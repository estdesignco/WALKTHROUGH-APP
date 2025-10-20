import React, { useState, useEffect } from 'react';
import { Palette, Layers, ImageIcon, Upload, Trash2, Plus, Download, Search } from 'lucide-react';
import { getRoomColor } from '../utils/roomColors';
import { PAINT_VENDORS, searchPaintColors, getColorsByVendor } from '../utils/paintVendorDatabase';

const DesignToolsDashboard = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colorPalettes, setColorPalettes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [inspirationImages, setInspirationImages] = useState([]);
  const [beforeAfterPhotos, setBeforeAfterPhotos] = useState([]);
  const [showAddColor, setShowAddColor] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', hex: '#D4A574', usage: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', type: '', source: '', image: null });
  const [expandedRooms, setExpandedRooms] = useState({});
  const [materialView, setMaterialView] = useState('byRoom'); // 'byRoom' or 'wholeHome'
  const [wholeHomeData, setWholeHomeData] = useState({
    doorHardware: { interior: '', exterior: '', hinges: '' },
    paint: { trim: '', trimColor: '#FFFFFF', ceiling: '', ceilingColor: '#FFFFFF', baseMolding: '', baseColor: '#FFFFFF' },
    flooring: { floor1: '', floor2: '', basement: '' },
    customSections: [] // For user-added sections
  });
  const [showPaintBrowser, setShowPaintBrowser] = useState(false);
  const [paintSearchTerm, setPaintSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ name: '', fields: [''] });

  useEffect(() => {
    loadDesignData();
  }, [projectId]);

  const loadDesignData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${BACKEND_URL}/api/design-data/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setColorPalettes(data.color_palettes || []);
        setMaterials(data.materials || []);
        setInspirationImages(data.inspiration_images || []);
        setBeforeAfterPhotos(data.before_after_photos || []);
        setWholeHomeData(data.whole_home_data || {
          doorHardware: { interior: '', exterior: '', hinges: '' },
          paint: { trim: '', trimColor: '#FFFFFF', ceiling: '', ceilingColor: '#FFFFFF', baseMolding: '', baseColor: '#FFFFFF' },
          flooring: { floor1: '', floor2: '', basement: '' }
        });
      }
      
      const projectResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=ffe`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
        
        // Auto-detect fabrics and paint from FFE items
        autoDetectFabricsAndPaint(projectData);
        
        // Auto-load before photos from room photos (without measurements)
        loadBeforePhotos(projectData);
      }
    } catch (error) {
      console.error('Error loading design data:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoDetectFabricsAndPaint = (projectData) => {
    const fabricKeywords = ['fabric', 'drape', 'curtain', 'chair', 'sofa', 'upholstery', 'ottoman', 'cushion'];
    const paintKeywords = ['paint', 'color', 'finish'];
    
    const detectedMaterials = [];
    
    projectData.rooms?.forEach(room => {
      room.categories?.forEach(category => {
        // Check if paint category
        const isPaintCategory = category.name.toLowerCase().includes('paint') || 
                               category.name.toLowerCase().includes('finish') ||
                               category.name.toLowerCase().includes('wallpaper');
        
        category.subcategories?.forEach(subcategory => {
          subcategory.items?.forEach(item => {
            const itemName = (item.name || '').toLowerCase();
            
            // Check for fabrics
            if (fabricKeywords.some(keyword => itemName.includes(keyword))) {
              detectedMaterials.push({
                id: item.id,
                name: item.name,
                type: 'Fabric',
                source: item.vendor || '',
                image: item.image_url,
                room: room.name,
                color: item.finish_color,
                from_ffe: true
              });
            }
            
            // Check for paint (especially from paint category)
            if (isPaintCategory || paintKeywords.some(keyword => itemName.includes(keyword))) {
              detectedMaterials.push({
                id: item.id,
                name: item.name,
                type: 'Paint',
                source: item.vendor || '',
                image: item.image_url,
                room: room.name,
                color: item.finish_color,
                from_ffe: true
              });
            }
          });
        });
      });
    });
    
    // Merge with existing materials (don't duplicate)
    const existingIds = materials.map(m => m.id);
    const newMaterials = detectedMaterials.filter(m => !existingIds.includes(m.id));
    setMaterials([...materials, ...newMaterials]);
  };

  const loadBeforePhotos = async (projectData) => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const beforePhotos = [];
      
      for (const room of projectData.rooms || []) {
        try {
          const photoResponse = await fetch(`${BACKEND_URL}/api/photos/by-room/${projectId}/${room.id}`);
          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            // Only get photos WITHOUT measurements
            const photosWithoutMeasurements = (photoData.photos || []).filter(p => !p.metadata?.has_measurements);
            
            photosWithoutMeasurements.forEach(photo => {
              beforePhotos.push({
                id: photo.id,
                type: 'before',
                image: photo.photo_data,
                filename: photo.file_name,
                room: room.name,
                from_room_photos: true
              });
            });
          }
        } catch (err) {
          console.error(`Error loading photos for room ${room.name}:`, err);
        }
      }
      
      // Merge with existing before/after photos
      setBeforeAfterPhotos([...beforeAfterPhotos, ...beforePhotos]);
    } catch (error) {
      console.error('Error loading before photos:', error);
    }
  };

  const handleAddColor = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/design-data/${projectId}/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColor)
      });
      
      setShowAddColor(false);
      setNewColor({ name: '', hex: '#D4A574', usage: '' });
      loadDesignData();
    } catch (error) {
      console.error('Error adding color:', error);
      alert('Failed to add color');
    }
  };

  const handleAddMaterial = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      const materialData = {
        ...newMaterial,
        image: newMaterial.image // base64 image
      };
      
      await fetch(`${BACKEND_URL}/api/design-data/${projectId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
      });
      
      setShowAddMaterial(false);
      setNewMaterial({ name: '', type: '', source: '', image: null });
      loadDesignData();
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Failed to add material');
    }
  };

  const handleImageUpload = async (type, file) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        await fetch(`${BACKEND_URL}/api/design-data/${projectId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, image: base64, filename: file.name })
        });
        
        loadDesignData();
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteColor = async (colorId) => {
    if (!window.confirm('Delete this color?')) return;
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/design-data/${projectId}/colors/${colorId}`, {
        method: 'DELETE'
      });
      loadDesignData();
    } catch (error) {
      console.error('Error deleting color:', error);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/design-data/${projectId}/materials/${materialId}`, {
        method: 'DELETE'
      });
      loadDesignData();
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const saveWholeHomeData = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${BACKEND_URL}/api/design-data/${projectId}/whole-home`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wholeHomeData)
      });
      alert('✅ Whole home data saved!');
    } catch (error) {
      console.error('Error saving whole home data:', error);
      alert('Failed to save whole home data');
    }
  };

  const handleAddCustomSection = () => {
    const section = {
      id: Date.now().toString(),
      name: newSection.name,
      fields: newSection.fields.filter(f => f.trim())
    };
    
    setWholeHomeData({
      ...wholeHomeData,
      customSections: [...(wholeHomeData.customSections || []), section]
    });
    
    setShowAddSection(false);
    setNewSection({ name: '', fields: [''] });
  };

  const addColorFromVendor = (vendorColor) => {
    handleAddColor();
    setNewColor({ 
      name: `${vendorColor.vendor} - ${vendorColor.name}`, 
      hex: vendorColor.hex, 
      usage: `${vendorColor.code}` 
    });
    setShowPaintBrowser(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-[#D4C5A9]">Loading design tools...</div>;
  }

  return (
    <div className="w-full" style={{ backgroundColor: '#0F172A', padding: '24px' }}>
      <h2 className="text-3xl font-bold text-[#D4A574] mb-6">🎨 Design Tools</h2>

      {/* COLOR PALETTE MANAGER */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#D4A574]">🎨 Color Palette Manager</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPaintBrowser(true)}
              className="bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Browse Paint Vendors
            </button>
            <button
              onClick={() => setShowAddColor(true)}
              className="bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Custom Color
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {colorPalettes.map((color, index) => (
            <div key={color.id || index} className="rounded-xl border-2 border-[#D4A574]/50 overflow-hidden hover:border-[#D4A574] transition-all group">
              <div 
                className="h-32 cursor-pointer"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              ></div>
              <div className="bg-[#1E293B] p-3">
                <div className="font-bold text-[#D4A574] text-sm mb-1">{color.name}</div>
                <div className="text-xs text-[#B49B7E] mb-1">{color.hex}</div>
                <div className="text-xs text-gray-400 mb-2">{color.usage}</div>
                <button
                  onClick={() => handleDeleteColor(color.id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  <Trash2 className="w-3 h-3 inline" /> Delete
                </button>
              </div>
            </div>
          ))}
          
          {colorPalettes.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#B49B7E]">
              No colors added yet. Click "Add Color" to start your palette.
            </div>
          )}
        </div>
      </div>

      {/* MATERIAL LIBRARY - GROUPED BY ROOM */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#D4A574]">🧵 Material Library</h3>
          <div className="flex gap-3">
            <div className="flex gap-2 bg-[#1E293B] rounded-lg p-1">
              <button
                onClick={() => setMaterialView('byRoom')}
                className={`px-4 py-2 rounded font-bold text-sm ${materialView === 'byRoom' ? 'bg-[#D4A574] text-black' : 'text-[#B49B7E]'}`}
              >
                By Room
              </button>
              <button
                onClick={() => setMaterialView('wholeHome')}
                className={`px-4 py-2 rounded font-bold text-sm ${materialView === 'wholeHome' ? 'bg-[#D4A574] text-black' : 'text-[#B49B7E]'}`}
              >
                Entire Home
              </button>
            </div>
            <button
              onClick={() => setShowAddMaterial(true)}
              className="bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Material
            </button>
          </div>
        </div>
        
        {materialView === 'byRoom' ? (
          /* BY ROOM VIEW - COLLAPSIBLE */
          Object.entries(
            materials.reduce((acc, material) => {
              const room = material.room || 'Ungrouped';
              if (!acc[room]) acc[room] = [];
              acc[room].push(material);
              return acc;
            }, {})
          ).map(([roomName, roomMaterials]) => (
            <div key={roomName} className="mb-4">
              <button
                onClick={() => setExpandedRooms({ ...expandedRooms, [roomName]: !expandedRooms[roomName] })}
                className="w-full text-left border-2 border-[#D4A574] rounded-lg p-4 mb-3 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${getRoomColor(roomName)}FF 0%, ${getRoomColor(roomName)}AA 20%, ${getRoomColor(roomName)} 40%, ${getRoomColor(roomName)}AA 80%, ${getRoomColor(roomName)}FF 100%)`,
                  boxShadow: `0 0 25px ${getRoomColor(roomName)}60, inset 0 0 50px rgba(255, 255, 255, 0.14), inset 0 0 80px rgba(0, 0, 0, 0.45)`,
                  textShadow: '0 2px 6px rgba(0, 0, 0, 0.75), 0 0 16px rgba(255, 255, 255, 0.35)'
                }}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xl font-bold text-white">
                    {expandedRooms[roomName] ? '▼' : '▶'} 📍 {roomName}
                  </h4>
                  <span className="text-white font-bold">{roomMaterials.length} items</span>
                </div>
              </button>
              
              {expandedRooms[roomName] && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pl-4">
                  {roomMaterials.map((material, index) => (
                    <div key={material.id || index} className="rounded-xl border-2 overflow-hidden transition-all" style={{
                      borderColor: '#D4A574',
                      boxShadow: '0 0 20px rgba(212, 165, 116, 0.3), inset 0 0 30px rgba(212, 165, 116, 0.08)'
                    }}>
                      {material.image ? (
                        <img src={material.image} alt={material.name} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                          <Layers className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4" style={{
                        background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.9) 50%, rgba(30, 30, 40, 0.95) 100%)',
                        boxShadow: 'inset 0 0 20px rgba(212, 165, 116, 0.05)'
                      }}>
                        <div className="font-bold text-[#D4A574] mb-1">{material.name}</div>
                        <div className="text-sm text-[#B49B7E] mb-1">{material.type}</div>
                        {material.color && <div className="text-xs text-gray-300 mb-1">Color: {material.color}</div>}
                        <div className="text-xs text-gray-400 mb-3">{material.source}</div>
                        {material.from_ffe && <div className="text-xs text-purple-400 mb-2">🔗 From FFE</div>}
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          <Trash2 className="w-4 h-4 inline" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          /* ENTIRE HOME VIEW - FLAT LIST */
          <div>
            <div className="text-lg font-bold text-[#D4C5A9] mb-4 border-b-2 border-[#D4A574]/50 pb-2">
              🏠 Whole Home Materials ({materials.filter(m => !m.room || m.room === 'Ungrouped').length} items)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {materials.filter(m => !m.room || m.room === 'Ungrouped').map((material, index) => (
                <div key={material.id || index} className="rounded-xl border-2 border-[#D4A574]/50 overflow-hidden hover:border-[#D4A574] transition-all">
                  {material.image ? (
                    <img src={material.image} alt={material.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                      <Layers className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="bg-[#1E293B] p-4">
                    <div className="font-bold text-[#D4A574] mb-1">{material.name}</div>
                    <div className="text-sm text-[#B49B7E] mb-1">{material.type}</div>
                    {material.color && <div className="text-xs text-gray-300 mb-1">Color: {material.color}</div>}
                    <div className="text-xs text-gray-400 mb-3">{material.source}</div>
                    {material.from_ffe && <div className="text-xs text-purple-400 mb-2">🔗 From FFE</div>}
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      <Trash2 className="w-4 h-4 inline" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {materials.length === 0 && (
          <div className="text-center py-12 text-[#B49B7E]">
            No materials detected. Fabrics and paint will auto-detect from FFE spreadsheet.
          </div>
        )}
      </div>

      {/* WHOLE HOME FINISHES */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(139,69,19,0.2) 0%, rgba(0,0,0,0.95) 50%, rgba(139,69,19,0.2) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#D4A574] mb-2">🏠 Whole Home Finishes</h3>
            <div className="text-sm text-[#B49B7E]">Items that apply to the entire home or multiple floors</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddSection(true)}
              className="bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Section
            </button>
            <button
              onClick={saveWholeHomeData}
              className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-bold"
            >
              💾 Save Changes
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Door Hardware */}
          <div className="rounded-lg border border-[#D4A574]/50 p-4" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.8) 100%)'
          }}>
            <h4 className="text-lg font-bold text-[#D4A574] mb-3">🚪 Door Hardware</h4>
            <div className="space-y-2">
              <input 
                type="text" 
                value={wholeHomeData.doorHardware.interior} 
                onChange={(e) => setWholeHomeData({ ...wholeHomeData, doorHardware: { ...wholeHomeData.doorHardware, interior: e.target.value }})}
                placeholder="Interior door handles" 
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
              />
              <input 
                type="text" 
                value={wholeHomeData.doorHardware.exterior} 
                onChange={(e) => setWholeHomeData({ ...wholeHomeData, doorHardware: { ...wholeHomeData.doorHardware, exterior: e.target.value }})}
                placeholder="Exterior door handles" 
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
              />
              <input 
                type="text" 
                value={wholeHomeData.doorHardware.hinges} 
                onChange={(e) => setWholeHomeData({ ...wholeHomeData, doorHardware: { ...wholeHomeData.doorHardware, hinges: e.target.value }})}
                placeholder="Hinges finish" 
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
              />
            </div>
          </div>
          
          {/* Whole Home Paint */}
          <div className="rounded-lg border border-[#D4A574]/50 p-4" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.8) 100%)'
          }}>
            <h4 className="text-lg font-bold text-[#D4A574] mb-3">🎨 Whole Home Paint</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={wholeHomeData.paint.trim} 
                  onChange={(e) => setWholeHomeData({ ...wholeHomeData, paint: { ...wholeHomeData.paint, trim: e.target.value }})}
                  placeholder="Trim color" 
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
                />
                <input 
                  type="color" 
                  value={wholeHomeData.paint.trimColor} 
                  onChange={(e) => setWholeHomeData({ ...wholeHomeData, paint: { ...wholeHomeData.paint, trimColor: e.target.value }})}
                  className="w-12 h-10 rounded" 
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={wholeHomeData.paint.ceiling} 
                  onChange={(e) => setWholeHomeData({ ...wholeHomeData, paint: { ...wholeHomeData.paint, ceiling: e.target.value }})}
                  placeholder="Ceiling color" 
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
                />
                <input 
                  type="color" 
                  value={wholeHomeData.paint.ceilingColor} 
                  onChange={(e) => setWholeHomeData({ ...wholeHomeData, paint: { ...wholeHomeData.paint, ceilingColor: e.target.value }})}
                  className="w-12 h-10 rounded" 
                />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={wholeHomeData.paint.baseMolding} 
                  onChange={(e) => setWholeHomeData({ ...wholeHomeData, paint: { ...wholeHomeData.paint, baseMolding: e.target.value }})}
                  placeholder="Base molding color" 
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
                />
                <input 
                  type="color" 
                  value={wholeHomeData.paint.baseColor} 
                  onChange={(e) => setWholeHomeData({ ...wholeHomeData, paint: { ...wholeHomeData.paint, baseColor: e.target.value }})}
                  className="w-12 h-10 rounded" 
                />
              </div>
            </div>
          </div>
          
          {/* Flooring by Floor */}
          <div className="rounded-lg border border-[#D4A574]/50 p-4" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.8) 100%)'
          }}>
            <h4 className="text-lg font-bold text-[#D4A574] mb-3">🏢 Flooring by Floor</h4>
            <div className="space-y-2">
              <input 
                type="text" 
                value={wholeHomeData.flooring.floor1} 
                onChange={(e) => setWholeHomeData({ ...wholeHomeData, flooring: { ...wholeHomeData.flooring, floor1: e.target.value }})}
                placeholder="1st Floor - Flooring type" 
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
              />
              <input 
                type="text" 
                value={wholeHomeData.flooring.floor2} 
                onChange={(e) => setWholeHomeData({ ...wholeHomeData, flooring: { ...wholeHomeData.flooring, floor2: e.target.value }})}
                placeholder="2nd Floor - Flooring type" 
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
              />
              <input 
                type="text" 
                value={wholeHomeData.flooring.basement} 
                onChange={(e) => setWholeHomeData({ ...wholeHomeData, flooring: { ...wholeHomeData.flooring, basement: e.target.value }})}
                placeholder="Basement - Flooring type" 
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
              />
            </div>
          </div>
          
          {/* CUSTOM SECTIONS - USER ADDED */}
          {wholeHomeData.customSections?.map((section, index) => (
            <div key={section.id} className="rounded-lg border border-[#D4A574]/50 p-4" style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.8) 100%)'
            }}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-bold text-[#D4A574]">✨ {section.name}</h4>
                <button
                  onClick={() => {
                    const updated = { ...wholeHomeData };
                    updated.customSections = updated.customSections.filter(s => s.id !== section.id);
                    setWholeHomeData(updated);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {section.fields.map((field, fieldIndex) => (
                  <input 
                    key={fieldIndex}
                    type="text" 
                    value={field}
                    onChange={(e) => {
                      const updated = { ...wholeHomeData };
                      updated.customSections[index].fields[fieldIndex] = e.target.value;
                      setWholeHomeData(updated);
                    }}
                    placeholder={`Field ${fieldIndex + 1}`}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INSPIRATION BOARD */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#D4A574]">💡 Inspiration Board</h3>
          <label className="bg-[#6B46C1] hover:bg-[#7B56D1] text-white px-6 py-3 rounded-lg font-bold cursor-pointer flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Image
            <input 
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={(e) => e.target.files[0] && handleImageUpload('inspiration', e.target.files[0])}
            />
          </label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inspirationImages.map((img, index) => (
            <div key={img.id || index} className="relative group rounded-lg overflow-hidden border-2 border-[#D4A574]/50 hover:border-[#D4A574] transition-all">
              <img src={img.image} alt={img.filename} className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={async () => {
                    if (window.confirm('Delete this image?')) {
                      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                      await fetch(`${BACKEND_URL}/api/design-data/${projectId}/images/${img.id}`, { method: 'DELETE' });
                      loadDesignData();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {inspirationImages.length === 0 && (
            <div className="col-span-full text-center py-16 text-[#B49B7E]">
              No inspiration images yet. Upload images to create your mood board.
            </div>
          )}
        </div>
      </div>

      {/* BEFORE/AFTER GALLERY - GROUPED BY ROOM */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#D4A574]">📸 Before & After Gallery</h3>
          <div className="flex gap-3">
            <div className="text-sm text-[#B49B7E]">Before photos auto-loaded from room photos</div>
            <label className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-bold cursor-pointer flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Add After Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={(e) => e.target.files[0] && handleImageUpload('after', e.target.files[0])}
              />
            </label>
          </div>
        </div>
        
        {/* Group by room */}
        {Object.entries(
          beforeAfterPhotos.reduce((acc, photo) => {
            const room = photo.room || 'Ungrouped';
            if (!acc[room]) acc[room] = { before: [], after: [] };
            if (photo.type === 'before') acc[room].before.push(photo);
            else acc[room].after.push(photo);
            return acc;
          }, {})
        ).map(([roomName, photos]) => (
          <div key={roomName} className="mb-8">
            <h4 className="text-xl font-bold text-[#D4C5A9] mb-4 border-b-2 border-[#D4A574]/50 pb-2">
              📍 {roomName}
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Before Photos */}
              <div>
                <h5 className="text-lg font-bold text-red-400 mb-3">🔴 BEFORE ({photos.before.length})</h5>
                <div className="grid grid-cols-2 gap-3">
                  {photos.before.map((photo, index) => (
                    <div key={photo.id || index} className="relative group rounded-lg overflow-hidden border-2 border-gray-600 hover:border-red-500 transition-all">
                      <img src={photo.image} alt="Before" className="w-full h-48 object-cover" />
                      {photo.from_room_photos && <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">Auto</div>}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete?')) {
                              const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                              await fetch(`${BACKEND_URL}/api/design-data/${projectId}/images/${photo.id}`, { method: 'DELETE' });
                              loadDesignData();
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* After Photos */}
              <div>
                <h5 className="text-lg font-bold text-green-400 mb-3">🟢 AFTER ({photos.after.length})</h5>
                <div className="grid grid-cols-2 gap-3">
                  {photos.after.map((photo, index) => (
                    <div key={photo.id || index} className="relative group rounded-lg overflow-hidden border-2 border-gray-600 hover:border-green-500 transition-all">
                      <img src={photo.image} alt="After" className="w-full h-48 object-cover" />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete?')) {
                              const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                              await fetch(`${BACKEND_URL}/api/design-data/${projectId}/images/${photo.id}`, { method: 'DELETE' });
                              loadDesignData();
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {beforeAfterPhotos.length === 0 && (
          <div className="text-center py-16 text-[#B49B7E]">
            Before photos will auto-load from room photos. Upload After photos to showcase transformations.
          </div>
        )}
      </div>

      {/* ADD COLOR MODAL */}
      {showAddColor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#D4A574] mb-6">🎨 Add Color to Palette</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#B49B7E] mb-2">Color Name</label>
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., Accent Gold"
                />
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Color Code</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="w-20 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                    placeholder="#D4A574"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Usage/Notes</label>
                <input
                  type="text"
                  value={newColor.usage}
                  onChange={(e) => setNewColor({ ...newColor, usage: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., Living room accent wall"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddColor}
                className="flex-1 bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-lg font-bold"
              >
                Add Color
              </button>
              <button
                onClick={() => setShowAddColor(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MATERIAL MODAL */}
      {showAddMaterial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#D4A574] mb-6">🧵 Add Material</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#B49B7E] mb-2">Material Name</label>
                <input
                  type="text"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., Velvet Upholstery"
                />
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Type</label>
                <select
                  value={newMaterial.type}
                  onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                >
                  <option value="">Select type...</option>
                  <option value="Fabric">Fabric</option>
                  <option value="Wallpaper">Wallpaper</option>
                  <option value="Paint">Paint</option>
                  <option value="Tile">Tile</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Trim">Trim</option>
                  <option value="Countertop">Countertop</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Source/Vendor</label>
                <input
                  type="text"
                  value={newMaterial.source}
                  onChange={(e) => setNewMaterial({ ...newMaterial, source: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., Kravet, Schumacher"
                />
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Swatch/Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewMaterial({ ...newMaterial, image: reader.result });
                      };
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#D4A574] file:text-black file:font-bold"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddMaterial}
                className="flex-1 bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-lg font-bold"
              >
                Add Material
              </button>
              <button
                onClick={() => setShowAddMaterial(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAINT VENDOR BROWSER MODAL */}
      {showPaintBrowser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowPaintBrowser(false)}>
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-[#D4A574]">🎨 Paint Vendor Browser</h3>
              <button onClick={() => setShowPaintBrowser(false)} className="text-[#D4A574] text-4xl hover:text-red-400">✕</button>
            </div>
            
            {/* Search and Filter */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={paintSearchTerm}
                onChange={(e) => setPaintSearchTerm(e.target.value)}
                placeholder="Search colors (e.g., 'White Dove', 'Gray')..."
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-[#D4A574]"
              />
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-[#D4A574]"
              >
                <option value="">All Vendors</option>
                {Object.keys(PAINT_VENDORS).map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            
            {/* Paint Colors Grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
              {(paintSearchTerm ? searchPaintColors(paintSearchTerm) : 
                selectedVendor ? getColorsByVendor(selectedVendor).map(c => ({ ...c, vendor: selectedVendor })) : 
                getAllPaintColors()).slice(0, 100).map((color, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setNewColor({ name: `${color.vendor} - ${color.name}`, hex: color.hex, usage: color.code });
                    setShowPaintBrowser(false);
                    setShowAddColor(true);
                  }}
                  className="rounded-lg border-2 border-[#D4A574]/50 hover:border-[#D4A574] overflow-hidden transition-all"
                  title={`${color.vendor} - ${color.name} (${color.code})`}
                >
                  <div className="h-24" style={{ backgroundColor: color.hex }}></div>
                  <div className="bg-[#1E293B] p-2">
                    <div className="text-xs text-[#D4A574] font-bold truncate">{color.name}</div>
                    <div className="text-xs text-gray-400">{color.code}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM SECTION MODAL */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] border-2 border-[#D4A574] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#D4A574] mb-6">➕ Add Custom Section</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[#B49B7E] mb-2">Section Name</label>
                <input
                  type="text"
                  value={newSection.name}
                  onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                  placeholder="e.g., Window Hardware, Lighting Fixtures"
                />
              </div>
              
              <div>
                <label className="block text-[#B49B7E] mb-2">Fields</label>
                {newSection.fields.map((field, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={field}
                      onChange={(e) => {
                        const updated = [...newSection.fields];
                        updated[index] = e.target.value;
                        setNewSection({ ...newSection, fields: updated });
                      }}
                      className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-[#D4A574]"
                      placeholder={`Field ${index + 1}`}
                    />
                    {newSection.fields.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = newSection.fields.filter((_, i) => i !== index);
                          setNewSection({ ...newSection, fields: updated });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setNewSection({ ...newSection, fields: [...newSection.fields, ''] })}
                  className="text-[#D4A574] hover:text-[#C49564] text-sm font-bold mt-2"
                >
                  + Add Field
                </button>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddCustomSection}
                className="flex-1 bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-lg font-bold"
              >
                Add Section
              </button>
              <button
                onClick={() => setShowAddSection(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignToolsDashboard;