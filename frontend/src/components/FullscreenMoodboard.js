import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DollhouseDocument from './moodboard/DollhouseDocument';
import Flat3DDocument from './moodboard/Flat3DDocument';
import FloorPlanDocument from './moodboard/FloorPlanDocument';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default function FullscreenMoodboard({ projectId }) {
    const navigate = useNavigate();
    const [activeDoc, setActiveDoc] = useState('flat3d'); // Start with Flat 3D
    const [moodboard, setMoodboard] = useState(null);
    const [paintCatalog, setPaintCatalog] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomPhotos, setRoomPhotos] = useState([]);
    const [showChecklist, setShowChecklist] = useState(false);
    
    const [sharedData, setSharedData] = useState({
        roomDimensions: { length: 15, width: 12, height: 10 },
        wallPaints: {
            front: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
            back: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
            left: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
            right: { hex: '#1E293B', name: 'Naval', code: 'SW 6244' },
            ceiling: { hex: '#F5F5DC', name: 'Alabaster', code: 'SW 7008' },
            floor: { hex: '#D4C5A9', name: 'Muted Gold', code: 'Custom' }
        },
        furnitureItems: []
    });
    
    useEffect(() => {
        loadOrCreateMoodboard();
        loadPaintCatalog();
        loadChecklistItems();
        loadProjectRooms();
    }, [projectId]);
    
    const loadProjectRooms = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}`);
            if (response.data.rooms) {
                setRooms(response.data.rooms);
                if (response.data.rooms.length > 0) {
                    const firstRoom = response.data.rooms[0];
                    setSelectedRoom(firstRoom);
                    loadRoomPhotos(firstRoom.id);
                }
            }
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    };
    
    const loadRoomPhotos = async (roomId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/photos/by-room/${projectId}/${roomId}`);
            setRoomPhotos(response.data.photos || []);
        } catch (error) {
            console.error('Failed to load photos:', error);
        }
    };
    
    const loadOrCreateMoodboard = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/moodboards/project/${projectId}`);
            if (response.data && response.data.length > 0) {
                setMoodboard(response.data[0]);
            } else {
                const newMb = await axios.post(`${BACKEND_URL}/api/moodboards`, {
                    project_id: projectId,
                    room_name: "Main Room",
                    room_length: 15,
                    room_width: 12,
                    room_height: 10
                });
                setMoodboard(newMb.data);
            }
        } catch (error) {
            console.error('Failed to load moodboard:', error);
        }
    };
    
    const loadPaintCatalog = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/moodboards/paint-catalog`);
            setPaintCatalog(response.data);
        } catch (error) {
            console.error('Failed to load paint catalog:', error);
        }
    };
    
    const loadChecklistItems = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
            const items = [];
            response.data.rooms?.forEach(room => {
                room.categories?.forEach(cat => {
                    cat.subcategories?.forEach(subcat => {
                        subcat.items?.forEach(item => {
                            if (item.status === 'PICKED') {
                                items.push({ ...item, room_name: room.name, category_name: cat.name });
                            }
                        });
                    });
                });
            });
            setChecklistItems(items);
        } catch (error) {
            console.error('Failed to load checklist:', error);
        }
    };
    
    const updateSharedData = (updates) => {
        const newData = { ...sharedData, ...updates };
        setSharedData(newData);
        
        if (moodboard) {
            axios.put(`${BACKEND_URL}/api/moodboards/${moodboard.id}`, updates)
                .catch(err => console.error('Save failed:', err));
        }
    };
    
    return (
        <div className="fixed inset-0 bg-[#0F172A] flex flex-col">
            <div className="h-12 bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-b-2 border-[#D4A574] flex items-center justify-between px-4 flex-shrink-0">
                <button onClick={() => navigate(`/project/${projectId}`)} className="text-[#D4A574] hover:text-[#BCA888] font-semibold">← Back</button>
                
                <div className="flex gap-2">
                    <button onClick={() => setActiveDoc('dollhouse')} className={`px-4 py-1 rounded font-semibold text-sm ${activeDoc === 'dollhouse' ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-[#D4C5A9]'}`}>🏠 3D Dollhouse</button>
                    <button onClick={() => setActiveDoc('flat3d')} className={`px-4 py-1 rounded font-semibold text-sm ${activeDoc === 'flat3d' ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-[#D4C5A9]'}`}>📐 Flat 3D</button>
                    <button onClick={() => setActiveDoc('floorplan')} className={`px-4 py-1 rounded font-semibold text-sm ${activeDoc === 'floorplan' ? 'bg-[#D4A574] text-black' : 'bg-gray-800 text-[#D4C5A9]'}`}>📏 Floor Plan</button>
                </div>
                
                <button onClick={() => setShowChecklist(!showChecklist)} className="bg-gray-800 hover:bg-gray-700 text-[#D4A574] px-4 py-1 rounded font-semibold text-sm">📋 Checklist ({checklistItems.length})</button>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
                {activeDoc === 'dollhouse' && moodboard && <DollhouseDocument moodboardId={moodboard.id} sharedData={sharedData} updateSharedData={updateSharedData} paintCatalog={paintCatalog} />}
                {activeDoc === 'flat3d' && moodboard && <Flat3DDocument moodboardId={moodboard.id} sharedData={sharedData} updateSharedData={updateSharedData} paintCatalog={paintCatalog} />}
                {activeDoc === 'floorplan' && moodboard && <FloorPlanDocument moodboardId={moodboard.id} sharedData={sharedData} updateSharedData={updateSharedData} paintCatalog={paintCatalog} />}
                
                {showChecklist && (
                    <div className="absolute inset-y-0 right-0 w-96 bg-gray-900 border-l-2 border-[#D4A574] p-4 overflow-y-auto shadow-2xl z-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[#D4A574] font-bold text-xl">📋 Checklist Items</h3>
                            <button onClick={() => setShowChecklist(false)} className="text-gray-400 hover:text-[#D4A574] text-2xl">✕</button>
                        </div>
                        {checklistItems.map((item, i) => (
                            <div key={i} onClick={() => { updateSharedData({ furnitureItems: [...sharedData.furnitureItems, { item_id: item.id, name: item.name, position_x: 0, position_y: 0, position_z: 0, placement_type: 'floor', price: item.cost }] }); setShowChecklist(false); }} className="bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-4 py-3 rounded mb-2 cursor-pointer border border-[#D4A574]/20 hover:border-[#D4A574]">
                                <div className="font-bold">{item.name}</div>
                                <div className="text-sm text-gray-400">{item.category_name}</div>
                                {item.cost > 0 && <div className="text-sm text-[#D4A574]">${item.cost}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
