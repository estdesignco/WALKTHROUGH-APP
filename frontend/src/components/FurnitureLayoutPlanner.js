import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, RotateCw, Trash2, Save, Download, Grid, Move } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Furniture Layout Planner
 * - Loads ACTUAL furniture from your FFE sheet
 * - Drag & drop to scale on floor plan
 * - Real dimensions from your items
 */
export default function FurnitureLayoutPlanner() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Room settings
  const [roomWidth, setRoomWidth] = useState(20); // feet
  const [roomLength, setRoomLength] = useState(15); // feet
  const [showGrid, setShowGrid] = useState(true);
  const [scale, setScale] = useState(30); // pixels per foot
  
  // Furniture from FFE
  const [ffeItems, setFfeItems] = useState([]);
  const [placedFurniture, setPlacedFurniture] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Drag state
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load FFE items from project
  useEffect(() => {
    loadFFEItems();
  }, [projectId]);

  const loadFFEItems = async () => {
    try {
      // Get project with all items
      const response = await fetch(`${API_URL}/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        
        // Extract all furniture items with dimensions
        const items = [];
        project.rooms?.forEach(room => {
          room.categories?.forEach(category => {
            category.subcategories?.forEach(subcategory => {
              subcategory.items?.forEach(item => {
                // Parse dimensions from the size field
                const dimensions = parseDimensions(item.size || item.dimensions || '');
                items.push({
                  id: item.id,
                  name: item.name,
                  category: category.name,
                  room: room.name,
                  width: dimensions.width || 3, // default 3 feet
                  depth: dimensions.depth || 2, // default 2 feet
                  height: dimensions.height || 3,
                  image_url: item.image_url,
                  color: getCategoryColor(category.name),
                  originalSize: item.size
                });
              });
            });
          });
        });
        
        setFfeItems(items);
      }
    } catch (error) {
      console.error('Failed to load FFE items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse dimensions from size string like "84"W x 40"D x 32"H" or "7' x 3'"
  const parseDimensions = (sizeStr) => {
    if (!sizeStr) return { width: 3, depth: 2, height: 3 };
    
    const result = { width: 3, depth: 2, height: 3 };
    
    // Try to parse inches format: 84"W x 40"D x 32"H
    const inchesMatch = sizeStr.match(/(\d+)"?\s*[Ww].*?(\d+)"?\s*[Dd]/);
    if (inchesMatch) {
      result.width = parseInt(inchesMatch[1]) / 12; // convert to feet
      result.depth = parseInt(inchesMatch[2]) / 12;
      return result;
    }
    
    // Try to parse feet format: 7' x 3'
    const feetMatch = sizeStr.match(/(\d+(?:\.\d+)?)'?\s*[xX×]\s*(\d+(?:\.\d+)?)/);
    if (feetMatch) {
      result.width = parseFloat(feetMatch[1]);
      result.depth = parseFloat(feetMatch[2]);
      return result;
    }
    
    // Try simple number format
    const simpleMatch = sizeStr.match(/(\d+)/);
    if (simpleMatch) {
      const size = parseInt(simpleMatch[1]);
      if (size > 20) {
        // Probably inches
        result.width = size / 12;
        result.depth = size / 24;
      } else {
        // Probably feet
        result.width = size;
        result.depth = size / 2;
      }
    }
    
    return result;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'SEATING': '#4A90D9',
      'TABLES': '#8B5A2B',
      'LIGHTING': '#FFD700',
      'STORAGE': '#6B8E23',
      'BEDS': '#9370DB',
      'RUGS': '#CD853F',
      'ACCESSORIES': '#20B2AA',
      'WINDOW TREATMENTS': '#DDA0DD'
    };
    return colors[category?.toUpperCase()] || '#888888';
  };

  // Add furniture to floor plan
  const addToFloorPlan = (item) => {
    const newPlacement = {
      ...item,
      placementId: `${item.id}-${Date.now()}`,
      x: roomWidth * scale / 2 - (item.width * scale) / 2,
      y: roomLength * scale / 2 - (item.depth * scale) / 2,
      rotation: 0
    };
    setPlacedFurniture(prev => [...prev, newPlacement]);
    setSelectedItem(newPlacement.placementId);
  };

  // Handle mouse down on furniture
  const handleMouseDown = (e, item) => {
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    setDragging(item.placementId);
    setDragOffset({
      x: e.clientX - rect.left - item.x,
      y: e.clientY - rect.top - item.y
    });
    setSelectedItem(item.placementId);
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (!dragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    setPlacedFurniture(prev => prev.map(item => 
      item.placementId === dragging 
        ? { ...item, x: Math.max(0, Math.min(newX, roomWidth * scale - item.width * scale)), 
                     y: Math.max(0, Math.min(newY, roomLength * scale - item.depth * scale)) }
        : item
    ));
  }, [dragging, dragOffset, roomWidth, roomLength, scale]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Rotate selected item
  const rotateSelected = () => {
    if (!selectedItem) return;
    setPlacedFurniture(prev => prev.map(item => 
      item.placementId === selectedItem 
        ? { ...item, rotation: (item.rotation + 90) % 360,
            // Swap width and depth on 90/270 rotation
            width: item.rotation % 180 === 0 ? item.depth : item.width,
            depth: item.rotation % 180 === 0 ? item.width : item.depth
          }
        : item
    ));
  };

  // Delete selected item
  const deleteSelected = () => {
    if (!selectedItem) return;
    setPlacedFurniture(prev => prev.filter(item => item.placementId !== selectedItem));
    setSelectedItem(null);
  };

  // Save layout
  const saveLayout = async () => {
    try {
      await fetch(`${API_URL}/layouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          room_width: roomWidth,
          room_length: roomLength,
          furniture: placedFurniture,
          created_at: new Date().toISOString()
        })
      });
      alert('Layout saved!');
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  // Export as image
  const exportImage = () => {
    // Use html2canvas or similar to export the floor plan
    alert('Export feature - would download floor plan as PNG');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      {/* Header */}
      <div className="p-4 border-b border-[#D4A574]/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#D4A574]">📐 Furniture Layout Planner</h1>
            <p className="text-gray-400 text-sm">Drag YOUR furniture from FFE to create layouts</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={saveLayout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
              <Save size={18} /> Save
            </button>
            <button onClick={exportImage} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              <Download size={18} /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - FFE Items */}
        <div className="w-72 border-r border-[#D4A574]/30 overflow-y-auto p-4">
          <h2 className="text-[#D4A574] font-bold mb-4">Your FFE Items</h2>
          
          {/* Room Dimensions */}
          <div className="mb-6 p-3 rounded-lg bg-black/30 border border-[#B49B7E]/30">
            <h3 className="text-white text-sm font-medium mb-2">Room Size</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-400 text-xs">Width (ft)</label>
                <input
                  type="number"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-black/50 border border-[#B49B7E]/30 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs">Length (ft)</label>
                <input
                  type="number"
                  value={roomLength}
                  onChange={(e) => setRoomLength(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-black/50 border border-[#B49B7E]/30 text-white text-sm"
                />
              </div>
            </div>
          </div>
          
          {loading ? (
            <p className="text-gray-500">Loading your furniture...</p>
          ) : ffeItems.length === 0 ? (
            <p className="text-gray-500">No furniture items in FFE yet.</p>
          ) : (
            <div className="space-y-2">
              {ffeItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToFloorPlan(item)}
                  className="p-3 rounded-lg bg-black/30 border border-[#B49B7E]/30 hover:border-[#D4A574] cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.width.toFixed(0)}'
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">
                        {item.width.toFixed(1)}' × {item.depth.toFixed(1)}' | {item.room}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setScale(s => Math.min(s + 5, 50))}
              className="p-2 rounded bg-black/30 text-white hover:bg-black/50"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={() => setScale(s => Math.max(s - 5, 15))}
              className="p-2 rounded bg-black/30 text-white hover:bg-black/50"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded text-white ${showGrid ? 'bg-[#D4A574]' : 'bg-black/30 hover:bg-black/50'}`}
              title="Toggle Grid"
            >
              <Grid size={20} />
            </button>
            
            {selectedItem && (
              <>
                <div className="w-px h-6 bg-[#B49B7E]/30 mx-2" />
                <button
                  onClick={rotateSelected}
                  className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  title="Rotate 90°"
                >
                  <RotateCw size={20} />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-2 rounded bg-red-600 text-white hover:bg-red-700"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
            
            <span className="ml-auto text-gray-400 text-sm">
              Scale: 1 ft = {scale}px | Room: {roomWidth}' × {roomLength}'
            </span>
          </div>

          {/* Floor Plan Canvas */}
          <div 
            ref={containerRef}
            className="relative overflow-auto rounded-lg border-2 border-[#D4A574]/50"
            style={{ 
              width: roomWidth * scale + 4,
              height: roomLength * scale + 4,
              backgroundColor: '#f5f5f0',
              backgroundImage: showGrid ? `
                linear-gradient(to right, #ddd 1px, transparent 1px),
                linear-gradient(to bottom, #ddd 1px, transparent 1px)
              ` : 'none',
              backgroundSize: `${scale}px ${scale}px`
            }}
            onClick={() => setSelectedItem(null)}
          >
            {/* Room dimensions labels */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-gray-600 text-sm font-medium">
              {roomWidth} feet
            </div>
            <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 -rotate-90 text-gray-600 text-sm font-medium">
              {roomLength} feet
            </div>

            {/* Placed Furniture */}
            {placedFurniture.map(item => (
              <div
                key={item.placementId}
                onMouseDown={(e) => handleMouseDown(e, item)}
                className={`absolute cursor-move flex items-center justify-center text-white text-xs font-bold rounded shadow-lg transition-shadow ${
                  selectedItem === item.placementId ? 'ring-2 ring-yellow-400 shadow-xl' : 'hover:shadow-xl'
                }`}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width * scale,
                  height: item.depth * scale,
                  backgroundColor: item.color,
                  transform: `rotate(${item.rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                title={`${item.name}\n${item.width.toFixed(1)}' × ${item.depth.toFixed(1)}'`}
              >
                <span className="text-center px-1 truncate" style={{ maxWidth: '100%' }}>
                  {item.name.split(' ').slice(0, 2).join(' ')}
                </span>
                
                {/* Resize handles when selected */}
                {selectedItem === item.placementId && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full cursor-pointer" />
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries({
              'SEATING': '#4A90D9',
              'TABLES': '#8B5A2B',
              'LIGHTING': '#FFD700',
              'STORAGE': '#6B8E23',
              'BEDS': '#9370DB',
              'RUGS': '#CD853F'
            }).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-gray-400 text-xs">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Selected Item Details */}
        {selectedItem && (
          <div className="w-64 border-l border-[#D4A574]/30 p-4">
            <h3 className="text-[#D4A574] font-bold mb-4">Selected Item</h3>
            {(() => {
              const item = placedFurniture.find(i => i.placementId === selectedItem);
              if (!item) return null;
              return (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-black/30 border border-[#B49B7E]/30">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-gray-400 text-sm">{item.category} | {item.room}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded bg-black/30">
                      <p className="text-gray-500 text-xs">Width</p>
                      <p className="text-white">{item.width.toFixed(1)} ft</p>
                    </div>
                    <div className="p-2 rounded bg-black/30">
                      <p className="text-gray-500 text-xs">Depth</p>
                      <p className="text-white">{item.depth.toFixed(1)} ft</p>
                    </div>
                    <div className="p-2 rounded bg-black/30">
                      <p className="text-gray-500 text-xs">Rotation</p>
                      <p className="text-white">{item.rotation}°</p>
                    </div>
                    <div className="p-2 rounded bg-black/30">
                      <p className="text-gray-500 text-xs">Position</p>
                      <p className="text-white text-xs">{(item.x / scale).toFixed(1)}', {(item.y / scale).toFixed(1)}'</p>
                    </div>
                  </div>
                  
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  
                  <p className="text-gray-500 text-xs">
                    Original size: {item.originalSize || 'Not specified'}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
