
import React from "react";
import { Room } from "@/api/entities";
import { Item } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ChevronRight, Loader2, DoorOpen, ChevronDown, Upload, Trash2, GripVertical, Undo } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import RoomForm from './RoomForm';

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

const SpreadsheetRow = ({ item, isSelected, onToggle, onUpdate, onDelete }) => {
    const [editingField, setEditingField] = React.useState(null);
    const [tempValue, setTempValue] = React.useState('');

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

export default function WalkthroughSpreadsheet({ project }) {
    const [rooms, setRooms] = React.useState([]);
    const [allItems, setAllItems] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [selectedItems, setSelectedItems] = React.useState(new Set());
    const [isRoomFormOpen, setIsRoomFormOpen] = React.useState(false);
    const [collapsedRooms, setCollapsedRooms] = React.useState(new Set());
    const [collapsedSections, setCollapsedSections] = React.useState(new Set());
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [lastDeletedItems, setLastDeletedItems] = React.useState([]);

    const ROOM_SORT_ORDER = React.useMemo(() => [
        "Foyer", "Entryway", "Hallway", "Living Room", "Family Room", "Great Room",
        "Kitchen", "Dining Room", "Breakfast Nook", "Bar Area", "Pantry", "Butler's Pantry", "Wine Cellar",
        "Primary Bedroom", "Primary Bathroom", "Walk-in Closet",
        "Guest Bedroom", "Guest Bathroom", "Children's Bedroom", "Nursery",
        "Half Bathroom", "Jack and Jill Bathroom",
        "Home Office", "Study", "Library", "Craft Room", "Music Room", "Art Studio",
        "Laundry Room", "Mudroom", "Linen Closet", "Utility Room", "Workshop",
        "Basement", "Home Theater", "Media Room", "Game Room", "Home Gym", "Play Room",
        "Sunroom", "Screened Porch", "Patio", "Deck", "Outdoor Kitchen", "Pool House", "Guest House"
    ], []);

    const loadData = React.useCallback(async () => {
        if (!project?.id) return;
        setIsLoading(true);
        try {
            const [roomList, itemList] = await Promise.all([
                Room.filter({ project_id: project.id }),
                Item.filter({ project_id: project.id, status: 'Walkthrough' }, '-created_date'),
            ]);

            const sorted = [...roomList].sort((a, b) => {
                const indexA = ROOM_SORT_ORDER.indexOf(a.name);
                const indexB = ROOM_SORT_ORDER.indexOf(b.name);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.name.localeCompare(b.name);
            });
            setRooms(sorted);
            setAllItems(itemList);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [project, ROOM_SORT_ORDER]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const refreshData = React.useCallback(async () => {
        await loadData();
    }, [loadData]);

    const handleItemUpdate = React.useCallback((itemId, updates) => {
        setAllItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
    }, []);

    const handleMoveToSelection = async () => {
        if (selectedItems.size === 0) {
            alert('Please select items first by checking the boxes.');
            return;
        }
        setIsUpdating(true);
        const itemIds = Array.from(selectedItems);
        try {
            const idChunks = chunk(itemIds, 20); // Process in chunks of 20

            for(const itemChunk of idChunks) {
                const promises = itemChunk.map(itemId => Item.update(itemId, { status: 'PICKED' }));
                await Promise.all(promises);
                await sleep(1000); // Wait 1 second between chunks to avoid rate limit
            }

            setSelectedItems(new Set());
            await refreshData();
            alert(`${itemIds.length} items moved to Checklist successfully! Check the Checklist tab.`);
        } catch (error) {
            console.error("Failed to move items:", error);
            alert('Failed to move items. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUndoDeletion = async () => {
        if (lastDeletedItems.length === 0) return;
        setIsUpdating(true);
        try {
            const itemsToRecreate = lastDeletedItems.map(({ id, created_date, updated_date, created_by, ...rest }) => rest);
            await Item.bulkCreate(itemsToRecreate);
            setLastDeletedItems([]);
            await refreshData();
        } catch (error) {
            console.error("Failed to undo deletion:", error);
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleAddNewItem = async (roomId, category, subCategory) => {
        try {
            const newItem = await Item.create({
                project_id: project.id,
                room_id: roomId,
                category: category,
                sub_category: subCategory,
                name: "New Item - Click to edit",
                status: 'Walkthrough',
                quantity: 1,
            });
            setAllItems(prev => [...prev, newItem]);
        } catch (error) {
            console.error("Failed to add new item:", error);
        }
    };
    
    const handleDeleteRoom = async (roomId) => {
        setIsDeleting(true);
        try {
            const itemsToDelete = allItems.filter(item => item.room_id === roomId);
            setLastDeletedItems(itemsToDelete);

            const itemChunks = chunk(itemsToDelete, 20); // Process in chunks of 20
            for(const itemChunk of itemChunks) {
                const promises = itemChunk.map(item => Item.delete(item.id));
                await Promise.all(promises);
                await sleep(1000); // Wait 1 second between chunks to avoid rate limit
            }
            
            await Room.delete(roomId);
            await refreshData();
        } catch (error) {
            console.error("Failed to delete room:", error);
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleDeleteItem = async (itemId) => {
        const itemToDelete = allItems.find(item => item.id === itemId);
        if (itemToDelete) setLastDeletedItems([itemToDelete]);
        
        try {
            await Item.delete(itemId);
            setAllItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error("Failed to delete item:", error);
        }
    };

    const handleDeleteSection = async (roomId, category, subCategory) => {
        setIsDeleting(true);
        try {
            const itemsToDelete = allItems.filter(item =>
                item.room_id === roomId &&
                item.category === category &&
                item.sub_category === subCategory
            );
            setLastDeletedItems(itemsToDelete);
            
            const itemChunks = chunk(itemsToDelete, 20); // Process in chunks of 20
            for(const itemChunk of itemChunks) {
                const promises = itemChunk.map(item => Item.delete(item.id));
                await Promise.all(promises);
                await sleep(1000); // Wait 1 second between chunks to avoid rate limit
            }

            setAllItems(prev => prev.filter(item => !(item.room_id === roomId && item.category === category && item.sub_category === subCategory)));
        } catch (error) {
            console.error("Failed to delete section:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleRoomCollapse = (roomId) => {
        setCollapsedRooms(prev => {
            const newSet = new Set(prev);
            newSet.has(roomId) ? newSet.delete(roomId) : newSet.add(roomId);
            return newSet;
        });
    };

    const toggleSectionCollapse = (sectionKey) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            newSet.has(sectionKey) ? newSet.delete(sectionKey) : newSet.add(sectionKey);
            return newSet;
        });
    };

    const handleDragEnd = (result) => {
        const { destination, source } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }
        const newRooms = Array.from(rooms);
        const [reorderedItem] = newRooms.splice(source.index, 1);
        newRooms.splice(destination.index, 0, reorderedItem);
        setRooms(newRooms);
    };

    if (isLoading) {
        return (
            <div className="text-white text-center py-8">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#8B7355]" />
                <p className="mt-2 text-lg">Loading project data...</p>
            </div>
        );
    }
    
    const CATEGORY_ORDER = ['LIGHTING', 'FURNITURE', 'PLUMBING', 'APPLIANCES', 'CABINETS', 'COUNTERTOPS & TILE', 'ACCESSORIES', 'TEXTILES', 'OUTDOOR', 'PAINT, WALLPAPER, HARDWARE & FINISHES', 'ARCHITECTURAL ELEMENTS', 'Uncategorized'];

    return (
        <div className="bg-gray-900 text-stone-200 p-6">
            <div className="w-full bg-[#8B7355] shadow-lg flex items-center justify-center my-8 h-auto max-h-[130px] p-4 rounded-lg border border-[#8B7355]/50">
                <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf1_Establishedlogo.png"
                    alt="Established Design Co."
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="mb-8 bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#8B7355]">WALKTHROUGH - {project.name.toUpperCase()}</h2>
                    <div className="flex gap-2 flex-wrap">
                        {lastDeletedItems.length > 0 && (
                            <Button onClick={handleUndoDeletion} variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-stone-900 text-xs px-3 py-2" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Undo className="w-3 h-3 mr-1" />}
                                Undo Delete
                            </Button>
                        )}
                        <Button className="bg-[#8B7355] text-stone-200 hover:bg-[#A0927B] text-xs px-3 py-2" onClick={() => alert('Google Sheets import coming soon!')}>
                            <Upload className="mr-1 h-3 w-3" />
                            Import
                        </Button>
                        <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#8B7355] text-stone-200 hover:bg-[#A0927B] text-xs px-3 py-2">
                                    <Plus className="mr-1 h-3 w-3" />
                                    Add Room
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Room</DialogTitle>
                                </DialogHeader>
                                <RoomForm projectId={project.id} onRoomCreated={() => { setIsRoomFormOpen(false); refreshData(); }} />
                            </DialogContent>
                        </Dialog>
                        <Button onClick={handleMoveToSelection} className="bg-[#059669] hover:bg-[#047857] text-stone-200 text-xs px-3 py-2" disabled={isUpdating || selectedItems.size === 0}>
                            {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                            Move to Selection
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mb-8 bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-stone-200 text-sm space-y-1">
                            <div className="font-bold text-[#8B7355] uppercase text-xs">Project Address</div>
                            <div>{project.address}</div>
                        </div>
                        <div className="mt-4 bg-gray-700 p-3 rounded">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-sm text-[#8B7355] uppercase">Client Information:</h3>
                            </div>
                            <div className="text-stone-200 text-sm space-y-2">
                                <div><span className="font-semibold text-stone-400">NAME:</span> <span className="text-stone-200">{project.client_name}</span></div>
                                <div><span className="font-semibold text-stone-400">EMAIL:</span> <span className="text-stone-200">{project.email}</span></div>
                                <div><span className="font-semibold text-stone-400">PHONE:</span> <span className="text-stone-200">{project.phone}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-700 p-4 rounded">
                        <h3 className="font-bold text-sm mb-3 text-[#8B7355] uppercase">Questionnaire Summary</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-stone-200">
                            <div><strong className="text-stone-400">Type:</strong> {project.project_type}</div>
                            <div><strong className="text-stone-400">Style Pref:</strong> {Array.isArray(project.design_styles_preference) ? project.design_styles_preference.join(', ') : ''}</div>
                            <div><strong className="text-stone-400">Timeline:</strong> {project.timeline}</div>
                            <div><strong className="text-stone-400">Budget:</strong> {project.budget_range}</div>
                            <div className="col-span-2"><strong className="text-stone-400">Priorities:</strong> {Array.isArray(project.project_priority) ? project.project_priority.join(', ') : ''}</div>
                        </div>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="rooms">
                    {(provided) => (
                        <div
                            className="overflow-x-auto"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {rooms.map((room, index) => {
                                const roomItems = allItems.filter(item => item.room_id === room.id);
                                const roomColor = ROOM_COLORS[room.name] || ROOM_COLORS.default;
                                const isRoomCollapsed = collapsedRooms.has(room.id);

                                const groupedItems = roomItems.reduce((acc, item) => {
                                    const category = item.category || 'Uncategorized';
                                    if (!acc[category]) acc[category] = {};
                                    const subCategory = item.sub_category || 'Misc.';
                                    if (!acc[category][subCategory]) acc[category][subCategory] = [];
                                    acc[category][subCategory].push(item);
                                    return acc;
                                }, {});

                                return (
                                    <Draggable key={room.id} draggableId={room.id} index={index} isDragDisabled={!isRoomCollapsed}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`mb-8 ${snapshot.isDragging ? 'shadow-2xl opacity-95' : ''}`}
                                            >
                                                <div
                                                    className="text-stone-200 text-center py-4 mb-0 font-bold text-xl flex items-center justify-between px-6 cursor-pointer select-none hover:opacity-90 transition-opacity"
                                                    style={{backgroundColor: roomColor}}
                                                    onClick={() => toggleRoomCollapse(room.id)}
                                                >
                                                    <div className="flex items-center">
                                                        <div {...provided.dragHandleProps} className={`transition-opacity ${isRoomCollapsed ? 'opacity-100' : 'opacity-0'} flex items-center`}>
                                                            <GripVertical className="mr-3 h-6 w-6 text-stone-200/50" />
                                                        </div>
                                                        {isRoomCollapsed ? <ChevronRight className="mr-3 h-6 w-6" /> : <ChevronDown className="mr-3 h-6 w-6" />}
                                                        <span>{room.name.toUpperCase()}</span>
                                                        <span className="ml-4 text-sm opacity-75">({roomItems.length} items)</span>
                                                    </div>
                                                    <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }} disabled={isDeleting} className="opacity-75 hover:opacity-100">
                                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Delete Room'}
                                                    </Button>
                                                </div>

                                                {!isRoomCollapsed && Object.entries(groupedItems)
                                                    .sort(([catA], [catB]) => {
                                                        const indexA = CATEGORY_ORDER.indexOf(catA);
                                                        const indexB = CATEGORY_ORDER.indexOf(catB);
                                                        if (indexA === -1) return 1; if (indexB === -1) return -1;
                                                        return indexA - indexB;
                                                    })
                                                    .map(([category, subCategories]) => {
                                                    const sectionKey = `${room.id}-${category}`;
                                                    const isSectionCollapsed = collapsedSections.has(sectionKey);
                                                    const categoryItemCount = Object.values(subCategories).flat().length;

                                                    return (
                                                        <div key={category} className="mb-6">
                                                            <div
                                                                className="text-stone-200 text-center py-3 mb-0 font-semibold text-lg flex items-center justify-center px-6 cursor-pointer select-none hover:opacity-90 transition-opacity"
                                                                style={{backgroundColor: '#4A6741'}}
                                                                onClick={() => toggleSectionCollapse(sectionKey)}
                                                            >
                                                                {isSectionCollapsed ? <ChevronRight className="mr-3 h-5 w-5" /> : <ChevronDown className="mr-3 h-5 w-5" />}
                                                                <span>{category.toUpperCase()}</span>
                                                                <span className="ml-3 text-sm opacity-75">({categoryItemCount} items)</span>
                                                            </div>

                                                            {!isSectionCollapsed && Object.entries(subCategories).map(([subCategory, subItems]) => (
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
                                                                                <th className="p-2 border-r border-gray-400 text-xs" style={{minWidth: '200px'}}>REMARKS</th>
                                                                                <th className="p-2 text-xs w-12"></th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {subItems.map((item) => (
                                                                                <SpreadsheetRow
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
                                                                    <div className="bg-gray-800 p-2 border-x border-b border-gray-600 flex gap-2">
                                                                        <Button variant="ghost" size="sm" onClick={() => handleAddNewItem(room.id, category, subCategory)} className="bg-[#2D3748]/80 hover:bg-[#2D3748] border border-[#8B7355]/50 text-[#A0927B] hover:text-stone-200">
                                                                            <Plus className="w-4 h-4 mr-2" /> Add Item
                                                                        </Button>
                                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSection(room.id, category, subCategory)} disabled={isDeleting} className="bg-[#4A5568]/80 hover:bg-[#4A5568] border border-red-400/50 text-[#F56565] hover:text-red-300">
                                                                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Trash2 className="w-4 h-4 mr-2" />} Delete Section
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            
            {rooms.length === 0 && allItems.length === 0 && !isLoading && (
                <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-lg bg-gray-800">
                    <DoorOpen className="mx-auto h-12 w-12 text-stone-400" />
                    <h3 className="mt-2 text-sm font-medium text-stone-300">No rooms found for this project.</h3>
                    <p className="mt-1 text-sm text-stone-400">Go to the Questionnaire to select rooms or add them manually here.</p>
                </div>
             )}
        </div>
    );
}
