import React, { useState, useRef } from 'react';
import axios from 'axios';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobilePhotoCapture({ projectId, roomId, onPhotoAdded, onClose }) {
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [measurementText, setMeasurementText] = useState('');
  const [leicaConnected, setLeicaConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastMeasurement, setLastMeasurement] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

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
      let message = '❌ Web Bluetooth NOT SUPPORTED\n\n';
      
      if (browserInfo.isChromeOnIOS) {
        message += '⚠️ CHROME ON iPAD USES SAFARI ENGINE\n\n';
        message += 'Web Bluetooth does NOT work on iOS/iPadOS\n';
        message += '(This is an Apple limitation, not a Chrome issue)\n\n';
        message += '✅ TO USE LEICA D5:\n';
        message += '• Chrome on Android tablet\n';
        message += '• Chrome on Windows/Mac DESKTOP\n\n';
        message += '❌ Will NOT work on any iPad browser';
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
      
      // Check if already paired for faster reconnection
      if (leicaManager.isPaired()) {
        console.log('📱 Device previously paired, reconnecting...');
      }
      
      const result = await leicaManager.connect();
      
      setLeicaConnected(true);
      alert(`✅ Connected to ${result.deviceName}!\n\nPress the button on your Leica to take a measurement.`);

      // Set up measurement callback
      leicaManager.setOnMeasurement((measurement) => {
        console.log('📏 Measurement received:', measurement);
        setLastMeasurement(measurement);
        setMeasurementText(measurement.feetInches);
      });

    } catch (error) {
      console.error('Connection error:', error);
      
      let errorMsg = `❌ Failed to connect:\n${error.message}\n\n`;
      
      if (error.message.includes('timeout')) {
        errorMsg += `⏱ CONNECTION TIMEOUT\n\n🔧 Quick Fixes:\n1. Turn Leica D5 OFF → Wait 3 seconds → Turn ON\n2. Move device closer (< 3 feet)\n3. Close other apps using Bluetooth\n4. Try again (may take 30-60 seconds first time)\n\n💡 Tip: Once paired, reconnection is much faster!`;
      } else if (error.message.includes('User cancelled')) {
        errorMsg = '⚠️ Connection cancelled by user';
      } else {
        errorMsg += `📋 Checklist:\n✓ Leica D5 powered ON\n✓ Bluetooth enabled on phone/tablet\n✓ Device in pairing mode (check manual)\n✓ Not connected to another device\n✓ Within 10 feet range\n\n🔄 If issues persist, restart both devices`;
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

  const handleCanvasClick = (event) => {
    if (!capturedPhoto) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (measurementText.trim()) {
      setMeasurements([
        ...measurements,
        { x, y, text: measurementText }
      ]);
      setMeasurementText('');
    }
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

      // Draw measurements
      measurements.forEach((m) => {
        const x = (m.x / 100) * canvas.width;
        const y = (m.y / 100) * canvas.height;

        // Draw arrow
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw text background
        ctx.font = 'bold 24px Arial';
        const textWidth = ctx.measureText(m.text).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x + 15, y - 20, textWidth + 10, 30);

        // Draw text
        ctx.fillStyle = '#FFD700';
        ctx.fillText(m.text, x + 20, y);
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
            {/* Photo with annotations */}
            <div className="relative border border-gray-700 rounded-lg overflow-hidden">
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="relative cursor-crosshair"
                style={{
                  backgroundImage: `url(${capturedPhoto})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  minHeight: '400px',
                  width: '100%'
                }}
              >
                {/* Measurement markers */}
                {measurements.map((m, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="relative">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"></div>
                      <div className="absolute left-6 top-0 bg-black bg-opacity-80 text-yellow-400 px-2 py-1 rounded text-sm whitespace-nowrap">
                        {m.text}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMeasurement(index);
                          }}
                          className="ml-2 text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
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