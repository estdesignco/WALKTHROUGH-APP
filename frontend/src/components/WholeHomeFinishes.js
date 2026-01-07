import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit3 } from 'lucide-react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const WholeHomeFinishes = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  
  const [wholeHomeData, setWholeHomeData] = useState({
    doorHardware: { interior: '', exterior: '', hinges: '', deadbolts: '' },
    paint: { walls: '', trim: '', ceiling: '', accent: '', brand: '' },
    flooring: { primary: '', secondary: '', transitions: '' },
    electrical: { outlets: '', switches: '', plates: '' },
    plumbing: { faucets: '', showerheads: '', toilets: '' },
    customSections: []
  });

  useEffect(() => {
    loadWholeHomeData();
  }, [projectId]);

  const loadWholeHomeData = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/whole-home-finishes`);
      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          setWholeHomeData(prev => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Failed to load whole home data:', error);
    } finally {
      setLoading(false);
    }
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

  const addCustomSection = () => {
    if (!newSectionName.trim()) return;
    setWholeHomeData(prev => ({
      ...prev,
      customSections: [...(prev.customSections || []), { name: newSectionName, items: ['', '', ''] }]
    }));
    setNewSectionName('');
    setShowAddSection(false);
  };

  const updateCustomSection = (index, itemIndex, value) => {
    setWholeHomeData(prev => {
      const sections = [...(prev.customSections || [])];
      sections[index].items[itemIndex] = value;
      return { ...prev, customSections: sections };
    });
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

  const inputClass = "w-full bg-gray-900 text-white px-3 py-2 rounded border border-[#8b7355]/50 text-sm focus:border-[#d4af37] focus:outline-none";
  const labelClass = "text-xs text-stone-400 mb-1 block";

  return (
    <div className="p-6 rounded-lg" style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
      border: '1px solid #8b7355'
    }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid #8b7355' }}>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>🏠 Whole Home Finishes</h2>
          <p className="text-stone-400 text-sm mt-1">Items that apply to the entire home or multiple rooms</p>
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

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Door Hardware */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🚪 Door Hardware</h3>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Interior Handles</label>
              <input type="text" className={inputClass} placeholder="Interior door handles"
                value={wholeHomeData.doorHardware?.interior || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, doorHardware: { ...prev.doorHardware, interior: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Exterior Handles</label>
              <input type="text" className={inputClass} placeholder="Exterior door handles"
                value={wholeHomeData.doorHardware?.exterior || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, doorHardware: { ...prev.doorHardware, exterior: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Hinges</label>
              <input type="text" className={inputClass} placeholder="Hinge finish"
                value={wholeHomeData.doorHardware?.hinges || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, doorHardware: { ...prev.doorHardware, hinges: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Deadbolts</label>
              <input type="text" className={inputClass} placeholder="Deadbolt finish"
                value={wholeHomeData.doorHardware?.deadbolts || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, doorHardware: { ...prev.doorHardware, deadbolts: e.target.value }}))}
              />
            </div>
          </div>
        </div>

        {/* Paint */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🎨 Paint</h3>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Brand</label>
              <input type="text" className={inputClass} placeholder="Paint brand"
                value={wholeHomeData.paint?.brand || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, paint: { ...prev.paint, brand: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Walls</label>
              <input type="text" className={inputClass} placeholder="Wall color"
                value={wholeHomeData.paint?.walls || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, paint: { ...prev.paint, walls: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Trim</label>
              <input type="text" className={inputClass} placeholder="Trim color"
                value={wholeHomeData.paint?.trim || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, paint: { ...prev.paint, trim: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Ceiling</label>
              <input type="text" className={inputClass} placeholder="Ceiling color"
                value={wholeHomeData.paint?.ceiling || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, paint: { ...prev.paint, ceiling: e.target.value }}))}
              />
            </div>
          </div>
        </div>

        {/* Flooring */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🪵 Flooring</h3>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Primary Flooring</label>
              <input type="text" className={inputClass} placeholder="Main flooring type"
                value={wholeHomeData.flooring?.primary || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, flooring: { ...prev.flooring, primary: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Secondary Flooring</label>
              <input type="text" className={inputClass} placeholder="Secondary flooring"
                value={wholeHomeData.flooring?.secondary || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, flooring: { ...prev.flooring, secondary: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Transitions</label>
              <input type="text" className={inputClass} placeholder="Transition strips"
                value={wholeHomeData.flooring?.transitions || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, flooring: { ...prev.flooring, transitions: e.target.value }}))}
              />
            </div>
          </div>
        </div>

        {/* Electrical */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>⚡ Electrical</h3>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Outlets</label>
              <input type="text" className={inputClass} placeholder="Outlet style/color"
                value={wholeHomeData.electrical?.outlets || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, electrical: { ...prev.electrical, outlets: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Switches</label>
              <input type="text" className={inputClass} placeholder="Switch style/color"
                value={wholeHomeData.electrical?.switches || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, electrical: { ...prev.electrical, switches: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Plates</label>
              <input type="text" className={inputClass} placeholder="Plate finish"
                value={wholeHomeData.electrical?.plates || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, electrical: { ...prev.electrical, plates: e.target.value }}))}
              />
            </div>
          </div>
        </div>

        {/* Plumbing */}
        <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#d4af37' }}>🚿 Plumbing</h3>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Faucet Finish</label>
              <input type="text" className={inputClass} placeholder="Faucet finish"
                value={wholeHomeData.plumbing?.faucets || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, plumbing: { ...prev.plumbing, faucets: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Showerheads</label>
              <input type="text" className={inputClass} placeholder="Showerhead style"
                value={wholeHomeData.plumbing?.showerheads || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, plumbing: { ...prev.plumbing, showerheads: e.target.value }}))}
              />
            </div>
            <div>
              <label className={labelClass}>Toilets</label>
              <input type="text" className={inputClass} placeholder="Toilet style"
                value={wholeHomeData.plumbing?.toilets || ''}
                onChange={(e) => setWholeHomeData(prev => ({ ...prev, plumbing: { ...prev.plumbing, toilets: e.target.value }}))}
              />
            </div>
          </div>
        </div>

        {/* Custom Sections */}
        {(wholeHomeData.customSections || []).map((section, sectionIndex) => (
          <div key={sectionIndex} className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #8b7355' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#d4af37' }}>📦 {section.name}</h3>
              <button onClick={() => deleteCustomSection(sectionIndex)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <input key={itemIndex} type="text" className={inputClass} placeholder={`Item ${itemIndex + 1}`}
                  value={item}
                  onChange={(e) => updateCustomSection(sectionIndex, itemIndex, e.target.value)}
                />
              ))}
              <button 
                onClick={() => {
                  const sections = [...wholeHomeData.customSections];
                  sections[sectionIndex].items.push('');
                  setWholeHomeData(prev => ({ ...prev, customSections: sections }));
                }}
                className="text-sm text-stone-400 hover:text-white"
              >
                + Add item
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-md w-full" style={{ background: '#2a2a2a', border: '1px solid #8b7355' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#d4af37' }}>Add Custom Section</h3>
            <input 
              type="text"
              className={inputClass}
              placeholder="Section name (e.g., 'Closet Hardware')"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAddSection(false)} className="px-4 py-2 text-stone-400 hover:text-white">
                Cancel
              </button>
              <button onClick={addCustomSection} className="px-4 py-2 rounded-lg" style={{ background: '#d4af37', color: 'black' }}>
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WholeHomeFinishes;
