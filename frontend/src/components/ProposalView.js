/**
 * ProposalView — Trade-first grouping + full CRUD
 * =================================================
 *   ┌──────────────────────────────────────────────────┐
 *   │ COMPANY HEADER (logo, estimate no, date, project)│
 *   ├──────────────────────────────────────────────────┤
 *   │ TRADE: PLUMBING                                  │  green banner, click X to delete trade
 *   │   ROOM: MASTER BATHROOM (room color)             │  click name to edit
 *   │   #  Description       QTY  Unit  $  Amt  Tot  P │
 *   │   1  Rough-in shower    1   LS   $.. ..   ..   ..│  X to delete line
 *   │   + ADD LINE                                     │
 *   │   ROOM: KITCHEN                                  │
 *   │   1  Run gas line       ...                      │
 *   │   + ADD LINE | + ADD ROOM TO PLUMBING            │
 *   │ TRADE: TILE  [X delete trade]                    │
 *   │   ...                                            │
 *   │ + ADD TRADE                                      │
 *   ├──────────────────────────────────────────────────┤
 *   │ SUBTOTAL / Less Payment / PM Fee / Tax / TOTAL DUE│
 *   ├──────────────────────────────────────────────────┤
 *   │ Notes (free text) / Signature line               │
 *   └──────────────────────────────────────────────────┘
 *
 * - Inline edits do NOT refetch (optimistic local + 350ms debounced PUT).
 * - Number inputs have spinner arrows hidden globally.
 * - Scope-derived lines: editable Description/Qty/Unit/Cost/Markup, deletable
 *   (delete = mark hidden in override).
 * - Custom lines (extras): full CRUD per trade-room bucket.
 * - "+ ADD TRADE" appends a custom trade group with no scope (extras only).
 * - Trade portal filters automatically to assigned_trades.
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getMutedRoomHeaderStyleStandalone, getRoomColor } from '../utils/roomColors';
import { parseScopeDocument, TRADE_COLORS, DEFAULT_TRADES } from './ScopeDocumentEditor';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const NUM_INPUT_CSS = `
  /* Spreadsheet-style cell editing — NO boxed inputs anywhere.
     Cells are contentEditable divs that look like plain table cells. */
  .proposal-cell .ce-cell { outline: none; min-height: 18px; cursor: text; }
  .proposal-cell .ce-cell:focus { background: rgba(212,165,116,0.10); box-shadow: inset 0 0 0 1px #D4A574; }
  .proposal-cell .ce-cell:hover { background: rgba(212,165,116,0.04); }
  .proposal-cell .ce-cell:empty::before { content: attr(data-ph); color: #6b6157; }
  /* Hide native number-input spinners just in case */
  .proposal-cell input::-webkit-outer-spin-button,
  .proposal-cell input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .proposal-cell input[type=number] { -moz-appearance: textfield; }
  .proposal-cell input { background: transparent; outline: none; border: none; width: 100%; color: inherit; font: inherit; padding: 0; }
  .proposal-cell input:focus { background: rgba(212,165,116,0.08); }
  @media print {
    .no-print { display: none !important; }
    .proposal-cell .ce-cell { color: #000 !important; }
  }
`;

const fmt = (n) => (n === null || n === undefined || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSD = (n) => `$${fmt(n || 0)}`;
const compute = (qty, cost, markup) => (Number(qty) || 0) * (Number(cost) || 0) * (1 + (Number(markup) || 0) / 100);
const computeAmount = (qty, cost) => (Number(qty) || 0) * (Number(cost) || 0);

// Remove ONLY #trade pills from scope HTML — keep @person and @product pills
// intact since they're meaningful content (e.g. "Hang light fixture @Jerome").
// Trade tags are identifiers/groupers, not part of the prose.
const stripTradePills = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[data-tag="trade"], .trade-pill').forEach(el => el.remove());
  // Tidy up double spaces left by removed pills
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

    // tradeOrder = order in which trades first appear in the scope doc
    const tradeOrder = [];
    const byTrade = {};

    parsed.items.forEach(item => {
      const rName = (item.roomName || 'GENERAL').toUpperCase();
      const tradeKeys = (item.trades && item.trades.length ? item.trades : []).map(t => (t || '').toUpperCase());
      if (assigned && tradeKeys.length && !tradeKeys.some(t => assigned.includes(t))) return;
      if (assigned && !tradeKeys.length) return;
      const lineTrades = tradeKeys.length ? tradeKeys : ['GENERAL'];
      lineTrades.forEach(T => {
        if (!byTrade[T]) { byTrade[T] = { tradeName: T, rooms: {}, roomOrder: [] }; tradeOrder.push(T); }
        if (!byTrade[T].rooms[rName]) { byTrade[T].rooms[rName] = []; byTrade[T].roomOrder.push(rName); }
        byTrade[T].rooms[rName].push({
          line_id: stableLineId(rName, T, item.text),
          text: item.text,
          html: item.html,
          source: 'scope',
        });
      });
    });

    // Merge in extras (custom user-added lines), keyed by `${TRADE}::${ROOM}`
    extras.forEach(e => {
      if (e.parent_kind !== 'trade-room' && e.parent_kind !== 'trade-only') return;
      const [T, R] = (e.parent_id || '').split('::');
      const TT = (T || 'GENERAL').toUpperCase();
      const RR = (R || 'GENERAL').toUpperCase();
      if (assigned && !assigned.includes(TT)) return;
      if (!byTrade[TT]) { byTrade[TT] = { tradeName: TT, rooms: {}, roomOrder: [] }; tradeOrder.push(TT); }
      if (!byTrade[TT].rooms[RR]) { byTrade[TT].rooms[RR] = []; byTrade[TT].roomOrder.push(RR); }
      byTrade[TT].rooms[RR].push({
        line_id: e.id,
        text: e.name,
        html: e.name,
        source: 'extra',
        extra: e,
      });
    });

    return tradeOrder.map(T => ({
      tradeName: T,
      roomGroups: byTrade[T].roomOrder.map(R => ({ roomName: R, lines: byTrade[T].rooms[R] })),
    }));
  }, [data, kind, portal, extras]);

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

  const addCustomTrade = async () => {
    const tradeName = (window.prompt('Custom trade name (e.g. DUMPSTER, SITE PROTECTION):') || '').trim().toUpperCase();
    if (!tradeName) return;
    // Adding a placeholder "GENERAL" room line keeps the trade visible
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
      // Scope-derived line — mark hidden in override
      if (!window.confirm('Hide this scope line from your proposal?')) return;
      saveOverride(line.line_id, { hidden: true });
    }
  };

  const deleteTrade = async (tradeName) => {
    if (!editEnabled) return;
    if (!window.confirm(`Delete entire ${tradeName} section? Scope lines will be hidden; custom lines deleted.`)) return;
    // Hide all scope lines in this trade
    grouped.find(g => g.tradeName === tradeName)?.roomGroups.forEach(rg => {
      rg.lines.forEach(l => {
        if (l.source === 'scope') saveOverride(l.line_id, { hidden: true });
      });
    });
    // Delete all extras under this trade
    const toDelete = extras.filter(e => (e.parent_id || '').startsWith(`${tradeName}::`));
    for (const e of toDelete) {
      await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra/${e.id}`, { method: 'DELETE' });
    }
    setExtras(prev => prev.filter(e => !(e.parent_id || '').startsWith(`${tradeName}::`)));
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
  const colCount = showProfit ? 8 : 7;

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 60 }} data-testid="proposal-view">
      <style>{NUM_INPUT_CSS}</style>
      <ProposalHeader company={company} projectName={projectName} portal={portal} />

      {!accepted && (
        <div className="no-print" style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: '#D4C5A9', fontSize: 13 }}>🔒 <strong>READ-ONLY</strong> — Accept this scope to start entering your numbers.</div>
          <button onClick={() => setShowAccept(true)} data-testid="accept-job-btn" style={{ background: '#D4A574', color: '#1a1f2e', padding: '8px 18px', fontWeight: 700, borderRadius: 4, fontSize: 13, border: 'none', cursor: 'pointer' }}>✓ ACCEPT JOB &amp; START QUOTE</button>
        </div>
      )}
      {accepted && editEnabled && (
        <div className="no-print" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065F46 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#D4C5A9', fontSize: 12 }}>✓ Accepted by <strong>{portal.proposal_accepted_signature}</strong>{portal.proposal_accepted_at ? ` on ${new Date(portal.proposal_accepted_at).toLocaleDateString()}` : ''} — editing UNLOCKED</div>
          <button onClick={() => setShowSnippets(!showSnippets)} style={{ background: '#0f1218', color: '#D4A574', border: '1px solid #D4A574', padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>{showSnippets ? '✕ CLOSE LIBRARY' : '📚 SNIPPET LIBRARY'}</button>
        </div>
      )}
      {showSnippets && <SnippetsPanel snippets={snippets} ownerKind={kind} ownerId={accessCode} onChange={loadSnippets} />}

      {/* MAIN PROPOSAL TABLE — TRADE first */}
      <div style={{ padding: 12 }}>
        {grouped.length === 0 ? (
          <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', padding: 24, borderRadius: 4, color: '#D4C5A9', textAlign: 'center' }}>
            {kind === 'trade'
              ? `No scope items assigned to ${(portal.assigned_trades || []).join(', ') || portal.trade_name || 'your trade'} yet.`
              : 'The Scope of Work is empty. Add #trade tags in the Scope of Work editor — they\'ll group the proposal automatically.'}
          </div>
        ) : (
          <table className="proposal-cell w-full border-collapse" style={{ background: '#000', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <Th w="4%">#</Th>
                <Th w="45%" align="left">DESCRIPTION</Th>
                <Th w="6%">QTY</Th>
                <Th w="5%">UNIT</Th>
                <Th w="10%">UNIT COST</Th>
                <Th w="10%">AMOUNT</Th>
                <Th w="10%">TOTAL</Th>
                {showProfit && <Th w="8%">PROFIT</Th>}
                {editEnabled && <Th w="2%" /* delete X */></Th>}
              </tr>
            </thead>
            <tbody>
              {grouped.map((tg) => {
                const tradeColor = TRADE_COLORS[tg.tradeName] || '#065F46';
                const isTradeCollapsed = collapsedTrades.has(tg.tradeName);
                // Quick stats so collapsed trade shows useful summary
                let tradeLineCount = 0;
                tg.roomGroups.forEach(rg => { rg.lines.forEach(l => { if (!overrides[l.line_id]?.hidden) tradeLineCount++; }); });
                return (
                  <React.Fragment key={tg.tradeName}>
                    {/* TRADE HEADER — click chevron to collapse */}
                    <tr>
                      <td colSpan={colCount + (editEnabled ? 1 : 0)} style={{ background: tradeColor, padding: '10px 14px', border: '1px solid #B49B7E' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => toggleTrade(tg.tradeName)} className="no-print" title={isTradeCollapsed ? 'Expand' : 'Collapse'}
                              style={{ background: 'rgba(0,0,0,0.25)', color: '#fff', border: 'none', width: 22, height: 22, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isTradeCollapsed ? '▶' : '▼'}
                            </button>
                            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 3 }}>{tg.tradeName}</span>
                            {isTradeCollapsed && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>· {tradeLineCount} line{tradeLineCount === 1 ? '' : 's'}</span>}
                          </div>
                          {editEnabled && (
                            <button onClick={() => deleteTrade(tg.tradeName)} className="no-print" style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '2px 10px', fontSize: 10, fontWeight: 700, borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}>✕ DELETE TRADE</button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {!isTradeCollapsed && tg.roomGroups.map((rg) => {
                      const roomColor = roomColorByName[rg.roomName] || getRoomColor(rg.roomName);
                      const banner = getMutedRoomHeaderStyleStandalone(roomColor);
                      const roomKey = `${tg.tradeName}::${rg.roomName}`;
                      const isRoomCollapsed = collapsedRooms.has(roomKey);
                      const visibleLines = rg.lines.filter(l => !overrides[l.line_id]?.hidden);
                      return (
                        <React.Fragment key={roomKey}>
                          <tr>
                            <td colSpan={colCount + (editEnabled ? 1 : 0)} style={{ ...banner, padding: '6px 14px', border: '1px solid #B49B7E' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button onClick={() => toggleRoom(roomKey)} className="no-print" title={isRoomCollapsed ? 'Expand' : 'Collapse'}
                                  style={{ background: 'rgba(0,0,0,0.3)', color: '#D4C5A9', border: 'none', width: 20, height: 20, borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {isRoomCollapsed ? '▶' : '▼'}
                                </button>
                                <span style={{ color: '#D4C5A9', fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>{rg.roomName}</span>
                                {isRoomCollapsed && <span style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.75, letterSpacing: 1 }}>· {visibleLines.length} line{visibleLines.length === 1 ? '' : 's'}</span>}
                              </div>
                            </td>
                          </tr>
                          {!isRoomCollapsed && visibleLines.map((line, idx) => (
                            <LineRow
                              key={line.line_id}
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
                          ))}
                          {!isRoomCollapsed && editEnabled && (
                            <tr className="no-print"><td colSpan={colCount + 1} style={{ padding: '6px 14px', background: '#0a0a0a', border: '1px solid #2a3040' }}>
                              <button onClick={() => addExtraLine(tg.tradeName, rg.roomName)} style={{ background: 'transparent', color: '#10B981', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: 0 }}>+ ADD LINE TO {rg.roomName}</button>
                            </td></tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {!isTradeCollapsed && editEnabled && (
                      <tr className="no-print"><td colSpan={colCount + 1} style={{ padding: '8px 14px', background: '#0f1218', border: '1px solid #2a3040' }}>
                        <button onClick={() => addRoomToTrade(tg.tradeName)} style={{ background: 'transparent', color: '#D4A574', border: '1px dashed #D4A574', padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, borderRadius: 4, letterSpacing: 1 }}>+ ADD ROOM TO {tg.tradeName}</button>
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
              {editEnabled && (
                <tr className="no-print"><td colSpan={colCount + 1} style={{ padding: '12px 14px', background: '#0a0a0a' }}>
                  <button onClick={addCustomTrade} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 700, borderRadius: 4, letterSpacing: 2 }}>+ ADD TRADE</button>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* GRAND TOTALS */}
      {grouped.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 12px 8px' }}>
          <table style={{ minWidth: 380, borderCollapse: 'collapse' }}>
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
// LineRow — handles BOTH scope-derived lines and custom extras.
// All editable cells use contentEditable — looks like plain spreadsheet
// cells, NO boxed inputs anywhere.
// ====================================================================
function LineRow({ line, idx, overrides, tradeQuotes, kind, editEnabled, showProfit, onChange, onUpdateExtra, onDelete }) {
  const o = overrides[line.line_id] || {};
  const isExtra = line.source === 'extra';
  const tq = (kind === 'builder' && tradeQuotes[line.line_id]) || null;

  const qty = isExtra ? (o.quantity ?? line.extra.quantity) : (o.quantity ?? 1);
  const unit = isExtra ? (o.unit ?? line.extra.unit ?? 'LS') : (o.unit ?? 'LS');
  const cost = isExtra ? (o.cost ?? line.extra.cost ?? 0)
    : ((o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0));
  const markup = isExtra ? (o.markup_percent ?? line.extra.markup_percent ?? 0)
    : (o.markup_percent ?? 0);
  // Description: extras use override.name → extra.name; scope lines use override.description → line.html with #trade pills stripped
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

  return (
    <tr style={{ background: idx % 2 === 0 ? '#0a0a0a' : '#0f0e0e' }}>
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
      {editEnabled && <td className="no-print" style={{ ...tdCell, padding: 4 }}><button onClick={onDelete} title="Delete line" style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: 4 }}>✕</button></td>}
    </tr>
  );
}

const tdCell = { border: '1px solid #B49B7E', padding: '6px 10px', color: '#D4C5A9', fontSize: 13, textAlign: 'right', verticalAlign: 'top' };

function Th({ children, w, align = 'right' }) {
  return <th className="border border-[#B49B7E] px-2 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ width: w, background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)', color: '#D4C5A9', textAlign: align }}>{children}</th>;
}

// ContentEditable cell for HTML (description column — keeps @person / @product pills intact)
function CellEditableHTML({ value, editable, placeholder, onChange }) {
  const ref = useRef(null);
  // Only set innerHTML when value changes from the OUTSIDE (not from user typing).
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

// ContentEditable cell for plain numeric input — looks like a normal cell.
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
  // Used in the bottom totals row (Less Payment / PM Fee / Tax) — kept as
  // compact contentEditable for consistency.
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
// Snippets panel
// ====================================================================
function SnippetsPanel({ snippets, ownerKind, ownerId, onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', default_quantity: 1, default_unit: 'EA', default_cost: 0, default_markup_percent: 0, notes: '' });
  const create = async () => {
    if (!draft.name.trim()) return;
    await fetch(`${API_URL}/api/proposal/snippets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner_kind: ownerKind, owner_id: ownerId, ...draft, default_quantity: Number(draft.default_quantity), default_cost: Number(draft.default_cost), default_markup_percent: Number(draft.default_markup_percent) }) });
    setDraft({ name: '', default_quantity: 1, default_unit: 'EA', default_cost: 0, default_markup_percent: 0, notes: '' });
    setAdding(false);
    onChange?.();
  };
  const remove = async (id) => {
    if (!window.confirm('Delete snippet?')) return;
    await fetch(`${API_URL}/api/proposal/snippets/${id}`, { method: 'DELETE' });
    onChange?.();
  };
  const inp = { background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 4 };
  return (
    <div className="no-print" style={{ background: '#1a1f2e', border: '1px solid #D4A574', margin: 12, padding: 12, borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 700 }}>📚 SNIPPET LIBRARY — reusable line items</div>
        <button onClick={() => setAdding(!adding)} style={{ background: '#10B981', color: '#fff', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{adding ? '✕ CANCEL' : '+ NEW SNIPPET'}</button>
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
        {snippets.map(s => (
          <div key={s.id} style={{ background: '#0f1218', border: '1px solid #B49B7E', padding: 8, borderRadius: 4, position: 'relative' }}>
            <div style={{ color: '#D4A574', fontSize: 12, fontWeight: 700 }}>{s.name}</div>
            <div style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.7 }}>{s.default_quantity} {s.default_unit} · {fmtUSD(s.default_cost)} · {s.default_markup_percent}%</div>
            <button onClick={() => remove(s.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
