import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Grid, Heart, ExternalLink, Save, Loader2, Pin, Image as ImageIcon, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Pinterest Integration - Browse and save pins for design inspiration
 */
export default function PinterestIntegration({ projectId, onBack }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [savedPins, setSavedPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [savingPin, setSavingPin] = useState(false);

  const inspirationCategories = [
    { id: 'all', name: 'All', icon: '🏠' },
    { id: 'living-room', name: 'Living Room', icon: '🛋️' },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
    { id: 'dining', name: 'Dining', icon: '🍽️' },
    { id: 'office', name: 'Office', icon: '💼' },
    { id: 'outdoor', name: 'Outdoor', icon: '🌿' }
  ];

  // Mock Pinterest-style inspiration data (since real Pinterest API needs OAuth)
  const mockInspirationData = [
    {
      id: '1',
      title: 'Modern Minimalist Living Room',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      source: 'Pinterest',
      category: 'living-room',
      saves: 1234
    },
    {
      id: '2', 
      title: 'Scandinavian Kitchen Design',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      source: 'Pinterest',
      category: 'kitchen',
      saves: 892
    },
    {
      id: '3',
      title: 'Cozy Bedroom Retreat',
      image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400',
      source: 'Pinterest',
      category: 'bedroom',
      saves: 2156
    },
    {
      id: '4',
      title: 'Luxury Bathroom Spa',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400',
      source: 'Pinterest',
      category: 'bathroom',
      saves: 1567
    },
    {
      id: '5',
      title: 'Industrial Loft Style',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      source: 'Pinterest',
      category: 'living-room',
      saves: 3421
    },
    {
      id: '6',
      title: 'Farmhouse Kitchen',
      image: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400',
      source: 'Pinterest',
      category: 'kitchen',
      saves: 1890
    },
    {
      id: '7',
      title: 'Bohemian Bedroom',
      image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400',
      source: 'Pinterest',
      category: 'bedroom',
      saves: 2789
    },
    {
      id: '8',
      title: 'Modern Home Office',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
      source: 'Pinterest',
      category: 'office',
      saves: 1456
    },
    {
      id: '9',
      title: 'Outdoor Living Space',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
      source: 'Pinterest',
      category: 'outdoor',
      saves: 2134
    },
    {
      id: '10',
      title: 'Elegant Dining Room',
      image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400',
      source: 'Pinterest',
      category: 'dining',
      saves: 1678
    },
    {
      id: '11',
      title: 'Contemporary Bathroom',
      image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400',
      source: 'Pinterest',
      category: 'bathroom',
      saves: 1234
    },
    {
      id: '12',
      title: 'Rustic Living Room',
      image: 'https://images.unsplash.com/photo-1583845112203-29329902332e?w=400',
      source: 'Pinterest',
      category: 'living-room',
      saves: 2567
    }
  ];

  useEffect(() => {
    loadSavedPins();
    // Simulate loading inspiration
    setSearchResults(mockInspirationData);
  }, [projectId]);

  const loadSavedPins = async () => {
    try {
      const res = await axios.get(`${API}/pinterest-pins/${projectId}`);
      setSavedPins(res.data || []);
    } catch (error) {
      console.log('No saved pins yet');
      setSavedPins([]);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(mockInspirationData);
      return;
    }
    
    setLoading(true);
    // Filter mock data based on search
    setTimeout(() => {
      const filtered = mockInspirationData.filter(pin => 
        pin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered.length > 0 ? filtered : mockInspirationData);
      setLoading(false);
    }, 500);
  };

  const handleSavePin = async (pin) => {
    setSelectedPin(pin);
    setShowSaveModal(true);
  };

  const confirmSavePin = async (room) => {
    if (!selectedPin) return;
    
    setSavingPin(true);
    try {
      await axios.post(`${API}/pinterest-pins`, {
        project_id: projectId,
        pin_id: selectedPin.id,
        title: selectedPin.title,
        image_url: selectedPin.image,
        source: selectedPin.source,
        category: selectedPin.category,
        room: room,
        saves: selectedPin.saves
      });
      
      setSavedPins([...savedPins, { ...selectedPin, room }]);
      setShowSaveModal(false);
      setSelectedPin(null);
    } catch (error) {
      console.error('Error saving pin:', error);
      alert('Failed to save pin');
    } finally {
      setSavingPin(false);
    }
  };

  const handleRemovePin = async (pinId) => {
    try {
      await axios.delete(`${API}/pinterest-pins/${pinId}`);
      setSavedPins(savedPins.filter(p => p.pin_id !== pinId && p.id !== pinId));
    } catch (error) {
      console.error('Error removing pin:', error);
    }
  };

  const filteredResults = selectedCategory === 'all' 
    ? searchResults 
    : searchResults.filter(pin => pin.category === selectedCategory);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,25,0.95) 100%)' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/30 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#D4A574] flex items-center gap-2">
                <span className="text-red-500">📌</span> Pinterest Inspiration
              </h1>
              <p className="text-gray-400 text-sm">Discover and save design ideas for your project</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[#E60023]/20 px-4 py-2 rounded-lg border border-[#E60023]/30">
            <Pin size={18} className="text-[#E60023]" />
            <span className="text-white text-sm">{savedPins.length} Saved</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for design inspiration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-black/50 border border-[#B49B7E]/30 text-white placeholder-gray-500 focus:border-[#E60023] focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 rounded-full bg-[#E60023] text-white font-semibold hover:bg-[#AD081B] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {inspirationCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#E60023] text-white'
                  : 'bg-black/30 text-gray-400 hover:text-white border border-[#B49B7E]/30 hover:border-[#E60023]/50'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Saved Pins Section */}
        {savedPins.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Heart size={20} className="text-[#E60023]" fill="#E60023" />
              Your Saved Ideas ({savedPins.length})
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {savedPins.map(pin => (
                <div
                  key={pin.id || pin.pin_id}
                  className="flex-shrink-0 w-48 group relative"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-black/30 border border-[#B49B7E]/20">
                    <img
                      src={pin.image_url || pin.image}
                      alt={pin.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemovePin(pin.pin_id || pin.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-white text-sm mt-2 truncate">{pin.title}</p>
                  {pin.room && (
                    <p className="text-gray-500 text-xs">{pin.room}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pinterest-style Masonry Grid */}
        <h2 className="text-xl font-semibold text-white mb-4">
          {selectedCategory === 'all' ? 'Explore Ideas' : `${inspirationCategories.find(c => c.id === selectedCategory)?.name} Ideas`}
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={48} className="animate-spin text-[#E60023]" />
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {filteredResults.map(pin => (
              <div
                key={pin.id}
                className="break-inside-avoid mb-4 group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden bg-black/30 border border-[#B49B7E]/10 hover:border-[#E60023]/50 transition-all">
                  <img
                    src={pin.image}
                    alt={pin.title}
                    className="w-full object-cover"
                    style={{ minHeight: '200px' }}
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSavePin(pin)}
                        className="px-4 py-2 rounded-full bg-[#E60023] text-white font-semibold hover:bg-[#AD081B] transition-colors flex items-center gap-2"
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{pin.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <Heart size={12} /> {pin.saves?.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-xs">• {pin.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredResults.length === 0 && !loading && (
          <div className="text-center py-16">
            <ImageIcon size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-gray-400">Try searching for something else or browse categories</p>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && selectedPin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-2xl max-w-md w-full overflow-hidden border border-[#D4A574]/30">
            <div className="relative h-48 overflow-hidden">
              <img
                src={selectedPin.image}
                alt={selectedPin.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setShowSaveModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2">{selectedPin.title}</h3>
              <p className="text-gray-400 text-sm mb-4">Save this idea to your project</p>
              
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Select a room:</p>
                {['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Dining Room', 'Office', 'General'].map(room => (
                  <button
                    key={room}
                    onClick={() => confirmSavePin(room)}
                    disabled={savingPin}
                    className="w-full px-4 py-3 rounded-lg bg-black/30 border border-[#B49B7E]/30 text-white hover:border-[#E60023] hover:bg-[#E60023]/10 transition-colors flex items-center justify-between disabled:opacity-50"
                  >
                    <span>{room}</span>
                    <ChevronRight size={18} className="text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-gradient-to-r from-[#E60023]/20 to-[#E60023]/5 rounded-xl p-4 border border-[#E60023]/30">
          <p className="text-gray-300 text-sm">
            <span className="font-semibold text-white">💡 Pro Tip:</span> Save pins to specific rooms to keep your inspiration organized. You can also search for specific styles like "mid-century modern" or "coastal farmhouse".
          </p>
        </div>
      </div>
    </div>
  );
}
