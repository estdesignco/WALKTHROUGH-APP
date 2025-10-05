import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MobilePhotoCapture from './MobilePhotoCapture';
import { leicaManager } from '../utils/leicaD5Manager';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MobilePhotoManagement({ projectId, onClose }) {
  const [project, setProject] = useState(null);
  const [roomPhotos, setRoomPhotos] = useState({});
  const [leicaConnected, setLeicaConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
    loadAllPhotos();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadAllPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}?sheet_type=walkthrough`);
      const rooms = response.data.rooms || [];
      
      const photosData = {};
      for (const room of rooms) {
        try {
          const photoResponse = await axios.get(`${API_URL}/photos/by-room/${projectId}/${room.id}`);
          photosData[room.id] = photoResponse.data.photos || [];
        } catch (err) {
          photosData[room.id] = [];
        }
      }
      
      setRoomPhotos(photosData);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

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
      alert(`✅ Connected to ${result.deviceName}!\n\nReady to take measurements.`);
    } catch (error) {
      let errorMsg = `❌ Failed to connect:\n${error.message}\n\n`;
      
      if (error.message.includes('timeout')) {
        errorMsg += `⏱ CONNECTION TIMEOUT\n\n🔧 Quick Fixes:\n1. Turn Leica D5 OFF → Wait 3 seconds → Turn ON\n2. Move device closer (< 3 feet)\n3. Close other apps using Bluetooth\n4. Try again (may take 30-60 seconds first time)\n\n💡 Tip: Once paired, reconnection is much faster!`;
      } else if (error.message.includes('User cancelled')) {
        errorMsg = '⚠️ Connection cancelled by user';
      } else {
        errorMsg += `📋 Checklist:\n✓ Leica D5 powered ON\n✓ Bluetooth enabled\n✓ Device in pairing mode\n✓ Not connected to another device\n✓ Within 10 feet range`;
      }
      
      alert(errorMsg);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectLeica = async () => {
    await leicaManager.disconnect();
    setLeicaConnected(false);
    alert('✅ Disconnected from Leica D5');
  };

  const totalPhotos = Object.values(roomPhotos).reduce((sum, photos) => sum + photos.length, 0);
  const totalMeasurements = Object.values(roomPhotos).reduce((sum, photos) => 
    sum + photos.filter(p => p.metadata?.measurements?.length > 0).length, 0
  );
  const roomsPhotographed = Object.keys(roomPhotos).filter(roomId => roomPhotos[roomId]?.length > 0).length;
  const totalRooms = project?.rooms?.length || 0;

  if (showPhotoCapture && selectedRoom) {
    return (
      <MobilePhotoCapture
        projectId={projectId}
        roomId={selectedRoom.id}
        onPhotoAdded={() => {
          loadAllPhotos();
          setShowPhotoCapture(false);
          setSelectedRoom(null);
        }}
        onClose={() => {
          setShowPhotoCapture(false);
          setSelectedRoom(null);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-auto">
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
      
      {/* Header - iPad Optimized */}
      <div className="bg-gray-900 p-4 md:p-6 lg:p-8 border-b border-[#D4A574]/60 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#D4A574]">📸 PHOTO MANAGEMENT</h2>
        <button
          onClick={onClose}
          className="text-white text-3xl md:text-4xl hover:text-red-400 p-2"
        >
          ✕
        </button>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        {/* Stats Grid - iPad Optimized */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 max-w-5xl mx-auto">
          {/* Photos Captured */}
          <div className="p-5 md:p-6 lg:p-8 border-2 border-[#D4A574]/50 rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl">
            <div className="text-[#D4A574] text-sm md:text-base lg:text-lg mb-2">Photos Captured</div>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#D4C5A9]">
              {totalPhotos}
            </div>
          </div>

          {/* Measurements Added */}
          <div className="p-5 md:p-6 lg:p-8 border-2 border-[#D4A574]/50 rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl">
            <div className="text-[#D4A574] text-sm md:text-base lg:text-lg mb-2">Measurements Added</div>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#D4C5A9]">
              {totalMeasurements}
            </div>
          </div>

          {/* Rooms Photographed */}
          <div className="p-5 md:p-6 lg:p-8 border-2 border-[#D4A574]/50 rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl">
            <div className="text-[#D4A574] text-sm md:text-base lg:text-lg mb-2">Rooms Photographed</div>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#D4C5A9]">
              {roomsPhotographed} / {totalRooms}
            </div>
          </div>

          {/* Leica D5 Status */}
          <div className="p-5 md:p-6 lg:p-8 border-2 border-[#D4A574]/50 rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl">
            <div className="text-[#D4A574] text-sm md:text-base lg:text-lg mb-2">Leica D5 Status</div>
            <div className={`text-xl md:text-2xl lg:text-3xl font-bold mb-3 ${leicaConnected ? 'text-green-400' : 'text-red-400'}`}>
              {leicaConnected ? '✓ Connected' : '✗ Not Connected'}
            </div>
            <button
              onClick={leicaConnected ? disconnectLeica : connectLeica}
              disabled={connecting}
              className="mt-3 px-5 md:px-6 py-3 md:py-4 bg-[#D4A574] hover:bg-[#C49564] disabled:bg-gray-600 text-black rounded-xl md:rounded-2xl text-sm md:text-base lg:text-lg font-bold w-full shadow-lg"
            >
              {connecting ? 'Connecting...' : (leicaConnected ? 'Disconnect' : 'Connect Leica D5')}
            </button>
          </div>
        </div>

        {/* Photos by Room - iPad Optimized */}
        <div className="border-t-2 border-[#D4A574]/30 pt-6 md:pt-8 max-w-5xl mx-auto">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#D4A574] mb-5 md:mb-6">📁 Photos by Room</h3>
          
          {loading ? (
            <div className="text-center text-[#D4A574] text-xl md:text-2xl py-12">Loading photos...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {project?.rooms?.map(room => (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowPhotoCapture(true);
                  }}
                  className="p-6 md:p-8 border-2 border-[#D4A574]/50 rounded-2xl md:rounded-3xl hover:bg-[#D4A574]/20 hover:border-[#D4A574] transition-all bg-gradient-to-br from-gray-900 to-black shadow-xl transform hover:scale-105"
                >
                  <div className="text-5xl md:text-6xl mb-3">📁</div>
                  <div className="text-base md:text-lg lg:text-xl text-[#D4C5A9] font-bold truncate mb-2">{room.name}</div>
                  <div className="text-sm md:text-base text-[#D4A574] font-medium">
                    {roomPhotos[room.id]?.length || 0} photos
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}