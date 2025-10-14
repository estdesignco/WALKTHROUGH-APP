import React, { useState, useRef } from 'react';
import axios from 'axios';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function SimplePhotoCapture({ projectId, roomId, roomName, onPhotoAdded, onClose }) {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [leicaConnected, setLeicaConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState(null);
  const [drawingArrow, setDrawingArrow] = useState(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedPhoto(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Connect to Leica D5 - SIMPLE VERSION
  const connectLeica = async () => {
    if (!leicaManager.isSupported()) {
      alert('❌ Web Bluetooth not supported.\n\nUse Chrome on Android or desktop (NOT iPad).');
      return;
    }

    try {
      setConnecting(true);
      const result = await leicaManager.connect();
      setLeicaConnected(true);
      alert(`✅ Leica D5 Connected!\nPress measurement button on Leica to take readings.`);

      leicaManager.setOnMeasurement((measurement) => {
        console.log('📏 NEW MEASUREMENT:', measurement.feetInches);
        setLastMeasurement(measurement);
        
        // Show big visual feedback
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                      background: linear-gradient(135deg, #4ade80, #22c55e); 
                      color: white; padding: 30px; border-radius: 20px; 
                      z-index: 9999; font-weight: bold; font-size: 24px;
                      box-shadow: 0 10px 50px rgba(34, 197, 94, 0.8);
                      border: 3px solid white;">
            📏 ${measurement.feetInches}
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 4000);
      });
    } catch (error) {
      alert(`❌ Connection failed: ${error.message}`);
    } finally {
      setConnecting(false);
    }
  };

  // Simple arrow drawing for measurements - FIXED TO WORK PROPERLY
  const handleImageMouseDown = (e) => {
    if (!capturedPhoto) return;

    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    console.log('🎯 Starting arrow at:', x, y);
    setDrawingArrow({ x1: x, y1: y, x2: x, y2: y });
  };

  const handleImageMouseMove = (e) => {
    if (!drawingArrow) return;

    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
  };

  const handleImageMouseUp = (e) => {
    if (!drawingArrow) return;

    const dx = drawingArrow.x2 - drawingArrow.x1;
    const dy = drawingArrow.y2 - drawingArrow.y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    console.log('🎯 Arrow length:', length);

    if (length > 3) { // Minimum 3% of image size
      // Use last Leica measurement or prompt for manual entry
      let text = '';
      if (lastMeasurement) {
        text = lastMeasurement.feetInches;
        console.log('📏 Using Leica measurement:', text);
      } else {
        text = prompt('Enter measurement:', "8'6\"");
        console.log('📝 Manual measurement entered:', text);
      }
      
      if (text && text.trim()) {
        const newMeasurement = {
          x1: drawingArrow.x1,
          y1: drawingArrow.y1,
          x2: drawingArrow.x2,
          y2: drawingArrow.y2,
          text: text.trim(),
          color: '#FFD700'
        };
        
        console.log('✅ Adding measurement:', newMeasurement);
        setMeasurements(prev => [...prev, newMeasurement]);
        
        // Clear the last measurement after use
        setLastMeasurement(null);
      }
    } else {
      console.log('❌ Arrow too short, not saving');
    }
    
    setDrawingArrow(null);
  };

  const handleSavePhoto = async () => {
    if (!capturedPhoto) {
      alert('Please take a photo first');
      return;
    }

    try {
      setUploading(true);
      console.log('🔄 Saving photo without measurements...');

      // Upload just the photo without annotations
      await axios.post(`${API_URL}/photos/upload`, {
        project_id: projectId,
        room_id: roomId,
        photo_data: capturedPhoto, // Just the original photo
        file_name: `photo_${roomName}_${Date.now()}.jpg`,
        metadata: {
          room_name: roomName,
          timestamp: new Date().toISOString(),
          has_measurements: false
        }
      });

      console.log('✅ Photo saved successfully!');
      alert('✅ Photo saved successfully!');
      
    } catch (error) {
      console.error('❌ Failed to save photo:', error);
      alert('❌ Failed to save photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMeasurements = async () => {
    if (!capturedPhoto) {
      alert('Please take a photo first');
      return;
    }

    if (measurements.length === 0) {
      alert('Please add some measurements first');
      return;
    }

    try {
      setUploading(true);
      console.log('🔄 Saving photo with measurements...');

      // Create canvas with annotations
      const img = new Image();
      img.src = capturedPhoto;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw measurement arrows
      measurements.forEach((m) => {
        const x1 = (m.x1 / 100) * canvas.width;
        const y1 = (m.y1 / 100) * canvas.height;
        const x2 = (m.x2 / 100) * canvas.width;
        const y2 = (m.y2 / 100) * canvas.height;

        // Draw arrow line
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headlen = 30;
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle - Math.PI / 6),
          y2 - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - headlen * Math.cos(angle + Math.PI / 6),
          y2 - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Draw measurement text
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 40;
        
        ctx.font = 'bold 48px Arial';
        const textWidth = ctx.measureText(m.text).width;
        
        // Text background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(midX - textWidth / 2 - 15, midY - 35, textWidth + 30, 60);
        
        // Text
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(m.text, midX, midY);
      });

      const annotatedPhoto = canvas.toDataURL('image/jpeg', 0.8);

      // Upload annotated photo
      await axios.post(`${API_URL}/photos/upload`, {
        project_id: projectId,
        room_id: roomId,
        photo_data: annotatedPhoto,
        file_name: `measurements_${roomName}_${Date.now()}.jpg`,
        metadata: {
          room_name: roomName,
          timestamp: new Date().toISOString(),
          measurements: measurements.map(m => m.text),
          measurement_count: measurements.length,
          has_measurements: true
        }
      });

      console.log('✅ Photo with measurements saved successfully!');
      alert('✅ Photo with measurements saved successfully!');
      onPhotoAdded();
      
    } catch (error) {
      console.error('❌ Failed to save measurements:', error);
      alert('❌ Failed to save measurements: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* SIMPLE HEADER */}
      <div className="bg-[#1E293B] p-4 flex justify-between items-center border-b-2 border-[#D4A574]">
        <h3 className="text-2xl font-bold text-[#D4A574]">📷 {roomName} Photos</h3>
        <button
          onClick={onClose}
          className="text-[#D4A574] text-3xl hover:text-red-400 font-bold"
        >
          ✕
        </button>
      </div>

      {!capturedPhoto ? (
        /* PHOTO CAPTURE SCREEN */
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-[#D4A574] text-center mb-12">
            <div className="text-9xl mb-8">📷</div>
            <p className="text-3xl font-bold text-[#D4C5A9] mb-4">Take Photo</p>
            <p className="text-xl text-[#D4A574]">Capture photo for {roomName}</p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-br from-[#D4A574] to-[#B48554] hover:from-[#E4B584] hover:to-[#C49564] text-black px-16 py-8 rounded-2xl font-bold text-3xl shadow-2xl transform hover:scale-105 transition-all"
          >
            📸 Take Photo
          </button>
        </div>
      ) : (
        /* MEASUREMENT SCREEN */
        <div className="flex-1 flex flex-col">
          {/* LEICA CONNECTION BAR */}
          <div className="bg-[#0F172A] p-4 border-b border-[#D4A574]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl font-bold text-lg ${
                  leicaConnected ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  📏 Leica D5: {leicaConnected ? 'Connected' : 'Not Connected'}
                </div>
                <button
                  onClick={leicaConnected ? () => leicaManager.disconnect() : connectLeica}
                  disabled={connecting}
                  className="px-6 py-2 bg-[#D4A574] hover:bg-[#C49564] disabled:bg-gray-600 text-black rounded-xl font-bold text-lg"
                >
                  {connecting ? 'Connecting...' : (leicaConnected ? 'Disconnect' : 'Connect Leica D5')}
                </button>
              </div>
              
              {/* Last Measurement Display */}
              {lastMeasurement && (
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl">
                  <div className="text-lg font-bold">📏 {lastMeasurement.feetInches}</div>
                  <div className="text-sm">Click photo to place arrow</div>
                </div>
              )}
            </div>
          </div>

          {/* LARGE PHOTO WITH MEASUREMENTS */}
          <div className="flex-1 p-4 flex items-center justify-center bg-black">
            <div className="relative max-w-full max-h-full">
              <img 
                ref={imageRef}
                src={capturedPhoto}
                alt="Photo for measurement"
                className="max-w-full max-h-[70vh] object-contain cursor-crosshair border-4 border-[#D4A574] rounded-xl"
                onMouseDown={handleImageMouseDown}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleImageMouseUp}
                draggable={false}
              />
              
              {/* SVG Overlay for arrows */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 10 }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#FFD700" />
                  </marker>
                </defs>
                
                {/* Measurement arrows */}
                {measurements.map((m, index) => (
                  <line
                    key={index}
                    x1={m.x1}
                    y1={m.y1}
                    x2={m.x2}
                    y2={m.y2}
                    stroke="#FFD700"
                    strokeWidth="1"
                    markerEnd="url(#arrowhead)"
                  />
                ))}
                
                {/* Drawing arrow */}
                {drawingArrow && (
                  <line
                    x1={drawingArrow.x1}
                    y1={drawingArrow.y1}
                    x2={drawingArrow.x2}
                    y2={drawingArrow.y2}
                    stroke="#FF6B6B"
                    strokeWidth="1"
                    markerEnd="url(#arrowhead)"
                    opacity="0.8"
                  />
                )}
              </svg>
              
              {/* Measurement labels */}
              {measurements.map((m, index) => (
                <div
                  key={index}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${(m.x1 + m.x2) / 2}%`,
                    top: `${(m.y1 + m.y2) / 2 - 8}%`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 20
                  }}
                >
                  <div 
                    className="bg-black bg-opacity-95 px-4 py-2 rounded-xl text-2xl font-bold whitespace-nowrap shadow-2xl border-4 border-[#FFD700]"
                    style={{ color: '#FFD700' }}
                  >
                    {m.text}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMeasurements(measurements.filter((_, i) => i !== index));
                      }}
                      className="ml-4 text-red-400 hover:text-red-300 font-bold text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIMPLE ACTION BUTTONS */}
          <div className="bg-[#1E293B] p-6 border-t-2 border-[#D4A574]">
            <div className="flex gap-4 max-w-4xl mx-auto">
              <button
                onClick={() => {
                  setCapturedPhoto(null);
                  setMeasurements([]);
                  setLastMeasurement(null);
                  setDrawingArrow(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-2xl font-bold text-xl"
              >
                🔄 Retake Photo
              </button>
              
              <button
                onClick={() => {
                  if (measurements.length > 0) {
                    setMeasurements([]);
                    alert('✅ All measurements cleared');
                  } else {
                    alert('No measurements to clear');
                  }
                }}
                className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xl"
              >
                🗑️ Clear Measurements
              </button>
              
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-2xl font-bold text-xl"
              >
                {uploading ? '⏳ Saving...' : '✅ Save Photo & Measurements'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}