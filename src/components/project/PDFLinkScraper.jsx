
import React, { useState, useEffect } from 'react';
import { UploadFile, InvokeLLM } from '@/api/integrations';
import { Item } from '@/api/entities';
import { Room } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Link, Wand2 } from 'lucide-react';

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

export default function PDFLinkScraper({ project, onComplete }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('Idle');
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [projectRooms, setProjectRooms] = useState([]);

    useEffect(() => {
        if (project?.id && isOpen) {
            const fetchRooms = async () => {
                const rooms = await Room.filter({ project_id: project.id });
                setProjectRooms(rooms);
            };
            fetchRooms();
        }
    }, [project?.id, isOpen]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const uploadFileWithRetry = async (file, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                setStatus(`Uploading PDF (attempt ${attempt}/${maxRetries})...`);
                const result = await UploadFile({ file });
                return result;
            } catch (error) {
                console.warn(`Upload attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    throw new Error(`File upload failed after ${maxRetries} attempts. This may be due to file size (${Math.round(file.size / 1024 / 1024)}MB) or server issues. Try again later or use a smaller file.`);
                }
                await sleep(2000 * attempt);
            }
        }
    };

    const handleScrape = async () => {
        if (!file || !selectedRoom) {
            alert('Please select a PDF file and a room.');
            return;
        }
        
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > 5) {
            if (!confirm(`Your PDF is ${Math.round(fileSizeMB)}MB. Large files can timeout. Continue?`)) {
                return;
            }
        }

        setIsProcessing(true);
        setStatus('Starting...');
        setProgress(0);
        
        try {
            // 1. Upload PDF with retry logic
            setStatus('1/5: Uploading PDF...');
            setProgress(5);
            const uploadResult = await uploadFileWithRetry(file);
            const file_url = uploadResult?.file_url;
            if (!file_url) throw new Error("File upload failed - no URL returned.");

            // 2. FORCE AI to extract ACTUAL hyperlinks using a much more aggressive prompt
            setStatus('2/5: FORCING AI to extract real hyperlinks...');
            setProgress(15);
            
            const linkExtractionResult = await InvokeLLM({
                prompt: `
CRITICAL TASK: You MUST extract the ACTUAL hyperlinks from this PDF document.

DO NOT describe what you see in the PDF.
DO NOT tell me about furniture or items.
DO NOT summarize the content.

YOUR ONLY JOB: Find every clickable hyperlink in the PDF and return the actual URLs.

Look for:
- Clickable text that links to websites
- Embedded URLs
- Hyperlinked images or elements

Return ONLY a JSON object like this:
{
  "links": ["https://example1.com", "https://example2.com"]
}

If there are NO actual hyperlinks (not just text that looks like URLs, but actual clickable links), return {"links": []}.

IMPORTANT: I need the actual hyperlink URLs, not descriptions of items.
                `,
                file_urls: [file_url],
                response_json_schema: {
                    type: "object", 
                    properties: { 
                        links: { 
                            type: "array", 
                            items: { type: "string" }
                        }
                    },
                    required: ["links"]
                }
            });
            
            let links = linkExtractionResult?.links?.filter(link => {
                return link && typeof link === 'string' && (link.startsWith('http://') || link.startsWith('https://'));
            });
            
            // Remove duplicates
            links = [...new Set(links)];
            
            console.log('Extracted links:', links);
            
            if (!links || links.length === 0) {
                throw new Error("No actual hyperlinks were found in the PDF. Make sure your Canva document has clickable hyperlinks, not just text that looks like URLs.");
            }
            
            // 3. Now scrape each link individually 
            const totalLinks = links.length;
            let scrapedItems = [];
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < totalLinks; i++) {
                const link = links[i];
                setStatus(`3/5: Scraping Link ${i + 1}/${totalLinks}: ${link.substring(0, 50)}...`);
                setProgress(20 + ((i / totalLinks) * 50));

                try {
                    const itemScrapeResult = await InvokeLLM({
                        prompt: `Visit this specific URL: ${link}

You are a web scraper. Your job is to visit this URL and extract product information from the website.

From the website at this URL, find and extract:
- Product name
- SKU or model number  
- Price (as a number only)
- Size/dimensions
- Color/finish
- Main product image URL

Return the data as JSON. If you cannot access this URL or find product data, return null.`,
                        add_context_from_internet: true,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                vendor_sku: { type: "string" },
                                actual_cost: { type: "number" },
                                size: { type: "string" },
                                finish_color: { type: "string" },
                                image_link: { type: "string" },
                            }
                        }
                    });
                    
                    if (itemScrapeResult && itemScrapeResult.name) {
                        scrapedItems.push({ ...itemScrapeResult, link: link });
                        successCount++;
                        console.log(`Successfully scraped: ${itemScrapeResult.name} from ${link}`);
                    } else {
                        failCount++;
                        console.warn(`Failed to scrape product data from: ${link}`);
                    }
                } catch (e) {
                    failCount++;
                    console.warn(`Error scraping link: ${link}`, e);
                }
                
                // Wait between requests
                await sleep(2000);
            }
            
            if (scrapedItems.length === 0) {
                throw new Error(`Found ${links.length} links but couldn't scrape any product data. The links may be broken or the websites are blocking access.`);
            }
            
            // 4. Save the scraped items
            setStatus(`4/5: Saving ${scrapedItems.length} products to your sheet...`);
            setProgress(75);
            
            const existingItems = await Item.filter({ room_id: selectedRoom });
            const existingItemsMap = new Map(existingItems.map(item => [item.link, item]));
            
            const itemsToUpdate = [];
            const itemsToCreate = [];

            for (const scrapedItem of scrapedItems) {
                if (scrapedItem.link && existingItemsMap.has(scrapedItem.link)) {
                    const existingItem = existingItemsMap.get(scrapedItem.link);
                    itemsToUpdate.push({ id: existingItem.id, payload: scrapedItem });
                } else {
                    itemsToCreate.push({ 
                        project_id: project.id, 
                        room_id: selectedRoom, 
                        ...scrapedItem, 
                        status: 'Approved', 
                        quantity: 1,
                        category: 'FURNITURE',
                        sub_category: 'MISC'
                    });
                }
            }

            // 5. Execute database operations
            setStatus(`5/5: Updating ${itemsToUpdate.length} items, creating ${itemsToCreate.length} new items...`);
            setProgress(90);
            
            if (itemsToUpdate.length > 0) {
                await Promise.all(itemsToUpdate.map(item => Item.update(item.id, item.payload)));
            }
            if (itemsToCreate.length > 0) {
                await Item.bulkCreate(itemsToCreate);
            }
            
            setProgress(100);
            setStatus(`SUCCESS! Scraped ${successCount} products from your PDF links. ${failCount} links failed.`);
            
            await sleep(3000);
            onComplete();
            setIsOpen(false);

        } catch (error) {
            console.error("Link scraping failed:", error);
            setStatus(`Error: ${error.message}`);
            await sleep(8000);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-blue-800/20 border-blue-500 text-blue-400 hover:bg-blue-800/40 hover:text-blue-300 text-xs px-3 py-2">
                    <Link className="mr-2 h-4 w-4" />
                    Import from PDF Links
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gray-800 text-stone-200 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-stone-100">AI PDF Link Importer</DialogTitle>
                    <DialogDescription className="text-stone-400">
                        Upload a Canva PDF with hyperlinked items. The AI will visit each link, scrape the product data, and add/update items in your sheet.
                    </DialogDescription>
                </DialogHeader>

                {!isProcessing ? (
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="pdf-file-links" className="text-stone-300">
                                Canva PDF File {file && `(${Math.round(file.size / 1024 / 1024 * 10) / 10}MB)`}
                            </Label>
                            <Input id="pdf-file-links" type="file" accept=".pdf" onChange={handleFileChange} className="bg-gray-700 border-gray-600 text-stone-300 file:text-stone-300 file:bg-gray-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-select-links" className="text-stone-300">Add/Update Items in Room</Label>
                             <select id="room-select-links" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 text-stone-300 rounded">
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
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-400 mb-4" />
                            <p className="text-blue-300 font-medium text-sm">{status}</p>
                        </div>
                        <Progress value={progress} className="h-2 [&>div]:bg-blue-400" />
                    </div>
                )}
                
                {!isProcessing && (
                    <DialogFooter>
                        <Button onClick={handleScrape} disabled={!file || !selectedRoom} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Wand2 className="mr-2 h-4 w-4" />
                            Start Link Import
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
