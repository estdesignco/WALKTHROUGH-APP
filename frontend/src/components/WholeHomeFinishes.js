import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, Trash2, Edit3, Image, Upload, Link, Copy, Clipboard } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const WholeHomeFinishes = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingField, setEditingField] = useState(null);
  
  const [wholeHomeData, setWholeHomeData] = useState({
    doorHardware: { 
      interior: { value: '', image: '', link: '', vendor: '', sku: '' },
      exterior: { value: '', image: '', link: '', vendor: '', sku: '' },
      hinges: { value: '', image: '', link: '', vendor: '', sku: '' },
      deadbolts: { value: '', image: '', link: '', vendor: '', sku: '' }
    },
    paint: { 
      brand: { value: '', image: '', link: '', vendor: '', sku: '' },
      walls: { value: '', image: '', link: '', vendor: '', sku: '' },
      trim: { value: '', image: '', link: '', vendor: '', sku: '' },
      ceiling: { value: '', image: '', link: '', vendor: '', sku: '' },
      accent: { value: '', image: '', link: '', vendor: '', sku: '' }
    },
    flooring: { 
      primary: { value: '', image: '', link: '', vendor: '', sku: '' },
      secondary: { value: '', image: '', link: '', vendor: '', sku: '' },
      transitions: { value: '', image: '', link: '', vendor: '', sku: '' }
    },
    electrical: { 
      outlets: { value: '', image: '', link: '', vendor: '', sku: '' },
      switches: { value: '', image: '', link: '', vendor: '', sku: '' },
      plates: { value: '', image: '', link: '', vendor: '', sku: '' }
    },
    plumbing: { 
      faucets: { value: '', image: '', link: '', vendor: '', sku: '' },
      showerheads: { value: '', image: '', link: '', vendor: '', sku: '' },
      toilets: { value: '', image: '', link: '', vendor: '', sku: '' }
    },
    customSections: []
  });

  // Check for scraper data from URL or localStorage
  useEffect(() => {
    const checkForScraperData = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'add-item' && params.get('source') === 'extension') {
        const scrapedData = {
          name: params.get('name') || '',
          price: params.get('price') || '',
          sku: params.get('sku') || '',
          vendor: params.get('vendor') || '',
          link: params.get('link') || '',
          image: params.get('image') || '',
          finish: params.get('finish') || '',
          finish_image: params.get('finish_image') || ''
        };
        
        if (scrapedData.name || scrapedData.sku) {
          localStorage.setItem('wholeHomeScraperData', JSON.stringify(scrapedData));
          alert(`✅ Product scraped! Click on any field to apply:\n\n${scrapedData.name}`);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };
    checkForScraperData();
  }, []);

  useEffect(() => {
    loadWholeHomeData();
  }, [projectId]);

  const loadWholeHomeData = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/whole-home-finishes`);
      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          // Migrate old format to new format with images
          const migratedData = migrateData(data);
          setWholeHomeData(prev => ({ ...prev, ...migratedData }));
        }
      }
    } catch (error) {
      console.error('Failed to load whole home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Migrate old string values to new object format
  const migrateData = (data) => {
    const migrated = { ...data };
    const sections = ['doorHardware', 'paint', 'flooring', 'electrical', 'plumbing'];
    
    sections.forEach(section => {
      if (migrated[section]) {
        Object.keys(migrated[section]).forEach(key => {
          const val = migrated[section][key];
          if (typeof val === 'string') {
            migrated[section][key] = { value: val, image: '', link: '', vendor: '', sku: '' };
          }
        });
      }
    });
    return migrated;
  };

  const saveWholeHomeData = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/whole-home-finishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wholeHomeData)
      });
      if (response.ok) {
        alert('✅ Whole Home Finishes saved!');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('❌ Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Add to finish library
  const addToFinishLibrary = async (fieldData, fieldName) => {
    if (!fieldData.value && !fieldData.image) {
      alert('Please add a value or image first');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/master-materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fieldData.value || fieldName,
          category: 'finish',
          photo_url: fieldData.image,
          source_url: fieldData.link,
          manufacturer: fieldData.vendor,
          sku: fieldData.sku,
          project_id: projectId
        })
      });
      if (response.ok) {
        alert('✅ Added to Finish Library!');
      }
    } catch (error) {
      console.error('Failed to add to finish library:', error);
    }
  };

  // Handle paste from clipboard or scraper
  const handlePaste = async (e, section, field) => {
    e.preventDefault();
    
    // Check for scraper data first
    const scraperData = localStorage.getItem('wholeHomeScraperData');
    if (scraperData) {
      try {
        const data = JSON.parse(scraperData);
        updateField(section, field, {
          value: data.name || data.finish || '',
          image: data.image || data.finish_image || '',
          link: data.link || '',
          vendor: data.vendor || '',
          sku: data.sku || ''
        });
        localStorage.removeItem('wholeHomeScraperData');
        return;
      } catch (err) {
        console.error('Error parsing scraper data:', err);
      }
    }
    
    // Try clipboard
    try {
      const clipText = await navigator.clipboard.readText();
      
      // Check if it's JSON from the spreadsheet
      try {
        const clipData = JSON.parse(clipText);
        if (clipData.name || clipData.image_url) {
          updateField(section, field, {
            value: clipData.name || clipData.finish_color || '',
            image: clipData.image_url || clipData.finish_image || '',
            link: clipData.link || clipData.url || '',
            vendor: clipData.vendor || '',
            sku: clipData.sku || ''
          });
          return;
        }
      } catch {
        // Not JSON, use as plain text
        updateField(section, field, { 
          ...getField(section, field),
          value: clipText 
        });
      }
    } catch (err) {
      console.error('Clipboard access denied:', err);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e, section, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target.result;
      
      // Upload to server
      try {
        const response = await fetch(`${API_URL}/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: imageData, project_id: projectId })
        });
        
        if (response.ok) {
          const result = await response.json();
          updateField(section, field, {
            ...getField(section, field),
            image: result.url || imageData
          });
        } else {
          // Use base64 as fallback
          updateField(section, field, {
            ...getField(section, field),
            image: imageData
          });
        }
      } catch (error) {
        // Use base64 as fallback
        updateField(section, field, {
          ...getField(section, field),
          image: imageData
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const getField = (section, field) => {
    return wholeHomeData[section]?.[field] || { value: '', image: '', link: '', vendor: '', sku: '' };
  };

  const updateField = (section, field, data) => {
    setWholeHomeData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: { ...prev[section]?.[field], ...data }
      }
    }));
  };

  const addCustomSection = () => {
    if (!newSectionName.trim()) return;
    setWholeHomeData(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), { 
        name: newSectionName, 
        items: [
          { label: 'Item 1', value: '', image: '', link: '', vendor: '', sku: '' },
          { label: 'Item 2', value: '', image: '', link: '', vendor: '', sku: '' },
          { label: 'Item 3', value: '', image: '', link: '', vendor: '', sku: '' }
        ]
      }]
    }));
    setNewSectionName('');
    setShowAddSection(false);
  };

  const deleteCustomSection = (index) => {
    if (!window.confirm('Delete this section?')) return;
    setWholeHomeData(prev => ({
      ...prev,
      customSections: prev.customSections.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-stone-300 text-xl">Loading whole home finishes...</div>
      </div>
    );
  }

  // Render a single finish field with image support
  const FinishField = ({ section, field, label }) => {
    const data = getField(section, field);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const isEditing = editingField === `${section}-${field}`;

    // Paste scraper data into this field
    const pasteScraperData = async () => {
      // Check for scraper data first
      const scraperData = localStorage.getItem('wholeHomeScraperData');
      if (scraperData) {
        try {
          const data = JSON.parse(scraperData);
          updateField(section, field, {
            value: data.name || data.finish || '',
            image: data.image || data.finish_image || '',
            link: data.link || '',
            vendor: data.vendor || '',
            sku: data.sku || ''
          });
          localStorage.removeItem('wholeHomeScraperData');
          return;
        } catch (err) {
          console.error('Error parsing scraper data:', err);
        }
      }
      
      // Try clipboard
      try {
        const clipText = await navigator.clipboard.readText();
        try {
          const clipData = JSON.parse(clipText);
          if (clipData.name || clipData.image_url) {
            updateField(section, field, {
              value: clipData.name || clipData.finish_color || '',
              image: clipData.image_url || clipData.finish_image || '',
              link: clipData.link || clipData.url || '',
              vendor: clipData.vendor || '',
              sku: clipData.sku || ''
            });
            return;
          }
        } catch {
          // Not JSON, use as plain text
          const currentData = getField(section, field);
          updateField(section, field, { ...currentData, value: clipText });
        }
      } catch (err) {
        alert('Please allow clipboard access or use the scraper extension');
      }
    };

    return (
      <div className="group relative">
        <label className="text-xs text-stone-400 mb-1 block">{label}</label>
        <div className="flex gap-2">
          {/* Image thumbnail */}
          <div 
            className="w-12 h-12 flex-shrink-0 rounded border border-[#8b7355]/50 overflow-hidden cursor-pointer hover:border-[#d4af37] transition-colors bg-gray-800 flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            {data.image ? (
              <img src={data.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-4 h-4 text-stone-500" />
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={(e) => handleImageUpload(e, section, field)}
            />
          </div>
          
          {/* Editable text input */}
          <div className="flex-1">
            <div className="flex gap-1">
              <input 
                ref={inputRef}
                type="text" 
                className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-l border border-[#8b7355]/50 text-sm focus:border-[#d4af37] focus:outline-none"
                placeholder={`Enter ${label.toLowerCase()}...`}
                value={data.value || ''}
                onChange={(e) => updateField(section, field, { ...data, value: e.target.value })}
                onPaste={(e) => handlePaste(e, section, field)}
                onFocus={() => setEditingField(`${section}-${field}`)}
                onBlur={() => setTimeout(() => setEditingField(null), 200)}
              />
              {/* PASTE BUTTON */}
              <button
                onClick={pasteScraperData}
                className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-r border border-green-600 transition-colors"
                title="Paste from scraper or clipboard"
              >
                📋 PASTE
              </button>
            </div>
            
            {/* Extra fields shown when editing */}
            {isEditing && (
              <div className="mt-2 space-y-2 p-2 bg-gray-800 rounded border border-[#8b7355]/30">
                <input 
                  type="text" 
                  className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-[#8b7355]/30 text-xs"
                  placeholder="Vendor..."
                  value={data.vendor || ''}
                  onChange={(e) => updateField(section, field, { ...data, vendor: e.target.value })}
                />
                <input 
                  type="text" 
                  className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-[#8b7355]/30 text-xs"
                  placeholder="SKU..."
                  value={data.sku || ''}
                  onChange={(e) => updateField(section, field, { ...data, sku: e.target.value })}
                />
                <input 
                  type="text" 
                  className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-[#8b7355]/30 text-xs"
                  placeholder="Link/URL..."
                  value={data.link || ''}
                  onChange={(e) => updateField(section, field, { ...data, link: e.target.value })}
                />
                <button
                  onClick={() => addToFinishLibrary(data, label)}
                  className="w-full px-2 py-1 text-xs bg-[#8b7355] hover:bg-[#a0845c] text-white rounded flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add to Finish Library
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 rounded-lg" style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      border: '1px solid #8b7355'
    }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid #8b7355' }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>🏠 Whole Home Finishes</h2>
          <p className="text-stone-400 text-sm mt-1">Click any field to edit • Paste from scraper or spreadsheet • Click image to upload</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddSection(true)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 100%)', color: 'white' }}
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
          <button
            onClick={saveWholeHomeData}
            disabled={saving}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
            style={{ background: '#10B981', color: 'white' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Scraper data indicator */}
      {localStorage.getItem('wholeHomeScraperData') && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg flex items-center gap-2">
          <Clipboard className="w-5 h-5 text-green-400" />
          <span className="text-green-300 text-sm">Scraped data ready! Click any field to apply it.</span>
          <button 
            onClick={() => { localStorage.removeItem('wholeHomeScraperData'); window.location.reload(); }}
            className="ml-auto text-xs text-red-400 hover:text-red-300"
          >
            Clear
          </button>
        </div>
      )}

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Door Hardware */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🚪 Door Hardware</h3>
          <div className="space-y-4">
            <FinishField section="doorHardware" field="interior" label="Interior Handles" />
            <FinishField section="doorHardware" field="exterior" label="Exterior Handles" />
            <FinishField section="doorHardware" field="hinges" label="Hinges" />
            <FinishField section="doorHardware" field="deadbolts" label="Deadbolts" />
          </div>
        </div>

        {/* Paint */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🎨 Paint</h3>
          <div className="space-y-4">
            <FinishField section="paint" field="brand" label="Brand" />
            <FinishField section="paint" field="walls" label="Walls" />
            <FinishField section="paint" field="trim" label="Trim" />
            <FinishField section="paint" field="ceiling" label="Ceiling" />
            <FinishField section="paint" field="accent" label="Accent" />
          </div>
        </div>

        {/* Flooring */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🪵 Flooring</h3>
          <div className="space-y-4">
            <FinishField section="flooring" field="primary" label="Primary Flooring" />
            <FinishField section="flooring" field="secondary" label="Secondary Flooring" />
            <FinishField section="flooring" field="transitions" label="Transitions" />
          </div>
        </div>

        {/* Electrical */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>⚡ Electrical</h3>
          <div className="space-y-4">
            <FinishField section="electrical" field="outlets" label="Outlets" />
            <FinishField section="electrical" field="switches" label="Switches" />
            <FinishField section="electrical" field="plates" label="Plates" />
          </div>
        </div>

        {/* Plumbing */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🚿 Plumbing</h3>
          <div className="space-y-4">
            <FinishField section="plumbing" field="faucets" label="Faucets" />
            <FinishField section="plumbing" field="showerheads" label="Showerheads" />
            <FinishField section="plumbing" field="toilets" label="Toilets" />
          </div>
        </div>

        {/* Custom Sections */}
        {wholeHomeData.customSections?.map((section, sectionIndex) => (
          <div key={sectionIndex} className="rounded-lg p-4 relative" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
            <button
              onClick={() => deleteCustomSection(sectionIndex)}
              className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>📦 {section.name}</h3>
            <div className="space-y-4">
              {section.items?.map((item, itemIndex) => (
                <div key={itemIndex} className="group relative">
                  <label className="text-xs text-stone-400 mb-1 block">
                    <input 
                      type="text" 
                      className="bg-transparent border-none text-xs text-stone-400 focus:outline-none"
                      value={item.label || `Item ${itemIndex + 1}`}
                      onChange={(e) => {
                        const newSections = [...wholeHomeData.customSections];
                        newSections[sectionIndex].items[itemIndex].label = e.target.value;
                        setWholeHomeData(prev => ({ ...prev, customSections: newSections }));
                      }}
                    />
                  </label>
                  <div className="flex gap-2">
                    <div 
                      className="w-12 h-12 flex-shrink-0 rounded border border-[#8b7355]/50 overflow-hidden cursor-pointer hover:border-[#d4af37] bg-gray-800 flex items-center justify-center"
                      onClick={() => document.getElementById(`custom-file-${sectionIndex}-${itemIndex}`)?.click()}
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-4 h-4 text-stone-500" />
                      )}
                      <input 
                        id={`custom-file-${sectionIndex}-${itemIndex}`}
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const newSections = [...wholeHomeData.customSections];
                            newSections[sectionIndex].items[itemIndex].image = event.target.result;
                            setWholeHomeData(prev => ({ ...prev, customSections: newSections }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                    <input 
                      type="text" 
                      className="flex-1 bg-gray-900 text-white px-3 py-2 rounded border border-[#8b7355]/50 text-sm focus:border-[#d4af37] focus:outline-none"
                      placeholder={`Enter ${item.label || 'item'}...`}
                      value={item.value || ''}
                      onChange={(e) => {
                        const newSections = [...wholeHomeData.customSections];
                        newSections[sectionIndex].items[itemIndex].value = e.target.value;
                        setWholeHomeData(prev => ({ ...prev, customSections: newSections }));
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  const newSections = [...wholeHomeData.customSections];
                  newSections[sectionIndex].items.push({ label: `Item ${section.items.length + 1}`, value: '', image: '' });
                  setWholeHomeData(prev => ({ ...prev, customSections: newSections }));
                }}
                className="w-full py-2 text-xs text-[#d4af37] border border-dashed border-[#8b7355]/50 rounded hover:bg-[#8b7355]/20"
              >
                + Add Item
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddSection(false)}>
          <div className="bg-gray-900 p-6 rounded-xl border border-[#8b7355]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>Add Custom Section</h3>
            <input
              type="text"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-[#8b7355]/50 mb-4"
              placeholder="Section name..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomSection()}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAddSection(false)} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
              <button onClick={addCustomSection} className="flex-1 px-4 py-2 bg-[#8b7355] text-white rounded">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WholeHomeFinishes;
