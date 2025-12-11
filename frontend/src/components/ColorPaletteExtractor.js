import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Copy, Check, Palette, Droplet } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Color Palette Extractor
 * Upload any inspiration image and AI extracts:
 * - Dominant colors with hex codes
 * - Paint brand matches (Benjamin Moore, Sherwin Williams)
 * - Complementary color suggestions
 * - Mood board creation
 */
export default function ColorPaletteExtractor() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [palette, setPalette] = useState(null);
  const [copiedColor, setCopiedColor] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
        setImageBase64(e.target.result.split(',')[1]);
        setPalette(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractColors = async () => {
    if (!imageBase64) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/ai/extract-colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPalette(data);
      } else {
        // Fallback: Extract colors locally using canvas
        extractColorsLocally();
      }
    } catch (error) {
      console.error('API extraction failed, using local extraction:', error);
      extractColorsLocally();
    } finally {
      setLoading(false);
    }
  };

  // Local color extraction using canvas
  const extractColorsLocally = () => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const sampleSize = 100;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      
      // Simple color clustering
      const colorCounts = {};
      for (let i = 0; i < imageData.length; i += 4) {
        // Quantize colors to reduce variations
        const r = Math.round(imageData[i] / 32) * 32;
        const g = Math.round(imageData[i + 1] / 32) * 32;
        const b = Math.round(imageData[i + 2] / 32) * 32;
        const hex = rgbToHex(r, g, b);
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
      
      // Get top colors
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([hex, count]) => ({
          hex,
          rgb: hexToRgb(hex),
          percentage: Math.round((count / (sampleSize * sampleSize)) * 100),
          name: getColorName(hex),
          paintMatch: getPaintMatch(hex)
        }));
      
      setPalette({
        success: true,
        colors: sortedColors,
        mood: detectMood(sortedColors),
        complementary: getComplementaryColors(sortedColors[0]?.hex || '#888888')
      });
    };
    img.src = image;
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.min(255, Math.max(0, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const getColorName = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    
    // Simple color naming based on HSL
    if (hsl.l < 15) return 'Black';
    if (hsl.l > 85) return 'White';
    if (hsl.s < 10) return hsl.l < 50 ? 'Charcoal' : 'Gray';
    
    const hue = hsl.h;
    if (hue < 15 || hue >= 345) return 'Red';
    if (hue < 45) return 'Orange';
    if (hue < 75) return 'Yellow';
    if (hue < 150) return 'Green';
    if (hue < 210) return 'Cyan';
    if (hue < 270) return 'Blue';
    if (hue < 315) return 'Purple';
    return 'Pink';
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const getPaintMatch = (hex) => {
    // Simplified paint matching - in production, use actual paint color databases
    const paintColors = {
      '#FFFFFF': { bm: 'OC-17 White Dove', sw: 'SW 7012 Creamy' },
      '#F5F5DC': { bm: 'OC-1 Natural Wicker', sw: 'SW 7036 Accessible Beige' },
      '#E0E0E0': { bm: 'HC-172 Revere Pewter', sw: 'SW 7015 Repose Gray' },
      '#C0C0C0': { bm: 'HC-169 Coventry Gray', sw: 'SW 7018 Dovetail' },
      '#808080': { bm: 'HC-166 Kendall Charcoal', sw: 'SW 7019 Gauntlet Gray' },
      '#404040': { bm: 'HC-190 Graphite', sw: 'SW 7020 Black Fox' },
      '#000000': { bm: '2132-10 Black', sw: 'SW 6258 Tricorn Black' },
      '#F0E68C': { bm: 'HC-7 Hawthorne Yellow', sw: 'SW 6697 Nugget' },
      '#DEB887': { bm: 'HC-77 Alexandria Beige', sw: 'SW 6119 Antique White' },
      '#D2B48C': { bm: 'HC-45 Shaker Beige', sw: 'SW 6106 Kilim Beige' },
      '#8B4513': { bm: 'HC-74 Valley Forge Brown', sw: 'SW 6069 French Roast' },
      '#006400': { bm: 'HC-125 Cushing Green', sw: 'SW 6461 Isle of Pines' },
      '#228B22': { bm: 'HC-120 Van Alen Green', sw: 'SW 6452 Inland' },
      '#000080': { bm: 'HC-155 Newburyport Blue', sw: 'SW 6244 Naval' },
      '#4169E1': { bm: 'HC-159 Phillipsburg Blue', sw: 'SW 6524 Commodore' },
      '#800020': { bm: 'HC-182 Classic Burgundy', sw: 'SW 6307 Fine Wine' }
    };
    
    // Find closest match
    let closestMatch = { bm: 'Similar to BM White', sw: 'Similar to SW Creamy' };
    let minDistance = Infinity;
    
    const targetRgb = hexToRgb(hex);
    
    for (const [colorHex, matches] of Object.entries(paintColors)) {
      const rgb = hexToRgb(colorHex);
      const distance = Math.sqrt(
        Math.pow(targetRgb.r - rgb.r, 2) +
        Math.pow(targetRgb.g - rgb.g, 2) +
        Math.pow(targetRgb.b - rgb.b, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestMatch = matches;
      }
    }
    
    return closestMatch;
  };

  const detectMood = (colors) => {
    if (!colors || colors.length === 0) return 'Neutral';
    
    const avgLightness = colors.reduce((sum, c) => {
      const rgb = c.rgb || hexToRgb(c.hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return sum + hsl.l;
    }, 0) / colors.length;
    
    const avgSaturation = colors.reduce((sum, c) => {
      const rgb = c.rgb || hexToRgb(c.hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return sum + hsl.s;
    }, 0) / colors.length;
    
    if (avgLightness > 70 && avgSaturation < 30) return 'Light & Airy';
    if (avgLightness < 30) return 'Moody & Dramatic';
    if (avgSaturation > 60) return 'Bold & Vibrant';
    if (avgLightness > 50 && avgSaturation < 40) return 'Soft & Calming';
    return 'Balanced & Harmonious';
  };

  const getComplementaryColors = (hex) => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Generate complementary, triadic, and analogous colors
    return [
      { name: 'Complementary', hex: hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l) },
      { name: 'Triadic 1', hex: hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l) },
      { name: 'Triadic 2', hex: hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l) },
      { name: 'Analogous 1', hex: hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l) },
      { name: 'Analogous 2', hex: hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l) }
    ];
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(text);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      {/* Header */}
      <div className="p-4 border-b border-[#D4A574]/30">
        <div className="max-w-6xl mx-auto flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-[#D4A574]">🎨 Color Palette Extractor</h1>
            <p className="text-gray-400 text-sm">Upload any image - get paint matches instantly</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Image Upload */}
          <div className="space-y-4">
            <div 
              className="rounded-xl border-2 border-dashed border-[#D4A574]/50 p-8 text-center cursor-pointer hover:border-[#D4A574] transition-colors"
              style={{ background: 'rgba(0,0,0,0.3)', minHeight: '400px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {image ? (
                <img src={image} alt="Uploaded" className="max-w-full max-h-[350px] mx-auto rounded-lg" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <Upload size={48} className="text-[#D4A574] mb-4" />
                  <p className="text-[#D4A574] font-medium mb-2">Drop inspiration image here</p>
                  <p className="text-gray-500 text-sm">Pinterest, magazine scan, photo - anything!</p>
                </div>
              )}
            </div>
            
            {image && (
              <button
                onClick={extractColors}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Extracting Colors...
                  </>
                ) : (
                  <>
                    <Palette size={24} />
                    Extract Color Palette
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right - Extracted Palette */}
          <div className="space-y-4">
            {palette ? (
              <>
                {/* Mood */}
                <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
                  <h3 className="text-[#D4A574] font-bold mb-2">Mood: {palette.mood}</h3>
                </div>
                
                {/* Extracted Colors */}
                <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
                  <h3 className="text-[#D4A574] font-bold mb-4">Extracted Colors</h3>
                  <div className="space-y-3">
                    {palette.colors?.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg shadow-lg cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color.hex }}
                          onClick={() => copyToClipboard(color.hex)}
                          title="Click to copy"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{color.name}</span>
                            <button
                              onClick={() => copyToClipboard(color.hex)}
                              className="text-gray-400 hover:text-white"
                            >
                              {copiedColor === color.hex ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                          <span className="text-gray-400 text-sm font-mono">{color.hex}</span>
                          <span className="text-gray-500 text-xs ml-2">{color.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Paint Matches */}
                <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
                  <h3 className="text-[#D4A574] font-bold mb-4 flex items-center gap-2">
                    <Droplet size={18} /> Paint Matches
                  </h3>
                  <div className="space-y-3">
                    {palette.colors?.slice(0, 4).map((color, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-black/30">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-white font-medium">{color.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-400">
                            <span className="text-gray-500">Benjamin Moore:</span><br />
                            {color.paintMatch?.bm || 'N/A'}
                          </div>
                          <div className="text-gray-400">
                            <span className="text-gray-500">Sherwin Williams:</span><br />
                            {color.paintMatch?.sw || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Complementary Colors */}
                {palette.complementary && (
                  <div className="p-4 rounded-xl bg-black/30 border border-[#D4A574]/30">
                    <h3 className="text-[#D4A574] font-bold mb-4">Suggested Combinations</h3>
                    <div className="flex flex-wrap gap-3">
                      {palette.complementary.map((color, idx) => (
                        <div key={idx} className="text-center">
                          <div 
                            className="w-12 h-12 rounded-lg shadow-lg cursor-pointer hover:scale-110 transition-transform mb-1"
                            style={{ backgroundColor: color.hex }}
                            onClick={() => copyToClipboard(color.hex)}
                          />
                          <span className="text-gray-500 text-xs">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 p-8 rounded-xl bg-black/20 border border-[#B49B7E]/20">
                <div className="text-center">
                  <Palette size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Upload an image and click "Extract" to see colors</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
