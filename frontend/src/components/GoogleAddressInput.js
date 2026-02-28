import { useState, useRef, useEffect, useCallback } from 'react';

const BACKEND_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin);

/**
 * Address autocomplete that calls the backend proxy (no Google Maps script needed on frontend).
 */
export default function GoogleAddressInput({ value, onChange, onPlaceSelected, placeholder, className, style }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await resp.json();
      setSuggestions(data.predictions || []);
      setShowDropdown(true);
    } catch (e) {
      console.warn('Address autocomplete error:', e);
      setSuggestions([]);
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = async (suggestion) => {
    setQuery(suggestion.description);
    setShowDropdown(false);
    setSuggestions([]);
    if (onChange) onChange(suggestion.description);

    // Get full place details (lat/lng, address components)
    try {
      const resp = await fetch(`${BACKEND_URL}/api/places/details?place_id=${encodeURIComponent(suggestion.place_id)}`);
      const details = await resp.json();
      if (onPlaceSelected) {
        onPlaceSelected({
          formatted_address: details.formatted_address || suggestion.description,
          geometry: { location: { lat: () => details.lat, lng: () => details.lng } },
          address_components: details.address_components || [],
          place_id: suggestion.place_id
        });
      }
    } catch (e) {
      // Even if details fail, still pass the address
      if (onPlaceSelected) {
        onPlaceSelected({ formatted_address: suggestion.description });
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder || "Start typing your address..."}
        className={className}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#1F2937',
          border: '1px solid #4B5563',
          borderRadius: '0 0 8px 8px',
          maxHeight: '240px',
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          {suggestions.map((s, i) => (
            <div
              key={s.place_id || i}
              onClick={() => handleSelect(s)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #374151' : 'none',
                color: '#F5F5DC',
                fontSize: '14px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#374151'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <span style={{ color: '#d4af37', marginRight: '8px' }}>📍</span>
              {s.description}
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9CA3AF',
          fontSize: '12px'
        }}>
          ...
        </div>
      )}
    </div>
  );
}
