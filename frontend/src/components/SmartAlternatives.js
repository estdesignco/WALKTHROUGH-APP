import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, ArrowRight, DollarSign, Package } from 'lucide-react';

const SmartAlternatives = ({ item, onClose, onSelectAlternative }) => {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState('all'); // all, lower, similar, higher
  const [vendorFilter, setVendorFilter] = useState('');

  useEffect(() => {
    if (item) {
      fetchAlternatives();
    }
  }, [item, priceRange, vendorFilter]);

  const fetchAlternatives = async () => {
    setLoading(true);
    try {
      const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      
      // Build search query from item properties
      const searchTerms = [];
      if (item.name) searchTerms.push(item.name);
      if (item.category_name) searchTerms.push(item.category_name);
      
      const query = searchTerms.join(' ').split(' ').slice(0, 3).join(' ');
      
      let url = `${BACKEND_URL}/api/smart-alternatives?query=${encodeURIComponent(query)}`;
      if (item.cost) url += `&base_price=${item.cost}`;
      if (priceRange !== 'all') url += `&price_range=${priceRange}`;
      if (vendorFilter) url += `&vendor=${encodeURIComponent(vendorFilter)}`;
      if (item.id) url += `&exclude_id=${item.id}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAlternatives(data.alternatives || []);
      }
    } catch (error) {
      console.error('Error fetching alternatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceComparison = (altPrice) => {
    if (!item.cost || !altPrice) return null;
    const diff = altPrice - item.cost;
    const percent = ((diff / item.cost) * 100).toFixed(0);
    
    if (diff < 0) {
      return <span className="text-green-400">-${Math.abs(diff).toFixed(0)} ({percent}%)</span>;
    } else if (diff > 0) {
      return <span className="text-red-400">+${diff.toFixed(0)} (+{percent}%)</span>;
    }
    return <span className="text-gray-400">Same price</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#D4A574]/30">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D4A574]/30 flex justify-between items-center"
             style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#D4A574]" />
            <div>
              <h2 className="text-xl font-bold text-[#D4A574]">Smart Alternatives</h2>
              <p className="text-sm text-[#B49B7E]">
                Finding alternatives for: <span className="text-white">{item?.name || 'Item'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-[#B49B7E]/20 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#B49B7E]" />
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="bg-slate-800 border border-[#B49B7E]/30 rounded px-3 py-1 text-sm text-white"
            >
              <option value="all">All Prices</option>
              <option value="lower">Lower Price</option>
              <option value="similar">Similar Price (±20%)</option>
              <option value="higher">Higher End</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#B49B7E]" />
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="bg-slate-800 border border-[#B49B7E]/30 rounded px-3 py-1 text-sm text-white"
            >
              <option value="">All Vendors</option>
              <option value="Uttermost">Uttermost</option>
              <option value="Four Hands">Four Hands</option>
              <option value="Bernhardt">Bernhardt</option>
              <option value="Gabby">Gabby</option>
              <option value="Worlds Away">Worlds Away</option>
              <option value="Loloi">Loloi</option>
            </select>
          </div>
          {item?.cost && (
            <div className="text-sm text-[#B49B7E] flex items-center gap-2">
              Current Price: <span className="text-[#D4A574] font-bold">${item.cost}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[#B49B7E]">Finding alternatives from your catalog...</p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-[#B49B7E]/50 mx-auto mb-4" />
              <p className="text-[#B49B7E]">No alternatives found in your catalog.</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting the filters or search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alternatives.map((alt, idx) => (
                <div 
                  key={alt.sku || idx}
                  className="bg-slate-800/50 rounded-lg border border-[#B49B7E]/20 hover:border-[#D4A574]/50 transition-all p-4 cursor-pointer group"
                  onClick={() => onSelectAlternative(alt)}
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                      {alt.image_url ? (
                        <img src={alt.image_url} alt={alt.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#B49B7E]/50">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate group-hover:text-[#D4A574] transition-colors">
                        {alt.name}
                      </h3>
                      <p className="text-xs text-[#B49B7E] mt-1">
                        {alt.vendor} • SKU: {alt.sku}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[#D4A574] font-bold">
                          ${alt.price?.toFixed(2) || 'N/A'}
                        </span>
                        {getPriceComparison(alt.price)}
                      </div>
                      {alt.dimensions && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{alt.dimensions}</p>
                      )}
                    </div>
                    
                    {/* Select Arrow */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-[#D4A574]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartAlternatives;
