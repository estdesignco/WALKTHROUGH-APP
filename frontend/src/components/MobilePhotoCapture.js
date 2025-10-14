import React, { useState, useRef } from 'react';
import axios from 'axios';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobilePhotoCapture({ projectId, roomId, onPhotoAdded, onClose }) {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [measurements, setMeasurements] = useState([]); // Now stores {x1, y1, x2, y2, text}
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [measurementText, setMeasurementText] = useState('');
  const [leicaConnected, setLeicaConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState(null);
  const [drawingArrow, setDrawingArrow] = useState(null); // {x1, y1, x2, y2} while drawing
  const [editingArrowIndex, setEditingArrowIndex] = useState(null); // Which arrow is being edited
  const [arrowColor, setArrowColor] = useState('#FFD700'); // Current arrow color (gold default)
  const [drawMode, setDrawMode] = useState(false); // Explicit draw mode
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
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

  // Connect to Leica D5
  const connectLeica = async () => {
    const browserInfo = leicaManager.getBrowserCompatibilityInfo();
    
    if (!leicaManager.isSupported()) {
      let message = '❌ WEB BLUETOOTH NOT SUPPORTED\n\n';
      
      if (browserInfo.isChromeOnIOS) {
        message += '⚠️ CHROME ON iPAD USES SAFARI ENGINE\n\n';
        message += 'Web Bluetooth does NOT work on iOS/iPadOS\n';
        message += '(This is an Apple limitation, not a Chrome issue)\n\n';
        message += '✅ TO USE LEICA D5:\n';
        message += '• Use Chrome on Android tablet/phone\n';
        message += '• Use Chrome on Windows/Mac desktop\n\n';
        message += '❌ Will NOT work on ANY iPad browser\n';
        message += '❌ Will NOT work on Safari on any device';
      } else if (browserInfo.isSafari) {
        message += '⚠️ Safari does NOT support Web Bluetooth\n\n';
        message += '✅ Please use Chrome or Edge browser';
      } else {
        message += '✅ Please use:\n• Chrome on Android\n• Chrome/Edge on desktop';
      }
      
      alert(message);
      return;
    }

    try {
      setConnecting(true);
      
      console.log('🔍 Starting Leica D5 connection process...');
      
      // Simple connection without complex retry logic first
      const result = await leicaManager.connect();
      
      setLeicaConnected(true);
      alert(`✅ CONNECTED TO LEICA D5!\n\nDevice: ${result.deviceName}\n\nPress the measurement button on your Leica to take readings.`);

      // Set up measurement callback
      leicaManager.setOnMeasurement((measurement) => {
        console.log('📏 NEW MEASUREMENT FROM LEICA:', measurement);
        setLastMeasurement(measurement);
        setMeasurementText(measurement.feetInches);
        
        // Show visual feedback
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                      background: linear-gradient(135deg, #4ade80, #22c55e); 
                      color: white; padding: 20px; border-radius: 12px; 
                      z-index: 9999; font-weight: bold; font-size: 18px;
                      box-shadow: 0 10px 30px rgba(34, 197, 94, 0.5);">
            📏 NEW MEASUREMENT: ${measurement.feetInches}
          </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      });

    } catch (error) {
      console.error('❌ Leica connection error:', error);
      
      let errorMsg = `❌ FAILED TO CONNECT TO LEICA D5\n\n`;
      
      if (error.message.includes('User cancelled')) {
        errorMsg = '⚠️ Connection cancelled by user.\n\nTip: Make sure to select your DISTO device when prompted.';
      } else if (error.message.includes('timeout')) {
        errorMsg += `⏱ CONNECTION TIMEOUT\n\n`;
        errorMsg += `🔧 Quick Fixes:\n`;
        errorMsg += `1. Turn Leica D5 OFF → Wait 5 seconds → Turn ON\n`;
        errorMsg += `2. Move device closer (< 5 feet from your device)\n`;
        errorMsg += `3. Make sure no other device is connected to the Leica\n`;
        errorMsg += `4. Try again (first connection may take 30-90 seconds)\n\n`;
        errorMsg += `💡 Once paired successfully, reconnection is much faster!`;
      } else if (error.message.includes('not found') || error.message.includes('No device')) {
        errorMsg += `🔍 DEVICE NOT FOUND\n\n`;
        errorMsg += `📋 Checklist:\n`;
        errorMsg += `✓ Leica D5 is powered ON\n`;
        errorMsg += `✓ Leica is in pairing mode (check manual)\n`;
        errorMsg += `✓ Leica is not connected to another device\n`;
        errorMsg += `✓ You're within 10 feet of the Leica\n`;
        errorMsg += `✓ Your device's Bluetooth is enabled\n\n`;
        errorMsg += `🔄 If still not working, restart both devices`;
      } else {
        errorMsg += `Error: ${error.message}\n\n`;
        errorMsg += `📋 General Troubleshooting:\n`;
        errorMsg += `✓ Leica D5 powered ON and ready\n`;
        errorMsg += `✓ Bluetooth enabled on your device\n`;
        errorMsg += `✓ No other device connected to Leica\n`;
        errorMsg += `✓ Within 10 feet range\n`;
        errorMsg += `✓ Using Chrome browser (not Safari)\n\n`;
        errorMsg += `🆘 If problems persist, try restarting both devices`;
      }
      
      alert(errorMsg);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from Leica D5
  const disconnectLeica = async () => {
    await leicaManager.disconnect();
    setLeicaConnected(false);
    setLastMeasurement(null);
    alert('✅ Disconnected from Leica D5');
  };

  // Start drawing arrow (only in draw mode)
  const handleMouseDown = (e) => {
    if (!capturedPhoto || !drawMode) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDrawingArrow({ x1: x, y1: y, x2: x, y2: y, color: arrowColor });
  };
  
  // Update arrow end point while dragging
  const handleMouseMove = (e) => {
    if (!drawingArrow) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDrawingArrow({ ...drawingArrow, x2: x, y2: y });
  };
  
  // Finish drawing arrow
  const handleMouseUp = () => {
    if (!drawingArrow) return;
    
    // Only save if arrow has some length
    const dx = drawingArrow.x2 - drawingArrow.x1;
    const dy = drawingArrow.y2 - drawingArrow.y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 2) { // Minimum 2% of image size
      // Use last Leica measurement if available, otherwise ask for manual input
      const text = lastMeasurement ? lastMeasurement.feetInches : prompt('Enter measurement:', '');
      
      if (text) {
        setMeasurements([
          ...measurements,
          { ...drawingArrow, text, color: arrowColor }
        ]);
        // Stay in draw mode, don't exit automatically
      }
    }
    
    setDrawingArrow(null);
  };

  const removeMeasurement = (index) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!capturedPhoto) {
      alert('Please capture a photo first');
      return;
    }

    try {
      setUploading(true);

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
        const color = m.color || '#FFD700';

        // Draw arrow line
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headlen = 20;
        
        ctx.fillStyle = color;
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
        const midY = (y1 + y2) / 2 - 30; // Above the arrow
        
        ctx.font = 'bold 32px Arial';
        const textWidth = ctx.measureText(m.text).width;
        
        // Text background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(midX - textWidth / 2 - 10, midY - 26, textWidth + 20, 42);
        
        // Text
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(m.text, midX, midY);
      });

      const annotatedPhoto = canvas.toDataURL('image/jpeg', 0.8);

      // Upload to server
      await axios.post(`${API_URL}/photos/upload`, {
        project_id: projectId,
        room_id: roomId,
        photo_data: annotatedPhoto,
        file_name: `photo_${Date.now()}.jpg`,
        metadata: {
          timestamp: new Date().toISOString(),
          notes,
          measurements: measurements.map(m => m.text)
        }
      });

      alert('✅ Photo saved successfully!');
      onPhotoAdded();
      onClose();
    } catch (error) {
      console.error('Failed to save photo:', error);
      alert('Failed to save photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Logo Header - Black logo on gold container */}
      <div className="text-center py-3 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-b border-[#D4A574]/20">
        <div className="inline-block bg-gradient-to-r from-[#D4A574] to-[#BCA888] p-0">
          <img 
            src={`${process.env.PUBLIC_URL}/established-logo.png`}
            alt="ESTABLISHED" 
            className="h-10 md:h-12 object-contain"
            style={{ 
              maxWidth: '180px',
              filter: 'brightness(0)',
              display: 'block'
            }}
          />
        </div>
      </div>
      
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-bold text-lg">📸 Photo Capture</h3>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-red-400"
          >
            ✕
          </button>
        </div>
        
        {/* Leica Connection */}
        <div className="flex gap-2">
          {!leicaConnected ? (
            <button
              onClick={connectLeica}
              disabled={connecting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-bold text-sm"
            >
              {connecting ? '⏳ Connecting...' : '📏 Connect Leica D5'}
            </button>
          ) : (
            <>
              <div className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-bold text-sm flex items-center justify-center">
                ✅ Leica D5 Connected
              </div>
              <button
                onClick={disconnectLeica}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
        
        {/* Last Measurement Display */}
        {lastMeasurement && (
          <div className="mt-3 bg-green-900 text-green-100 px-4 py-2 rounded">
            <div className="text-xs font-bold">Last Measurement:</div>
            <div className="text-lg font-bold">{lastMeasurement.feetInches}</div>
            <div className="text-xs text-green-300">
              {lastMeasurement.meters}m • {lastMeasurement.inches}" • {lastMeasurement.cm}cm
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!capturedPhoto ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="text-gray-400 text-center mb-4">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-lg">Capture or select a photo</p>
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg"
            >
              📸 Take/Select Photo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Arrow Controls */}
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-[#D4A574]/50 rounded-2xl p-4 space-y-3">
              {/* Draw Mode Toggle */}
              <button
                onClick={() => setDrawMode(!drawMode)}
                className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                  drawMode
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300'
                }`}
              >
                {drawMode ? '✏️ Draw Mode ON - Tap to draw arrows' : '👁️ View Mode - Tap to enable drawing'}
              </button>
              
              {/* Color Picker */}
              {drawMode && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[#D4A574] font-bold">Arrow Color:</span>
                  {['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFFFD2'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setArrowColor(color)}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        arrowColor === color ? 'border-white scale-110' : 'border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Photo with annotations - LARGE AND PROMINENT */}
            <div className="relative border-4 border-[#D4A574] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl">
              <img 
                ref={imageRef}
                src={capturedPhoto}
                alt="Captured photo"
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                style={{ minHeight: '500px' }}
              />
              <div
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="absolute inset-0 cursor-crosshair"
                style={{ zIndex: 20 }}
              >
                {/* SVG Overlay for clean arrow rendering */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 25 }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <marker
                      id="arrowhead-gold"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3, 0 6" fill="#FFD700" />
                    </marker>
                    <marker
                      id="arrowhead-red"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3, 0 6" fill="#FF6B6B" />
                    </marker>
                  </defs>
                  
                  {/* Dynamic arrowhead markers for each color */}
                  {[...new Set(measurements.map(m => m.color || '#FFD700'))].map((color) => (
                    <marker
                      key={`arrow-${color}`}
                      id={`arrowhead-${color.replace('#', '')}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3, 0 6" fill={color} />
                    </marker>
                  ))}
                  
                  {/* Saved arrows */}
                  {measurements.map((m, index) => (
                    <line
                      key={index}
                      x1={m.x1}
                      y1={m.y1}
                      x2={m.x2}
                      y2={m.y2}
                      stroke={m.color || '#FFD700'}
                      strokeWidth="0.5"
                      markerEnd={`url(#arrowhead-${(m.color || '#FFD700').replace('#', '')})`}
                    />
                  ))}
                  
                  {/* Drawing arrow */}
                  {drawingArrow && (
                    <line
                      x1={drawingArrow.x1}
                      y1={drawingArrow.y1}
                      x2={drawingArrow.x2}
                      y2={drawingArrow.y2}
                      stroke={drawingArrow.color}
                      strokeWidth="0.5"
                      markerEnd="url(#arrowhead-red)"
                      opacity="0.8"
                    />
                  )}
                </svg>
                
                {/* Measurement text labels */}
                {measurements.map((m, index) => (
                  <div
                    key={index}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${(m.x1 + m.x2) / 2}%`,
                      top: `${(m.y1 + m.y2) / 2 - 5}%`,
                      transform: 'translate(-50%, -100%)',
                      zIndex: 30
                    }}
                  >
                    <div 
                      className="bg-black bg-opacity-95 px-4 py-2 rounded-xl text-lg md:text-xl font-bold whitespace-nowrap shadow-2xl border-2"
                      style={{ 
                        color: m.color || '#FFD700',
                        borderColor: m.color || '#FFD700',
                        boxShadow: `0 0 20px ${m.color || '#FFD700'}40`
                      }}
                    >
                      {m.text}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMeasurement(index);
                        }}
                        className="ml-3 text-red-400 hover:text-red-300 font-bold text-xl"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Measurement */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <label className="text-white text-sm font-bold mb-2 block">
                📏 Add Measurement (click on photo to place)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={measurementText}
                  onChange={(e) => setMeasurementText(e.target.value)}
                  placeholder="e.g., 8'6'' or 102 inches"
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded"
                />
                <button
                  onClick={() => setMeasurementText('')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Clear
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                💡 Tip: Enter measurement, then click on the photo to place it
              </p>
            </div>

            {/* Notes */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <label className="text-white text-sm font-bold mb-2 block">
                📝 Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this photo..."
                className="w-full bg-gray-700 text-white px-4 py-2 rounded h-24 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCapturedPhoto(null);
                  setMeasurements([]);
                  setNotes('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-bold"
              >
                🔄 Retake
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold"
              >
                {uploading ? '⏳ Saving...' : '✅ Save Photo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}