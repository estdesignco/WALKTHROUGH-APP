import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const RoomRenderingStudio = () => {
  // State for the rendering pipeline
  const [step, setStep] = useState(1); // 1: Upload, 2: Clear, 3: Surfaces, 4: Furniture, 5: Final
  const [originalImage, setOriginalImage] = useState(null);
  const [originalImageBase64, setOriginalImageBase64] = useState(null);
  const [clearedRoom, setClearedRoom] = useState(null);
  const [surfacesChanged, setSurfacesChanged] = useState(null);
  const [finalRender, setFinalRender] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomAnalysis, setRoomAnalysis] = useState(null);
  
  // Form state
  const [keepElements, setKeepElements] = useState('fireplace, built-in shelves');
  const [floorType, setFloorType] = useState('');
  const [wallColor, setWallColor] = useState('');
  const [ceilingType, setCeilingType] = useState('');
  const [lightingFixtures, setLightingFixtures] = useState('');
  const [windowTreatments, setWindowTreatments] = useState('');
  const [furnitureList, setFurnitureList] = useState([
    { type: '', description: '', placement: '' }
  ]);
  const [designStyle, setDesignStyle] = useState('modern');
  const [colorPalette, setColorPalette] = useState('');
  const [mood, setMood] = useState('elegant and inviting');
  
  const fileInputRef = useRef(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setOriginalImageBase64(e.target.result.split(',')[1]);
        setStep(2);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2: Clear the room
  const clearRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/ai/room-studio/clear-room`, {
        room_image_base64: originalImageBase64,
        keep_elements: keepElements.split(',').map(e => e.trim()).filter(e => e)
      }, { timeout: 120000 });
      
      if (response.data.success) {
        setClearedRoom(`data:image/png;base64,${response.data.cleared_room_base64}`);
        setRoomAnalysis(response.data.room_analysis);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clear room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Change surfaces
  const changeSurfaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const imageToUse = clearedRoom ? clearedRoom.split(',')[1] : originalImageBase64;
      
      const response = await axios.post(`${API_URL}/ai/room-studio/change-surfaces`, {
        room_image_base64: imageToUse,
        floor: floorType || null,
        walls: wallColor || null,
        ceiling: ceilingType || null
      }, { timeout: 120000 });
      
      if (response.data.success) {
        setSurfacesChanged(`data:image/png;base64,${response.data.rendered_room_base64}`);
        setStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change surfaces. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Add furniture
  const addFurniture = async () => {
    setLoading(true);
    setError(null);
    try {
      const imageToUse = surfacesChanged ? surfacesChanged.split(',')[1] : 
                         clearedRoom ? clearedRoom.split(',')[1] : originalImageBase64;
      
      const furniture = furnitureList.filter(f => f.type || f.description);
      
      const response = await axios.post(`${API_URL}/ai/room-studio/add-furniture`, {
        room_image_base64: imageToUse,
        furniture: furniture,
        style: designStyle
      }, { timeout: 120000 });
      
      if (response.data.success) {
        setFinalRender(`data:image/png;base64,${response.data.furnished_room_base64}`);
        setStep(5);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add furniture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Full render in one go
  const doFullRender = async () => {
    setLoading(true);
    setError(null);
    try {
      const furniture = furnitureList.filter(f => f.type || f.description);
      const lighting = lightingFixtures ? lightingFixtures.split(',').map(l => l.trim()) : null;
      const palette = colorPalette ? colorPalette.split(',').map(c => c.trim()) : null;
      
      const response = await axios.post(`${API_URL}/ai/room-studio/full-render`, {
        original_room_base64: originalImageBase64,
        clear_all_furniture: true,
        items_to_keep: keepElements.split(',').map(e => e.trim()).filter(e => e),
        floor: floorType || null,
        walls: wallColor || null,
        ceiling: ceilingType || null,
        lighting: lighting,
        window_treatments: windowTreatments || null,
        furniture: furniture.length > 0 ? furniture : null,
        design_style: designStyle,
        color_palette: palette,
        mood: mood,
        render_quality: "high",
        photorealistic: true
      }, { timeout: 180000 });
      
      if (response.data.success) {
        setFinalRender(`data:image/png;base64,${response.data.rendered_room_base64}`);
        setRoomAnalysis(response.data.room_analysis);
        setStep(5);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to render room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add furniture item to list
  const addFurnitureItem = () => {
    setFurnitureList([...furnitureList, { type: '', description: '', placement: '' }]);
  };

  // Update furniture item
  const updateFurnitureItem = (index, field, value) => {
    const updated = [...furnitureList];
    updated[index][field] = value;
    setFurnitureList(updated);
  };

  // Remove furniture item
  const removeFurnitureItem = (index) => {
    setFurnitureList(furnitureList.filter((_, i) => i !== index));
  };

  // Reset everything
  const resetStudio = () => {
    setStep(1);
    setOriginalImage(null);
    setOriginalImageBase64(null);
    setClearedRoom(null);
    setSurfacesChanged(null);
    setFinalRender(null);
    setRoomAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#D4A574] mb-2">🎨 Room Rendering Studio</h1>
          <p className="text-[#D4C5A9]">Transform real room photos into stunning design visualizations</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: 'Upload' },
              { num: 2, label: 'Clear Room' },
              { num: 3, label: 'Surfaces' },
              { num: 4, label: 'Furniture' },
              { num: 5, label: 'Final' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div 
                  className={`flex flex-col items-center cursor-pointer ${step >= s.num ? 'text-[#D4A574]' : 'text-gray-500'}`}
                  onClick={() => s.num < step && setStep(s.num)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s.num ? 'bg-[#D4A574] text-black' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className="text-xs mt-1">{s.label}</span>
                </div>
                {idx < 4 && (
                  <div className={`w-12 h-1 ${step > s.num ? 'bg-[#D4A574]' : 'bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin w-16 h-16 border-4 border-[#D4A574] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[#D4A574] text-xl font-bold">AI is rendering your room...</p>
              <p className="text-gray-400 mt-2">This may take 30-60 seconds</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Controls */}
          <div className="space-y-6">
            {/* Step 1: Upload */}
            {step === 1 && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h2 className="text-2xl font-bold text-[#D4A574] mb-4">📸 Upload Room Photo</h2>
                <p className="text-[#D4C5A9] mb-4">Upload a photo of the room you want to transform</p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D4A574]/50 rounded-lg p-12 text-center cursor-pointer hover:border-[#D4A574] transition-colors"
                >
                  <p className="text-[#D4C5A9] text-lg mb-2">Click to upload room photo</p>
                  <p className="text-gray-500 text-sm">JPEG, PNG supported</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Step 2: Clear Room */}
            {step === 2 && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h2 className="text-2xl font-bold text-[#D4A574] mb-4">🧹 Clear Room</h2>
                <p className="text-[#D4C5A9] mb-4">Remove existing furniture to create a blank canvas</p>
                
                <div className="mb-4">
                  <label className="block text-[#D4C5A9] text-sm mb-2">Elements to KEEP (comma-separated)</label>
                  <input
                    type="text"
                    value={keepElements}
                    onChange={(e) => setKeepElements(e.target.value)}
                    placeholder="fireplace, built-in shelves, columns"
                    className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                  />
                  <p className="text-gray-500 text-xs mt-1">Leave empty to clear everything</p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={clearRoom}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black font-bold py-3 rounded-lg"
                  >
                    🧹 Clear Furniture
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-gray-700 text-[#D4C5A9] font-bold py-3 rounded-lg"
                  >
                    Skip →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Surfaces */}
            {step === 3 && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h2 className="text-2xl font-bold text-[#D4A574] mb-4">🎨 Change Surfaces</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#D4C5A9] text-sm mb-2">New Flooring</label>
                    <input
                      type="text"
                      value={floorType}
                      onChange={(e) => setFloorType(e.target.value)}
                      placeholder="e.g., wide plank white oak hardwood, carrara marble tile"
                      className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#D4C5A9] text-sm mb-2">Wall Treatment</label>
                    <input
                      type="text"
                      value={wallColor}
                      onChange={(e) => setWallColor(e.target.value)}
                      placeholder="e.g., Benjamin Moore Simply White, navy blue grasscloth wallpaper"
                      className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#D4C5A9] text-sm mb-2">Ceiling</label>
                    <input
                      type="text"
                      value={ceilingType}
                      onChange={(e) => setCeilingType(e.target.value)}
                      placeholder="e.g., white coffered ceiling, exposed wood beams"
                      className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#D4C5A9] text-sm mb-2">Window Treatments</label>
                    <input
                      type="text"
                      value={windowTreatments}
                      onChange={(e) => setWindowTreatments(e.target.value)}
                      placeholder="e.g., floor-length ivory linen drapes with blackout lining"
                      className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[#D4C5A9] text-sm mb-2">Lighting Fixtures (comma-separated)</label>
                    <input
                      type="text"
                      value={lightingFixtures}
                      onChange={(e) => setLightingFixtures(e.target.value)}
                      placeholder="e.g., crystal chandelier, recessed lighting, brass wall sconces"
                      className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={changeSurfaces}
                    disabled={loading || (!floorType && !wallColor && !ceilingType)}
                    className="flex-1 bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    🎨 Apply Surface Changes
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-gray-700 text-[#D4C5A9] font-bold py-3 rounded-lg"
                  >
                    Skip →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Furniture */}
            {step === 4 && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h2 className="text-2xl font-bold text-[#D4A574] mb-4">🛋️ Add Furniture</h2>
                
                <div className="mb-4">
                  <label className="block text-[#D4C5A9] text-sm mb-2">Design Style</label>
                  <select
                    value={designStyle}
                    onChange={(e) => setDesignStyle(e.target.value)}
                    className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                  >
                    <option value="modern">Modern</option>
                    <option value="traditional">Traditional</option>
                    <option value="transitional">Transitional</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="industrial">Industrial</option>
                    <option value="bohemian">Bohemian</option>
                    <option value="coastal">Coastal</option>
                    <option value="farmhouse">Farmhouse</option>
                    <option value="mid-century modern">Mid-Century Modern</option>
                    <option value="contemporary">Contemporary</option>
                    <option value="glam">Glam/Hollywood Regency</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-[#D4C5A9] text-sm mb-2">Color Palette (comma-separated)</label>
                  <input
                    type="text"
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    placeholder="e.g., warm neutrals, navy accents, gold hardware"
                    className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[#D4C5A9] text-sm mb-2">Mood</label>
                  <input
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    placeholder="e.g., cozy and inviting, luxurious, minimalist zen"
                    className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2"
                  />
                </div>
                
                <div className="space-y-3 mb-4">
                  <label className="block text-[#D4C5A9] text-sm">Furniture Pieces</label>
                  {furnitureList.map((item, idx) => (
                    <div key={idx} className="bg-[#0F172A] p-3 rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.type}
                          onChange={(e) => updateFurnitureItem(idx, 'type', e.target.value)}
                          placeholder="Type (sofa, chair, table)"
                          className="flex-1 bg-[#1E293B] text-[#D4C5A9] border border-[#D4A574]/30 rounded px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => removeFurnitureItem(idx)}
                          className="text-red-400 px-2"
                        >
                          ✕
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateFurnitureItem(idx, 'description', e.target.value)}
                        placeholder="Description (cream boucle sectional with brass legs)"
                        className="w-full bg-[#1E293B] text-[#D4C5A9] border border-[#D4A574]/30 rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={item.placement}
                        onChange={(e) => updateFurnitureItem(idx, 'placement', e.target.value)}
                        placeholder="Placement (facing fireplace, under window)"
                        className="w-full bg-[#1E293B] text-[#D4C5A9] border border-[#D4A574]/30 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addFurnitureItem}
                    className="w-full bg-[#0F172A] text-[#D4A574] border border-[#D4A574]/30 rounded-lg py-2 hover:bg-[#1E293B]"
                  >
                    + Add Another Piece
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={addFurniture}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    🛋️ Add Furniture & Render
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={doFullRender}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg text-lg"
                  >
                    ✨ FULL TRANSFORMATION RENDER ✨
                  </button>
                  <p className="text-gray-400 text-xs mt-2">Combines all changes in one photorealistic render</p>
                </div>
              </div>
            )}

            {/* Step 5: Final */}
            {step === 5 && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h2 className="text-2xl font-bold text-[#D4A574] mb-4">✨ Rendering Complete!</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={resetStudio}
                    className="w-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black font-bold py-3 rounded-lg"
                  >
                    🔄 Start New Render
                  </button>
                  
                  {finalRender && (
                    <a
                      href={finalRender}
                      download="room-render.png"
                      className="block w-full bg-green-600 text-white text-center font-bold py-3 rounded-lg"
                    >
                      📥 Download Final Render
                    </a>
                  )}
                </div>

                {roomAnalysis && (
                  <div className="mt-4 bg-[#0F172A] p-4 rounded-lg">
                    <h3 className="text-[#D4A574] font-bold mb-2">Room Analysis</h3>
                    <p className="text-[#D4C5A9] text-sm whitespace-pre-wrap">{roomAnalysis}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side - Preview */}
          <div className="space-y-6">
            {/* Original Image */}
            {originalImage && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-4">
                <h3 className="text-[#D4A574] font-bold mb-2">📸 Original Room</h3>
                <img src={originalImage} alt="Original" className="w-full rounded-lg" />
              </div>
            )}

            {/* Cleared Room */}
            {clearedRoom && (
              <div className="bg-[#1E293B] rounded-lg border border-green-500/30 p-4">
                <h3 className="text-green-400 font-bold mb-2">🧹 Cleared Room</h3>
                <img src={clearedRoom} alt="Cleared" className="w-full rounded-lg" />
              </div>
            )}

            {/* Surfaces Changed */}
            {surfacesChanged && (
              <div className="bg-[#1E293B] rounded-lg border border-blue-500/30 p-4">
                <h3 className="text-blue-400 font-bold mb-2">🎨 New Surfaces</h3>
                <img src={surfacesChanged} alt="Surfaces" className="w-full rounded-lg" />
              </div>
            )}

            {/* Final Render */}
            {finalRender && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574] border-2 p-4">
                <h3 className="text-[#D4A574] font-bold mb-2 text-lg">✨ Final Render</h3>
                <img src={finalRender} alt="Final" className="w-full rounded-lg" />
              </div>
            )}

            {/* Empty State */}
            {!originalImage && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-12 text-center">
                <p className="text-gray-500 text-lg">Upload a room photo to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
          <h3 className="text-xl font-bold text-[#D4A574] mb-4">💡 Tips for Best Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0F172A] p-4 rounded-lg">
              <h4 className="text-[#D4C5A9] font-bold mb-2">📸 Photo Quality</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Use high-resolution photos</li>
                <li>• Good, even lighting</li>
                <li>• Shoot from corner for best perspective</li>
                <li>• Include full room in frame</li>
              </ul>
            </div>
            <div className="bg-[#0F172A] p-4 rounded-lg">
              <h4 className="text-[#D4C5A9] font-bold mb-2">📝 Descriptions</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Be specific with materials</li>
                <li>• Include brand names if known</li>
                <li>• Describe textures and finishes</li>
                <li>• Mention scale (large, small)</li>
              </ul>
            </div>
            <div className="bg-[#0F172A] p-4 rounded-lg">
              <h4 className="text-[#D4C5A9] font-bold mb-2">✨ Rendering</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Full render takes 30-60 seconds</li>
                <li>• Step-by-step gives more control</li>
                <li>• Try different styles</li>
                <li>• Save variations for client</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomRenderingStudio;
