import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const PaintColorAutocomplete = ({ 
  value = '', 
  onChange, 
  onBlur,
  placeholder = "Enter color...",
  className = "",
  style = {},
  textColor = "#D4C5A9"
}) => {
  // Simple uncontrolled input with value sync via key
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allColors, setAllColors] = useState([]);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load all paint colors on mount
  useEffect(() => {
    const loadPaintColors = async () => {
      try {
        const response = await fetch(`${API}/paint-colors`);
        if (response.ok) {
          const data = await response.json();
          const colors = [];
          Object.entries(data.data || {}).forEach(([manufacturer, categories]) => {
            Object.entries(categories).forEach(([category, colorList]) => {
              colorList.forEach(color => {
                colors.push({
                  name: color,
                  manufacturer,
                  category,
                  display: `${color} - ${manufacturer}`
                });
              });
            });
          });
          setAllColors(colors);
        }
      } catch (error) {
        console.error('Error loading paint colors:', error);
      }
    };
    loadPaintColors();
  }, []);

  // Filter suggestions based on input
  const filterSuggestions = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allColors.filter(color => 
      color.name.toLowerCase().includes(term) ||
      color.manufacturer.toLowerCase().includes(term) ||
      color.category.toLowerCase().includes(term)
    ).slice(0, 15);

    setSuggestions(filtered);
  }, [allColors]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      filterSuggestions(newValue);
      setShowSuggestions(true);
    }, 150);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (onChange) {
      onChange(suggestion.name);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          setShowSuggestions(false);
          e.target.blur();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Handle blur
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (onBlur && inputValue !== value) {
        onBlur(inputValue);
      }
    }, 200);
  };

  // Handle focus
  const handleFocus = () => {
    if (inputValue && inputValue.length >= 1) {
      filterSuggestions(inputValue);
      setShowSuggestions(true);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedItem = suggestionsRef.current.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative" style={{ width: 'max-content', minWidth: '40px' }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        size={Math.max((inputValue || placeholder || '').length + 2, 8)}
        className={`bg-transparent text-sm outline-none focus:ring-1 focus:ring-[#D4A574] rounded ${className}`}
        style={{ color: textColor, width: 'auto', minWidth: '40px', ...style }}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-64 mt-1 bg-stone-900 border border-stone-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          style={{ left: 0, top: '100%' }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.name}-${suggestion.manufacturer}-${index}`}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                index === selectedIndex 
                  ? 'bg-[#8b7355] text-white' 
                  : 'text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="text-xs text-stone-500">
                {suggestion.manufacturer} • {suggestion.category}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaintColorAutocomplete;
