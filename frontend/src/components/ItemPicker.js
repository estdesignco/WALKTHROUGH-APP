/**
 * ItemPicker — narrow-by-room, doc-toggle item picker for Tasks/To-Do.
 * ====================================================================
 * Replaces the "type to search 4,000+ items by name/SKU/vendor" autocomplete
 * which was painful to use. Now mirrors the Builder Portal scope-tagger UX:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  [ ALL ] [ CHECKLIST ] [ FFE ]   (doc toggle, segmented)│
 *   │  Room: [ Select a room ▼ ]                              │
 *   │  Search: [ ___________________ ] (only within room)     │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  [CHECKLIST]  Curtain Rods/Hardware                     │
 *   │  Bar Area · Window Treatments · Vendor: — · SKU: —      │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  [FFE]  Princeton Bed - King                            │
 *   │  Master Bedroom · Furniture · Vendor: RH                │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Pulls REAL project data: items prop is the flattened FFE+Checklist list
 * already loaded by the parent. Filters live without re-fetching.
 */
import React, { useState, useMemo, useEffect } from 'react';

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'CHECKLIST', label: 'Checklist' },
  { value: 'FFE', label: 'FF&E' },
];

export default function ItemPicker({
  items = [],            // flat array of {id, name, roomName, categoryName, vendor, sku, sourceType}
  onSelect,              // (item) => void
  onCancel,              // () => void — optional close handler
  defaultSourceType = 'all',
  defaultRoomName = '',
  autoFocusSearch = true,
  testIdPrefix = 'itempicker',
}) {
  const [sourceType, setSourceType] = useState(defaultSourceType);
  const [roomName, setRoomName] = useState(defaultRoomName);
  const [search, setSearch] = useState('');

  // Unique rooms — derived from whatever items the parent passed in. We
  // sort alphabetically and keep an "All rooms" sentinel at the top so the
  // picker still works if a room name was misspelled / missing.
  const rooms = useMemo(() => {
    const set = new Set();
    items.forEach(i => { if (i.roomName) set.add(i.roomName); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // Auto-select the first room when the picker opens with no room selected
  // (saves the user one click for the common case of "I want to tag something
  // in the only room I'm working in").
  useEffect(() => {
    if (!roomName && rooms.length === 1) setRoomName(rooms[0]);
  }, [rooms, roomName]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter(item => {
        if (sourceType !== 'all' && item.sourceType !== sourceType) return false;
        if (roomName && item.roomName !== roomName) return false;
        if (!q) return true;
        return (
          (item.name || '').toLowerCase().includes(q) ||
          (item.sku || '').toLowerCase().includes(q) ||
          (item.vendor || '').toLowerCase().includes(q) ||
          (item.categoryName || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 50);
  }, [items, sourceType, roomName, search]);

  // Counts per source for the toggle badges — shows the builder how many
  // items they'll see when they flip the switch.
  const counts = useMemo(() => {
    let chk = 0, ffe = 0;
    items.forEach(i => {
      if (roomName && i.roomName !== roomName) return;
      if (i.sourceType === 'CHECKLIST') chk++;
      else if (i.sourceType === 'FFE') ffe++;
    });
    return { all: chk + ffe, CHECKLIST: chk, FFE: ffe };
  }, [items, roomName]);

  return (
    <div className="space-y-3" data-testid={`${testIdPrefix}-root`}>
      {/* Doc-type segmented toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-black/40 border border-[#B49B7E]/30 w-fit" data-testid={`${testIdPrefix}-doc-toggle`}>
        {SOURCE_OPTIONS.map(opt => {
          const active = sourceType === opt.value;
          const count = counts[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSourceType(opt.value)}
              data-testid={`${testIdPrefix}-doc-${opt.value.toLowerCase()}`}
              className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all ${
                active
                  ? 'bg-[#D4A574] text-black shadow-md'
                  : 'text-[#D4C5A9] hover:bg-white/5'
              }`}
            >
              {opt.label}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-[#B49B7E]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Room dropdown + search — stacked on small screens, side-by-side on wider */}
      <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-2">
        <div>
          <label className="text-[10px] text-[#D4A574] font-bold tracking-widest uppercase block mb-1">Room</label>
          <select
            value={roomName}
            onChange={e => { setRoomName(e.target.value); setSearch(''); }}
            data-testid={`${testIdPrefix}-room-select`}
            className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white text-sm focus:border-[#D4A574] focus:outline-none"
          >
            <option value="">All rooms ({rooms.length})</option>
            {rooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[#D4A574] font-bold tracking-widest uppercase block mb-1">
            Search {roomName ? `in ${roomName}` : 'all rooms'}
          </label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={roomName ? `Search items in ${roomName}…` : 'Pick a room first, or search across all rooms…'}
            data-testid={`${testIdPrefix}-search`}
            autoFocus={autoFocusSearch}
            className="w-full px-3 py-2 rounded-lg bg-black/50 border border-[#B49B7E]/30 text-white text-sm placeholder-gray-500 focus:border-[#D4A574] focus:outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-black/30 border border-[#B49B7E]/20 rounded-lg max-h-72 overflow-y-auto" data-testid={`${testIdPrefix}-results`}>
        {items.length === 0 ? (
          <div className="px-4 py-6 text-yellow-400 text-sm text-center">
            ⚠ No project items loaded yet. Add items to Checklist or FF&amp;E first.
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-gray-400 text-sm text-center">
            {roomName
              ? `No ${sourceType === 'all' ? '' : sourceType + ' '}items in ${roomName}${search ? ` matching "${search}"` : ''}.`
              : `Pick a room above${search ? ' or refine your search' : ''}.`}
          </div>
        ) : (
          filtered.map(item => (
            <button
              key={`${item.sourceType}-${item.id}`}
              type="button"
              onClick={() => onSelect?.(item)}
              data-testid={`${testIdPrefix}-result-${item.id}`}
              className="w-full px-4 py-2.5 text-left hover:bg-[#D4A574]/15 border-b border-[#B49B7E]/10 last:border-b-0 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${item.sourceType === 'CHECKLIST' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                  {item.sourceType === 'CHECKLIST' ? 'CHECKLIST' : 'FF&E'}
                </span>
                <span className="text-white font-medium text-sm">{item.name || '(unnamed)'}</span>
              </div>
              <div className="text-gray-400 text-[11px] mt-1">
                {item.roomName || '—'}
                {item.categoryName && <> &middot; {item.categoryName}</>}
                {item.vendor && <> &middot; {item.vendor}</>}
                {item.sku && <> &middot; SKU: {item.sku}</>}
              </div>
            </button>
          ))
        )}
      </div>

      {onCancel && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            data-testid={`${testIdPrefix}-cancel`}
            className="text-xs text-gray-400 hover:text-red-400 px-3 py-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
