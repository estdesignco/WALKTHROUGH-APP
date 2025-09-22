
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Room } from '@/api/entities';
import { Item } from '@/api/entities';
import { TemplateItem } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, DoorOpen, Trash2, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

const ROOM_OPTIONS = [
    "Entire Home",
    "Living Room", "Family Room", "Great Room", "Primary Bedroom", "Guest Bedroom", "Children's Bedroom",
    "Nursery", "Home Office", "Study", "Library", "Primary Bathroom", "Guest Bathroom", "Half Bathroom",
    "Jack and Jill Bathroom", "Kitchen", "Pantry", "Butler's Pantry", "Dining Room", "Breakfast Nook",
    "Bar Area", "Wine Cellar", "Laundry Room", "Mudroom", "Utility Room", "Linen Closet",
    "Walk-in Closet", "Basement", "Home Theater", "Media Room", "Game Room", "Home Gym",
    "Play Room", "Craft Room", "Music Room", "Art Studio", "Workshop", "Foyer", "Entryway",
    "Hallway", "Sunroom", "Screened Porch", "Patio", "Deck", "Outdoor Kitchen", "Pool House", "Guest House"
];

const AddItemForm = ({ projectId, roomId, onItemsAdded }) => {
    const [templateItems, setTemplateItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [itemsToCreate, setItemsToCreate] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            const allItems = await TemplateItem.list();
            setTemplateItems(allItems);
        };
        fetchTemplates();
    }, []);

    const categories = useMemo(() => [...new Set(templateItems.map(item => item.category))], [templateItems]);
    
    const subCategories = useMemo(() => {
        if (!selectedCategory) return [];
        return [...new Set(templateItems.filter(item => item.category === selectedCategory).map(item => item.sub_category))];
    }, [templateItems, selectedCategory]);

    const availableItems = useMemo(() => {
        if (!selectedCategory || !selectedSubCategory) return [];
        return templateItems.filter(item => item.category === selectedCategory && item.sub_category === selectedSubCategory);
    }, [templateItems, selectedCategory, selectedSubCategory]);

    const handleItemSelectionChange = (itemId, checked) => {
        if (checked) {
            const item = templateItems.find(i => i.id === itemId);
            setItemsToCreate(prev => [...prev, {
                project_id: projectId,
                room_id: roomId,
                name: item.item_name,
                category: item.category,
                sub_category: item.sub_category,
                status: 'Walkthrough',
                quantity: 1,
            }]);
        } else {
            const item = templateItems.find(i => i.id === itemId);
            setItemsToCreate(prev => prev.filter(i => i.name !== item.item_name));
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (itemsToCreate.length === 0) return;
        setIsCreating(true);
        try {
            await Item.bulkCreate(itemsToCreate);
            onItemsAdded();
        } catch (error) {
            console.error("Failed to add items:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Sub-Category</Label>
                    <Select onValueChange={setSelectedSubCategory} value={selectedSubCategory} disabled={!selectedCategory}>
                        <SelectTrigger><SelectValue placeholder="Select a sub-category" /></SelectTrigger>
                        <SelectContent>
                            {subCategories.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {selectedCategory && selectedSubCategory && (
                <Card className="max-h-64 overflow-y-auto">
                    <CardContent className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm">Select Items to Add</h4>
                        {availableItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={item.id} 
                                    onCheckedChange={(checked) => handleItemSelectionChange(item.id, checked)}
                                    // Check if this item is already in itemsToCreate to pre-check the checkbox
                                    checked={itemsToCreate.some(i => i.name === item.item_name)}
                                />
                                <Label htmlFor={item.id}>{item.item_name}</Label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Button type="submit" disabled={isCreating || itemsToCreate.length === 0} className="w-full bg-[#B49B7E] hover:bg-[#A08B6F]">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add {itemsToCreate.length} Item(s)
            </Button>
        </form>
    );
};

const RoomSection = ({ project, room, onItemsUpdated }) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddItemFormOpen, setAddItemFormOpen] = useState(false);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const roomItems = await Item.filter({ room_id: room.id }, '-created_date');
            setItems(roomItems);
        } catch (error) {
            console.error("Failed to fetch items for room:", error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [room.id]);

    useEffect(() => {
        if (room?.id) {
            fetchItems();
        }
    }, [room?.id, fetchItems]);
    
    const handleItemsAdded = () => {
        setAddItemFormOpen(false);
        fetchItems();
        onItemsUpdated();
    };

    const groupedItems = useMemo(() => {
        return items.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = {};
            }
            const subCategory = item.sub_category || 'Misc.';
            if (!acc[category][subCategory]) {
                acc[category][subCategory] = [];
            }
            acc[category][subCategory].push(item);
            return acc;
        }, {});
    }, [items]);

    return (
        <Card className="bg-white/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{room.name}</CardTitle>
                    <CardDescription>{room.notes}</CardDescription>
                </div>
                <Dialog open={isAddItemFormOpen} onOpenChange={setAddItemFormOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Item(s)</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Items to {room.name}</DialogTitle>
                        </DialogHeader>
                        <AddItemForm projectId={project.id} roomId={room.id} onItemsAdded={handleItemsAdded} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-stone-500">No items added to this room yet.</p>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {Object.entries(groupedItems).map(([category, subCategories]) => (
                            <div key={category} className="mb-4 p-3 border rounded-lg bg-stone-50">
                                <h3 className="text-lg font-semibold text-stone-800 mb-2">{category}</h3>
                                {Object.entries(subCategories).map(([subCategory, subItems]) => (
                                    <AccordionItem key={`${category}-${subCategory}`} value={`${category}-${subCategory}`}>
                                        <AccordionTrigger className="text-md font-medium">{subCategory}</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-2">
                                                {subItems.map(item => (
                                                    <li key={item.id} className="text-sm text-stone-700 p-2 rounded hover:bg-stone-100 flex justify-between items-center">
                                                        <span>{item.name}</span>
                                                        <div>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </div>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
};

const RoomForm = ({ projectId, onRoomCreated }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await Room.create({ project_id: projectId, name, notes });
      onRoomCreated();
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="roomName">Room Name (e.g., Master Bedroom)</Label>
        <Input id="roomName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="roomNotes">Notes</Label>
        <Textarea id="roomNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Ceiling height, flooring type, etc."/>
      </div>
      <Button type="submit" disabled={isCreating} className="w-full bg-[#B49B7E] hover:bg-[#A08B6F]">
        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Add Room
      </Button>
    </form>
  );
};


export default function Walkthrough({ project }) {
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
  
    const fetchRoomsAndItems = useCallback(async () => {
      setIsLoading(true);
      try {
        const roomList = await Room.filter({ project_id: project.id }, '-created_date');
        setRooms(roomList);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setIsLoading(false);
      }
    }, [project.id]);
  
    useEffect(() => {
      if (project) {
        fetchRoomsAndItems();
      }
    }, [project, fetchRoomsAndItems]);
  
    const handleRoomCreated = () => {
      setIsFormOpen(false);
      fetchRoomsAndItems();
    };

    const handleItemsUpdated = () => {
        // This function is just to trigger a re-render if needed, but child component handles its own state.
        // Could be used in future to update project-level summaries.
        // For now, it simply ensures the parent is aware of a change, even if it doesn't directly re-fetch rooms.
        // If a total item count for the project was needed, this would trigger re-calculation.
    };
  
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Rooms</h3>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> New Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a New Room</DialogTitle>
              </DialogHeader>
              <RoomForm projectId={project.id} onRoomCreated={handleRoomCreated} />
            </DialogContent>
          </Dialog>
        </div>
  
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-lg bg-white">
            <DoorOpen className="mx-auto h-12 w-12 text-stone-400" />
            <h3 className="mt-2 text-sm font-medium text-stone-900">No rooms in this project yet</h3>
            <p className="mt-1 text-sm text-stone-500">Add the first room to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rooms.map((room) => (
              <RoomSection key={room.id} project={project} room={room} onItemsUpdated={handleItemsUpdated} />
            ))}
          </div>
        )}
      </div>
    );
}
