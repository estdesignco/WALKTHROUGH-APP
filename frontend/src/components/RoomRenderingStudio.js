import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const RoomRenderingStudio = () => {
  const navigate = useNavigate();
  const [roomImage, setRoomImage] = useState(null);
  const [roomImageBase64, setRoomImageBase64] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [renderedImages, setRenderedImages] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRoomImage(e.target.result);
        setRoomImageBase64(e.target.result.split(',')[1]);
        setMessages([{
          role: 'assistant',
          content: "📸 Photo loaded! Now tell me EXACTLY what you want.\n\nI'll build YOUR vision - no AI suggestions, just what YOU describe.\n\nExamples:\n• \"Remove all furniture\"\n• \"Change floor to white oak hardwood\"\n• \"Add a cream sectional sofa facing the window\"\n• \"Paint walls Sherwin Williams Alabaster\"\n• \"Add navy velvet drapes floor to ceiling\"\n\nBe specific - I'll render exactly what you say!"
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !roomImageBase64) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ai/room-studio/chat-render`, {
        room_image_base64: roomImageBase64,
        user_request: userMessage,
        conversation_history: messages.map(m => ({ role: m.role, content: m.content }))
      }, { timeout: 180000 });

      if (response.data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message,
          image: response.data.rendered_image_base64 ? `data:image/png;base64,${response.data.rendered_image_base64}` : null
        }]);

        if (response.data.rendered_image_base64) {
          setRenderedImages(prev => [...prev, {
            image: `data:image/png;base64,${response.data.rendered_image_base64}`,
            prompt: userMessage,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.response?.data?.detail || error.message}. Please try again.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    "Remove all furniture - show empty room",
    "Change floor to wide plank white oak hardwood",
    "Paint walls Benjamin Moore Simply White",
    "Add large cream boucle sectional sofa",
    "Add floor-length ivory linen drapes",
    "Add crystal chandelier",
    "Make this modern minimalist",
    "Add cozy lighting and warm textiles"
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#141214' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#C39B77', border: '1px solid #C39B77' }}
          >
            ← Back
          </button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#E6D4A8' }}>🎨 Room Rendering Studio</h1>
            <p style={{ color: '#A0A0A0' }}>Upload a photo and just tell me what you want!</p>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #C39B77' }}>
              <h3 className="font-bold mb-3" style={{ color: '#E6D4A8' }}>📸 Your Room Photo</h3>
              
              {roomImage ? (
                <div className="relative">
                  <img src={roomImage} alt="Room" className="w-full rounded-lg" />
                  <button
                    onClick={() => { setRoomImage(null); setRoomImageBase64(null); setMessages([]); setRenderedImages([]); }}
                    className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
                  style={{ borderColor: '#C39B77' }}
                >
                  <p className="text-lg mb-2" style={{ color: '#E6D4A8' }}>📸 Click to upload</p>
                  <p style={{ color: '#A0A0A0' }} className="text-sm">JPEG, PNG</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {roomImage && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #C39B77' }}>
                <h3 className="font-bold mb-3" style={{ color: '#E6D4A8' }}>⚡ Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((action, idx) => (
                    <button key={idx} onClick={() => setInput(action)} disabled={loading}
                      className="w-full text-left p-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#252525', color: '#E6D4A8', border: '1px solid #3a3a3a' }}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {renderedImages.length > 0 && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #C39B77' }}>
                <h3 className="font-bold mb-3" style={{ color: '#E6D4A8' }}>🖼️ Renders ({renderedImages.length})</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {renderedImages.map((render, idx) => (
                    <div key={idx} className="p-2 rounded-lg" style={{ backgroundColor: '#252525' }}>
                      <img src={render.image} alt={`Render ${idx + 1}`} className="w-full rounded mb-2" />
                      <p className="text-xs truncate" style={{ color: '#A0A0A0' }}>{render.prompt}</p>
                      <a href={render.image} download={`render-${idx + 1}.png`} className="text-xs hover:underline" style={{ color: '#C39B77' }}>📥 Download</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg h-[700px] flex flex-col" style={{ backgroundColor: '#1a1a1a', border: '1px solid #C39B77' }}>
              {/* Chat Header */}
              <div className="px-4 py-3 rounded-t-lg" style={{ backgroundColor: '#C39B77' }}>
                <h3 className="font-bold text-black">🤖 Room Design AI - Just tell me what you want!</h3>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!roomImage && (
                  <div className="text-center py-12">
                    <p className="text-xl mb-4" style={{ color: '#E6D4A8' }}>👈 Upload a room photo to start!</p>
                    <p style={{ color: '#A0A0A0' }}>Then tell me what changes you want.</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-lg`} style={{
                      backgroundColor: msg.role === 'user' ? '#C39B77' : '#252525',
                      color: msg.role === 'user' ? '#000' : '#E6D4A8',
                      border: msg.role === 'user' ? 'none' : '1px solid #3a3a3a'
                    }}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.image && (
                        <div className="mt-3">
                          <img src={msg.image} alt="Rendered" className="w-full rounded-lg" style={{ border: '2px solid #C39B77' }} />
                          <a href={msg.image} download="room-render.png" className="inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                            📥 Download Render
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#252525', color: '#E6D4A8', border: '1px solid #3a3a3a' }}>
                      <div className="flex items-center gap-3">
                        <div className="animate-spin w-5 h-5 border-2 rounded-full" style={{ borderColor: '#C39B77', borderTopColor: 'transparent' }}></div>
                        <span>Rendering... 30-60 seconds...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4" style={{ borderTop: '1px solid #3a3a3a' }}>
                <div className="flex gap-2">
                  <input
                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={roomImage ? "Tell me what to do..." : "Upload a photo first..."}
                    disabled={!roomImage || loading}
                    className="flex-1 rounded-lg px-4 py-3 focus:outline-none disabled:opacity-50"
                    style={{ backgroundColor: '#252525', color: '#E6D4A8', border: '1px solid #3a3a3a' }}
                  />
                  <button onClick={sendMessage} disabled={!roomImage || loading || !input.trim()}
                    className="font-bold px-6 py-3 rounded-lg disabled:opacity-50"
                    style={{ backgroundColor: '#C39B77', color: '#000' }}>
                    {loading ? '⏳' : '✨ Render'}
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: '#A0A0A0' }}>Just describe: "Change floor to marble", "Add velvet sofa", "Make it minimalist"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomRenderingStudio;
