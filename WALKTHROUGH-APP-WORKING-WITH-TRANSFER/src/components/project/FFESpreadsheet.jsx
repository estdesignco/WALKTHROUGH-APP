
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Room } from '@/api/entities';
import { Item } from '@/api/entities';
import { TemplateItem } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Image as ImageIcon, Plus, Link as LinkIcon, Trash2, Download, ChevronRight, Undo, FolderPlus, Upload, UserPlus, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import PDFLinkScraper from './PDFLinkScraper'; // Import the new component
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

const ROOM_OPTIONS = [
    "Living Room", "Family Room", "Great Room", "Primary Bedroom", "Guest Bedroom", "Children's Bedroom",
    "Nursery", "Home Office", "Study", "Library", "Primary Bathroom", "Guest Bathroom", "Half Bathroom",
    "Jack and Jill Bathroom", "Kitchen", "Pantry", "Butler's Pantry", "Dining Room", "Breakfast Nook",
    "Bar Area", "Wine Cellar", "Laundry Room", "Mudroom", "Utility Room", "Linen Closet",
    "Walk-in Closet", "Basement", "Home Theater", "Media Room", "Game Room", "Home Gym",
    "Play Room", "Craft Room", "Music Room", "Art Studio", "Workshop", "Foyer", "Entryway",
    "Hallway", "Sunroom", "Screened Porch", "Patio", "Deck", "Outdoor Kitchen", "Pool House", "Guest House"
];

const RoomForm = ({ projectId, onRoomCreated }) => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roomName = selectedRoom === 'custom' ? customRoom : selectedRoom;
    if (!roomName) return;

    setIsCreating(true);
    try {
      const newRoom = await Room.create({ project_id: projectId, name: roomName, notes });
      onRoomCreated(newRoom);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Select Room Type</Label>
        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
          <SelectTrigger>
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
          <Label htmlFor="customRoomName">Custom Room Name</Label>
          <Input id="customRoomName" value={customRoom} onChange={(e) => setCustomRoom(e.target.value)} placeholder="e.g., Wine Tasting Room" required />
        </div>
      )}
      <div>
        <Label htmlFor="roomNotes">Notes</Label>
        <Textarea id="roomNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Ceiling height, flooring type, etc."/>
      </div>
      <Button type="submit" disabled={isCreating || (!selectedRoom || (selectedRoom === 'custom' && !customRoom))} className="w-full bg-[#8B7355] hover:bg-[#7A6249]">
        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Add Room
      </Button>
    </form>
  );
};

const ROOM_COLORS = {
    'Living Room': '#8B5CF6', 'Kitchen': '#06B6D4', 'Dining Room': '#DC2626',
    'Primary Bedroom': '#2F5233', 'Guest Bedroom': '#7C3AED', 'Home Office': '#EA580C',
    'Primary Bathroom': '#0284C7', 'Guest Bathroom': '#7C2D12', 'Laundry Room': '#65A30D',
    'Entryway': '#BE185D', 'Sunroom': '#0891B2', 'Nursery': '#C2410C',
    'Master Bedroom': '#059669',
};

// Updated FFE_STATUSES with new colors
const FFE_STATUSES = [
    { value: 'Approved', color: '#4ADE80' },
    { value: 'Ordered', color: '#FB923C' },
    { value: 'Shipped', color: '#FBBF24' },
    { value: 'Delivered to Receiver', color: '#A78BFA' },
    { value: 'Delivered to Store', color: '#A855F7' },
    { value: 'Delivered to Jobsite', color: '#3B82F6' },
    { value: 'On Hold', color: '#06B6D4' },
    { value: 'Partially Delivered', color: '#10B981' },
    { value: 'Damaged', color: '#D97706' },
    { value: 'Backordered', color: '#DC2626' },
    { value: 'At Workroom', color: '#7C3AED' },
    { value: 'Ask Advisor', color: '#DB2777' },
    { value: 'Ask Client', color: '#059669' },
    { value: 'Ready for Install', color: '#0D9488' },
    { value: 'Installed', color: '#65A30D' },
    { value: 'PICKED', color: '#FFD700' } // Keeping PICKED for checklist functionality
];

// Merged and updated CARRIERS, preserving object structure
const CARRIERS = [
    { value: 'UPS', color: '#FFBF00' },
    { value: 'FedEx', color: '#4D148C' },
    { value: 'USPS', color: '#004B87' },
    { value: 'DHL', color: '#FFCC00' },
    { value: 'OnTrac', color: '#00A0C6' }, // New from outline
    { value: 'XPO', color: '#D6001C' },
    { value: 'R+L', color: '#004A7B' }, // New from outline
    { value: 'Pilot', color: '#F05030' }, // New from outline
    { value: 'Estes', color: '#E51E25' },
    { value: 'Other', color: '#6B7280' },
];

// Updated SHIPPING_TO_OPTIONS, preserving object structure
const SHIPPING_TO_OPTIONS = [
    { value: "Client", color: "#FBBF24" },
    { value: "Receiver", color: "#60A5FA" },
    { value: "Store", color: "#F472B6" },
    { value: "Jobsite", color: "#34D399" },
];

const getFFEStatusColor = (status) => FFE_STATUSES.find(s => s.value === status)?.color || '#6B7280';
const getCarrierColor = (carrier) => CARRIERS.find(c => c.value === carrier)?.color || '#6B7280';
const getShippingToColor = (shippingTo) => SHIPPING_TO_OPTIONS.find(s => s.value === shippingTo)?.color || '#6B7280';

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
            await Item.update(item.id, { image_link: tempValue });
            onUpdate();
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
            <div className="cursor-pointer text-white text-xs flex items-center justify-center h-full">
                {imageUrl ? (
                    <div className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" onClick={() => setShowModal(true)} />
                        <span className="text-xs" onClick={() => setIsEditing(true)}>Edit</span>
                    </div>
                ) : (
                    <span onClick={() => setIsEditing(true)} className="text-gray-400">+ Image</span>
                )}
            </div>
            {showModal && <ImageModal imageUrl={imageUrl} onClose={() => setShowModal(false)} />}
        </>
    );
};

const EditableCell = ({ value, field, item, onUpdate, className = '' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    const handleSave = async () => {
        let valueToSave = tempValue;
        if (field === 'actual_cost' || field === 'quantity') {
            if (tempValue === '' || tempValue === null || tempValue === undefined) {
                valueToSave = null;
            } else {
                const numValue = parseFloat(tempValue);
                valueToSave = isNaN(numValue) ? null : numValue;
            }
        }
        if (valueToSave !== value) {
            await Item.update(item.id, { [field]: valueToSave });
            onUpdate();
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Input
                value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className={`w-full h-full text-xs p-1 bg-gray-600 text-white border-none focus:ring-0 ${className}`}
                autoFocus type={field === 'actual_cost' || field === 'quantity' ? 'number' : 'text'} />
        );
    }
    return (
        <span onClick={() => setIsEditing(true)} className={`cursor-pointer text-white text-xs block w-full h-full px-1 flex items-center ${className}`}>
            {value || <span className="text-gray-400">-</span>}
        </span>
    );
};

const DateCell = ({ value, field, item, onUpdate, className = '' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    const handleSave = async () => {
        let valueToSave = tempValue === '' ? null : tempValue;
        if (valueToSave !== value) {
            await Item.update(item.id, { [field]: valueToSave });
            onUpdate();
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return <Input type="date" value={tempValue} onChange={(e) => setTempValue(e.target.value)} onBlur={handleSave}
            className={`w-full h-full text-xs p-1 bg-gray-600 text-white border-none focus:ring-0 ${className}`} autoFocus />;
    }
    return (
        <span onClick={() => setIsEditing(true)} className={`cursor-pointer text-white text-xs block w-full h-full px-1 flex items-center ${className}`}>
            {value ? new Date(value).toLocaleDateString() : <span className="text-gray-400">-</span>}
        </span>
    );
};

const HeaderCell = ({ children, className = '', style = {}, ...props }) => (
    <th className={`p-2 border border-gray-400 align-middle ${className}`} style={style} {...props}>
        <div className="text-xs font-bold leading-tight">{children}</div>
    </th>
);

const LinkCell = ({ value, item, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    const handleSave = async () => {
        if (tempValue !== value) {
            await Item.update(item.id, { link: tempValue === '' ? null : tempValue });
            onUpdate();
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="w-full h-full text-xs p-1 bg-gray-600 text-white border-none focus:ring-0"
                placeholder="Link URL"
                autoFocus
            />
        );
    }

    return (
        <div className="cursor-pointer text-white text-xs flex items-center justify-center h-full">
            {value ? (
                <div className="flex items-center gap-1">
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3"/>
                        <span>View</span>
                    </a>
                    <span className="text-xs text-gray-400 hover:text-white" onClick={() => setIsEditing(true)}>Edit</span>
                </div>
            ) : (
                <span onClick={() => setIsEditing(true)} className="text-gray-400">+ Link</span>
            )}
        </div>
    );
};

const getTrackingURL = (carrier, trackingNumber) => {
    if (!trackingNumber) return null;
    
    const trackingURLs = {
        'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
        'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
        'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
        'DHL': `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
        'OnTrac': `https://www.ontrac.com/trackingResults.asp?trackingNumber=${trackingNumber}`, // Added OnTrac
        'XPO': `https://app.xpo.com/tracking/search/pro?pro=${trackingNumber}`,
        'R+L': `https://www.rlcarriers.com/freight/shipping/tracker?pro=${trackingNumber}`, // Added R+L
        'Pilot': `https://www.pilotdelivers.com/track/?keywords=${trackingNumber}`, // Added Pilot
        // Note: Original code had Amazon, Southeastern, A. Duie Pyle, Old Dominion, Brooks Furniture Express, Zenith, Sunbelt.
        // These are removed to align with updated CARRIERS list from outline.
        'Other': null
    };
    
    return trackingURLs[carrier] || null;
};

const TrackingNumberCell = ({ item, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(item.tracking_number || '');

    const handleSave = async () => {
        if (value !== item.tracking_number) {
            await Item.update(item.id, { tracking_number: value });
            onUpdate();
        }
        setIsEditing(false);
    };

    const handleTrack = () => {
        const trackingURL = getTrackingURL(item.carrier, item.tracking_number);
        if (trackingURL) {
            window.open(trackingURL, '_blank');
        } else {
            alert('Please select a carrier first or enter a valid tracking number.');
        }
    };

    if (isEditing) {
        return (
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="w-full h-full text-xs p-1 bg-gray-700 text-white border-gray-600 focus:ring-0"
                placeholder="Enter tracking #"
                autoFocus
            />
        );
    }

    return (
        <div className="flex items-center gap-1 h-full px-1">
            <span
                className="text-white text-xs cursor-pointer hover:text-blue-400 underline flex-1 min-w-0 truncate"
                onClick={item.tracking_number ? handleTrack : () => setIsEditing(true)}
                title={item.tracking_number ? `Track with ${item.carrier || 'carrier'}` : 'Click to add tracking number'}
            >
                {item.tracking_number || <span className="text-gray-400">Add Tracking #</span>}
            </span>
            {item.tracking_number && item.carrier && getTrackingURL(item.carrier, item.tracking_number) && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-400 hover:text-blue-300 flex-shrink-0"
                    onClick={handleTrack}
                    title="Track Package"
                >
                    🚚
                </Button>
            )}
        </div>
    );
};

const SpreadsheetRow = ({ item, onUpdate, onDelete, selectedItems, onToggleSelect }) => {
    const handleUpdate = async (field, value) => {
        await Item.update(item.id, { [field]: value });
        onUpdate();
    };

    return (
        <tr className="border-b border-gray-600" style={{backgroundColor: '#2D3748', height: '80px' }}>
            <td className="p-0 border border-gray-400 align-middle text-white text-xs bg-gray-800 w-10 flex items-center justify-center h-full">
                <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => onToggleSelect(item.id)}
                    className="h-4 w-4 border-gray-400 data-[state=checked]:bg-[#8B7355] data-[state=checked]:text-white"
                />
            </td>
            <td className="p-0 border border-gray-400 align-middle text-white text-xs bg-gray-800 w-40"><EditableCell value={item.name} field="name" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-40"><EditableCell value={item.vendor_sku} field="vendor_sku" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle text-center bg-gray-800 w-24"><EditableCell value={item.quantity} field="quantity" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-32"><EditableCell value={item.size} field="size" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-40">
                <Select value={item.status || undefined} onValueChange={(v) => handleUpdate('status', v)}>
                    <SelectTrigger className="w-full h-full text-xs bg-transparent border-none focus:ring-0 text-white">
                        {item.status ? (<div className="flex items-center"><span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: getFFEStatusColor(item.status) }}></span>{item.status}</div>) : <SelectValue placeholder="-"/>}
                    </SelectTrigger>
                    <SelectContent>{FFE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}><div className="flex items-center"><span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: s.color }}></span>{s.value}</div></SelectItem>)}</SelectContent>
                </Select>
            </td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-32"><EditableCell value={item.finish_color} field="finish_color" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-24"><EditableCell value={item.actual_cost} field="actual_cost" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-32"><ImageCell imageUrl={item.image_link} onUpdate={onUpdate} item={item} /></td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-32"><LinkCell value={item.link} item={item} onUpdate={onUpdate} /></td>
            <td className="p-0 border border-gray-400 align-top text-xs w-48">
                <div className="p-1 border-b border-gray-500 h-1/3 flex items-center" style={{backgroundColor: item.status ? getFFEStatusColor(item.status) : '#374151' }}>
                    {item.status || '-'}
                </div>
                <DateCell value={item.estimated_ship_date} field="estimated_ship_date" item={item} onUpdate={onUpdate} className="h-1/3 bg-gray-800" />
                <DateCell value={item.estimated_delivery_date} field="estimated_delivery_date" item={item} onUpdate={onUpdate} className="h-1/3" style={{backgroundColor: '#374151'}} />
            </td>
            <td className="p-0 border border-gray-400 align-top w-40">
                <DateCell value={item.install_date} field="install_date" item={item} onUpdate={onUpdate} className="h-1/2 bg-gray-800" />
                <div className="p-0 h-1/2" style={{backgroundColor: '#374151'}}>
                     <Select value={item.shipping_to || undefined} onValueChange={(v) => handleUpdate('shipping_to', v)}>
                        <SelectTrigger className="w-full h-full text-xs bg-transparent border-none focus:ring-0 text-white">
                             {item.shipping_to ? (<div className="flex items-center"><span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: getShippingToColor(item.shipping_to) }}></span>{item.shipping_to}</div>) : <SelectValue placeholder="-"/>}
                        </SelectTrigger>
                        <SelectContent>{SHIPPING_TO_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}><div className="flex items-center"><span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: opt.color }}></span>{opt.value}</div></SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </td>
            <td className="p-2 border-r border-gray-600 w-32 bg-gray-800">
                <TrackingNumberCell item={item} onUpdate={onUpdate} />
            </td>
            <td className="p-0 border border-gray-400 align-middle w-32" style={{backgroundColor: '#374151'}}>
                 <Select value={item.carrier || undefined} onValueChange={(v) => handleUpdate('carrier', v)}>
                    <SelectTrigger className="w-full h-full text-xs bg-transparent border-none focus:ring-0 text-white">
                        {item.carrier ? (<div className="flex items-center"><span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: getCarrierColor(item.carrier) }}></span>{item.carrier}</div>) : <SelectValue placeholder="-"/>}
                    </SelectTrigger>
                    <SelectContent>{CARRIERS.map(c => <SelectItem key={c.value} value={c.value}><div className="flex items-center"><span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: c.color }}></span>{c.value}</div></SelectItem>)}</SelectContent>
                </Select>
            </td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-32"><DateCell value={item.order_date} field="order_date" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle w-48" style={{backgroundColor: '#374151'}}><EditableCell value={item.remarks} field="remarks" item={item} onUpdate={onUpdate} className="w-full h-full text-xs" /></td>
            <td className="p-0 border border-gray-400 align-middle bg-gray-800 w-16 text-center">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-900/50 hover:text-red-300" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </td>
        </tr>
    );
};

export default function FFESpreadsheet({ project }) {
    const [rooms, setRooms] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pieData, setPieData] = useState([]);
    const [carrierBreakdownData, setCarrierBreakdownData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roomFilter, setRoomFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false); // Consolidated state for all data modifications
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [lastDeletedItems, setLastDeletedItems] = useState([]); // New state for undo

    const ffeStatusesOnly = useMemo(() => FFE_STATUSES.map(s => s.value), []);

    const loadData = useCallback(async () => {
        if (!project?.id) return;
        setIsLoading(true);
        try {
            // Using Promise.all for concurrent fetching, as per outline structure
            const [roomList, itemList] = await Promise.all([
                Room.filter({ project_id: project.id }),
                // Filter items by statuses defined in FFE_STATUSES
                Item.filter({ project_id: project.id, status: { $in: ffeStatusesOnly } }, '-created_date')
            ]);
            setRooms(roomList);
            setAllItems(itemList);
            
            // Re-added chart data calculation to preserve functionality
            const statusCounts = itemList.reduce((acc, item) => {
                const status = item.status || 'Approved'; // Default to Approved if status is null/undefined
                acc[status] = (acc[status] || 0) + 1; 
                return acc;
            }, {});
            setPieData(Object.entries(statusCounts).map(([name, value]) => ({ name, value, color: getFFEStatusColor(name) })));

            const carrierCounts = itemList.reduce((acc, item) => {
                if (item.carrier) {
                    acc[item.carrier] = (acc[item.carrier] || 0) + 1;
                }
                return acc;
            }, {});

            const breakdownData = Object.entries(carrierCounts)
                .map(([name, value]) => ({
                    name,
                    value,
                    color: CARRIERS.find(c => c.value === name)?.color || '#6B7280'
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setCarrierBreakdownData(breakdownData);

        } catch (error) { 
            console.error("Failed to load data:", error); 
        } finally { 
            setIsLoading(false); 
        }
    }, [project, ffeStatusesOnly]);

    useEffect(() => { 
        loadData(); 
    }, [loadData]);
    
    const refreshData = useCallback(async () => { 
        await loadData(); 
    }, [loadData]);

    const handleRoomCreatedAndPopulate = async (newRoom) => {
        setIsRoomFormOpen(false);
        await refreshData();
    };

    const handleAddNewItem = async (roomId, category, subCategory) => {
        setIsUpdating(true);
        try {
            await Item.create({
                project_id: project.id,
                room_id: roomId,
                category: category,
                sub_category: subCategory,
                name: "New Item - Click to edit",
                status: 'Approved',
                quantity: 1,
            });
            await refreshData();
        } catch (error) {
            console.error("Failed to add new item:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMoveToChecklist = async () => {
        if (selectedItems.size === 0) return;
        setIsUpdating(true);
        const itemIds = Array.from(selectedItems);
        try {
            const idChunks = chunk(itemIds, 20);

            for (const itemChunk of idChunks) {
                const promises = itemChunk.map(itemId => Item.update(itemId, { status: 'PICKED' }));
                await Promise.all(promises);
                await sleep(1000); // Wait for 1 second after each chunk to avoid rate limits
            }

            setSelectedItems(new Set());
            await refreshData();
        } catch (error) {
            console.error("Failed to move items to Checklist:", error);
            alert("An error occurred while moving items. Some items may not have been moved. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        setIsUpdating(true);
        const itemToDelete = allItems.find(item => item.id === itemId);
        if (itemToDelete) {
            setLastDeletedItems([itemToDelete]); // Store for undo
        }
        try {
            await Item.delete(itemId);
            await refreshData(); 
        } catch (error) {
            console.error("Failed to delete item:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteSection = async (roomId, category, subCategory) => {
        setIsUpdating(true);
        try {
            const itemsToDelete = allItems.filter(item =>
                item.room_id === roomId &&
                item.category === category &&
                item.sub_category === subCategory
            );
            if (itemsToDelete.length > 0) {
                setLastDeletedItems(itemsToDelete);
                
                const itemChunks = chunk(itemsToDelete, 20); // Chunk items for batch deletion
                for(const itemChunk of itemChunks) {
                    const promises = itemChunk.map(item => Item.delete(item.id));
                    await Promise.all(promises);
                    await sleep(1000); // Wait for 1 second after each chunk
                }
            }
            await refreshData();
        } catch (error) {
            console.error("Failed to delete section:", error);
        } finally {
            setIsUpdating(false);
        }
    };
    
    // New function from outline to undo deletions
    const handleUndoDeletion = async () => {
        if (lastDeletedItems.length === 0) return;
        setIsUpdating(true);
        try {
            // Filter out properties that are auto-generated by the backend (id, timestamps)
            const itemsToRecreate = lastDeletedItems.map(({ id, created_date, updated_date, created_by, ...rest }) => rest);
            await Item.bulkCreate(itemsToRecreate);
            setLastDeletedItems([]); // Clear the undo buffer
            await refreshData();
        } catch (error) {
            console.error("Failed to undo deletion:", error);
            alert("Could not undo the deletion.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleSelectItem = useCallback((itemId) => {
        setSelectedItems(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(itemId)) {
                newSelected.delete(itemId);
            } else {
                newSelected.add(itemId);
            }
            return newSelected;
        });
    }, [setSelectedItems]);

    const exportToCSV = () => {
        const headers = ['Room', 'Category', 'Sub-Category', 'Item Name', 'Vendor/SKU', 'Quantity', 'Size', 'Status', 'Finish/Color', 'Actual Cost', 'Image Link', 'Link', 'Estimated Ship Date', 'Estimated Delivery Date', 'Install Date', 'Shipping To', 'Tracking Number', 'Carrier', 'Order Date', 'Remarks'];
        const csvData = allItems.map(item => {
            const room = rooms.find(r => r.id === item.room_id);
            return [
                room?.name || '',
                item.category || '',
                item.sub_category || '',
                item.name || '',
                item.vendor_sku || '',
                item.quantity || '',
                item.size || '',
                item.status || '',
                item.finish_color || '',
                item.actual_cost || '',
                item.image_link || '',
                item.link || '',
                item.estimated_ship_date || '',
                item.estimated_delivery_date || '',
                item.install_date || '',
                item.shipping_to || '',
                item.tracking_number || '',
                item.carrier || '',
                item.order_date || '', // Added order_date to CSV export
                item.remarks || ''
            ];
        });
        const csvContent = [headers.join(','), ...csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${project.name.toLowerCase().replace(/\s/g, '-')}-ffe-data.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('Your browser does not support downloading files directly. Please copy the data manually.');
        }
    };

    const filteredItems = useMemo(() => allItems.filter(item =>
        (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.vendor_sku?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (roomFilter === 'all' || item.room_id === roomFilter) &&
        (categoryFilter === 'all' || item.category === categoryFilter)
    ), [allItems, searchTerm, roomFilter, categoryFilter]);

    const categories = useMemo(() => [...new Set(allItems.map(item => item.category).filter(Boolean))], [allItems]);

    if (isLoading) return <div className="text-white text-center p-10">Loading...</div>;

    const totalColumns = 17;

    const CATEGORY_ORDER = ['LIGHTING', 'FURNITURE', 'PLUMBING', 'APPLIANCES', 'CABINETS', 'ACCESSORIES', 'TEXTILES', 'OUTDOOR', 'PAINT, WALLPAPER, HARDWARE & FINISHES', 'Uncategorized'];

    return (
        <div className="bg-gray-900 text-stone-200 p-6">
             <div className="w-full bg-[#8B7355] shadow-lg flex items-center justify-center my-8 h-auto max-h-[130px] p-4 rounded-lg border border-[#8B7355]/50">
                <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3b546fdf5_Establishedlogo.png"
                    alt="Established Design Co."
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="mb-8 bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-[#8B7355]">FF&E - {project.name.toUpperCase()}</h2>
                    <div className="flex gap-2 flex-wrap">
                         {lastDeletedItems.length > 0 && (
                            <Button onClick={handleUndoDeletion} variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-stone-900 text-xs px-3 py-2 disabled:opacity-50" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Undo className="w-3 h-3 mr-1" />}
                                Undo Delete
                            </Button>
                        )}
                        <Button variant="outline" className="bg-[#8B7355] text-stone-200 hover:bg-[#A0927B] text-xs px-3 py-2" onClick={exportToCSV}>
                            <Download className="mr-1 h-3 w-3" />
                            Export FF&E
                        </Button>
                        <PDFLinkScraper project={project} onComplete={refreshData} />
                        <EnhancedPDFExtractor project={project} onComplete={refreshData} />
                         <Button variant="outline" className="bg-[#8B7355] text-stone-200 hover:bg-[#A0927B] text-xs px-3 py-2" onClick={() => alert("Coming soon!")}>
                            <FileDown className="mr-1 h-3 w-3" />
                            Spec Sheet
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="mb-8 bg-gray-800 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="font-bold mb-4 text-center" style={{color: '#8B7355'}}>Status Overview</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius="80%"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} items`, name]} />
                                <Legend /> {/* Added Legend for better clarity */}
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4 text-center" style={{color: '#8B7355'}}>Status Breakdown</h3>
                        <div className="space-y-2 h-80 overflow-y-auto pr-2">
                            {pieData.map((entry) => (
                                <div key={entry.name} className="flex items-center text-xs">
                                    <div
                                        className="w-full flex justify-between items-center p-2 rounded"
                                        style={{ backgroundColor: entry.color, color: '#FFF' }}
                                    >
                                        <span>{entry.name}</span>
                                        <span className="font-bold bg-black bg-opacity-20 px-2 py-0.5 rounded-full">
                                            {entry.value}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold mb-4 text-center" style={{color: '#8B7355'}}>Shipping Carrier Breakdown</h3>
                        <div className="space-y-2 h-80 overflow-y-auto pr-2">
                            {carrierBreakdownData.length > 0 ? carrierBreakdownData.map((entry) => (
                                <div key={entry.name} className="flex items-center text-xs">
                                    <div
                                        className="w-full flex justify-between items-center p-2 rounded"
                                        style={{ backgroundColor: entry.color, color: '#FFF' }}
                                    >
                                        <span>{entry.name}</span>
                                        <span className="font-bold bg-black bg-opacity-20 px-2 py-0.5 rounded-full">
                                            {entry.value}
                                        </span>
                                    </div>
                                </div>
                            )) : <p className="text-stone-400 text-sm text-center pt-8">No items with assigned carriers.</p>}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mb-6 bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5" style={{color: '#8B7355'}} />
                        <Input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 h-12 text-sm bg-gray-700 text-white border-gray-600" />
                    </div>
                    <Select value={roomFilter} onValueChange={setRoomFilter}>
                        <SelectTrigger className="w-48 h-12 bg-gray-700 text-white border-gray-600 text-sm flex-shrink-0">
                            <SelectValue placeholder="All Rooms" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Rooms</SelectItem>
                            {rooms.map(room => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-48 h-12 bg-gray-700 text-white border-gray-600 text-sm flex-shrink-0">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 text-sm bg-[#8B7355] hover:bg-[#7A6249] text-white flex-shrink-0"><Plus className="mr-2 h-4 w-4" /> Add Room</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add a New Room</DialogTitle>
                            </DialogHeader>
                            <RoomForm projectId={project.id} onRoomCreated={handleRoomCreatedAndPopulate} />
                        </DialogContent>
                    </Dialog>
            </div>

            <div className="w-full overflow-x-auto">
                {rooms.filter(r => roomFilter === 'all' || r.id === roomFilter).map(room => {
                    const roomItems = filteredItems.filter(item => item.room_id === room.id);
                    if (roomItems.length === 0 && roomFilter !== 'all' && room.id !== roomFilter) return null;

                    const groupedItems = roomItems.reduce((acc, item) => {
                        const cat = item.category || 'Uncategorized';
                         if (!acc[cat]) {
                            acc[cat] = {};
                        }
                        const subCategory = item.sub_category || 'Misc.';
                        if (!acc[cat][subCategory]) {
                            acc[cat][subCategory] = [];
                        }
                        acc[cat][subCategory].push(item);
                        return acc;
                    }, {});

                    return (
                        <div key={room.id} className="mb-8">
                            <table className="w-full border-collapse" style={{minWidth: '2200px', tableLayout: 'fixed'}}>
                                <thead>
                                    <tr><th colSpan={totalColumns} className="text-white text-center py-3 mb-0 font-bold text-lg border border-gray-600" style={{backgroundColor: ROOM_COLORS[room.name] || '#6B7280'}}>{room.name.toUpperCase()}</th></tr>
                                </thead>
                                <tbody>
                                    {Object.keys(groupedItems).length === 0 && (
                                        <tr className="bg-gray-800">
                                            <td colSpan={totalColumns} className="p-4 text-center text-gray-400">
                                                No items in this room yet. Add your first item below.
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAddNewItem(room.id, 'Uncategorized', 'Misc.')}
                                                    className="bg-[#8B7355] hover:bg-[#7A6249] text-stone-200 ml-2"
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Add Initial Item
                                                </Button>
                                            </td>
                                        </tr>
                                    )}

                                    {Object.entries(groupedItems)
                                        .sort(([catA], [catB]) => {
                                            const indexA = CATEGORY_ORDER.indexOf(catA);
                                            const indexB = CATEGORY_ORDER.indexOf(catB);
                                            if (indexA === -1 && indexB === -1) return 0;
                                            if (indexA === -1) return 1;
                                            if (indexB === -1) return -1;
                                            return indexA - indexB;
                                        })
                                        .map(([category, subCategories]) => (
                                        <React.Fragment key={category}>
                                            <tr><td colSpan={totalColumns} className="text-white text-center py-2 font-semibold text-sm border-x border-gray-600" style={{backgroundColor: '#4A6748'}}>{category.toUpperCase()}</td></tr>
                                            {Object.entries(subCategories).map(([subCategory, items]) => (
                                                <React.Fragment key={subCategory}>
                                                    <tr>
                                                        <th colSpan={totalColumns} className="text-white text-center py-2 font-semibold text-sm border-x border-gray-600" style={{backgroundColor: '#C05A5C'}}>{subCategory.toUpperCase()}</th>
                                                    </tr>
                                                    <tr style={{backgroundColor: '#C05A5C'}} className="text-white text-xs text-center">
                                                        <HeaderCell className="w-10" rowSpan="2">SELECT</HeaderCell>
                                                        <HeaderCell className="w-40" rowSpan="2">ITEM NAME</HeaderCell>
                                                        <HeaderCell className="w-40" rowSpan="2">VENDOR/SKU</HeaderCell>
                                                        <HeaderCell className="w-24" rowSpan="2">QTY</HeaderCell>
                                                        <HeaderCell className="w-32" rowSpan="2">SIZE</HeaderCell>
                                                        <HeaderCell className="w-40" rowSpan="2">ORDERS STATUS</HeaderCell>
                                                        <HeaderCell colSpan="4" style={{backgroundColor: '#8B5A3D'}}>ADDITIONAL INFO.</HeaderCell>
                                                        <HeaderCell colSpan="5" style={{backgroundColor: '#5B4A75'}}>SHIPPING INFO.</HeaderCell>
                                                        <HeaderCell className="w-48" rowSpan="2">NOTES</HeaderCell>
                                                        <HeaderCell className="w-16" rowSpan="2">ACTIONS</HeaderCell>
                                                    </tr>
                                                    <tr style={{backgroundColor: '#C05A5C'}} className="text-white text-xs text-center">
                                                        <HeaderCell style={{backgroundColor: '#8B5A3D'}} className="w-32">FINISH/Color</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#8B5A3D'}} className="w-24">Cost/Price</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#8B5A3D'}} className="w-32">Image</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#8B5A3D'}} className="w-32">Link</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#5B4A75'}} className="w-48">Order Status / Est. Ship Date / Est. Delivery Date</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#5B4A75'}} className="w-40">Install Date / Shipping TO</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#5B4A75'}} className="w-32">TRACKING #</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#5B4A75'}} className="w-32">Carrier</HeaderCell>
                                                        <HeaderCell style={{backgroundColor: '#5B4A75'}} className="w-32">Order Date</HeaderCell>
                                                    </tr>
                                                    {items.map(item => <SpreadsheetRow key={item.id} item={item} onUpdate={refreshData} onDelete={() => handleDeleteItem(item.id)} selectedItems={selectedItems} onToggleSelect={handleToggleSelectItem} />)}
                                                     <tr>
                                                        <td colSpan={totalColumns} className="p-2 bg-gray-800 border-x border-b border-gray-600">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleAddNewItem(room.id, category, subCategory)}
                                                                    className="bg-[#2D3748]/60 hover:bg-[#2D3748]/80 border border-[#8B7355]/40 text-[#A0927B] hover:text-stone-200 transition-all duration-200"
                                                                    disabled={isUpdating}
                                                                >
                                                                    {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Plus className="w-4 h-4 mr-2" />} Add Item
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteSection(room.id, category, subCategory)}
                                                                    disabled={isUpdating}
                                                                    className="bg-[#4A5568]/60 hover:bg-[#4A5568]/80 border border-red-400/40 text-[#F56565] hover:text-red-300 transition-all duration-200"
                                                                >
                                                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="w-4 h-4 mr-2" />} Delete Section
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
