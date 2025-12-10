import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const RoomRenderingStudio = () => {
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
          content: "Great! I've loaded your room photo. Now just tell me what you want to do!\n\nExamples:\n• \"Remove all furniture and show empty room\"\n• \"Change floor to white oak hardwood\"\n• \"Add a cream sectional facing the fireplace\"\n• \"Paint walls Benjamin Moore Simply White\"\n• \"Add floor-length navy velvet drapes\"\n• \"Transform into modern minimalist with new floors, paint & furniture\"\n\nJust describe what you want!"
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
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#D4A574] mb-2">🎨 Room Rendering Studio</h1>
          <p className="text-[#D4C5A9]">Upload a photo and just tell me what you want!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-4">
              <h3 className="text-[#D4A574] font-bold mb-3">📸 Your Room Photo</h3>
              
              {roomImage ? (
                <div className="relative">
                  <img src={roomImage} alt="Room" className="w-full rounded-lg" />
                  <button
                    onClick={() => { setRoomImage(null); setRoomImageBase64(null); setMessages([]); setRenderedImages([]); }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D4A574]/50 rounded-lg p-8 text-center cursor-pointer hover:border-[#D4A574]"
                >
                  <p className="text-[#D4C5A9] text-lg mb-2">📸 Click to upload</p>
                  <p className="text-gray-500 text-sm">JPEG, PNG</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {roomImage && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-4">
                <h3 className="text-[#D4A574] font-bold mb-3">⚡ Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((action, idx) => (
                    <button key={idx} onClick={() => setInput(action)} disabled={loading}
                      className="w-full text-left bg-[#0F172A] text-[#D4C5A9] p-2 rounded-lg hover:bg-[#2E3B4B] text-sm border border-[#D4A574]/20 disabled:opacity-50">
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {renderedImages.length > 0 && (
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-4">
                <h3 className="text-[#D4A574] font-bold mb-3">🖼️ Renders ({renderedImages.length})</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {renderedImages.map((render, idx) => (
                    <div key={idx} className="bg-[#0F172A] p-2 rounded-lg">
                      <img src={render.image} alt={`Render ${idx + 1}`} className="w-full rounded mb-2" />
                      <p className="text-gray-400 text-xs truncate">{render.prompt}</p>
                      <a href={render.image} download={`render-${idx + 1}.png`} className="text-[#D4A574] text-xs hover:underline">📥 Download</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 h-[700px] flex flex-col">
              <div className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] px-4 py-3 rounded-t-lg">
                <h3 className="font-bold text-black">🤖 Room Design AI - Just tell me what you want!</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!roomImage && (
                  <div className="text-center py-12">
                    <p className="text-[#D4A574] text-xl mb-4">👈 Upload a room photo to start!</p>
                    <p className="text-gray-400">Then tell me what changes you want.</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#D4A574] text-black' : 'bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30'} p-4 rounded-lg`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.image && (
                        <div className="mt-3">
                          <img src={msg.image} alt="Rendered" className="w-full rounded-lg border-2 border-[#D4A574]" />
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
                    <div className="bg-[#0F172A] text-[#D4C5A9] p-4 rounded-lg border border-[#D4A574]/30">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin w-5 h-5 border-2 border-[#D4A574] border-t-transparent rounded-full"></div>
                        <span>Rendering... 30-60 seconds...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-[#D4A574]/30">
                <div className="flex gap-2">
                  <input
                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={roomImage ? "Tell me what to do..." : "Upload a photo first..."}
                    disabled={!roomImage || loading}
                    className="flex-1 bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A574] disabled:opacity-50"
                  />
                  <button onClick={sendMessage} disabled={!roomImage || loading || !input.trim()}
                    className="bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black font-bold px-6 py-3 rounded-lg disabled:opacity-50">
                    {loading ? '⏳' : '✨ Render'}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">Just describe: "Change floor to marble", "Add velvet sofa", "Make it minimalist"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomRenderingStudio;
