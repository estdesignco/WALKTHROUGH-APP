import React, { useState } from 'react';

const CanvaSyncButton = ({ projectId, roomId, roomName, items, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  const uploadToCanva = async () => {
    setUploading(true);
    setProgress(0);

    try {
      // Get all items with images from this room
      const itemsWithImages = items.filter(item => item.image_url || item.product_image);
      
      if (itemsWithImages.length === 0) {
        alert('No items with images found in this room.');
        setUploading(false);
        return;
      }

      const totalItems = itemsWithImages.length;
      let uploaded = 0;

      // Upload each item's image to Canva
      for (const item of itemsWithImages) {
        const response = await fetch(`${BACKEND_URL}/api/canva/upload-checklist-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            room_id: roomId,
            room_name: roomName,
            item_id: item.id,
            item_name: item.name,
            item_link: item.link || '',
            image_url: item.image_url || item.product_image
          })
        });

        if (response.ok) {
          uploaded++;
          setProgress(Math.round((uploaded / totalItems) * 100));
        } else {
          console.error(`Failed to upload ${item.name}`);
        }
      }

      alert(`Successfully uploaded ${uploaded} out of ${totalItems} items to Canva!`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error uploading to Canva:', error);
      alert('Failed to upload to Canva. Please check your connection and try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <button
      onClick={uploadToCanva}
      disabled={uploading}
      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
      title="Upload room items to Canva"
    >
      {uploading ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          <span>{progress}%</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.7 8.2c0-1.1.9-2 2-2h5.6c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2H9.7c-1.1 0-2-.9-2-2V8.2zm10.6 0c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2zM1.3 8.2c0-1.1.9-2 2-2h.4c1.1 0 2 .9 2 2v7.6c0 1.1-.9 2-2 2h-.4c-1.1 0-2-.9-2-2V8.2z"/>
          </svg>
          <span>→ Canva</span>
        </>
      )}
    </button>
  );
};

export default CanvaSyncButton;