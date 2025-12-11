import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sun, Moon, Lightbulb, Thermometer, Download } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Lighting Simulator
 * - Upload room photo
 * - Simulate different lighting conditions
 * - Adjust color temperature (warm/cool)
 * - Day vs night preview
 * - Dimmer settings
 */
export default function LightingSimulator() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  
  // Lighting controls
  const [brightness, setBrightness] = useState(100);
  const [warmth, setWarmth] = useState(50); // 0 = cool, 100 = warm
  const [contrast, setContrast] = useState(100);
  const [shadows, setShadows] = useState(50);
  const [timeOfDay, setTimeOfDay] = useState('day'); // day, evening, night
  const [dimmer, setDimmer] = useState(100);
  
  // Preset modes
  const [activePreset, setActivePreset] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setOriginalImage(e.target.result);
        resetSettings();
      };
      reader.readAsDataURL(file);
    }
  };

  const resetSettings = () => {
    setBrightness(100);
    setWarmth(50);
    setContrast(100);
    setShadows(50);
    setTimeOfDay('day');
    setDimmer(100);
    setActivePreset(null);
  };

  const applyPreset = (preset) => {
    setActivePreset(preset);
    switch (preset) {
      case 'morning':
        setBrightness(110);
        setWarmth(60);
        setContrast(95);
        setShadows(40);
        setTimeOfDay('day');
        setDimmer(100);
        break;
      case 'afternoon':
        setBrightness(120);
        setWarmth(50);
        setContrast(105);
        setShadows(50);
        setTimeOfDay('day');
        setDimmer(100);
        break;
      case 'golden_hour':
        setBrightness(95);
        setWarmth(80);
        setContrast(90);
        setShadows(60);
        setTimeOfDay('evening');
        setDimmer(90);
        break;
      case 'evening':
        setBrightness(70);
        setWarmth(70);
        setContrast(85);
        setShadows(70);
        setTimeOfDay('evening');
        setDimmer(70);
        break;
      case 'night':
        setBrightness(40);
        setWarmth(75);
        setContrast(80);
        setShadows(80);
        setTimeOfDay('night');
        setDimmer(50);
        break;
      case 'candlelight':
        setBrightness(50);
        setWarmth(90);
        setContrast(75);
        setShadows(85);
        setTimeOfDay('night');
        setDimmer(40);
        break;
      case 'daylight_bulb':
        setBrightness(105);
        setWarmth(30);
        setContrast(100);
        setShadows(45);
        setTimeOfDay('day');
        setDimmer(100);
        break;
      case 'warm_bulb':
        setBrightness(90);
        setWarmth(80);
        setContrast(95);
        setShadows(55);
        setTimeOfDay('evening');
        setDimmer(85);
        break;
      default:
        resetSettings();
    }
  };

  // Calculate CSS filter based on settings
  const getFilterStyle = () => {
    // Warmth to sepia/hue adjustment
    const sepiaValue = Math.max(0, (warmth - 50) / 100);
    const hueRotate = warmth < 50 ? (50 - warmth) * 0.5 : 0; // Cool shift
    
    // Time of day adjustments
    let timeAdjustment = {
      brightness: 1,
      saturate: 1,
      contrast: 1
    };
    
    if (timeOfDay === 'evening') {
      timeAdjustment = { brightness: 0.9, saturate: 0.95, contrast: 0.95 };
    } else if (timeOfDay === 'night') {
      timeAdjustment = { brightness: 0.7, saturate: 0.8, contrast: 0.9 };
    }
    
    const finalBrightness = (brightness / 100) * (dimmer / 100) * timeAdjustment.brightness;
    const finalContrast = (contrast / 100) * timeAdjustment.contrast;
    const finalSaturate = timeAdjustment.saturate;
    
    return {
      filter: `
        brightness(${finalBrightness})
        contrast(${finalContrast})
        saturate(${finalSaturate})
        sepia(${sepiaValue})
        hue-rotate(${hueRotate}deg)
      `.trim()
    };
  };

  // Get shadow overlay gradient
  const getShadowOverlay = () => {
    const shadowIntensity = (shadows - 50) / 100;
    if (shadowIntensity <= 0) return 'none';
    
    return `linear-gradient(
      135deg,
      rgba(0,0,0,${shadowIntensity * 0.3}) 0%,
      transparent 50%,
      rgba(0,0,0,${shadowIntensity * 0.2}) 100%
    )`;
  };

  // Export processed image
  const exportImage = () => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply filters via canvas
      ctx.filter = getFilterStyle().filter;
      ctx.drawImage(img, 0, 0);
      
      // Download
      const link = document.createElement('a');
      link.download = `lighting-preview-${timeOfDay}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = image;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      {/* Header */}
      <div className="p-4 border-b border-[#D4A574]/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#D4A574]">💡 Lighting Simulator</h1>
            <p className="text-gray-400 text-sm">Preview how your room looks in different lighting</p>
          </div>
          
          {image && (
            <button
              onClick={exportImage}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              <Download size={18} />
              Export
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Image Preview */}
          <div className="lg:col-span-2">
            <div 
              className="rounded-xl border-2 border-dashed border-[#D4A574]/50 overflow-hidden cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.3)', minHeight: '500px' }}
              onClick={() => !image && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {image ? (
                <div className="relative w-full h-full">
                  {/* Shadow overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{ background: getShadowOverlay() }}
                  />
                  
                  {/* Main image with filters */}
                  <img 
                    src={image} 
                    alt="Room preview" 
                    className="w-full h-auto"
                    style={getFilterStyle()}
                  />
                  
                  {/* Time indicator */}
                  <div className="absolute top-4 right-4 px-3 py-2 rounded-full bg-black/70 text-white text-sm flex items-center gap-2">
                    {timeOfDay === 'day' && <Sun size={16} className="text-yellow-400" />}
                    {timeOfDay === 'evening' && <Sun size={16} className="text-orange-400" />}
                    {timeOfDay === 'night' && <Moon size={16} className="text-blue-300" />}
                    {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
                  </div>
                  
                  {/* Change image button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-black/70 text-white text-sm hover:bg-black/90"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <Upload size={48} className="text-[#D4A574] mb-4" />
                  <p className="text-[#D4A574] font-medium mb-2">Upload a room photo</p>
                  <p className="text-gray-500 text-sm">See how it looks in different lighting</p>
                </div>
              )}
            </div>
            
            {/* Hidden canvas for export */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Right - Controls */}
          <div className="space-y-4">
            {/* Presets */}
            <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
              <h3 className="text-[#D4A574] font-bold mb-3 flex items-center gap-2">
                <Lightbulb size={18} />
                Lighting Presets
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'morning', label: '🌅 Morning', temp: '5000K' },
                  { id: 'afternoon', label: '☀️ Afternoon', temp: '5500K' },
                  { id: 'golden_hour', label: '🌇 Golden Hour', temp: '3500K' },
                  { id: 'evening', label: '🌆 Evening', temp: '3000K' },
                  { id: 'night', label: '🌙 Night', temp: '2700K' },
                  { id: 'candlelight', label: '🕯️ Candlelight', temp: '1800K' },
                  { id: 'daylight_bulb', label: '💡 Daylight LED', temp: '6500K' },
                  { id: 'warm_bulb', label: '💡 Warm LED', temp: '2700K' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`p-2 rounded-lg text-left text-sm transition-all ${
                      activePreset === preset.id
                        ? 'bg-[#D4A574] text-white'
                        : 'bg-black/30 text-gray-300 hover:bg-black/50'
                    }`}
                  >
                    {preset.label}
                    <span className="block text-xs opacity-70">{preset.temp}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time of Day */}
            <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
              <h3 className="text-[#D4A574] font-bold mb-3">Time of Day</h3>
              <div className="flex gap-2">
                {[
                  { id: 'day', icon: Sun, color: 'text-yellow-400' },
                  { id: 'evening', icon: Sun, color: 'text-orange-400' },
                  { id: 'night', icon: Moon, color: 'text-blue-300' }
                ].map(time => (
                  <button
                    key={time.id}
                    onClick={() => setTimeOfDay(time.id)}
                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      timeOfDay === time.id
                        ? 'bg-[#D4A574] text-white'
                        : 'bg-black/30 text-gray-400 hover:bg-black/50'
                    }`}
                  >
                    <time.icon size={18} className={timeOfDay === time.id ? 'text-white' : time.color} />
                    {time.id.charAt(0).toUpperCase() + time.id.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30 space-y-4">
              <h3 className="text-[#D4A574] font-bold flex items-center gap-2">
                <Thermometer size={18} />
                Manual Adjustments
              </h3>
              
              {/* Brightness */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Brightness</span>
                  <span className="text-white">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={brightness}
                  onChange={(e) => { setBrightness(Number(e.target.value)); setActivePreset(null); }}
                  className="w-full accent-[#D4A574]"
                />
              </div>
              
              {/* Color Temperature */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Color Temperature</span>
                  <span className="text-white">{warmth < 50 ? 'Cool' : warmth > 50 ? 'Warm' : 'Neutral'}</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={warmth}
                    onChange={(e) => { setWarmth(Number(e.target.value)); setActivePreset(null); }}
                    className="w-full accent-[#D4A574]"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>❄️ Cool</span>
                    <span>🔥 Warm</span>
                  </div>
                </div>
              </div>
              
              {/* Contrast */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Contrast</span>
                  <span className="text-white">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => { setContrast(Number(e.target.value)); setActivePreset(null); }}
                  className="w-full accent-[#D4A574]"
                />
              </div>
              
              {/* Dimmer */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Dimmer Level</span>
                  <span className="text-white">{dimmer}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={dimmer}
                  onChange={(e) => { setDimmer(Number(e.target.value)); setActivePreset(null); }}
                  className="w-full accent-[#D4A574]"
                />
              </div>
              
              {/* Shadows */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Shadow Depth</span>
                  <span className="text-white">{shadows}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={shadows}
                  onChange={(e) => { setShadows(Number(e.target.value)); setActivePreset(null); }}
                  className="w-full accent-[#D4A574]"
                />
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={resetSettings}
              className="w-full py-3 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
