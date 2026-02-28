import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Address autocomplete using OpenStreetMap Nominatim (free, no API key, no billing).
 * Returns full address with lat/lng for geotagging.
 */
export default function GoogleAddressInput({ value, onChange, onPlaceSelected, placeholder, className, style }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

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
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=us&addressdetails=1&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await resp.json();
      setSuggestions(data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        place_id: item.place_id,
        address: item.address || {}
      })));
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const handleSelect = (suggestion) => {
    const addr = suggestion.display_name;
    setQuery(addr);
    setShowDropdown(false);
    setSuggestions([]);
    if (onChange) onChange(addr);
    if (onPlaceSelected) {
      onPlaceSelected({
        formatted_address: addr,
        geometry: {
          location: {
            lat: () => suggestion.lat,
            lng: () => suggestion.lng
          }
        },
        address_components: buildAddressComponents(suggestion.address),
        lat: suggestion.lat,
        lng: suggestion.lng
      });
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder || "Start typing your address..."}
        className={className}
        style={style}
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
              {s.display_name}
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

function buildAddressComponents(address) {
  const components = [];
  if (address.house_number) components.push({ long_name: address.house_number, types: ['street_number'] });
  if (address.road) components.push({ long_name: address.road, types: ['route'] });
  if (address.city || address.town || address.village) components.push({ long_name: address.city || address.town || address.village, types: ['locality'] });
  if (address.county) components.push({ long_name: address.county, types: ['administrative_area_level_2'] });
  if (address.state) components.push({ long_name: address.state, types: ['administrative_area_level_1'] });
  if (address.postcode) components.push({ long_name: address.postcode, types: ['postal_code'] });
  if (address.country) components.push({ long_name: address.country, types: ['country'] });
  return components;
}
