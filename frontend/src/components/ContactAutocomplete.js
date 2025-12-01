import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * Contact Autocomplete Component
 * Provides predictive text for contacts based on the master contacts database
 */
const ContactAutocomplete = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Enter name...",
  className = "",
  projectId = null,
  autoSyncRole = ""  // Role to use when auto-syncing (e.g., "Builder", "Architect")
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Search for suggestions when value changes
  useEffect(() => {
    const searchContacts = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${API}/master/contacts/autocomplete`, {
          params: { q: value, limit: 5 }
        });
        setSuggestions(response.data);
        setShowSuggestions(response.data.length > 0);
      } catch (error) {
        console.error('Error fetching contact suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchContacts, 200);
    return () => clearTimeout(debounce);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (contact) => {
    onChange(contact.name);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(contact);
    }
  };

  const handleBlur = async () => {
    // Wait a bit for potential click on suggestion
    setTimeout(async () => {
      if (value && value.length > 2 && autoSyncRole) {
        // Auto-sync the contact to master database
        try {
          await axios.post(`${API}/master/contacts/auto-sync`, {
            name: value,
            role: autoSyncRole,
            project_id: projectId
          });
          console.log('✅ Contact auto-synced to master database');
        } catch (error) {
          console.error('Error auto-syncing contact:', error);
        }
      }
    }, 300);
  };

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full ${className}`}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl max-h-60 overflow-auto"
        >
          {suggestions.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleSelect(contact)}
              className="px-4 py-3 hover:bg-stone-700 cursor-pointer border-b border-stone-700 last:border-b-0"
            >
              <div className="font-medium text-stone-200">{contact.name}</div>
              <div className="text-sm text-stone-400 flex items-center gap-3">
                {contact.company && <span>{contact.company}</span>}
                {contact.role && <span className="text-[#8b7355]">{contact.role}</span>}
              </div>
              {contact.phone && (
                <div className="text-xs text-stone-500 mt-1">{contact.phone}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Utility function to auto-sync a contact to the master database
 * Call this whenever a contact is entered anywhere in the app
 */
export const autoSyncContact = async (contactData, projectId = null) => {
  try {
    const response = await axios.post(`${API}/master/contacts/auto-sync`, {
      name: contactData.name,
      phone: contactData.phone || '',
      email: contactData.email || '',
      role: contactData.role || '',
      company: contactData.company || '',
      project_id: projectId
    });
    console.log('✅ Contact auto-synced:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error auto-syncing contact:', error);
    return null;
  }
};

/**
 * Material Autocomplete Component
 * Provides predictive text for materials based on the master materials database
 */
export const MaterialAutocomplete = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Enter material name...",
  className = "",
  category = null
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const searchMaterials = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const params = { q: value, limit: 5 };
        if (category) params.category = category;
        
        const response = await axios.get(`${API}/master/materials/autocomplete`, { params });
        setSuggestions(response.data);
        setShowSuggestions(response.data.length > 0);
      } catch (error) {
        console.error('Error fetching material suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchMaterials, 200);
    return () => clearTimeout(debounce);
  }, [value, category]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (material) => {
    onChange(material.name);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(material);
    }
  };

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={`w-full ${className}`}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl max-h-60 overflow-auto"
        >
          {suggestions.map((material) => (
            <div
              key={material.id}
              onClick={() => handleSelect(material)}
              className="px-4 py-3 hover:bg-stone-700 cursor-pointer border-b border-stone-700 last:border-b-0"
            >
              <div className="font-medium text-stone-200">{material.name}</div>
              <div className="text-sm text-stone-400 flex items-center gap-3">
                {material.manufacturer && <span>{material.manufacturer}</span>}
                {material.color && <span>{material.color}</span>}
              </div>
              {material.sku && (
                <div className="text-xs text-stone-500 mt-1">SKU: {material.sku}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactAutocomplete;
