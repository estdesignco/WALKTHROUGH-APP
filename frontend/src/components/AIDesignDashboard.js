import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// Brand colors
const COLORS = {
  bg: '#141214',
  bgCard: '#1a1a1a',
  bgInput: '#252525',
  textPrimary: '#E6D4A8',
  textSecondary: '#A0A0A0',
  accent: '#C39B77',
  border: '#3a3a3a'
};

// AI Chat Assistant Component
const AIChatAssistant = ({ projectContext }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`chat-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ai/chat`, {
        message: userMessage,
        session_id: sessionId,
        project_context: projectContext
      });

      if (response.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] rounded-lg" style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.accent}` }}>
      <div className="px-4 py-3 rounded-t-lg" style={{ backgroundColor: COLORS.accent }}>
        <h3 className="font-bold text-black">🤖 Design AI Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            <p className="text-lg mb-2">👋 Hi! I'm your Design AI Assistant</p>
            <p className="text-sm">Ask me about room layouts, color palettes, furniture recommendations, or budget planning!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-[#D4A574] text-black' 
                : 'bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0F172A] text-[#D4C5A9] p-3 rounded-lg border border-[#D4A574]/30">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-[#D4A574]/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about design, colors, furniture..."
            className="flex-1 bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-4 py-2 focus:outline-none focus:border-[#D4A574]"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-[#D4A574] hover:bg-[#B49B7E] text-black font-bold px-6 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Room Visualizer Component
const RoomVisualizer = () => {
  const [formData, setFormData] = useState({
    room_type: 'living room',
    style: 'modern',
    color_palette: '',
    features: '',
    dimensions: '',
    additional_notes: ''
  });
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        ...formData,
        color_palette: formData.color_palette ? formData.color_palette.split(',').map(c => c.trim()) : null,
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : null
      };
      
      const response = await axios.post(`${API_URL}/ai/render-room`, payload, { timeout: 120000 });
      
      if (response.data.success) {
        setGeneratedImage(response.data.image_base64);
      }
    } catch (error) {
      console.error('Render error:', error);
      setError('Failed to generate room visualization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
      <h3 className="text-xl font-bold text-[#D4A574] mb-4">🎨 AI Room Visualizer</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Room Type</label>
          <select
            value={formData.room_type}
            onChange={(e) => setFormData({...formData, room_type: e.target.value})}
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          >
            <option value="living room">Living Room</option>
            <option value="bedroom">Bedroom</option>
            <option value="kitchen">Kitchen</option>
            <option value="dining room">Dining Room</option>
            <option value="bathroom">Bathroom</option>
            <option value="home office">Home Office</option>
            <option value="nursery">Nursery</option>
            <option value="outdoor patio">Outdoor Patio</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Style</label>
          <select
            value={formData.style}
            onChange={(e) => setFormData({...formData, style: e.target.value})}
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          >
            <option value="modern">Modern</option>
            <option value="traditional">Traditional</option>
            <option value="minimalist">Minimalist</option>
            <option value="industrial">Industrial</option>
            <option value="bohemian">Bohemian</option>
            <option value="coastal">Coastal</option>
            <option value="farmhouse">Farmhouse</option>
            <option value="mid-century modern">Mid-Century Modern</option>
            <option value="scandinavian">Scandinavian</option>
            <option value="contemporary">Contemporary</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Color Palette (comma-separated)</label>
          <input
            type="text"
            value={formData.color_palette}
            onChange={(e) => setFormData({...formData, color_palette: e.target.value})}
            placeholder="e.g., warm neutrals, navy blue, gold accents"
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Features (comma-separated)</label>
          <input
            type="text"
            value={formData.features}
            onChange={(e) => setFormData({...formData, features: e.target.value})}
            placeholder="e.g., fireplace, large windows, vaulted ceiling"
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Dimensions</label>
          <input
            type="text"
            value={formData.dimensions}
            onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
            placeholder="e.g., 20x15 feet"
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Additional Notes</label>
          <input
            type="text"
            value={formData.additional_notes}
            onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
            placeholder="Any specific requests..."
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] hover:from-[#B49B7E] hover:to-[#A08B6F] text-black font-bold py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? '🎨 Generating Room Visualization...' : '✨ Generate Room Visualization'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      
      {generatedImage && (
        <div className="mt-4">
          <p className="text-[#D4C5A9] text-sm mb-2">Generated Visualization:</p>
          <img 
            src={`data:image/png;base64,${generatedImage}`} 
            alt="Generated Room" 
            className="w-full rounded-lg border border-[#D4A574]/30"
          />
          <div className="mt-2 flex gap-2">
            <a 
              href={`data:image/png;base64,${generatedImage}`}
              download="room-visualization.png"
              className="bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 px-4 py-2 rounded-lg hover:bg-[#1E293B]"
            >
              📥 Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Style Analyzer Component
const StyleAnalyzer = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        setImage(base64);
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeStyle = async () => {
    if (!image) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/analyze-style`, {
        image_base64: image,
        analyze_colors: true,
        analyze_furniture: true,
        analyze_lighting: true
      }, { timeout: 60000 });
      
      if (response.data.success) {
        setAnalysis(response.data.style_analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
      <h3 className="text-xl font-bold text-[#D4A574] mb-4">🔍 AI Style Analyzer</h3>
      <p className="text-[#D4C5A9] text-sm mb-4">Upload an inspiration image to extract the style profile</p>
      
      <div className="border-2 border-dashed border-[#D4A574]/30 rounded-lg p-6 text-center mb-4">
        {imagePreview ? (
          <div>
            <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-2" />
            <button 
              onClick={() => { setImage(null); setImagePreview(null); setAnalysis(null); }}
              className="text-red-400 text-sm hover:underline"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
            <p className="text-[#D4C5A9] mb-2">📸 Click to upload inspiration image</p>
            <p className="text-gray-500 text-sm">JPEG, PNG, WEBP supported</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
      
      {image && (
        <button
          onClick={analyzeStyle}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? '🔍 Analyzing Style...' : '✨ Analyze Style'}
        </button>
      )}
      
      {analysis && (
        <div className="mt-4 space-y-4">
          {analysis.primary_style && (
            <div className="bg-[#0F172A] p-4 rounded-lg">
              <h4 className="text-[#D4A574] font-bold mb-2">Primary Style</h4>
              <p className="text-[#D4C5A9] text-lg">{analysis.primary_style}</p>
              {analysis.secondary_styles && (
                <p className="text-gray-400 text-sm mt-1">Also: {analysis.secondary_styles.join(', ')}</p>
              )}
            </div>
          )}
          
          {analysis.color_palette && (
            <div className="bg-[#0F172A] p-4 rounded-lg">
              <h4 className="text-[#D4A574] font-bold mb-2">Color Palette</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.color_palette.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#1E293B] px-3 py-1 rounded-full">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20" 
                      style={{ backgroundColor: color.hex || color }}
                    />
                    <span className="text-[#D4C5A9] text-sm">{color.name || color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {analysis.mood_keywords && (
            <div className="bg-[#0F172A] p-4 rounded-lg">
              <h4 className="text-[#D4A574] font-bold mb-2">Mood</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.mood_keywords.map((keyword, idx) => (
                  <span key={idx} className="bg-[#D4A574]/20 text-[#D4A574] px-3 py-1 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {analysis.designer_tips && (
            <div className="bg-[#0F172A] p-4 rounded-lg">
              <h4 className="text-[#D4A574] font-bold mb-2">Designer Tips</h4>
              <ul className="space-y-1">
                {analysis.designer_tips.map((tip, idx) => (
                  <li key={idx} className="text-[#D4C5A9] text-sm">• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Budget Optimizer Component
const BudgetOptimizer = ({ items = [], onOptimize }) => {
  const [targetBudget, setTargetBudget] = useState('');
  const [priorityCategories, setPriorityCategories] = useState('');
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleOptimize = async () => {
    if (!targetBudget) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/optimize-budget`, {
        items,
        target_budget: parseFloat(targetBudget),
        priority_categories: priorityCategories ? priorityCategories.split(',').map(c => c.trim()) : null
      }, { timeout: 60000 });
      
      if (response.data.success) {
        setOptimization(response.data);
        if (onOptimize) onOptimize(response.data);
      }
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
      <h3 className="text-xl font-bold text-[#D4A574] mb-4">💰 AI Budget Optimizer</h3>
      
      <div className="mb-4 p-4 bg-[#0F172A] rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-[#D4C5A9]">Current Total:</span>
          <span className="text-2xl font-bold text-[#D4A574]">${currentTotal.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Target Budget</label>
          <input
            type="number"
            value={targetBudget}
            onChange={(e) => setTargetBudget(e.target.value)}
            placeholder="Enter target budget"
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-[#D4C5A9] text-sm mb-1">Priority Categories</label>
          <input
            type="text"
            value={priorityCategories}
            onChange={(e) => setPriorityCategories(e.target.value)}
            placeholder="e.g., Lighting, Seating"
            className="w-full bg-[#0F172A] text-[#D4C5A9] border border-[#D4A574]/30 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      
      <button
        onClick={handleOptimize}
        disabled={loading || !targetBudget || items.length === 0}
        className="w-full bg-gradient-to-r from-[#D4A574] to-[#B49B7E] text-black font-bold py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? '💡 Optimizing...' : '✨ Optimize Budget'}
      </button>
      
      {optimization && optimization.optimization && (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
            <span className="text-green-400">Estimated Savings:</span>
            <span className="text-green-400 font-bold">${optimization.optimization.total_savings?.toLocaleString() || '0'}</span>
          </div>
          
          {optimization.optimization.swap_items && optimization.optimization.swap_items.length > 0 && (
            <div className="bg-[#0F172A] p-3 rounded-lg">
              <h4 className="text-[#D4A574] font-bold mb-2">💡 Suggested Swaps</h4>
              {optimization.optimization.swap_items.map((swap, idx) => (
                <div key={idx} className="border-b border-[#D4A574]/20 pb-2 mb-2 last:border-0">
                  <p className="text-[#D4C5A9] text-sm">
                    <span className="text-red-400">Replace:</span> {swap.original_item}
                  </p>
                  <p className="text-[#D4C5A9] text-sm">
                    <span className="text-green-400">With:</span> {swap.suggested_alternative} (~${swap.estimated_price})
                  </p>
                  <p className="text-gray-400 text-xs">Savings: ${swap.savings}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main AI Dashboard Component
const AIDesignDashboard = ({ project, items = [] }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');

  const tabs = [
    { id: 'chat', label: '💬 Chat', icon: '🤖' },
    { id: 'visualize', label: '🎨 Visualize', icon: '🖼️' },
    { id: 'analyze', label: '🔍 Analyze', icon: '📊' },
    { id: 'budget', label: '💰 Budget', icon: '💡' }
  ];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ color: COLORS.accent, border: `1px solid ${COLORS.accent}` }}
          >
            ← Back
          </button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.textPrimary }}>✨ AI Design Assistant</h1>
            <p style={{ color: COLORS.textSecondary }}>Powered by GPT-5 & gpt-image-1</p>
          </div>
          <div className="w-20"></div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-3 rounded-lg font-bold transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? COLORS.accent : COLORS.bgCard,
                color: activeTab === tab.id ? '#000' : COLORS.textPrimary,
                border: `1px solid ${COLORS.accent}`
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'chat' && (
            <>
              <AIChatAssistant projectContext={project} />
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h3 className="text-xl font-bold text-[#D4A574] mb-4">💡 Quick Prompts</h3>
                <div className="space-y-2">
                  {[
                    "What furniture vendors do you recommend for modern minimalist design?",
                    "How can I make a small living room feel larger?",
                    "What colors work well with navy blue in a bedroom?",
                    "Suggest lighting options for a home office",
                    "What's trending in kitchen design for 2025?"
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left bg-[#0F172A] text-[#D4C5A9] p-3 rounded-lg hover:bg-[#1E293B] border border-[#D4A574]/20 text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'visualize' && (
            <>
              <RoomVisualizer />
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h3 className="text-xl font-bold text-[#D4A574] mb-4">📚 Style Guide</h3>
                <div className="space-y-3">
                  {[
                    { style: 'Modern', desc: 'Clean lines, minimal ornamentation, neutral palette' },
                    { style: 'Traditional', desc: 'Classic elegance, rich colors, ornate details' },
                    { style: 'Minimalist', desc: 'Less is more, functional, clutter-free' },
                    { style: 'Industrial', desc: 'Raw materials, exposed elements, urban vibe' },
                    { style: 'Bohemian', desc: 'Eclectic, colorful, globally inspired' },
                    { style: 'Coastal', desc: 'Beach-inspired, light colors, natural textures' },
                    { style: 'Farmhouse', desc: 'Rustic charm, comfortable, welcoming' },
                    { style: 'Mid-Century', desc: 'Retro modern, organic shapes, bold colors' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#0F172A] p-3 rounded-lg">
                      <span className="text-[#D4A574] font-bold">{item.style}:</span>
                      <span className="text-[#D4C5A9] ml-2 text-sm">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'analyze' && (
            <>
              <StyleAnalyzer />
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h3 className="text-xl font-bold text-[#D4A574] mb-4">📷 Tips for Best Results</h3>
                <ul className="space-y-2 text-[#D4C5A9]">
                  <li>• Use high-quality, well-lit images</li>
                  <li>• Include full room shots for better analysis</li>
                  <li>• Magazine photos work great as inspiration</li>
                  <li>• Try different angles to capture all details</li>
                  <li>• Interior design portfolio images yield best results</li>
                </ul>
              </div>
            </>
          )}
          
          {activeTab === 'budget' && (
            <>
              <BudgetOptimizer items={items} />
              <div className="bg-[#1E293B] rounded-lg border border-[#D4A574]/30 p-6">
                <h3 className="text-xl font-bold text-[#D4A574] mb-4">💡 Budget Tips</h3>
                <ul className="space-y-2 text-[#D4C5A9]">
                  <li>• Splurge on pieces you'll use daily (sofa, bed)</li>
                  <li>• Save on trendy accent pieces that may change</li>
                  <li>• Consider quality over quantity</li>
                  <li>• Invest in good lighting - it transforms spaces</li>
                  <li>• Mix high and low - designer + budget pieces</li>
                  <li>• Watch for sales at major vendors</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDesignDashboard;
export { AIChatAssistant, RoomVisualizer, StyleAnalyzer, BudgetOptimizer };
