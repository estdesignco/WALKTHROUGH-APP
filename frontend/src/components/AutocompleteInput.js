import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');

/**
 * AutocompleteInput - A reusable autocomplete input component
 * for vendors, materials, contacts, and paint colors
 */
const AutocompleteInput = ({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing...",
  type = "vendors", // vendors, materials, contacts, paint-colors
  category = null,
  style = {},
  inputStyle = {},
  disabled = false,
  minChars = 1,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < minChars) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        let endpoint = `${API}/api/autocomplete/${type}?q=${encodeURIComponent(inputValue)}&limit=10`;
        if (category) {
          endpoint += `&category=${encodeURIComponent(category)}`;
        }
        
        const response = await axios.get(endpoint);
        setSuggestions(response.data || []);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, type, category, minChars]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const selectedValue = suggestion.name || suggestion;
    setInputValue(selectedValue);
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSelect) {
      onSelect(suggestion);
    }
    if (onChange) {
      onChange(selectedValue);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const getSuggestionLabel = (suggestion) => {
    if (type === 'paint-colors') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: suggestion.color_code || suggestion.hex_color || '#ccc',
              border: '1px solid #ddd'
            }}
          />
          <span>{suggestion.name}</span>
          <span style={{ color: '#888', fontSize: '12px' }}>
            ({suggestion.manufacturer})
          </span>
        </div>
      );
    }
    
    return (
      <div>
        <span>{suggestion.name}</span>
        {suggestion.manufacturer && suggestion.manufacturer !== suggestion.name && (
          <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>
            ({suggestion.manufacturer})
          </span>
        )}
        {suggestion.category && (
          <span style={{ 
            color: '#666', 
            fontSize: '11px', 
            marginLeft: '8px',
            backgroundColor: '#f0f0f0',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {suggestion.category}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => inputValue.length >= minChars && setShowSuggestions(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px',
          outline: 'none',
          ...inputStyle
        }}
      />
      
      {loading && (
        <div style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#888',
          fontSize: '12px'
        }}>
          ...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '250px',
            overflowY: 'auto',
            zIndex: 9999,
            marginTop: '4px'
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              onClick={() => handleSelectSuggestion(suggestion)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                backgroundColor: index === highlightedIndex ? '#f5f5f5' : '#fff',
                borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {getSuggestionLabel(suggestion)}
            </div>
          ))}
        </div>
      )}

      {showSuggestions && inputValue.length >= minChars && suggestions.length === 0 && !loading && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px 12px',
            color: '#888',
            fontSize: '13px',
            zIndex: 9999,
            marginTop: '4px'
          }}
        >
          No matches found. Type to add new.
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
