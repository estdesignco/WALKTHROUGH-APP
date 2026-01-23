import React, { useState, useEffect } from 'react';
import { Search, Palette, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import BackButton from './BackButton';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

// Color chip component - defined outside to avoid re-creation on render
const ColorChip = ({ colorName, isCopied, onCopy }) => {
  return (
    <div 
      onClick={() => onCopy(colorName)}
      className="group flex items-center gap-2 p-2 rounded-lg bg-stone-800/50 hover:bg-stone-700 cursor-pointer transition-all border border-stone-700 hover:border-[#8b7355]"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-400 to-stone-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-200 truncate">{colorName}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {isCopied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-stone-400" />
        )}
      </div>
    </div>
  );
};

const PaintCatalogPage = () => {
  const [paintData, setPaintData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedManufacturers, setExpandedManufacturers] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [copiedColor, setCopiedColor] = useState(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');

  useEffect(() => {
    loadPaintColors();
  }, []);

  const loadPaintColors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/paint-colors`);
      if (response.ok) {
        const data = await response.json();
        setPaintData(data.data || {});
        // Expand all manufacturers by default
        const expanded = {};
        Object.keys(data.data || {}).forEach(m => expanded[m] = true);
        setExpandedManufacturers(expanded);
      }
    } catch (error) {
      console.error('Error loading paint colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (colorName) => {
    navigator.clipboard.writeText(colorName);
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const toggleManufacturer = (manufacturer) => {
    setExpandedManufacturers(prev => ({
      ...prev,
      [manufacturer]: !prev[manufacturer]
    }));
  };

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter colors based on search term
  const getFilteredData = () => {
    if (!searchTerm) return paintData;
    
    const filtered = {};
    Object.entries(paintData).forEach(([manufacturer, categories]) => {
      if (selectedManufacturer !== 'all' && manufacturer !== selectedManufacturer) return;
      
      const filteredCategories = {};
      Object.entries(categories).forEach(([category, colors]) => {
        const matchedColors = colors.filter(color => 
          color.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (matchedColors.length > 0) {
          filteredCategories[category] = matchedColors;
        }
      });
      if (Object.keys(filteredCategories).length > 0) {
        filtered[manufacturer] = filteredCategories;
      }
    });
    return filtered;
  };

  const filteredData = getFilteredData();
  const manufacturers = Object.keys(paintData);

  return (
    <div className="min-h-screen bg-black text-stone-300 p-6">
      <BackButton />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b7355] to-[#6b5745] flex items-center justify-center">
              <Palette className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-[#D4C5A9]">Paint Catalog</h1>
              <p className="text-stone-500">Browse professional paint colors from top manufacturers</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Search paint colors by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355]"
            />
          </div>
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="px-4 py-3 bg-stone-900 border border-stone-700 rounded-lg text-stone-300 focus:outline-none focus:border-[#8b7355] min-w-[200px]"
          >
            <option value="all">All Manufacturers</option>
            {manufacturers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Color Count */}
        <div className="mb-6 text-stone-500 text-sm">
          {(() => {
            let count = 0;
            Object.values(filteredData).forEach(cats => {
              Object.values(cats).forEach(colors => {
                count += colors.length;
              });
            });
            return `${count} colors found`;
          })()}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Loading paint catalog...</div>
        ) : Object.keys(filteredData).length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 mx-auto text-stone-700 mb-4" />
            <p className="text-stone-500">No colors found</p>
            <p className="text-stone-600 text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredData).map(([manufacturer, categories]) => (
              <div key={manufacturer} className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                {/* Manufacturer Header */}
                <button
                  onClick={() => toggleManufacturer(manufacturer)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#8b7355]/20 to-transparent hover:from-[#8b7355]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedManufacturers[manufacturer] ? (
                      <ChevronDown className="w-5 h-5 text-[#D4A574]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#D4A574]" />
                    )}
                    <h2 className="text-xl font-medium text-[#D4C5A9]">{manufacturer}</h2>
                    <span className="text-sm text-stone-500">
                      ({Object.values(categories).flat().length} colors)
                    </span>
                  </div>
                </button>

                {/* Categories */}
                {expandedManufacturers[manufacturer] && (
                  <div className="border-t border-stone-800">
                    {Object.entries(categories).map(([category, colors]) => {
                      const categoryKey = `${manufacturer}-${category}`;
                      const isExpanded = expandedCategories[categoryKey] !== false; // Default expanded
                      
                      return (
                        <div key={categoryKey} className="border-b border-stone-800 last:border-b-0">
                          <button
                            onClick={() => toggleCategory(categoryKey)}
                            className="w-full flex items-center justify-between p-3 pl-10 hover:bg-stone-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-stone-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                              )}
                              <span className="text-stone-300">{category}</span>
                              <span className="text-xs text-stone-600">({colors.length})</span>
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="px-10 pb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {colors.map((color, idx) => (
                                <ColorChip 
                                  key={`${color}-${idx}`} 
                                  colorName={color} 
                                  isCopied={copiedColor === color}
                                  onCopy={copyToClipboard}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-stone-900/50 border border-stone-800 rounded-lg">
          <p className="text-stone-500 text-sm">
            <strong className="text-stone-400">Tip:</strong> Click on any color to copy its name to your clipboard. 
            Use the search bar to find specific colors by name or code. These colors will autocomplete in 
            the Finish/Color fields throughout the application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaintCatalogPage;
