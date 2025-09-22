
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Room } from '@/api/entities';
import { Item } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Download, ChevronRight, Loader2, Undo, Trash2, AlertTriangle, ImageIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import RoomForm from './RoomForm';
import { Checkbox } from "@/components/ui/checkbox";
import EnhancedPDFExtractor from './EnhancedPDFExtractor'; // Import the enhanced extractor

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

const CHECKLIST_STATUSES = [
    { value: 'PICKED', color: '#4ADE80' }, { value: 'ORDER SAMPLES', color: '#FB923C' },
    { value: 'SAMPLES ORDERED', color: '#FBBF24' }, { value: 'SAMPLES ARRIVED', color: '#A78BFA' },
    { value: 'ASK NEIL', color: '#A855F7' }, { value: 'ASK CHARLENE', color: '#3B82F6' },
    { value: 'ASK JALA', color: '#06B6D4' }, { value: 'GET QUOTE', color: '#10B981' },
    { value: 'WAITING ON QT', color: '#D97706' }, { value: 'READY FOR PRESENTATION', color: '#DC2626' },
    { value: 'Approved', color: '#22C55E' }
];

const ROOM_COLORS = {
    'Foyer': '#8B7355', 'Entryway': '#A68B6B', 'Hallway': '#7A6B5D',
    'Living Room': '#6B8E7F', 'Family Room': '#7F6B8E', 'Great Room': '#8E7F6B',
    'Kitchen': '#8B5A3C', 'Dining Room': '#7A4A4A', 'Breakfast Nook': '#9B6B4A', 'Bar Area': '#DC7633', 'Pantry': '#D4AC0D', "Butler's Pantry": '#7A8A5A', 'Wine Cellar': '#5A3A3A',
    'Primary Bedroom': '#5A7A6A', 'Primary Bathroom': '#6A7A8A', 'Walk-in Closet': '#7A7A6A',
    'Guest Bedroom': '#6A8A7A', 'Guest Bathroom': '#7A8A9A', "Children's Bedroom": '#8A6A9A', 'Nursery': '#9A8A7A',
    'Half Bathroom': '#6A9A8A', 'Jack and Jill Bathroom': '#8A9A6A',
    'Home Office': '#5A5A7A', 'Study': '#6A6A8A', 'Library': '#4A4A5A',
    'Craft Room': '#8A5A6A', 'Music Room': '#7A5A8A', 'Art Studio': '#6A5A8A',
    'Laundry Room': '#7A7A7A', 'Mudroom': '#8E44AD', 'Linen Closet': '#8A8A7A', 'Utility Room': '#5A6A6A', 'Workshop': '#6A6A5A',
    'Basement': '#5A5A6A', 'Home Theater': '#3A3A4A', 'Media Room': '#4A4A6A', 'Game Room': '#6A4A6A', 'Home Gym': '#7A6A4A', 'Play Room': '#8A7A4A',
    'Sunroom': '#6A8A9A', 'Screened Porch': '#7A9A8A', 'Patio': '#5A7A5A', 'Deck': '#6A8A6A', 'Outdoor Kitchen': '#8A6A5A', 'Pool House': '#5A8A9A', 'Guest House': '#5A9A8A',
    'default': '#607D8B'
};

const getChecklistStatusColor = (status) => CHECKLIST_STATUSES.find(s => s.value === status)?.color || '#6B7280';


const ImageModal = ({ imageUrl, onClose }) => (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>Product Image</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
                <img src={imageUrl} alt="Product" className="max-w-full max-h-[70vh] object-contain" />
            </div>
        </DialogContent>
    </Dialog>
);

const ImageCell = ({ imageUrl, onUpdate, item }) => {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(imageUrl || '');

    const handleSave = async () => {
        if (tempValue !== imageUrl) {
            try {
                await Item.update(item.id, { image_link: tempValue });
                onUpdate(item.id, { image_link: tempValue }); // Propagate the update
            } catch (error) {
                console.error("Failed to update image link:", error);
                // Optionally revert tempValue or show error message
            }
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Input
                value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="w-full h-full text-xs p-1 bg-gray-600 text-white border-none focus:ring-0"
                placeholder="Image URL" autoFocus />
        );
    }

    return (
        <>
            <div className="cursor-pointer text-white text-xs flex items-center justify-center h-full group" style={{ minHeight: '24px' }}>
                {imageUrl ? (
                    <div className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" onClick={() => setShowModal(true)} />
                        <span className="text-xs group-hover:block hidden" onClick={() => setIsEditing(true)}>Edit</span>
                    </div>
                ) : (
                    <span onClick={() => setIsEditing(true)} className="text-gray-400 group-hover:text-blue-400">+ Image</span>
                )}
            </div>
            {showModal && <ImageModal imageUrl={imageUrl} onClose={() => setShowModal(false)} />}
        </>
    );
};

const ChecklistRow = ({ item, isSelected, onToggle, onUpdate, onDelete }) => {
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const handleFieldEdit = (field, value) => {
        setEditingField(field);
        setTempValue(value || '');
    };

    const handleFieldSave = async (field) => {
        if (tempValue !== item[field]) {
            try {
                await Item.update(item.id, { [field]: tempValue });
                onUpdate(item.id, { [field]: tempValue });
            } catch (error) {
                console.error("Failed to update item:", error);
            }
        }
        setEditingField(null);
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await Item.update(item.id, { status: newStatus });
            onUpdate(item.id, { status: newStatus });
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };
    
    return (
        <tr className="border-b border-gray-600" style={{backgroundColor: '#2D3748'}}>
            <td className="p-1 border-r border-gray-600 text-xs">
                <Checkbox checked={isSelected} onCheckedChange={onToggle} className="mx-auto" />
            </td>
            <td className="p-1 border-r border-gray-600 text-xs">
                {editingField === 'name' ? (
                    <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleFieldSave('name')}
                        autoFocus
                        className="w-full h-6 text-xs p-1 bg-gray-700 text-stone-200 border-blue-500"
                    />
                ) : (
                    <span
                        className="text-stone-200 text-xs cursor-pointer block w-full h-full p-1"
                        onClick={() => handleFieldEdit('name', item.name)}
                    >
                        {item.name || '-'}
                    </span>
                )}
            </td>
            <td className="p-1 border-r border-gray-600 text-center">
                {editingField === 'quantity' ? (
                    <Input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleFieldSave('quantity')}
                        autoFocus
                        className="w-12 h-6 text-xs p-1 bg-gray-700 text-stone-200 border-blue-500 mx-auto"
                    />
                ) : (
                    <span
                        className="text-stone-200 text-xs cursor-pointer block w-full h-full p-1"
                        onClick={() => handleFieldEdit('quantity', item.quantity)}
                    >
                        {item.quantity || '1'}
                    </span>
                )}
            </td>
            <td className="p-1 border-r border-gray-600">
                {editingField === 'size' ? (
                    <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleFieldSave('size')}
                        autoFocus
                        className="w-full h-6 text-xs p-1 bg-gray-700 text-stone-200 border-blue-500"
                    />
                ) : (
                    <span
                        className="text-stone-200 text-xs cursor-pointer block w-full h-full p-1"
                        onClick={() => handleFieldEdit('size', item.size)}
                    >
                        {item.size || '-'}
                    </span>
                )}
            </td>
            <td className="p-1 border-r border-gray-600 w-48">
                <Select value={item.status || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full h-6 text-xs bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {CHECKLIST_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                                <div className="flex items-center">
                                    <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: s.color }}></span>
                                    {s.value}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </td>
            <td className="p-0 border-r border-gray-600 w-32 bg-gray-800">
                <ImageCell imageUrl={item.image_link} onUpdate={onUpdate} item={item} />
            </td>
            <td className="p-1 border-r border-gray-600">
                {editingField === 'remarks' ? (
                    <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleFieldSave('remarks')}
                        autoFocus
                        className="w-full h-6 text-xs p-1 bg-gray-700 text-stone-200 border-blue-500"
                    />
                ) : (
                    <span
                        className="text-stone-200 text-xs cursor-pointer block w-full h-full p-1"
                        onClick={() => handleFieldEdit('remarks', item.remarks)}
                    >
                        {item.remarks || '-'}
                    </span>
                )}
            </td>
            <td className="p-1 text-center">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-900/50 hover:text-red-300" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </td>
        </tr>
    );
};

export default function ChecklistSpreadsheet({ project }) {
    const [rooms, setRooms] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusSummary, setStatusSummary] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [roomFilter, setRoomFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
    const [lastDeletedItems, setLastDeletedItems] = useState([]);
    const [isResetting, setIsResetting] = useState(false);

    const checklistStatusesOnly = useMemo(() => CHECKLIST_STATUSES.map(s => s.value), []);

    const loadData = useCallback(async () => {
        if (!project?.id) return;
        setIsLoading(true);
        try {
            const [roomList, itemList] = await Promise.all([
                Room.filter({ project_id: project.id }),
                Item.filter({ project_id: project.id, status: { $in: checklistStatusesOnly } }, '-created_date')
            ]);
            setRooms(roomList);
            setAllItems(itemList);

            const statusCounts = itemList.reduce((acc, item) => {
                const status = item.status || 'No Status';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});
            setStatusSummary(Object.entries(statusCounts).map(([status, count]) => ({
                name: status, value: count, color: getChecklistStatusColor(status)
            })));
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [project, checklistStatusesOnly]);

    useEffect(() => { loadData(); }, [loadData]);
    
    const refreshData = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const handleItemUpdate = useCallback((itemId, updates) => {
        setAllItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
    }, []);

    const handleMoveToFFE = async () => {
        if (selectedItems.size === 0) return;
        setIsUpdating(true);
        try {
            const itemIds = Array.from(selectedItems);
            const idChunks = chunk(itemIds, 5); // Process only 5 items at a time

            for (const itemChunk of idChunks) {
                const promises = itemChunk.map(itemId => Item.update(itemId, { status: 'Approved' }));
                await Promise.all(promises);
                await sleep(3000); // Wait 3 seconds between chunks
            }

            setSelectedItems(new Set());
            await refreshData();
            alert(`${itemIds.length} items moved to FF&E!`);
        } catch (error) {
            console.error("Failed to move items to FF&E:", error);
            alert('Failed to move items. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        const itemToDelete = allItems.find(item => item.id === itemId);
        if (itemToDelete) setLastDeletedItems([itemToDelete]);
        
        try {
            await Item.delete(itemId);
            setAllItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            // Handle 404 errors gracefully
            if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('not found')) {
                console.warn(`Item ${itemId} already deleted or not found. Removing from local state.`);
                setAllItems(prev => prev.filter(item => item.id !== itemId));
            } else {
                console.error("Failed to delete item:", error);
                alert('Failed to delete item. Please try again.');
            }
        }
    };

    const handleUndoDeletion = async () => {
        if (lastDeletedItems.length === 0) return;
        setIsUpdating(true);
        try {
            // Ensure to remove properties that are auto-generated on creation (like id, timestamps)
            const itemsToRecreate = lastDeletedItems.map(({ id, created_date, updated_date, created_by, ...rest }) => rest);
            await Item.bulkCreate(itemsToRecreate);
            setLastDeletedItems([]);
            await refreshData();
        } catch (error) {
            console.error("Failed to undo deletion:", error);
            alert("Failed to undo deletion. Please check the console for details.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleResetChecklist = async () => {
        if (!confirm("This will move ALL items from this checklist back to the Walkthrough tab, effectively clearing it. Are you sure?")) {
            return;
        }

        setIsResetting(true);
        try {
            const itemsToReset = await Item.filter({ project_id: project.id, status: { $in: checklistStatusesOnly } });

            if (itemsToReset.length === 0) {
                alert("The checklist is already empty.");
                setIsResetting(false);
                return;
            }

            const itemChunks = chunk(itemsToReset, 5); // Process only 5 items at a time

            for (const itemChunk of itemChunks) {
                const updatePromises = itemChunk.map(item => 
                    Item.update(item.id, { status: 'Walkthrough' })
                );
                await Promise.all(updatePromises);
                await sleep(3000); // Wait 3 seconds between chunks
            }
            
            await refreshData();
            
            alert(`${itemsToReset.length} items moved back to Walkthrough. The checklist is now clear.`);

        } catch (error) {
            console.error("Failed to reset checklist:", error);
            alert("An error occurred while resetting the checklist.");
        } finally {
            setIsResetting(false);
        }
    };

    const categories = useMemo(() => [...new Set(allItems.map(item => item.category).filter(Boolean))].sort(), [allItems]);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            if (!checklistStatusesOnly.includes(item.status)) return false;
            const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.remarks && item.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
            const roomMatch = roomFilter === 'all' || item.room_id === roomFilter;
            const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
            return searchMatch && roomMatch && categoryMatch;
        });
    }, [allItems, searchTerm, roomFilter, categoryFilter, checklistStatusesOnly]);

    if (isLoading) return <div className="text-stone-200 text-center p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#8B7355]" /></div>;

    const CATEGORY_ORDER = ['LIGHTING', 'FURNITURE', 'PLUMBING', 'APPLIANCES', 'CABINETS', 'COUNTERTOPS & TILE', 'ACCESSORIES', 'TEXTILES', 'OUTDOOR', 'PAINT, WALLPAPER, HARDWARE & FINISHES', 'ARCHITECTURAL ELEMENTS', 'Uncategorized'];

    return (
        <div className="bg-gray-900 text-stone-200 p-6 min-h-screen">
            <div className="w-full bg-[#8B7355] shadow-lg flex items-center justify-center my-8 h-auto max-h-[130px] p-4 rounded-lg border border-[#8B7355]/50">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf2_Establishedlogo.png" alt="Established Design Co." className="w-full h-full object-contain" />
            </div>
            
            <div className="mb-8 bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-wrap gap-2 justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#8B7355] mb-2 md:mb-0">CHECKLIST - {project.name.toUpperCase()}</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleResetChecklist} variant="destructive" className="text-xs px-3 py-2" disabled={isResetting}>
                            {isResetting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Undo className="w-3 h-3 mr-1" />}
                            Reset Checklist
                        </Button>
                        {lastDeletedItems.length > 0 && (
                            <Button onClick={handleUndoDeletion} variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-stone-900 text-xs px-3 py-2" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Undo className="w-3 h-3 mr-1" />}
                                Undo Delete
                            </Button>
                        )}
                        <EnhancedPDFExtractor project={project} onComplete={refreshData} targetStatus="PICKED" />
                        <Button onClick={handleMoveToFFE} className="bg-[#8B7355] hover:bg-[#7A6249] text-stone-200 text-xs px-3 py-2" disabled={isUpdating || selectedItems.size === 0}>
                            {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                            Move to FF&E ({selectedItems.size})
                        </Button>
                    </div>
                </div>
            </div>

            {/* Status Overview Charts */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg md:col-span-1">
                    <h3 className="font-bold mb-4 text-center" style={{color: '#8B7355'}}>Status Overview</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={statusSummary} cx="50%" cy="50%" outerRadius="80%" dataKey="value" nameKey="name">
                                {statusSummary.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg md:col-span-2">
                    <h3 className="font-bold mb-4 text-center" style={{color: '#8B7355'}}>Status Breakdown</h3>
                    <div className="space-y-2 h-64 overflow-y-auto pr-2">
                        {statusSummary.map((item) => (
                            <div key={item.name} className="flex justify-between items-center p-2 rounded text-stone-900 font-medium text-xs" style={{backgroundColor: item.color}}>
                                <span>{item.name}</span>
                                <span className="font-bold bg-black bg-opacity-20 text-stone-200 px-2 py-0.5 rounded-full">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 justify-center items-center bg-gray-800 p-8 rounded-lg flex-wrap mb-8">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Search className="w-5 h-5" style={{color: '#8B7355'}} />
                    <Input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 h-12 text-sm bg-gray-700 text-stone-200 border-gray-600" />
                </div>
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="w-48 h-12 bg-gray-700 text-stone-200 border-gray-600 text-sm flex-shrink-0">
                        <SelectValue placeholder="All Rooms" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {rooms.map(room => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48 h-12 bg-gray-700 text-stone-200 border-gray-600 text-sm flex-shrink-0">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 text-sm bg-[#8B7355] hover:bg-[#7A6249] text-stone-200 flex-shrink-0">
                            <Plus className="mr-2 h-4 w-4" /> Add Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add a New Room</DialogTitle>
                        </DialogHeader>
                        <RoomForm projectId={project.id} onRoomCreated={() => { setIsRoomFormOpen(false); refreshData(); }} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* ORGANIZED BY ROOM AND CATEGORY JUST LIKE WALKTHROUGH */}
            <div className="overflow-x-auto">
                {rooms.filter(r => roomFilter === 'all' || r.id === roomFilter).map(room => {
                    const roomItems = filteredItems.filter(item => item.room_id === room.id);
                    if (roomItems.length === 0 && roomFilter !== 'all') return null;

                    const roomColor = ROOM_COLORS[room.name] || ROOM_COLORS.default;

                    const groupedItems = roomItems.reduce((acc, item) => {
                        const category = item.category || 'Uncategorized';
                        if (!acc[category]) acc[category] = {};
                        const subCategory = item.sub_category || 'Misc.';
                        if (!acc[category][subCategory]) acc[category][subCategory] = [];
                        acc[category][subCategory].push(item);
                        return acc;
                    }, {});

                    return (
                        <div key={room.id} className="mb-8">
                            <div
                                className="text-stone-200 text-center py-4 mb-0 font-bold text-xl px-6"
                                style={{backgroundColor: roomColor}}
                            >
                                {room.name.toUpperCase()} ({roomItems.length} items)
                            </div>

                            {Object.keys(groupedItems).length === 0 && (
                                <div className="bg-gray-800 p-4 text-center text-gray-400">
                                    No items from this room are in the checklist yet.
                                </div>
                            )}

                            {Object.entries(groupedItems)
                                .sort(([catA], [catB]) => {
                                    const indexA = CATEGORY_ORDER.indexOf(catA);
                                    const indexB = CATEGORY_ORDER.indexOf(catB);
                                    if (indexA === -1) return 1; if (indexB === -1) return -1;
                                    return indexA - indexB;
                                })
                                .map(([category, subCategories]) => (
                                <div key={category} className="mb-6">
                                    <div
                                        className="text-stone-200 text-center py-3 mb-0 font-semibold text-lg px-6"
                                        style={{backgroundColor: '#4A6741'}}
                                    >
                                        {category.toUpperCase()}
                                    </div>

                                    {Object.entries(subCategories).map(([subCategory, subItems]) => (
                                        <div key={subCategory} className="mb-4">
                                            <table className="w-full text-xs table-fixed">
                                                <thead style={{backgroundColor: '#B8484A'}} className="text-stone-200">
                                                    <tr>
                                                        <th className="p-2 border-r border-gray-400 text-xs w-8">✓</th>
                                                        <th className="p-2 border-r border-gray-400 text-xs font-bold" style={{minWidth: '150px'}}>
                                                            {subCategory.toUpperCase()} ({subItems.length})
                                                        </th>
                                                        <th className="p-2 border-r border-gray-400 text-xs w-16">QTY</th>
                                                        <th className="p-2 border-r border-gray-400 text-xs" style={{minWidth: '80px'}}>SIZE</th>
                                                        <th className="p-2 border-r border-gray-400 text-xs w-48">STATUS</th>
                                                        <th className="p-2 border-r border-gray-400 text-xs w-32">IMAGE</th>
                                                        <th className="p-2 border-r border-gray-400 text-xs" style={{minWidth: '200px'}}>REMARKS</th>
                                                        <th className="p-2 text-xs w-12"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subItems.map((item) => (
                                                        <ChecklistRow
                                                            key={item.id}
                                                            item={item}
                                                            isSelected={selectedItems.has(item.id)}
                                                            onToggle={(checked) => {
                                                                const newSelected = new Set(selectedItems);
                                                                if (checked) newSelected.add(item.id); else newSelected.delete(item.id);
                                                                setSelectedItems(newSelected);
                                                            }}
                                                            onUpdate={handleItemUpdate}
                                                            onDelete={() => handleDeleteItem(item.id)}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    );
                })}

                {allItems.length === 0 && !isLoading && (
                    <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-lg bg-gray-800">
                        <h3 className="mt-2 text-sm font-medium text-stone-300">No items in the checklist yet.</h3>
                        <p className="mt-1 text-sm text-stone-400">Go to the Walkthrough tab, select items, and click "Move to Selection" to add them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
