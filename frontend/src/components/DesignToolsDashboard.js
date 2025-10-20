import React, { useState, useEffect } from 'react';
import { Palette, Layers, ImageIcon, Upload, Trash2, Plus, Download } from 'lucide-react';

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
          <button
            onClick={() => setShowAddColor(true)}
            className="bg-[#D4A574] hover:bg-[#C49564] text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Color
          </button>
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
          <button
            onClick={() => setShowAddMaterial(true)}
            className="bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Material
          </button>
        </div>
        
        {/* Group materials by room */}
        {Object.entries(
          materials.reduce((acc, material) => {
            const room = material.room || 'Ungrouped';
            if (!acc[room]) acc[room] = [];
            acc[room].push(material);
            return acc;
          }, {})
        ).map(([roomName, roomMaterials]) => (
          <div key={roomName} className="mb-8">
            <h4 className="text-xl font-bold text-[#D4C5A9] mb-4 border-b-2 border-[#D4A574]/50 pb-2">
              📍 {roomName}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {roomMaterials.map((material, index) => (
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
        ))}
        
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
        <h3 className="text-2xl font-bold text-[#D4A574] mb-6">🏠 Whole Home Finishes</h3>
        <div className="text-sm text-[#B49B7E] mb-6">Items that apply to the entire home or multiple floors</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Door Hardware */}
          <div className="rounded-lg border border-[#D4A574]/50 p-4" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.8) 100%)'
          }}>
            <h4 className="text-lg font-bold text-[#D4A574] mb-3">🚪 Door Hardware</h4>
            <div className="space-y-2">
              <input type="text" placeholder="Interior door handles" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
              <input type="text" placeholder="Exterior door handles" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
              <input type="text" placeholder="Hinges finish" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
            </div>
          </div>
          
          {/* Whole Home Paint */}
          <div className="rounded-lg border border-[#D4A574]/50 p-4" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.8) 100%)'
          }}>
            <h4 className="text-lg font-bold text-[#D4A574] mb-3">🎨 Whole Home Paint</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" placeholder="Trim color" className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
                <input type="color" className="w-12 h-10 rounded" />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Ceiling color" className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
                <input type="color" className="w-12 h-10 rounded" />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Base molding color" className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
                <input type="color" className="w-12 h-10 rounded" />
              </div>
            </div>
          </div>
          
          {/* Flooring by Floor */}
          <div className="rounded-lg border border-[#D4A574]/50 p-4" style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.8) 100%)'
          }}>
            <h4 className="text-lg font-bold text-[#D4A574] mb-3">🏢 Flooring by Floor</h4>
            <div className="space-y-2">
              <input type="text" placeholder="1st Floor - Flooring type" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
              <input type="text" placeholder="2nd Floor - Flooring type" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
              <input type="text" placeholder="Basement - Flooring type" className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-[#D4A574]/50 text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* MATERIAL LIBRARY */}
      <div className="rounded-2xl p-6 border border-[#D4A574]/60 mb-8" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.95) 100%)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#D4A574]">🧵 Material Library</h3>
          <button
            onClick={() => setShowAddMaterial(true)}
            className="bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Material
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {materials.map((material, index) => (
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
                <div className="text-xs text-gray-400 mb-3">{material.source}</div>
                <button
                  onClick={() => handleDeleteMaterial(material.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  <Trash2 className="w-4 h-4 inline" /> Delete
                </button>
              </div>
            </div>
          ))}
          
          {materials.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#B49B7E]">
              No materials added yet. Click "Add Material" to start your library.
            </div>
          )}
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
    </div>
  );
};

export default DesignToolsDashboard;