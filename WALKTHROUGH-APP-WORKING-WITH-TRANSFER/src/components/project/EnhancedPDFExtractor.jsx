
import React, { useState, useEffect } from 'react';
import { UploadFile, InvokeLLM } from '@/api/integrations';
import { Item } from '@/api/entities';
import { Room } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileUp, Wand2, CheckCircle, Plus, RefreshCw } from 'lucide-react';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function chunk(array, size) {
    const chunked_arr = [];
    let index = 0;
    while (index < array.length) {
        chunked_arr.push(array.slice(index, size + index));
        index += size;
    }
    return chunked_arr;
}

export default function EnhancedPDFExtractor({ project, onComplete, targetStatus = 'Approved' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('Ready to extract');
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [projectRooms, setProjectRooms] = useState([]);

    useEffect(() => {
        if (project?.id && isOpen) {
            const fetchRooms = async () => {
                try {
                    const rooms = await Room.filter({ project_id: project.id });
                    setProjectRooms(rooms);
                } catch (error) {
                    console.error("Failed to fetch project rooms:", error);
                }
            };
            fetchRooms();
        }
    }, [project?.id, isOpen]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleExtract = async () => {
        if (!file || !selectedRoom) {
            alert('Please select a PDF file and choose a room.');
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        
        try {
            // Step 1: Upload PDF
            setStatus('Step 1/3: Uploading Canva design PDF...');
            setProgress(10);
            const { file_url } = await UploadFile({ file });
            if (!file_url) throw new Error("File upload failed.");

            // Step 2: Extract items using AI designed for design documents
            setStatus('Step 2/3: AI is reading the Canva design and extracting product information...');
            setProgress(30);
            
            const canvaExtractPrompt = `
                You are an expert AI for extracting furniture and product information from DESIGN DOCUMENTS (like Canva presentations).
                
                This PDF is a DESIGN DOCUMENT, not a technical specification sheet. It likely contains:
                - Visual layouts and mood boards
                - Product images with descriptions
                - Text that might be embedded in images
                - Design presentations rather than structured data
                
                Your task:
                1. Analyze every page of this design PDF
                2. Look for ANY products, furniture, fixtures, or design elements mentioned
                3. Extract whatever information you can find, even if incomplete:
                   - Product names (even if just "sofa" or "table lamp")
                   - Brand names (West Elm, Pottery Barn, etc.)
                   - Colors mentioned (navy blue, white oak, etc.)
                   - Any prices you can spot
                   - Any dimensions mentioned
                   - Product categories (furniture, lighting, accessories)
                
                Be VERY generous in what you extract. Even if you only see "Blue Velvet Chair - $599", create an item for it.
                For missing information, make reasonable assumptions:
                - If no specific name, use descriptive names like "Blue Velvet Accent Chair"
                - If no category, guess based on the item type
                - If no sub-category, use general ones like "SEATING" or "DECOR"
                
                Return whatever you can find, even if it's minimal information.
            `;

            const extractResponse = await InvokeLLM({
                prompt: canvaExtractPrompt,
                file_urls: [file_url],
                response_json_schema: {
                    type: "object",
                    properties: {
                        items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    vendor_sku: { type: "string" },
                                    actual_cost: { type: "number" },
                                    size: { type: "string" },
                                    finish_color: { type: "string" },
                                    link: { type: "string" },
                                    image_link: { type: "string" },
                                    category: { type: "string" },
                                    sub_category: { type: "string" },
                                    remarks: { type: "string" }
                                }
                            }
                        }
                    },
                    required: ["items"]
                }
            });

            const extractedItems = extractResponse?.items || [];
            
            if (extractedItems.length === 0) {
                throw new Error("AI could not identify any products in this Canva design. The PDF might be entirely image-based or contain no product information.");
            }

            setProgress(60);

            // Step 3: Create items in database
            const targetPhase = targetStatus === 'PICKED' ? 'Checklist' : 'FF&E';
            setStatus(`Step 3/3: Adding ${extractedItems.length} design items to ${targetPhase}...`);
            setProgress(80);

            const itemsToCreate = extractedItems.map(item => ({
                project_id: project.id,
                room_id: selectedRoom,
                name: item.name || 'Design Item - Click to edit',
                vendor_sku: item.vendor_sku || null,
                actual_cost: item.actual_cost || null,
                size: item.size || null,
                finish_color: item.finish_color || null,
                link: item.link || null,
                image_link: item.image_link || null,
                category: item.category || 'Uncategorized',
                sub_category: item.sub_category || 'Misc.',
                remarks: item.remarks || 'Extracted from Canva design',
                status: targetStatus,
                quantity: 1
            }));

            // Process item creation in chunks
            const itemChunks = chunk(itemsToCreate, 20);
            let createdCount = 0;
            for (const itemChunk of itemChunks) {
                await Item.bulkCreate(itemChunk);
                createdCount += itemChunk.length;
                setProgress(80 + (createdCount / itemsToCreate.length) * 20);
                await sleep(1000);
            }

            setProgress(100);
            setStatus(`Success! Extracted ${extractedItems.length} design items from your Canva PDF.`);
            
            await sleep(2000);
            onComplete();
            setIsProcessing(false);
            setIsOpen(false);

        } catch (error) {
            console.error("Failed to extract from Canva PDF:", error);
            setStatus(`Error: ${error.message}`);
            await sleep(5000);
            setIsProcessing(false);
        }
    };

    const targetPhase = targetStatus === 'PICKED' ? 'Checklist' : 'FF&E';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                setIsProcessing(false);
                setStatus('Ready to extract');
                setProgress(0);
                setFile(null);
                setSelectedRoom(''); // Reset selected room on close
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-purple-800/20 border-purple-500 text-purple-400 hover:bg-purple-800/40 hover:text-purple-300 text-xs px-3 py-2">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Extract from Canva
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gray-800 text-stone-200 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-stone-100">Canva Design PDF Extractor</DialogTitle>
                    <DialogDescription className="text-stone-400">
                        Upload a Canva design PDF and AI will extract all the furniture, fixtures, and products mentioned in your design presentation.
                        <br/><strong className="text-purple-400">Perfect for mood boards, design presentations, and visual specifications!</strong>
                    </DialogDescription>
                </DialogHeader>
                
                {!isProcessing ? (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="pdf-file" className="text-stone-300">Canva Design PDF</Label>
                            <Input
                                id="pdf-file"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="bg-gray-700 border-gray-600 text-stone-300 file:text-stone-300 file:bg-gray-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-select" className="text-stone-300">Add Items to Room</Label>
                            <select
                                id="room-select"
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="w-full p-2 bg-gray-700 border border-gray-600 text-stone-300 rounded"
                            >
                                <option value="">Select a room...</option>
                                {projectRooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 space-y-4">
                        <div className="text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-400 mb-4" />
                            <p className="text-purple-300 font-medium">{status}</p>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-stone-400 text-center">Reading your Canva design...</p>
                    </div>
                )}
                
                {!isProcessing && (
                    <DialogFooter>
                        <Button 
                            onClick={handleExtract} 
                            disabled={!file || !selectedRoom} 
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Wand2 className="mr-2 h-4 w-4" />
                            Extract from Design
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
