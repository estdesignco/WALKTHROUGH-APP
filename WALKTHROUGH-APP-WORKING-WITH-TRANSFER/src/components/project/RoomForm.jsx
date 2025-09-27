import React, { useState } from 'react';
import { Room } from '@/api/entities';
import { Item } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from 'lucide-react';

const ROOM_OPTIONS = [
    "Living Room", "Family Room", "Great Room", "Primary Bedroom", "Guest Bedroom", "Children's Bedroom",
    "Nursery", "Home Office", "Study", "Library", "Primary Bathroom", "Guest Bathroom", "Half Bathroom",
    "Jack and Jill Bathroom", "Kitchen", "Pantry", "Butler's Pantry", "Dining Room", "Breakfast Nook",
    "Bar Area", "Wine Cellar", "Laundry Room", "Mudroom", "Utility Room", "Linen Closet",
    "Walk-in Closet", "Basement", "Home Theater", "Media Room", "Game Room", "Home Gym",
    "Play Room", "Craft Room", "Music Room", "Art Studio", "Workshop", "Foyer", "Entryway",
    "Hallway", "Sunroom", "Screened Porch", "Patio", "Deck", "Outdoor Kitchen", "Pool House", "Guest House"
];

export default function RoomForm({ projectId, onRoomCreated }) {
    const [selectedRoom, setSelectedRoom] = useState('');
    const [customRoom, setCustomRoom] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const roomName = selectedRoom === 'custom' ? customRoom : selectedRoom;
        if (!roomName) return;

        setIsCreating(true);
        try {
            const newRoom = await Room.create({ 
                project_id: projectId, 
                name: roomName
            });

            // THIS IS THE CORRECTED, SIMPLIFIED ITEM POPULATION LOGIC
            const basicItems = [
                { category: 'LIGHTING', sub_category: 'CEILING', name: 'Ceiling Light - Click to edit' },
                { category: 'FURNITURE', sub_category: 'SEATING', name: 'Seating - Click to edit' },
                { category: 'ACCESSORIES', sub_category: 'ART & DECOR', name: 'Art & Decor - Click to edit' },
                { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'WALL', name: 'Wall Finish - Click to edit' },
                { category: 'PAINT, WALLPAPER, HARDWARE & FINISHES', sub_category: 'FLOORING', name: 'Flooring - Click to edit' }
            ];

            if (roomName.toLowerCase().includes('kitchen')) {
                basicItems.push(
                    { category: 'APPLIANCES', sub_category: 'KITCHEN APPLIANCES', name: 'Refrigerator - Click to edit' },
                    { category: 'PLUMBING', sub_category: 'KITCHEN SINKS & FAUCETS', name: 'Kitchen Sink - Click to edit' },
                    { category: 'CABINETS', sub_category: 'LOWER', name: 'Lower Cabinets - Click to edit' },
                    { category: 'COUNTERTOPS & TILE', sub_category: 'COUNTERTOPS', name: 'Countertops - Click to edit' }
                );
            } else if (roomName.toLowerCase().includes('bath')) {
                basicItems.push(
                    { category: 'PLUMBING', sub_category: 'SHOWER & TUB', name: 'Shower/Tub - Click to edit' },
                    { category: 'CABINETS', sub_category: 'VANITY', name: 'Vanity - Click to edit' },
                    { category: 'COUNTERTOPS & TILE', sub_category: 'TILE', name: 'Floor Tile - Click to edit' }
                );
            } else if (roomName.toLowerCase().includes('bedroom')) {
                 basicItems.push(
                    { category: 'FURNITURE', sub_category: 'BEDS', name: 'Bed - Click to edit' },
                    { category: 'TEXTILES', sub_category: 'BEDDING', name: 'Bedding - Click to edit' }
                );
            }

            const itemsToCreate = basicItems.map(item => ({
                project_id: projectId,
                room_id: newRoom.id,
                category: item.category,
                sub_category: item.sub_category,
                name: item.name,
                status: 'Walkthrough',
                quantity: 1,
            }));

            await Item.bulkCreate(itemsToCreate);
            
            onRoomCreated(newRoom);
            
            setSelectedRoom('');
            setCustomRoom('');
        } catch (error) {
            console.error("Failed to create room:", error);
            alert('Failed to create room. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="room-type">Select Room Type</Label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger id="room-type">
                        <SelectValue placeholder="Choose a room type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 overflow-y-auto">
                        {ROOM_OPTIONS.map(room => (
                            <SelectItem key={room} value={room}>{room}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Room (type below)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {selectedRoom === 'custom' && (
                <div>
                    <Label htmlFor="custom-room-name">Custom Room Name</Label>
                    <Input 
                        id="custom-room-name" 
                        value={customRoom} 
                        onChange={(e) => setCustomRoom(e.target.value)} 
                        placeholder="e.g., Wine Tasting Room" 
                        required 
                    />
                </div>
            )}
            <Button 
                type="submit" 
                disabled={isCreating || (!selectedRoom || (selectedRoom === 'custom' && !customRoom))} 
                className="w-full bg-[#8B7355] hover:bg-[#7A6249]"
            >
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Room
            </Button>
        </form>
    );
}