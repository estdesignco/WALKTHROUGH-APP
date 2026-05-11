/**
 * ProposalView — Trade ▶ Room ▶ Items, Checklist-style DnD + inline rename.
 * ==========================================================================
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ COMPANY HEADER (logo, estimate no, date, project)      │
 *   ├────────────────────────────────────────────────────────┤
 *   │ ⋮⋮ ▼  PLUMBING (rename here)                  ✕ delete │  <- TRADE banner
 *   │   ⋮⋮ ▼  MASTER BATHROOM                                │  <- ROOM banner (muted)
 *   │   ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐                       │
 *   │   │⋮⋮│# │DESC│QTY│UNIT│COST│AMT│TOTAL│PROF│X │           │
 *   │   ├──┴──┴──┴──┴──┴──┴──┴──┴──┴──┤                       │
 *   │   │drag row...                  │                       │
 *   │   └─────────────────────────────┘                       │
 *   │   + ADD LINE TO MASTER BATHROOM                         │
 *   │   ⋮⋮ ▼  KITCHEN                                         │
 *   │   ...                                                   │
 *   │   + ADD ROOM TO PLUMBING                                │
 *   │ ⋮⋮ ▼  TILE                                              │
 *   │ ...                                                     │
 *   │ + ADD TRADE                                             │
 *   ├────────────────────────────────────────────────────────┤
 *   │ SUBTOTAL / Less Payment / PM Fee / Tax / TOTAL DUE      │
 *   └────────────────────────────────────────────────────────┘
 *
 * Look & feel parity with `ExactChecklistSpreadsheet.js`:
 *   - Trade banner uses Checklist Room-header recipe (muted gradient + halo +
 *     inset shadows, TRADE_COLORS as the color seed).
 *   - Room banner uses `getMutedRoomHeaderStyleStandalone` (already in use).
 *   - Item rows use Checklist's alternating linear-gradient cell strip.
 *   - Drag handles `⋮⋮` on every banner + row.
 *   - Header names are `contentEditable` for inline rename (Checklist-style).
 *   - DnD via @hello-pangea/dnd at THREE levels: Trade / Room / Line.
 *
 * Persistence: layout (order + renames) saved to portal.proposal_layout via
 * PUT /api/builder/{code}/proposal/layout (works for builder + trade portals).
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getMutedRoomHeaderStyle, getMutedRoomHeaderStyleStandalone, getRoomColor } from '../utils/roomColors';
import { parseScopeDocument, TRADE_COLORS } from './ScopeDocumentEditor';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const PROPOSAL_CSS = `
  /* Spreadsheet-style cell editing — NO boxed inputs anywhere.
     Cells are contentEditable spans that look like plain table cells. */
  .proposal-cell .ce-cell { outline: none; min-height: 18px; cursor: text; }
  .proposal-cell .ce-cell:focus { background: rgba(212,165,116,0.10); box-shadow: inset 0 0 0 1px #D4A574; }
  .proposal-cell .ce-cell:hover { background: rgba(212,165,116,0.04); }
  .proposal-cell .ce-cell:empty::before { content: attr(data-ph); color: #6b6157; }
  .proposal-cell input::-webkit-outer-spin-button,
  .proposal-cell input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .proposal-cell input[type=number] { -moz-appearance: textfield; }
  .proposal-cell input { background: transparent; outline: none; border: none; width: 100%; color: inherit; font: inherit; padding: 0; }
  .proposal-cell input:focus { background: rgba(212,165,116,0.08); }
  .proposal-drag-handle { cursor: grab; user-select: none; }
  .proposal-drag-handle:active { cursor: grabbing; }
  .proposal-banner-name { outline: none; }
  .proposal-banner-name:focus { background: rgba(0,0,0,0.25); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4); }
  /* Make sure dragging trades doesn't break inline tables width */
  .proposal-trade-block { background: transparent; }
  .proposal-room-block { background: transparent; }
  @media print {
    .no-print { display: none !important; }
    .proposal-cell .ce-cell { color: #000 !important; }
    .proposal-drag-handle { display: none !important; }
  }
`;

const fmt = (n) => (n === null || n === undefined || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSD = (n) => `$${fmt(n || 0)}`;
const compute = (qty, cost, markup) => (Number(qty) || 0) * (Number(cost) || 0) * (1 + (Number(markup) || 0) / 100);
const computeAmount = (qty, cost) => (Number(qty) || 0) * (Number(cost) || 0);

// Strip ONLY #trade pills from scope HTML — keep @person / @product pills
// because they're meaningful content (e.g. "Hang light fixture @Jerome").
const stripTradePills = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[data-tag="trade"], .trade-pill').forEach(el => el.remove());
  return div.innerHTML.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
};

const stableLineId = (room, trade, text) => {
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let h = 5381;
  const s = `${norm(room)}|${norm(trade)}|${norm(text)}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `sl_${(h >>> 0).toString(36)}`;
};

const useDebounced = (fn, delay = 350) => {
  const timer = useRef(null);
  return (...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  };
};

// Reorder helper for DnD
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export default function ProposalView({ accessCode, kind = 'builder', onPortalChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccept, setShowAccept] = useState(false);
  const [signature, setSignature] = useState('');
  const [overrides, setOverrides] = useState({});  // { line_id: {...} }
  const [extras, setExtras] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [notes, setNotes] = useState('');
  const [lessPayment, setLessPayment] = useState(0);
  // Local layout state — mirrors portal.proposal_layout but updated optimistically.
  const [layout, setLayout] = useState({ trade_order: [], room_order: {}, line_order: {}, trade_renames: {}, room_renames: {} });
  // Collapse state — local to viewer (not persisted to server)
  const [collapsedTrades, setCollapsedTrades] = useState(new Set());
  const [collapsedRooms, setCollapsedRooms] = useState(new Set());
  const toggleTrade = (t) => setCollapsedTrades(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const toggleRoom = (key) => setCollapsedRooms(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        const map = {};
        (json.overrides || []).forEach(o => { map[o.item_id] = o; });
        setOverrides(map);
        setExtras(json.extras || []);
        setNotes(json.portal?.proposal_notes || '');
        setLessPayment(json.portal?.proposal_less_payment || 0);
        const lay = json.portal?.proposal_layout || {};
        setLayout({
          trade_order: lay.trade_order || [],
          room_order: lay.room_order || {},
          line_order: lay.line_order || {},
          trade_renames: lay.trade_renames || {},
          room_renames: lay.room_renames || {},
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  const loadSnippets = async () => {
    const res = await fetch(`${API_URL}/api/proposal/snippets?owner_kind=${kind}&owner_id=${accessCode}`);
    if (res.ok) setSnippets(await res.json());
  };
  useEffect(() => { load(); loadSnippets(); /* eslint-disable-next-line */ }, [accessCode]);

  const portal = data?.portal || {};
  const editEnabled = !!portal.proposal_edit_enabled;
  const viewEnabled = !!portal.proposal_view_enabled;
  const accepted = !!portal.proposal_accepted;
  const tradeQuotes = data?.trade_quotes || {};

  // ========================= LAYOUT PERSISTENCE =========================
  const debouncedPersistLayout = useDebounced(async (lay) => {
    try {
      await fetch(`${API_URL}/api/builder/${accessCode}/proposal/layout`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_layout: lay }),
      });
    } catch (e) { console.error('layout save failed', e); }
  }, 350);
  const updateLayout = (patch) => {
    setLayout(prev => {
      const next = { ...prev, ...patch };
      debouncedPersistLayout(next);
      return next;
    });
  };

  // ========================= GROUP BY TRADE → ROOM =========================
  const roomColorByName = useMemo(() => {
    const m = {};
    (data?.rooms || []).forEach(r => { m[(r.name || '').toUpperCase()] = r.color || getRoomColor(r.name); });
    return m;
  }, [data]);

  const grouped = useMemo(() => {
    const html = data?.scope_document || '';
    const projectRooms = data?.rooms || [];
    const parsed = parseScopeDocument(html, projectRooms);
    const assigned = (kind === 'trade')
      ? (portal.assigned_trades && portal.assigned_trades.length
          ? portal.assigned_trades.map(t => (t || '').toUpperCase())
          : [(portal.trade_name || '').toUpperCase()])
      : null;

    // First-pass: gather trades & rooms from scope in DOC order
    const scopeTradeOrder = [];
    const byTrade = {};

    parsed.items.forEach(item => {
      const rName = (item.roomName || 'GENERAL').toUpperCase();
      const tradeKeys = (item.trades && item.trades.length ? item.trades : []).map(t => (t || '').toUpperCase());
      if (assigned && tradeKeys.length && !tradeKeys.some(t => assigned.includes(t))) return;
      if (assigned && !tradeKeys.length) return;
      const lineTrades = tradeKeys.length ? tradeKeys : ['GENERAL'];
      lineTrades.forEach(T => {
        if (!byTrade[T]) { byTrade[T] = { tradeName: T, rooms: {}, roomOrder: [] }; scopeTradeOrder.push(T); }
        if (!byTrade[T].rooms[rName]) { byTrade[T].rooms[rName] = []; byTrade[T].roomOrder.push(rName); }
        byTrade[T].rooms[rName].push({
          line_id: stableLineId(rName, T, item.text),
          text: item.text,
          html: item.html,
          source: 'scope',
        });
      });
    });

    // Merge extras (custom user-added lines)
    extras.forEach(e => {
      if (e.parent_kind !== 'trade-room' && e.parent_kind !== 'trade-only') return;
      const [T, R] = (e.parent_id || '').split('::');
      const TT = (T || 'GENERAL').toUpperCase();
      const RR = (R || 'GENERAL').toUpperCase();
      if (assigned && !assigned.includes(TT)) return;
      if (!byTrade[TT]) { byTrade[TT] = { tradeName: TT, rooms: {}, roomOrder: [] }; scopeTradeOrder.push(TT); }
      if (!byTrade[TT].rooms[RR]) { byTrade[TT].rooms[RR] = []; byTrade[TT].roomOrder.push(RR); }
      byTrade[TT].rooms[RR].push({
        line_id: e.id,
        text: e.name,
        html: e.name,
        source: 'extra',
        extra: e,
      });
    });

    // Apply layout: trade_order overrides doc order (with unseen trades appended)
    const persistedTrades = (layout.trade_order || []).filter(t => byTrade[t]);
    const persistedSet = new Set(persistedTrades);
    const finalTradeOrder = [
      ...persistedTrades,
      ...scopeTradeOrder.filter(t => !persistedSet.has(t)),
    ];

    return finalTradeOrder.map(T => {
      const tg = byTrade[T];
      const persistedRooms = (layout.room_order?.[T] || []).filter(r => tg.rooms[r]);
      const persistedRoomSet = new Set(persistedRooms);
      const finalRoomOrder = [
        ...persistedRooms,
        ...tg.roomOrder.filter(r => !persistedRoomSet.has(r)),
      ];

      const roomGroups = finalRoomOrder.map(R => {
        const allLines = tg.rooms[R];
        const orderKey = `${T}::${R}`;
        const persistedLineOrder = layout.line_order?.[orderKey] || [];
        const idToIdx = new Map(persistedLineOrder.map((id, i) => [id, i]));
        const ordered = [...allLines].sort((a, b) => {
          const ai = idToIdx.has(a.line_id) ? idToIdx.get(a.line_id) : 1e9;
          const bi = idToIdx.has(b.line_id) ? idToIdx.get(b.line_id) : 1e9;
          if (ai !== bi) return ai - bi;
          return 0; // preserve natural order
        });
        return {
          roomName: R,
          displayName: layout.room_renames?.[orderKey] || R,
          lines: ordered,
        };
      });

      return {
        tradeName: T,
        displayName: layout.trade_renames?.[T] || T,
        roomGroups,
      };
    });
  }, [data, kind, portal, extras, layout]);

  // ========================= MUTATIONS =========================
  const debouncedPersistOverride = useDebounced(async (lineId, payload) => {
    try {
      await fetch(`${API_URL}/api/builder/${accessCode}/proposal/override`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: lineId, ...payload }),
      });
    } catch (e) { console.error('override save failed', e); }
  }, 350);

  const saveOverride = (lineId, patch) => {
    if (!editEnabled) return;
    setOverrides(prev => {
      const next = { ...prev, [lineId]: { ...(prev[lineId] || { item_id: lineId }), ...patch } };
      debouncedPersistOverride(lineId, next[lineId]);
      return next;
    });
  };

  const debouncedExtraUpdate = useDebounced(async (id, patch) => {
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, 350);

  const updateExtra = (id, patch) => {
    if (!editEnabled) return;
    setExtras(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    debouncedExtraUpdate(id, patch);
  };

  const addExtraLine = async (tradeName, roomName) => {
    if (!editEnabled) return;
    const body = {
      parent_kind: 'trade-room',
      parent_id: `${tradeName}::${roomName}`,
      name: 'New line item',
      quantity: 1,
      unit: 'LS',
      cost: 0,
      markup_percent: 0,
      notes: '',
    };
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setExtras(prev => [...prev, created]);
    }
  };

  // Add a snippet as a new line item under a chosen trade + room. Used by the
  // Snippet Library cards (click card → pick destination → instant add).
  const addSnippetToProposal = async (snippet, tradeName, roomName) => {
    if (!editEnabled) return null;
    const T = (tradeName || 'GENERAL').trim().toUpperCase();
    const R = (roomName || 'GENERAL').trim().toUpperCase();
    const body = {
      parent_kind: 'trade-room',
      parent_id: `${T}::${R}`,
      name: snippet.name || 'New line item',
      quantity: Number(snippet.default_quantity) || 1,
      unit: snippet.default_unit || 'EA',
      cost: Number(snippet.default_cost) || 0,
      markup_percent: Number(snippet.default_markup_percent) || 0,
      notes: snippet.notes || '',
    };
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setExtras(prev => [...prev, created]);
      return created;
    }
    return null;
  };

  const addCustomTrade = async () => {
    const tradeName = (window.prompt('Custom trade name (e.g. DUMPSTER, SITE PROTECTION):') || '').trim().toUpperCase();
    if (!tradeName) return;
    const body = {
      parent_kind: 'trade-only',
      parent_id: `${tradeName}::GENERAL`,
      name: 'New line item',
      quantity: 1,
      unit: 'LS',
      cost: 0,
      markup_percent: 0,
      notes: '',
    };
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setExtras(prev => [...prev, created]);
    }
  };

  const addRoomToTrade = async (tradeName) => {
    const roomName = (window.prompt('Add room to this trade:') || '').trim().toUpperCase();
    if (!roomName) return;
    const body = {
      parent_kind: 'trade-room',
      parent_id: `${tradeName}::${roomName}`,
      name: 'New line item',
      quantity: 1,
      unit: 'LS',
      cost: 0,
      markup_percent: 0,
      notes: '',
    };
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setExtras(prev => [...prev, created]);
    }
  };

  const deleteLine = async (line) => {
    if (!editEnabled) return;
    if (line.source === 'extra') {
      if (!window.confirm(`Delete "${line.text || 'this line'}"?`)) return;
      await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra/${line.line_id}`, { method: 'DELETE' });
      setExtras(prev => prev.filter(e => e.id !== line.line_id));
    } else {
      if (!window.confirm('Hide this scope line from your proposal?')) return;
      saveOverride(line.line_id, { hidden: true });
    }
  };

  const deleteTrade = async (tradeName) => {
    if (!editEnabled) return;
    if (!window.confirm(`Delete entire ${tradeName} section? Scope lines will be hidden; custom lines deleted.`)) return;
    grouped.find(g => g.tradeName === tradeName)?.roomGroups.forEach(rg => {
      rg.lines.forEach(l => {
        if (l.source === 'scope') saveOverride(l.line_id, { hidden: true });
      });
    });
    const toDelete = extras.filter(e => (e.parent_id || '').startsWith(`${tradeName}::`));
    for (const e of toDelete) {
      await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra/${e.id}`, { method: 'DELETE' });
    }
    setExtras(prev => prev.filter(e => !(e.parent_id || '').startsWith(`${tradeName}::`)));
  };

  // ========================= RENAMES =========================
  const renameTrade = (oldName, newName) => {
    if (!editEnabled) return;
    const n = (newName || '').trim().toUpperCase();
    if (!n || n === oldName) return;
    updateLayout({ trade_renames: { ...layout.trade_renames, [oldName]: n } });
  };
  const renameRoom = (tradeName, oldRoom, newName) => {
    if (!editEnabled) return;
    const n = (newName || '').trim().toUpperCase();
    if (!n || n === oldRoom) return;
    const key = `${tradeName}::${oldRoom}`;
    updateLayout({ room_renames: { ...layout.room_renames, [key]: n } });
  };

  // ========================= DnD HANDLER =========================
  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'TRADE') {
      // Reorder trades using the CURRENT visible order
      const currentTrades = grouped.map(g => g.tradeName);
      const next = reorder(currentTrades, source.index, destination.index);
      updateLayout({ trade_order: next });
      return;
    }

    if (type && type.startsWith('ROOM-')) {
      const tradeName = type.replace('ROOM-', '');
      const tg = grouped.find(g => g.tradeName === tradeName);
      if (!tg) return;
      const currentRooms = tg.roomGroups.map(rg => rg.roomName);
      const next = reorder(currentRooms, source.index, destination.index);
      updateLayout({ room_order: { ...layout.room_order, [tradeName]: next } });
      return;
    }

    if (type && type.startsWith('LINE-')) {
      const orderKey = type.replace('LINE-', '');  // "TRADE::ROOM"
      const [tradeName, roomName] = orderKey.split('::');
      const tg = grouped.find(g => g.tradeName === tradeName);
      const rg = tg?.roomGroups.find(r => r.roomName === roomName);
      if (!rg) return;
      const visibleLines = rg.lines.filter(l => !overrides[l.line_id]?.hidden);
      const currentIds = visibleLines.map(l => l.line_id);
      const next = reorder(currentIds, source.index, destination.index);
      updateLayout({ line_order: { ...layout.line_order, [orderKey]: next } });
      return;
    }
  };

  const debouncedNotes = useDebounced(async (val) => {
    await fetch(`${API_URL}/api/builder-portal/${portal.id}/proposal-settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_notes: val }),
    }).catch(() => {});
  }, 600);
  const debouncedLessPayment = useDebounced(async (val) => {
    await fetch(`${API_URL}/api/builder-portal/${portal.id}/proposal-settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_less_payment: parseFloat(val) || 0 }),
    }).catch(() => {});
  }, 600);
  const debouncedRate = useDebounced(async (patch) => {
    await fetch(`${API_URL}/api/builder-portal/${portal.id}/proposal-settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, 350);

  // ========================= TOTALS =========================
  const grandTotals = useMemo(() => {
    let total = 0, amount = 0;
    grouped.forEach(tg => {
      tg.roomGroups.forEach(rg => {
        rg.lines.forEach(line => {
          const o = overrides[line.line_id] || {};
          if (o.hidden) return;
          let qty, cost, markup;
          if (line.source === 'extra') {
            qty = (o.quantity ?? line.extra.quantity) || 0;
            cost = (o.cost ?? line.extra.cost) || 0;
            markup = (o.markup_percent ?? line.extra.markup_percent) || 0;
          } else {
            const tq = (kind === 'builder' && tradeQuotes[line.line_id]) || null;
            qty = o.quantity ?? 1;
            cost = (o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0);
            markup = o.markup_percent ?? 0;
          }
          amount += computeAmount(qty, cost);
          total += compute(qty, cost, markup);
        });
      });
    });
    const tax = total * (Number(portal.tax_rate || 0) / 100);
    const pmFee = total * (Number(portal.pm_fee_rate || 0) / 100);
    const less = Number(lessPayment || 0);
    return { subtotal: total, amount, tax, pmFee, less, totalDue: total + tax + pmFee - less, profit: total - amount };
  }, [grouped, overrides, tradeQuotes, kind, portal.tax_rate, portal.pm_fee_rate, lessPayment]);

  const acceptProposal = async () => {
    if (!signature.trim()) return alert('Type your full legal name to accept.');
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal/accept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signature }),
    });
    if (res.ok) { setShowAccept(false); setSignature(''); load(); onPortalChange?.(); }
    else { const err = await res.json().catch(() => ({})); alert(err.detail || 'Accept failed'); }
  };

  if (loading) return <div style={{ padding: 40, color: '#D4C5A9' }}>Loading proposal…</div>;
  if (!viewEnabled) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#D4C5A9' }}>
      <h2 style={{ color: '#D4A574', fontSize: 22, marginBottom: 12 }}>Proposal not yet released</h2>
      <p>The designer hasn't enabled the proposal view yet.</p>
    </div>
  );

  const company = data?.company || {};
  const projectName = data?.project_name || '';
  const showProfit = kind === 'builder' || kind === 'trade';
  // table column count for line items: ⋮⋮ # DESC QTY UNIT COST AMT TOTAL [PROFIT] [X]
  const colCount = showProfit ? 9 : 8;

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 60 }} data-testid="proposal-view">
      <style>{PROPOSAL_CSS}</style>
      <ProposalHeader company={company} projectName={projectName} portal={portal} />

      {!accepted && (
        <div className="no-print" style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: '#D4C5A9', fontSize: 13 }}>🔒 <strong>READ-ONLY</strong> — Accept this scope to start entering your numbers.</div>
          <button onClick={() => setShowAccept(true)} data-testid="accept-job-btn" style={{ background: '#D4A574', color: '#1a1f2e', padding: '8px 18px', fontWeight: 700, borderRadius: 4, fontSize: 13, border: 'none', cursor: 'pointer' }}>✓ ACCEPT JOB &amp; START QUOTE</button>
        </div>
      )}
      {accepted && editEnabled && (
        <div className="no-print" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065F46 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#D4C5A9', fontSize: 12 }}>✓ Accepted by <strong>{portal.proposal_accepted_signature}</strong>{portal.proposal_accepted_at ? ` on ${new Date(portal.proposal_accepted_at).toLocaleDateString()}` : ''} — editing UNLOCKED · Drag <span style={{ color: '#D4A574' }}>⋮⋮</span> to reorder, click name to rename</div>
          <button onClick={() => setShowSnippets(!showSnippets)} style={{ background: '#0f1218', color: '#D4A574', border: '1px solid #D4A574', padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>{showSnippets ? '✕ CLOSE LIBRARY' : '📚 SNIPPET LIBRARY'}</button>
        </div>
      )}
      {showSnippets && <SnippetsPanel snippets={snippets} ownerKind={kind} ownerId={accessCode} onChange={loadSnippets} grouped={grouped} editEnabled={editEnabled} onAddToProposal={addSnippetToProposal} />}

      {/* MAIN PROPOSAL — Checklist-style draggable blocks */}
      <div className="proposal-cell" style={{ padding: 12 }} data-testid="proposal-body">
        {grouped.length === 0 ? (
          <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', padding: 24, borderRadius: 4, color: '#D4C5A9', textAlign: 'center' }}>
            {kind === 'trade'
              ? `No scope items assigned to ${(portal.assigned_trades || []).join(', ') || portal.trade_name || 'your trade'} yet.`
              : 'The Scope of Work is empty. Add #trade tags in the Scope of Work editor — they\'ll group the proposal automatically.'}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="trades" type="TRADE">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {grouped.map((tg, tIdx) => {
                    const tradeColor = TRADE_COLORS[tg.tradeName] || '#065F46';
                    const isTradeCollapsed = collapsedTrades.has(tg.tradeName);
                    let tradeLineCount = 0;
                    tg.roomGroups.forEach(rg => { rg.lines.forEach(l => { if (!overrides[l.line_id]?.hidden) tradeLineCount++; }); });
                    return (
                      <Draggable key={tg.tradeName} draggableId={`trade-${tg.tradeName}`} index={tIdx} isDragDisabled={!editEnabled}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className="proposal-trade-block mb-6"
                            style={{
                              ...prov.draggableProps.style,
                              opacity: snap.isDragging ? 0.85 : 1,
                            }}
                            data-testid={`trade-block-${tg.tradeName}`}
                          >
                            {/* TRADE BANNER — Checklist Room-header recipe */}
                            <div
                              className="px-4 py-2 text-white font-bold mb-2 border border-[#B49B7E]"
                              style={getMutedRoomHeaderStyle(tradeColor)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div {...prov.dragHandleProps} className="proposal-drag-handle text-[#B49B7E] hover:text-white px-2" title="Drag to reorder trade" data-testid={`trade-drag-${tg.tradeName}`}>
                                    ⋮⋮
                                  </div>
                                  <button onClick={() => toggleTrade(tg.tradeName)} className="text-[#B49B7E] hover:text-white" data-testid={`trade-toggle-${tg.tradeName}`}>
                                    {isTradeCollapsed ? '▶' : '▼'}
                                  </button>
                                  <span
                                    contentEditable={editEnabled}
                                    suppressContentEditableWarning
                                    className="proposal-banner-name px-1"
                                    style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, color: '#fff' }}
                                    onBlur={(e) => renameTrade(tg.tradeName, e.currentTarget.textContent)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                    data-testid={`trade-name-${tg.tradeName}`}
                                  >{tg.displayName}</span>
                                  {isTradeCollapsed && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600, letterSpacing: 1, marginLeft: 8 }}>· {tradeLineCount} line{tradeLineCount === 1 ? '' : 's'}</span>}
                                </div>
                                {editEnabled && (
                                  <button onClick={() => deleteTrade(tg.tradeName)} className="no-print" title="Delete trade"
                                    style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '2px 10px', fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}
                                    data-testid={`trade-delete-${tg.tradeName}`}>
                                    ✕ DELETE TRADE
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* ROOMS (each is its own Draggable inside a per-trade Droppable) */}
                            {!isTradeCollapsed && (
                              <Droppable droppableId={`rooms-${tg.tradeName}`} type={`ROOM-${tg.tradeName}`}>
                                {(rProv) => (
                                  <div ref={rProv.innerRef} {...rProv.droppableProps}>
                                    {tg.roomGroups.map((rg, rIdx) => {
                                      const roomColor = roomColorByName[rg.roomName] || getRoomColor(rg.roomName);
                                      const banner = getMutedRoomHeaderStyleStandalone(roomColor);
                                      const roomKey = `${tg.tradeName}::${rg.roomName}`;
                                      const isRoomCollapsed = collapsedRooms.has(roomKey);
                                      const visibleLines = rg.lines.filter(l => !overrides[l.line_id]?.hidden);
                                      return (
                                        <Draggable key={roomKey} draggableId={`room-${roomKey}`} index={rIdx} isDragDisabled={!editEnabled}>
                                          {(rdProv, rdSnap) => (
                                            <div
                                              ref={rdProv.innerRef}
                                              {...rdProv.draggableProps}
                                              className="proposal-room-block mb-3"
                                              style={{
                                                ...rdProv.draggableProps.style,
                                                opacity: rdSnap.isDragging ? 0.85 : 1,
                                              }}
                                              data-testid={`room-block-${roomKey}`}
                                            >
                                              <div style={{ ...banner, padding: '6px 14px', border: '1px solid #B49B7E', marginBottom: 4 }}>
                                                <div className="flex items-center gap-2">
                                                  <div {...rdProv.dragHandleProps} className="proposal-drag-handle text-[#B49B7E] hover:text-white px-1" title="Drag to reorder room" data-testid={`room-drag-${roomKey}`}>
                                                    ⋮⋮
                                                  </div>
                                                  <button onClick={() => toggleRoom(roomKey)} className="text-[#B49B7E] hover:text-white" data-testid={`room-toggle-${roomKey}`}>
                                                    {isRoomCollapsed ? '▶' : '▼'}
                                                  </button>
                                                  <span
                                                    contentEditable={editEnabled}
                                                    suppressContentEditableWarning
                                                    className="proposal-banner-name px-1"
                                                    style={{ color: '#D4C5A9', fontSize: 12, fontWeight: 800, letterSpacing: 2 }}
                                                    onBlur={(e) => renameRoom(tg.tradeName, rg.roomName, e.currentTarget.textContent)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                                    data-testid={`room-name-${roomKey}`}
                                                  >{rg.displayName}</span>
                                                  {isRoomCollapsed && <span style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.75, letterSpacing: 1, marginLeft: 6 }}>· {visibleLines.length} line{visibleLines.length === 1 ? '' : 's'}</span>}
                                                </div>
                                              </div>

                                              {!isRoomCollapsed && (
                                                <>
                                                  <table className="w-full border-collapse" style={{ background: '#000', tableLayout: 'auto' }}>
                                                    <thead>
                                                      <tr>
                                                        <Th w="3%" />
                                                        <Th w="4%">#</Th>
                                                        <Th w="42%" align="left">DESCRIPTION</Th>
                                                        <Th w="6%">QTY</Th>
                                                        <Th w="5%">UNIT</Th>
                                                        <Th w="10%">UNIT COST</Th>
                                                        <Th w="10%">AMOUNT</Th>
                                                        <Th w="10%">TOTAL</Th>
                                                        {showProfit && <Th w="8%">PROFIT</Th>}
                                                        {editEnabled && <Th w="2%" />}
                                                      </tr>
                                                    </thead>
                                                    <Droppable droppableId={`lines-${roomKey}`} type={`LINE-${roomKey}`}>
                                                      {(lProv) => (
                                                        <tbody ref={lProv.innerRef} {...lProv.droppableProps}>
                                                          {visibleLines.map((line, idx) => (
                                                            <Draggable key={line.line_id} draggableId={`line-${line.line_id}`} index={idx} isDragDisabled={!editEnabled}>
                                                              {(liProv, liSnap) => (
                                                                <LineRow
                                                                  innerRef={liProv.innerRef}
                                                                  draggableProps={liProv.draggableProps}
                                                                  dragHandleProps={liProv.dragHandleProps}
                                                                  isDragging={liSnap.isDragging}
                                                                  line={line}
                                                                  idx={idx}
                                                                  overrides={overrides}
                                                                  tradeQuotes={tradeQuotes}
                                                                  kind={kind}
                                                                  editEnabled={editEnabled}
                                                                  showProfit={showProfit}
                                                                  onChange={saveOverride}
                                                                  onUpdateExtra={updateExtra}
                                                                  onDelete={() => deleteLine(line)}
                                                                />
                                                              )}
                                                            </Draggable>
                                                          ))}
                                                          {lProv.placeholder}
                                                        </tbody>
                                                      )}
                                                    </Droppable>
                                                  </table>

                                                  {editEnabled && (
                                                    <div className="no-print" style={{ padding: '6px 14px', background: '#0a0a0a', border: '1px solid #2a3040' }}>
                                                      <button onClick={() => addExtraLine(tg.tradeName, rg.roomName)}
                                                        style={{ background: 'transparent', color: '#10B981', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: 0 }}
                                                        data-testid={`add-line-${roomKey}`}>
                                                        + ADD LINE TO {rg.displayName}
                                                      </button>
                                                    </div>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {rProv.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}

                            {!isTradeCollapsed && editEnabled && (
                              <div className="no-print" style={{ padding: '8px 14px', background: '#0f1218', border: '1px solid #2a3040' }}>
                                <button onClick={() => addRoomToTrade(tg.tradeName)}
                                  style={{ background: 'transparent', color: '#D4A574', border: '1px dashed #D4A574', padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, borderRadius: 4, letterSpacing: 1 }}
                                  data-testid={`add-room-${tg.tradeName}`}>
                                  + ADD ROOM TO {tg.displayName}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  {editEnabled && (
                    <div className="no-print" style={{ padding: '12px 14px' }}>
                      <button onClick={addCustomTrade}
                        style={{ background: '#10B981', color: '#fff', border: 'none', padding: '8px 18px', cursor: 'pointer', fontSize: 12, fontWeight: 700, borderRadius: 4, letterSpacing: 2 }}
                        data-testid="add-trade-btn">
                        + ADD TRADE
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* GRAND TOTALS */}
      {grouped.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 12px 8px' }}>
          <table style={{ minWidth: 380, borderCollapse: 'collapse' }} className="proposal-cell">
            <tbody>
              <TotalRow label="SUB TOTAL" value={fmtUSD(grandTotals.subtotal)} bold />
              <TotalRow label="Less Payment (deposit)" value={editEnabled
                ? <NumInline value={lessPayment} onChange={v => { setLessPayment(v); debouncedLessPayment(v); }} prefix="$" />
                : fmtUSD(lessPayment)} />
              <TotalRow label={editEnabled
                ? <span>Project Mgmt Fee &nbsp;<NumInline value={portal.pm_fee_rate || 0} onChange={v => debouncedRate({ pm_fee_rate: v })} suffix="%" /></span>
                : `Project Mgmt Fee (${portal.pm_fee_rate || 0}%)`} value={fmtUSD(grandTotals.pmFee)} />
              <TotalRow label={editEnabled
                ? <span>Tax &nbsp;<NumInline value={portal.tax_rate || 0} onChange={v => debouncedRate({ tax_rate: v })} suffix="%" /></span>
                : `Tax (${portal.tax_rate || 0}%)`} value={fmtUSD(grandTotals.tax)} />
              <tr><td style={{ padding: '10px 14px', background: '#D4A574', color: '#1a1f2e', fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>TOTAL DUE</td><td style={{ padding: '10px 14px', background: '#D4A574', color: '#1a1f2e', fontWeight: 900, fontSize: 14, textAlign: 'right' }}>{fmtUSD(grandTotals.totalDue)}</td></tr>
              {showProfit && <tr><td style={{ padding: '6px 14px', background: '#064e3b', color: '#D4C5A9', fontSize: 11 }}>Profit (your eyes only)</td><td style={{ padding: '6px 14px', background: '#064e3b', color: '#D4C5A9', fontSize: 11, textAlign: 'right', fontWeight: 700 }}>{fmtUSD(grandTotals.profit)}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* NOTES + SIGNATURE */}
      {grouped.length > 0 && (
        <div style={{ padding: '20px 24px', borderTop: '1px solid #2a3040', marginTop: 16 }}>
          <div style={{ color: '#D4A574', fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>NOTES</div>
          {editEnabled ? (
            <textarea value={notes} onChange={e => { setNotes(e.target.value); debouncedNotes(e.target.value); }} rows={4} placeholder="Add any notes for the customer here..." style={{ width: '100%', background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', borderRadius: 4, padding: 10, fontSize: 13, lineHeight: 1.5, resize: 'vertical' }} />
          ) : (
            <p style={{ color: '#D4C5A9', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{notes || <span style={{ opacity: 0.5 }}>No notes.</span>}</p>
          )}
          <p style={{ color: '#D4A574', fontSize: 12, marginTop: 24, textAlign: 'center', letterSpacing: 1 }}>THANK YOU FOR YOUR CONSIDERATION!</p>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}><div style={{ borderBottom: '1px solid #D4A574', height: 32 }}></div><div style={{ color: '#D4C5A9', fontSize: 11, marginTop: 4 }}>Customer Signature</div></div>
            <div style={{ flex: 1, minWidth: 200 }}><div style={{ borderBottom: '1px solid #D4A574', height: 32 }}></div><div style={{ color: '#D4C5A9', fontSize: 11, marginTop: 4 }}>Date</div></div>
          </div>
        </div>
      )}

      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 24px' }}>
        <button onClick={() => window.print()} style={{ background: '#D4A574', color: '#1a1f2e', padding: '8px 16px', fontWeight: 700, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12 }}>🖨 PRINT / SAVE PDF</button>
      </div>

      {showAccept && (
        <div onClick={() => setShowAccept(false)} className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f1218', border: '1px solid #D4A574', maxWidth: 520, width: '92%', padding: 24, borderRadius: 8 }}>
            <h2 style={{ color: '#D4A574', fontSize: 18, marginBottom: 8 }}>Accept Job</h2>
            <p style={{ color: '#D4C5A9', fontSize: 13, marginBottom: 16 }}>By typing your full legal name and clicking Accept, you agree to the scope of work and unlock editing for your quote.</p>
            <input autoFocus value={signature} onChange={e => setSignature(e.target.value)} placeholder="Type your full legal name" data-testid="accept-signature-input" style={{ width: '100%', padding: '10px 12px', background: '#1a1f2e', border: '1px solid #D4A574', color: '#D4C5A9', borderRadius: 4, fontSize: 14, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAccept(false)} style={{ background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={acceptProposal} data-testid="confirm-accept-btn" style={{ background: '#D4A574', color: '#1a1f2e', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✓ Accept &amp; Sign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// LineRow — Checklist-style alternating gradient row + ⋮⋮ drag handle.
// All editable cells use contentEditable (looks like plain spreadsheet
// cells, NO boxed inputs anywhere).
// ====================================================================
function LineRow({ innerRef, draggableProps, dragHandleProps, isDragging, line, idx, overrides, tradeQuotes, kind, editEnabled, showProfit, onChange, onUpdateExtra, onDelete }) {
  const o = overrides[line.line_id] || {};
  const isExtra = line.source === 'extra';
  const tq = (kind === 'builder' && tradeQuotes[line.line_id]) || null;

  const qty = isExtra ? (o.quantity ?? line.extra.quantity) : (o.quantity ?? 1);
  const unit = isExtra ? (o.unit ?? line.extra.unit ?? 'LS') : (o.unit ?? 'LS');
  const cost = isExtra ? (o.cost ?? line.extra.cost ?? 0)
    : ((o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0));
  const markup = isExtra ? (o.markup_percent ?? line.extra.markup_percent ?? 0)
    : (o.markup_percent ?? 0);
  const descriptionHtml = isExtra
    ? (o.name ?? line.extra.name)
    : (o.description ?? stripTradePills(line.html));

  const amount = computeAmount(qty, cost);
  const total = compute(qty, cost, markup);
  const profit = total - amount;

  const handlePatch = (patch) => {
    if (isExtra) onUpdateExtra(line.line_id, patch);
    else onChange(line.line_id, patch);
  };

  // Checklist alternating gradient (matches ExactChecklistSpreadsheet.js item rows)
  const rowBg = idx % 2 === 0
    ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 30, 0.9) 30%, rgba(15, 15, 25, 0.95) 70%, rgba(0, 0, 0, 0.95) 100%)'
    : 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(45, 45, 55, 0.9) 30%, rgba(25, 25, 35, 0.95) 70%, rgba(15, 15, 25, 0.95) 100%)';

  return (
    <tr
      ref={innerRef}
      {...draggableProps}
      style={{
        ...draggableProps?.style,
        background: rowBg,
        opacity: isDragging ? 0.9 : 1,
        boxShadow: isDragging ? '0 4px 18px rgba(212,165,116,0.45)' : undefined,
      }}
      data-testid={`line-row-${line.line_id}`}
    >
      <td className="no-print" {...(editEnabled ? dragHandleProps : {})} style={{ ...tdCell, padding: '4px 6px', textAlign: 'center', cursor: editEnabled ? 'grab' : 'default', color: '#B49B7E' }} title="Drag to reorder">
        {editEnabled ? '⋮⋮' : ''}
      </td>
      <td style={{ ...tdCell, color: '#B49B7E', fontWeight: 700 }}>{idx + 1}</td>
      <td style={{ ...tdCell, textAlign: 'left', padding: '6px 10px' }}>
        <CellEditableHTML
          value={descriptionHtml}
          editable={editEnabled}
          placeholder="(empty)"
          onChange={v => handlePatch(isExtra ? { name: v } : { description: v })}
        />
        {tq && <div style={{ marginTop: 2, color: '#10B981', fontSize: 10, letterSpacing: 1 }}>✓ Quoted by {tq.trade_name}: {fmtUSD(tq.cost)}</div>}
      </td>
      <CellNum value={qty} editable={editEnabled} onChange={v => handlePatch({ quantity: v })} />
      <CellText value={unit} editable={editEnabled} onChange={v => handlePatch({ unit: v })} />
      <CellNum value={cost} editable={editEnabled} prefix="$" onChange={v => handlePatch({ cost: v })} />
      <td style={{ ...tdCell, fontWeight: 600 }}>{fmtUSD(amount)}</td>
      <td style={{ ...tdCell, fontWeight: 700, color: '#D4A574' }}>
        {fmtUSD(total)}
        {editEnabled && (
          <span style={{ display: 'inline-flex', alignItems: 'baseline', fontSize: 9, color: '#B49B7E', marginTop: 1, marginLeft: 0 }}>
            +<CellNumInline value={markup} onChange={v => handlePatch({ markup_percent: v })} />%
          </span>
        )}
      </td>
      {showProfit && <td style={{ ...tdCell, color: '#10B981', fontWeight: 700 }}>{fmtUSD(profit)}</td>}
      {editEnabled && <td className="no-print" style={{ ...tdCell, padding: 4 }}><button onClick={onDelete} title="Delete line" style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: 4 }} data-testid={`line-delete-${line.line_id}`}>✕</button></td>}
    </tr>
  );
}

const tdCell = { border: '1px solid #B49B7E', padding: '6px 10px', color: '#D4C5A9', fontSize: 13, textAlign: 'right', verticalAlign: 'top' };

function Th({ children, w, align = 'right' }) {
  return <th className="border border-[#B49B7E] px-2 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ width: w, background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)', color: '#D4C5A9', textAlign: align }}>{children}</th>;
}

// ContentEditable cell for HTML (keeps @person / @product pills intact)
function CellEditableHTML({ value, editable, placeholder, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);
  if (!editable) {
    return <div style={{ color: '#D4C5A9', fontSize: 13, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: value || '' }} />;
  }
  return (
    <div
      ref={ref}
      className="ce-cell"
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder || ''}
      onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      style={{ color: '#D4C5A9', fontSize: 13, lineHeight: 1.5, minHeight: 18 }}
    />
  );
}

// ContentEditable cell for plain numeric input
function CellNum({ value, editable, prefix = '', onChange }) {
  const ref = useRef(null);
  const display = (value === null || value === undefined || value === '') ? '' : String(value);
  useEffect(() => {
    if (ref.current && ref.current.textContent !== display) ref.current.textContent = display;
  }, [display]);
  if (!editable) {
    return <td style={tdCell}>{prefix}{fmt(value)}</td>;
  }
  return (
    <td style={tdCell}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 2 }}>
        {prefix && <span style={{ color: '#B49B7E' }}>{prefix}</span>}
        <span
          ref={ref}
          className="ce-cell"
          contentEditable
          suppressContentEditableWarning
          inputMode="decimal"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
          onBlur={(e) => {
            const raw = e.currentTarget.textContent.replace(/[^0-9.\-]/g, '');
            const num = parseFloat(raw);
            onChange(isNaN(num) ? 0 : num);
          }}
          style={{ minWidth: 24, textAlign: 'right' }}
        />
      </div>
    </td>
  );
}

// ContentEditable inline number (markup % under TOTAL column)
function CellNumInline({ value, onChange }) {
  const ref = useRef(null);
  const display = (value === null || value === undefined || value === '') ? '0' : String(value);
  useEffect(() => {
    if (ref.current && ref.current.textContent !== display) ref.current.textContent = display;
  }, [display]);
  return (
    <span
      ref={ref}
      className="ce-cell"
      contentEditable
      suppressContentEditableWarning
      inputMode="decimal"
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      onBlur={(e) => {
        const raw = e.currentTarget.textContent.replace(/[^0-9.\-]/g, '');
        const num = parseFloat(raw);
        onChange(isNaN(num) ? 0 : num);
      }}
      style={{ minWidth: 18, padding: '0 2px', borderBottom: '1px dotted #D4A574', color: '#D4A574' }}
    />
  );
}

// ContentEditable cell for plain text (Unit column)
function CellText({ value, editable, onChange }) {
  const ref = useRef(null);
  const display = value || '';
  useEffect(() => {
    if (ref.current && ref.current.textContent !== display) ref.current.textContent = display;
  }, [display]);
  if (!editable) return <td style={tdCell}>{display}</td>;
  return (
    <td style={tdCell}>
      <span
        ref={ref}
        className="ce-cell"
        contentEditable
        suppressContentEditableWarning
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
        onBlur={(e) => onChange(e.currentTarget.textContent.trim())}
        style={{ display: 'inline-block', minWidth: 28, textAlign: 'center' }}
      />
    </td>
  );
}

function NumInline({ value, onChange, prefix = '', suffix = '' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
      {prefix}
      <CellNumInline value={value} onChange={onChange} />
      {suffix}
    </span>
  );
}
function TotalRow({ label, value, bold }) {
  return <tr><td style={{ padding: '6px 14px', color: '#D4C5A9', fontSize: 13, borderBottom: '1px solid #1a1f2e', fontWeight: bold ? 700 : 400 }}>{label}</td><td style={{ padding: '6px 14px', color: '#D4C5A9', fontSize: 13, borderBottom: '1px solid #1a1f2e', textAlign: 'right', fontWeight: bold ? 700 : 400 }}>{value}</td></tr>;
}

function ProposalHeader({ company, projectName, portal }) {
  const today = new Date().toLocaleDateString();
  const estNo = portal?.id ? portal.id.slice(0, 8).toUpperCase() : '';
  return (
    <div style={{ borderBottom: '2px solid #D4A574', padding: 24, background: 'linear-gradient(135deg, #0f1218 0%, #1a1f2e 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: '1 1 auto', minWidth: 280 }}>
          {company.logo_data ? (
            <img src={company.logo_data} alt="logo" style={{ height: 64, maxWidth: 200, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 64, height: 64, background: '#1a1f2e', border: '1px dashed #D4A574', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4C5A9', fontSize: 9 }}>LOGO</div>
          )}
          <div>
            <h1 style={{ color: '#D4A574', fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>{company.company_name || 'YOUR COMPANY NAME'}</h1>
            <p style={{ color: '#D4C5A9', fontSize: 12, lineHeight: 1.5 }}>
              {company.address || ''}<br />
              {company.phone || ''}{company.phone && company.email ? ' · ' : ''}{company.email || ''}<br />
              {company.license_number ? `License # ${company.license_number}` : ''}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: '0 0 auto', minWidth: 200 }}>
          <div style={{ color: '#D4A574', fontSize: 16, letterSpacing: 4, fontWeight: 800 }}>ESTIMATE</div>
          <table style={{ marginTop: 8, marginLeft: 'auto', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={hLbl}>ESTIMATE NO.</td><td style={hVal}>{estNo}</td></tr>
              <tr><td style={hLbl}>DATE</td><td style={hVal}>{today}</td></tr>
              <tr><td style={hLbl}>PROJECT</td><td style={hVal}>{projectName}</td></tr>
              {portal.proposal_accepted_at && <tr><td style={hLbl}>ACCEPTED</td><td style={hVal}>{new Date(portal.proposal_accepted_at).toLocaleDateString()}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const hLbl = { padding: '2px 8px', color: '#D4A574', fontSize: 10, letterSpacing: 1, textAlign: 'right' };
const hVal = { padding: '2px 8px', color: '#D4C5A9', fontSize: 12, textAlign: 'right' };

// ====================================================================
// Snippets panel — clickable cards that ADD to the proposal.
// Click a card → tiny destination picker (Trade + Room) appears →
// pick destination → instantly adds a new line item with the snippet's
// default qty/unit/cost/markup. Power-user: hold Shift while clicking
// to re-use the last destination ("repeat add").
// ====================================================================
function SnippetsPanel({ snippets, ownerKind, ownerId, onChange, grouped = [], editEnabled = true, onAddToProposal }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', default_quantity: 1, default_unit: 'EA', default_cost: 0, default_markup_percent: 0, notes: '' });
  const [pickerFor, setPickerFor] = useState(null);  // snippet currently choosing destination
  const [lastDest, setLastDest] = useState(null);    // {trade, room} — last successful add
  const [flashId, setFlashId] = useState(null);      // snippet that just got added (green flash)

  const create = async () => {
    if (!draft.name.trim()) return;
    await fetch(`${API_URL}/api/proposal/snippets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner_kind: ownerKind, owner_id: ownerId, ...draft, default_quantity: Number(draft.default_quantity), default_cost: Number(draft.default_cost), default_markup_percent: Number(draft.default_markup_percent) }) });
    setDraft({ name: '', default_quantity: 1, default_unit: 'EA', default_cost: 0, default_markup_percent: 0, notes: '' });
    setAdding(false);
    onChange?.();
  };
  const remove = async (id, e) => {
    e?.stopPropagation?.();
    if (!window.confirm('Delete snippet?')) return;
    await fetch(`${API_URL}/api/proposal/snippets/${id}`, { method: 'DELETE' });
    onChange?.();
  };

  const handleCardClick = async (s, e) => {
    if (!editEnabled || !onAddToProposal) return;
    // Shift-click = repeat add to last destination (super-fast power-user mode)
    if (e?.shiftKey && lastDest) {
      const ok = await onAddToProposal(s, lastDest.trade, lastDest.room);
      if (ok) { setFlashId(s.id); setTimeout(() => setFlashId(null), 700); }
      return;
    }
    setPickerFor(s);
  };

  const confirmAdd = async (trade, room) => {
    if (!pickerFor) return;
    const ok = await onAddToProposal(pickerFor, trade, room);
    if (ok) {
      setLastDest({ trade, room });
      setFlashId(pickerFor.id);
      setTimeout(() => setFlashId(null), 700);
    }
    setPickerFor(null);
  };

  const inp = { background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 4 };

  return (
    <div className="no-print" style={{ background: '#1a1f2e', border: '1px solid #D4A574', margin: 12, padding: 12, borderRadius: 4 }} data-testid="snippet-library">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 700 }}>📚 SNIPPET LIBRARY — reusable line items</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {editEnabled && (
            <span style={{ color: '#D4C5A9', fontSize: 10, letterSpacing: 1, opacity: 0.85 }}>
              ← Click any card to add it to your quote {lastDest && <em style={{ color: '#10B981' }}>· Shift-click to repeat last → {lastDest.trade} / {lastDest.room}</em>}
            </span>
          )}
          <button onClick={() => setAdding(!adding)} data-testid="new-snippet-btn" style={{ background: '#10B981', color: '#fff', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{adding ? '✕ CANCEL' : '+ NEW SNIPPET'}</button>
        </div>
      </div>
      {adding && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 12 }}>
          <input placeholder="Name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inp} />
          <input type="number" placeholder="Qty" value={draft.default_quantity} onChange={e => setDraft({ ...draft, default_quantity: e.target.value })} style={inp} />
          <input placeholder="Unit" value={draft.default_unit} onChange={e => setDraft({ ...draft, default_unit: e.target.value })} style={inp} />
          <input type="number" placeholder="Cost" value={draft.default_cost} onChange={e => setDraft({ ...draft, default_cost: e.target.value })} style={inp} />
          <input type="number" placeholder="Markup %" value={draft.default_markup_percent} onChange={e => setDraft({ ...draft, default_markup_percent: e.target.value })} style={inp} />
          <button onClick={create} style={{ background: '#D4A574', color: '#1a1f2e', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>SAVE</button>
        </div>
      )}
      {snippets.length === 0 && <p style={{ color: '#D4C5A9', fontSize: 12 }}>No snippets yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {snippets.map(s => {
          const isFlashing = flashId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={(e) => handleCardClick(s, e)}
              disabled={!editEnabled}
              data-testid={`snippet-card-${s.id}`}
              title={editEnabled ? 'Click to add to your quote · Shift-click to repeat last destination' : 'Accept the job to unlock snippet adds'}
              style={{
                textAlign: 'left',
                background: isFlashing ? 'linear-gradient(135deg, #10B981 0%, #065F46 100%)' : '#0f1218',
                border: `1px solid ${isFlashing ? '#10B981' : '#B49B7E'}`,
                padding: 8,
                borderRadius: 4,
                position: 'relative',
                cursor: editEnabled ? 'pointer' : 'not-allowed',
                color: 'inherit',
                font: 'inherit',
                transition: 'transform 120ms ease, box-shadow 120ms ease, background 200ms ease, border-color 200ms ease',
                outline: 'none',
              }}
              onMouseEnter={e => { if (editEnabled) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(212,165,116,0.25)'; e.currentTarget.style.borderColor = '#D4A574'; } }}
              onMouseLeave={e => { if (!isFlashing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#B49B7E'; } }}
            >
              <div style={{ color: isFlashing ? '#fff' : '#D4A574', fontSize: 12, fontWeight: 700, paddingRight: 18 }}>{s.name}</div>
              <div style={{ color: isFlashing ? '#fff' : '#D4C5A9', fontSize: 10, opacity: 0.85, marginTop: 2 }}>{s.default_quantity} {s.default_unit} · {fmtUSD(s.default_cost)} · {s.default_markup_percent}%</div>
              {isFlashing && <div style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>✓ ADDED</div>}
              <span
                onClick={(e) => remove(s.id, e)}
                role="button"
                title="Delete snippet"
                style={{ position: 'absolute', top: 4, right: 4, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: '2px 4px' }}
              >✕</span>
            </button>
          );
        })}
      </div>

      {pickerFor && (
        <SnippetDestinationPicker
          snippet={pickerFor}
          grouped={grouped}
          onCancel={() => setPickerFor(null)}
          onConfirm={confirmAdd}
        />
      )}
    </div>
  );
}

// Small modal to pick which Trade + Room the snippet should land in.
// Allows creating a brand-new Trade or Room on the fly.
function SnippetDestinationPicker({ snippet, grouped, onCancel, onConfirm }) {
  const tradeOptions = grouped.map(g => g.tradeName);
  const [trade, setTrade] = useState(tradeOptions[0] || '__NEW__');
  const [newTrade, setNewTrade] = useState('');
  const [room, setRoom] = useState('');
  const [newRoom, setNewRoom] = useState('');

  const isNewTrade = trade === '__NEW__';
  const finalTrade = (isNewTrade ? newTrade : trade).trim().toUpperCase();

  const roomsForTrade = useMemo(() => {
    if (isNewTrade) return [];
    const tg = grouped.find(g => g.tradeName === trade);
    return tg ? tg.roomGroups.map(r => r.roomName) : [];
  }, [grouped, trade, isNewTrade]);

  const isNewRoom = room === '__NEW__' || isNewTrade;
  const finalRoom = (isNewRoom ? newRoom : room).trim().toUpperCase();

  useEffect(() => {
    // Reset room when trade changes (so we don't carry over a stale room)
    if (isNewTrade) setRoom('__NEW__');
    else if (roomsForTrade.length) setRoom(roomsForTrade[0]);
    else setRoom('__NEW__');
  }, [trade, isNewTrade, roomsForTrade]);

  const canConfirm = !!finalTrade && !!finalRoom;
  const handleConfirm = () => { if (canConfirm) onConfirm(finalTrade, finalRoom); };

  const inp = { background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '8px 10px', fontSize: 13, borderRadius: 4, width: '100%' };
  const lbl = { color: '#D4A574', fontSize: 11, letterSpacing: 2, fontWeight: 700, marginBottom: 4, display: 'block' };

  return (
    <div onClick={onCancel} className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} data-testid="snippet-dest-picker" style={{ background: '#0f1218', border: '1px solid #D4A574', borderRadius: 8, padding: 20, width: '92%', maxWidth: 480 }}>
        <h3 style={{ color: '#D4A574', fontSize: 16, letterSpacing: 1, marginBottom: 4 }}>ADD TO QUOTE</h3>
        <p style={{ color: '#D4C5A9', fontSize: 12, opacity: 0.85, marginBottom: 14 }}>{snippet.name} — {snippet.default_quantity} {snippet.default_unit} · {fmtUSD(snippet.default_cost)} · {snippet.default_markup_percent}%</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>TRADE</label>
            <select value={trade} onChange={e => setTrade(e.target.value)} data-testid="snippet-trade-select" style={inp}>
              {tradeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="__NEW__">+ NEW TRADE…</option>
            </select>
            {isNewTrade && (
              <input
                autoFocus
                value={newTrade}
                onChange={e => setNewTrade(e.target.value.toUpperCase())}
                placeholder="e.g. DUMPSTER"
                data-testid="snippet-new-trade-input"
                style={{ ...inp, marginTop: 8 }}
              />
            )}
          </div>
          <div>
            <label style={lbl}>ROOM</label>
            {!isNewTrade && (
              <select value={room} onChange={e => setRoom(e.target.value)} data-testid="snippet-room-select" style={inp}>
                {roomsForTrade.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="__NEW__">+ NEW ROOM…</option>
              </select>
            )}
            {isNewRoom && (
              <input
                autoFocus={!isNewTrade}
                value={newRoom}
                onChange={e => setNewRoom(e.target.value.toUpperCase())}
                placeholder="e.g. MASTER BATH"
                data-testid="snippet-new-room-input"
                style={{ ...inp, marginTop: isNewTrade ? 0 : 8 }}
              />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onCancel} style={{ background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={handleConfirm} disabled={!canConfirm} data-testid="snippet-confirm-add-btn"
            style={{ background: canConfirm ? '#D4A574' : '#4b5563', color: '#1a1f2e', padding: '8px 18px', borderRadius: 4, border: 'none', cursor: canConfirm ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
            ✓ ADD LINE
          </button>
        </div>
      </div>
    </div>
  );
}
