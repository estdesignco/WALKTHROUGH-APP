import React, { useState, useEffect, useCallback } from 'react';
import { getStatusColor } from '../utils/statusColors';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const SURFACE_ICONS = {
  wall: '|',
  floor: '_',
  ceiling: '^',
  niche: '[]',
  trim: '~',
};

const SCHEDULE_TYPES = [
  { value: 'tile', label: 'Tile Schedule' },
  { value: 'paint_wallpaper', label: 'Paint / Wallpaper' },
  { value: 'wood_mixed', label: 'Wood / Mixed Materials' },
];

const RoomFinishSchedule = ({ projectId, roomId, roomName, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('tile');
  const [saving, setSaving] = useState(false);
  const [roomItems, setRoomItems] = useState([]);
  const [showAddMaterial, setShowAddMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState({ name: '', vendor: '', sku: '', size: '', color: '', image: '', link: '', position_label: '' });

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`);
      const data = await res.json();
      setSchedules(data);
      if (data.length > 0 && !activeSchedule) setActiveSchedule(data[0]);
    } catch (err) { console.error('Failed to fetch schedules:', err); }
    finally { setLoading(false); }
  }, [projectId, roomId, activeSchedule]);

  const fetchRoomItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`);
      const project = await res.json();
      const room = (project.rooms || []).find(r => r.id === roomId);
      if (!room) return;
      const items = [];
      (room.categories || []).forEach(cat => {
        (cat.subcategories || []).forEach(sub => {
          (sub.items || []).forEach(item => {
            items.push({ ...item, categoryName: cat.name });
          });
        });
      });
      setRoomItems(items);
    } catch (err) { console.error('Failed to fetch room items:', err); }
  }, [projectId, roomId]);

  useEffect(() => { fetchSchedules(); fetchRoomItems(); }, [fetchSchedules, fetchRoomItems]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/rooms/${roomId}/finish-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_type: newType, name: newName.trim() })
      });
      const schedule = await res.json();
      setSchedules(prev => [...prev, schedule]);
      setActiveSchedule(schedule);
      setShowCreate(false);
      setNewName('');
    } catch (err) { console.error('Failed to create schedule:', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${scheduleId}`, { method: 'DELETE' });
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      if (activeSchedule?.id === scheduleId) setActiveSchedule(null);
    } catch (err) { console.error('Failed to delete:', err); }
  };

  const handleAddMaterial = async (surfaceId) => {
    if (!activeSchedule) return;
    setSaving(true);
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      return { ...s, materials: [...s.materials, { id: crypto.randomUUID(), ...materialForm }] };
    });
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${activeSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaces: updatedSurfaces })
      });
      const updated = await res.json();
      setActiveSchedule(updated);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
      setShowAddMaterial(null);
      setMaterialForm({ name: '', vendor: '', sku: '', size: '', color: '', image: '', link: '', position_label: '' });
    } catch (err) { console.error('Failed to add material:', err); }
    finally { setSaving(false); }
  };

  const handleRemoveMaterial = async (surfaceId, materialId) => {
    if (!activeSchedule) return;
    const updatedSurfaces = activeSchedule.surfaces.map(s => {
      if (s.id !== surfaceId) return s;
      return { ...s, materials: s.materials.filter(m => m.id !== materialId) };
    });
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${activeSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaces: updatedSurfaces })
      });
      const updated = await res.json();
      setActiveSchedule(updated);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) { console.error('Failed to remove material:', err); }
  };

  const handleAddFromItem = (item) => {
    setMaterialForm({
      name: item.name || '',
      vendor: item.vendor || '',
      sku: item.sku || '',
      size: item.size || '',
      color: item.finish_color || item.color || '',
      image: item.image || item.image_url || '',
      link: item.link || '',
      position_label: '',
      item_id: item.id,
    });
  };

  const handleAddSurface = async () => {
    if (!activeSchedule) return;
    const name = prompt('Surface name (e.g., "Accent Niche", "Window Sill"):');
    if (!name) return;
    const updatedSurfaces = [...activeSchedule.surfaces, { id: crypto.randomUUID(), name, surface_type: 'wall', materials: [] }];
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/finish-schedules/${activeSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surfaces: updatedSurfaces })
      });
      const updated = await res.json();
      setActiveSchedule(updated);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) { console.error('Failed to add surface:', err); }
  };

  if (loading) return <div className="text-center py-12 text-[#D4C5A9]/60">Loading schedules...</div>;

  return (
    <div className="rounded-2xl border border-[#B49B7E]/30 p-4" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.9) 50%, rgba(0,0,0,0.95) 100%)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-white" data-testid="schedule-header">
            Room Finish Schedules
          </h3>
          <div className="text-sm text-[#B49B7E]">{roomName}</div>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="create-schedule-btn"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' }}
          >
            + New Schedule
          </button>
          {onClose && (
            <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm text-[#D4C5A9]/60 hover:text-white border border-[#B49B7E]/30">
              Close
            </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-4 p-4 rounded-lg border border-[#B49B7E]/30" style={{ background: 'rgba(30,30,40,0.9)' }}>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              data-testid="schedule-name-input"
              placeholder="Schedule name (e.g., Primary Shower)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#B49B7E] bg-black/50 text-white focus:outline-none"
            />
            <div className="flex gap-2">
              {SCHEDULE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setNewType(t.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${newType === t.value ? 'text-white' : 'text-[#D4C5A9]/50 border border-[#B49B7E]/20'}`}
                  style={newType === t.value ? { background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving || !newName.trim()} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-[#D4C5A9]/60 border border-[#B49B7E]/30">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tabs */}
      {schedules.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {schedules.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSchedule(s)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeSchedule?.id === s.id ? 'text-white' : 'text-[#D4C5A9]/60 border border-[#B49B7E]/20 hover:border-[#B49B7E]/50'}`}
              style={activeSchedule?.id === s.id ? { background: 'linear-gradient(135deg, #D4A574 0%, #8B7355 100%)' } : {}}
            >
              {s.name}
              <span className="ml-2 text-xs opacity-60">({SCHEDULE_TYPES.find(t => t.value === s.schedule_type)?.label || s.schedule_type})</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Schedule Content */}
      {activeSchedule ? (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-bold text-[#D4A574]">{activeSchedule.name}</h4>
            <div className="flex gap-2">
              <button onClick={handleAddSurface} className="px-3 py-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-500">+ Add Surface</button>
              <button onClick={() => handleDelete(activeSchedule.id)} className="px-3 py-1 rounded text-xs text-white bg-red-700 hover:bg-red-600">Delete</button>
            </div>
          </div>

          {/* Visual Elevation Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSchedule.surfaces.map(surface => (
              <div key={surface.id} className="rounded-lg border border-[#B49B7E]/30 overflow-hidden" style={{ background: 'rgba(15,15,25,0.8)' }}>
                {/* Surface Header */}
                <div className="flex justify-between items-center px-3 py-2 border-b border-[#B49B7E]/20" style={{ background: 'rgba(180,155,126,0.15)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[#B49B7E] font-mono text-xs">{SURFACE_ICONS[surface.surface_type] || '|'}</span>
                    <span className="text-white font-bold text-sm">{surface.name}</span>
                    <span className="text-[#B49B7E]/40 text-xs">({surface.materials.length} material{surface.materials.length !== 1 ? 's' : ''})</span>
                  </div>
                  <button
                    data-testid={`add-material-${surface.id}`}
                    onClick={() => { setShowAddMaterial(surface.id); setMaterialForm({ name: '', vendor: '', sku: '', size: '', color: '', image: '', link: '', position_label: '' }); }}
                    className="px-2 py-1 rounded text-xs font-bold text-white bg-green-700 hover:bg-green-600"
                  >
                    + Material
                  </button>
                </div>

                {/* Materials as tile swatches */}
                <div className="p-2">
                  {surface.materials.length === 0 ? (
                    <div className="text-center py-4 text-[#B49B7E]/30 text-xs italic">No materials assigned — click + Material to add</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {surface.materials.map(mat => (
                        <div key={mat.id} className="group relative">
                          {/* Tile Swatch */}
                          <div
                            className="w-20 h-20 rounded-lg border-2 border-[#B49B7E]/40 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-[#D4A574] hover:scale-105"
                            style={{ background: mat.image ? `url(${mat.image}) center/cover` : (mat.color || '#333') }}
                            onClick={() => { if (mat.link) window.open(mat.link, '_blank'); }}
                            data-testid={`tile-swatch-${mat.id}`}
                          >
                            {!mat.image && !mat.color && (
                              <span className="text-white text-xs text-center px-1 leading-tight">{mat.name?.substring(0, 15) || '?'}</span>
                            )}
                          </div>
                          {/* Position Label */}
                          {mat.position_label && (
                            <div className="text-center text-[10px] text-[#B49B7E] mt-1 truncate w-20">{mat.position_label}</div>
                          )}
                          {/* Hover Tooltip */}
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 rounded-lg border border-[#B49B7E]/40 text-xs shadow-xl" style={{ background: 'rgba(0,0,0,0.95)' }}>
                            <div className="text-white font-bold">{mat.name}</div>
                            {mat.vendor && <div className="text-[#B49B7E]">Vendor: {mat.vendor}</div>}
                            {mat.sku && <div className="text-[#B49B7E]">SKU: {mat.sku}</div>}
                            {mat.size && <div className="text-[#B49B7E]">Size: {mat.size}</div>}
                            {mat.color && <div className="text-[#B49B7E]">Color: {mat.color}</div>}
                            {mat.link && <div className="text-blue-400 underline">Click to view</div>}
                          </div>
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveMaterial(surface.id, mat.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Material Form (inline) */}
                {showAddMaterial === surface.id && (
                  <div className="p-3 border-t border-[#B49B7E]/20" style={{ background: 'rgba(30,30,40,0.9)' }}>
                    {/* Quick pick from room items */}
                    {roomItems.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-[#B49B7E] mb-1">Quick pick from room items:</div>
                        <div className="flex gap-1 flex-wrap max-h-24 overflow-y-auto">
                          {roomItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleAddFromItem(item)}
                              className="px-2 py-1 rounded text-[10px] text-white border border-[#B49B7E]/20 hover:border-[#D4A574] truncate max-w-[140px]"
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input placeholder="Material name" value={materialForm.name} onChange={e => setMaterialForm(p => ({...p, name: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                      <input placeholder="Vendor" value={materialForm.vendor} onChange={e => setMaterialForm(p => ({...p, vendor: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                      <input placeholder="SKU" value={materialForm.sku} onChange={e => setMaterialForm(p => ({...p, sku: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                      <input placeholder="Size (e.g., 12x24)" value={materialForm.size} onChange={e => setMaterialForm(p => ({...p, size: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                      <input placeholder="Color" value={materialForm.color} onChange={e => setMaterialForm(p => ({...p, color: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                      <input placeholder="Image URL" value={materialForm.image} onChange={e => setMaterialForm(p => ({...p, image: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                      <input placeholder="Product link" value={materialForm.link} onChange={e => setMaterialForm(p => ({...p, link: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                      <input placeholder="Position (e.g., Upper, Border)" value={materialForm.position_label} onChange={e => setMaterialForm(p => ({...p, position_label: e.target.value}))} className="px-2 py-1 rounded border border-[#B49B7E]/30 bg-black/50 text-white text-xs focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddMaterial(surface.id)} disabled={saving || !materialForm.name} className="px-3 py-1 rounded text-xs font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50">
                        {saving ? 'Adding...' : 'Add Material'}
                      </button>
                      <button onClick={() => setShowAddMaterial(null)} className="px-3 py-1 rounded text-xs text-[#D4C5A9]/60 border border-[#B49B7E]/30">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-[#D4C5A9]/40 text-lg mb-2">No finish schedules yet</div>
          <div className="text-[#B49B7E]/40 text-sm">Create a Tile Schedule, Paint/Wallpaper, or Wood/Mixed schedule for this room</div>
        </div>
      ) : null}
    </div>
  );
};

export default RoomFinishSchedule;
