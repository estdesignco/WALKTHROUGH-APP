import { useRef, useEffect } from 'react';

/**
 * Custom Google Places Autocomplete input.
 * Uses the Google Maps script loaded in index.html - no library, no double-loading.
 */
export default function GoogleAddressInput({ value, onChange, onPlaceSelected, placeholder, className, style }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const initAutocomplete = () => {
      if (!inputRef.current) return;
      if (!window.google?.maps?.places) {
        // Script not loaded yet, retry
        setTimeout(initAutocomplete, 500);
        return;
      }
      if (autocompleteRef.current) return; // Already initialized

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' }
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            if (onPlaceSelected) onPlaceSelected(place);
            if (onChange) onChange(place.formatted_address);
          }
        });
      } catch (err) {
        console.warn('Google Places init error:', err);
      }
    };

    initAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [onPlaceSelected, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      placeholder={placeholder || "Start typing your address..."}
      className={className}
      style={style}
      onChange={(e) => {
        if (onChange) onChange(e.target.value);
      }}
    />
  );
}
