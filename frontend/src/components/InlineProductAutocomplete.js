import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * InlineProductAutocomplete - Autocomplete cell for spreadsheet
 * Provides inline autocomplete when typing in item name cells
 */
const InlineProductAutocomplete = ({ 
  value, 
  onChange, 
  onProductSelect,
  placeholder = "Type to search...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
      const response = await fetch(`${backendUrl}/api/autocomplete/products?query=${encodeURIComponent(query)}&limit=8`);
      const data = await response.json();
      
      if (data.success && data.products) {
        setSuggestions(data.products);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(newValue);
    }, 250);
  };

  const handleSelectProduct = (product) => {
    setInputValue(product.name);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectProduct(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleBlur = (e) => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      if (onChange && inputValue !== value) {
        onChange(inputValue);
      }
    }, 200);
  };

  return (
    <div className="relative" style={{ width: 'max-content', minWidth: '40px' }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        size={Math.max((inputValue || placeholder || '').length + 2, 8)}
        className={`bg-transparent outline-none ${className}`}
        style={{ width: 'auto', minWidth: '40px' }}
      />
      
      {isSearching && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-3 w-3 border border-blue-400 rounded-full border-t-transparent"></div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto"
          style={{ minWidth: '300px' }}
        >
          {suggestions.map((product, index) => (
            <div
              key={`${product.sku}-${index}`}
              onClick={() => handleSelectProduct(product)}
              className={`p-2 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-gray-700 ${
                index === selectedIndex ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                ) : (
                  <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-xs">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{product.name}</div>
                  <div className="text-xs text-gray-400">
                    <span className="text-blue-400">{product.vendor}</span>
                    <span className="mx-1">•</span>
                    <span>{product.sku}</span>
                    <span className="mx-1">•</span>
                    <span className="text-green-400 font-medium">${(product.cost || product.price || 0).toLocaleString()}</span>
                  </div>
                  {/* Show dimensions and link if available */}
                  {(product.dimensions || product.product_link) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {product.dimensions && (
                        <span className="text-yellow-400">📐 {product.dimensions}</span>
                      )}
                      {product.dimensions && product.product_link && <span className="mx-1">•</span>}
                      {product.product_link && (
                        <span className="text-purple-400">🔗 Link available</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * VendorDropdown - Dropdown select for vendors
 */
const VendorDropdown = ({ value, onChange, className = "" }) => {
  const [vendors, setVendors] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const response = await fetch(`${backendUrl}/api/autocomplete/vendors`);
        const data = await response.json();
        if (data.success) {
          setVendors(data.vendors);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (vendor) => {
    setInputValue(vendor);
    setIsOpen(false);
    if (onChange) {
      onChange(vendor);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className="relative w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            if (onChange && inputValue !== value) {
              onChange(inputValue);
            }
          }, 200);
        }}
        placeholder="Select vendor..."
        className={`w-full bg-transparent outline-none ${className}`}
      />
      
      {isOpen && filteredVendors.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ minWidth: '150px' }}>
          {filteredVendors.map((vendor) => (
            <div
              key={vendor}
              onClick={() => handleSelect(vendor)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-white text-sm border-b border-gray-700 last:border-b-0"
            >
              {vendor}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { InlineProductAutocomplete, VendorDropdown };
export default InlineProductAutocomplete;
