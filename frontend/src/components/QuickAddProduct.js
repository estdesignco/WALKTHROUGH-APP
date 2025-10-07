import React, { useState } from 'react';

const QuickAddProduct = ({ projectId, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [rooms, setRooms] = useState([]);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const loadRooms = async () => {
    if (!projectId) {
      alert('No project ID provided!');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}?sheet_type=checklist`);
      if (!res.ok) throw new Error('Failed to load project');
      
      const data = await res.json();
      setRooms(data.rooms || []);
      setProjectLoaded(true);
    } catch (e) {
      alert('Error loading project: ' + e.message);
    }
  };

  const addProduct = async () => {
    if (!url.trim()) {
      alert('Please enter a product URL!');
      return;
    }

    if (!selectedRoom) {
      alert('Please select a room first!');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Scrape product
      console.log('🔍 Scraping:', url);
      const scrapeRes = await fetch(`${BACKEND_URL}/api/scrape-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url.trim(),
          auto_clip_to_houzz: true
        })
      });

      if (!scrapeRes.ok) {
        throw new Error('Failed to scrape product');
      }

      const productData = await scrapeRes.json();
      console.log('✅ Scraped:', productData.name);

      // Step 2: Find room and subcategory
      const room = rooms.find(r => r.id === selectedRoom);
      if (!room) {
        throw new Error('Room not found');
      }

      let subcategoryId = null;
      
      // Try to find matching category
      const productName = productData.name.toLowerCase();
      const categoryKeywords = {
        'Lighting': ['light', 'lamp', 'chandelier', 'sconce', 'pendant', 'fixture'],
        'Furniture': ['chair', 'sofa', 'table', 'desk', 'bed', 'dresser', 'cabinet'],
        'Decor': ['pillow', 'rug', 'art', 'vase', 'mirror', 'frame', 'plant']
      };

      for (const cat of room.categories || []) {
        const keywords = categoryKeywords[cat.name] || [];
        if (keywords.some(kw => productName.includes(kw))) {
          if (cat.subcategories && cat.subcategories.length > 0) {
            subcategoryId = cat.subcategories[0].id;
            console.log('✅ Matched category:', cat.name);
            break;
          }
        }
      }

      // Fallback to first available subcategory
      if (!subcategoryId && room.categories && room.categories.length > 0) {
        for (const cat of room.categories) {
          if (cat.subcategories && cat.subcategories.length > 0) {
            subcategoryId = cat.subcategories[0].id;
            break;
          }
        }
      }

      if (!subcategoryId) {
        throw new Error('No category found in this room');
      }

      // Step 3: Add to checklist
      console.log('📝 Adding to checklist...');
      const addRes = await fetch(`${BACKEND_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          subcategory_id: subcategoryId,
          status: '',
          quantity: 1
        })
      });

      if (!addRes.ok) {
        throw new Error('Failed to add to checklist');
      }

      const addedItem = await addRes.json();
      console.log('✅ Added to checklist:', addedItem);

      // Success!
      alert(`✅ SUCCESS!\n\n"${productData.name}"\n\nAdded to:\n→ Main checklist\n→ Room: ${room.name}\n\n💡 Now manually add the image to your Canva board with the link attached!`);
      
      setUrl('');
      
      if (onSuccess) {
        onSuccess(addedItem);
      }

    } catch (e) {
      console.error('❌ Error:', e);
      alert('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      padding: '30px',
      borderRadius: '16px',
      border: '3px solid #B49B7E',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
    }}>
      <h2 style={{
        color: '#D4A574',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        ✨ Quick Add Product
      </h2>

      {!projectLoaded ? (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={loadRooms}
            style={{
              background: 'linear-gradient(135deg, #D4A574, #B49B7E)',
              color: '#000',
              padding: '14px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Load Project Rooms
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#D4A574',
              fontWeight: 'bold',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Select Room:
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '2px solid #D4A574',
                borderRadius: '8px',
                color: '#D4A574',
                fontSize: '14px'
              }}
            >
              <option value="">-- Select a room --</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#D4A574',
              fontWeight: 'bold',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Product URL:
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Houzz, West Elm, CB2, etc. URL here..."
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '2px solid #D4A574',
                borderRadius: '8px',
                color: '#D4A574',
                fontSize: '14px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && url.trim() && selectedRoom) {
                  addProduct();
                }
              }}
            />
          </div>

          <button
            onClick={addProduct}
            disabled={loading || !url.trim() || !selectedRoom}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#666' : 'linear-gradient(135deg, #9ACD32, #7FCD32)',
              color: '#000',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              opacity: (loading || !url.trim() || !selectedRoom) ? 0.5 : 1
            }}
          >
            {loading ? '⏳ Adding...' : '🚀 Add to Checklist'}
          </button>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(154, 205, 50, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(154, 205, 50, 0.3)'
          }}>
            <p style={{ color: '#9ACD32', fontSize: '13px', margin: 0 }}>
              💡 <strong>Tip:</strong> After adding, manually place the product image on your Canva board with the link attached for visual reference!
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickAddProduct;