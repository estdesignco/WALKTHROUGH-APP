/**
 * ProposalView — Steve Cseplo Construction Estimate format
 * =========================================================
 * Single unified table that matches the user's reference xlsx exactly:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ COMPANY HEADER (logo + estimate no + date + client info)    │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ DIV. │ DESCRIPTION │ QTY │ UNIT COST │ AMOUNT │ TOTAL │ Profit│
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ ROOM NAME 1 (full-width banner row, muted gradient)         │
 *   │  1. scope sentence       1    $100      $100    $115   $15  │
 *   │  2. scope sentence       2    $50       $100    $115   $15  │
 *   │                            Section Subtotal:    $230        │
 *   │ ROOM NAME 2 (banner row)                                    │
 *   │  1. ...                                                      │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ SUB TOTAL                                            $X      │
 *   │ Less Payment (deposit)                               $X      │
 *   │ Project Management Fee   (X%)                        $X      │
 *   │ TAX                      (X%)                        $X      │
 *   │ TOTAL DUE                                            $X      │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │ Notes (free text)                                            │
 *   │ Signature line                                               │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * - Inline edits do NOT refetch the page (optimistic local state, debounced
 *   server PUT in background). No more flash on every keystroke.
 * - All <input type="number"> spinner arrows hidden via ::-webkit / Firefox.
 * - DIV column = first trade tag of each scope sentence (PLUMBING / TILE / etc.).
 * - For builder portals: trade subs' submitted Cost auto-prefills the line.
 * - Trade portals see only their assigned trades.
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getMutedRoomHeaderStyleStandalone } from '../utils/roomColors';
import { parseScopeDocument, TRADE_COLORS } from './ScopeDocumentEditor';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

// CSS to hide number-input spinners (injected once)
const NUM_INPUT_CSS = `
  .proposal-cell input::-webkit-outer-spin-button,
  .proposal-cell input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .proposal-cell input[type=number] { -moz-appearance: textfield; }
  .proposal-cell input { background: transparent; outline: none; border: none; width: 100%; color: inherit; font: inherit; padding: 0; }
  .proposal-cell input:focus { background: rgba(212,165,116,0.08); }
  @media print {
    .no-print { display: none !important; }
    .proposal-cell input { color: #000 !important; }
  }
`;

const fmt = (n) => (n === null || n === undefined || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSD = (n) => `$${fmt(n || 0)}`;
const compute = (qty, cost, markup) => (Number(qty) || 0) * (Number(cost) || 0) * (1 + (Number(markup) || 0) / 100);
const computeAmount = (qty, cost) => (Number(qty) || 0) * (Number(cost) || 0);

// Stable line id from normalized text — survives unrelated scope edits
const stableLineId = (room, trade, text) => {
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let h = 5381;
  const s = `${norm(room)}|${norm(trade)}|${norm(text)}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `sl_${(h >>> 0).toString(36)}`;
};

// Simple debounce ref-based hook
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
  // Optimistic local state — applied immediately, server saves in background.
  const [overrides, setOverrides] = useState({});  // { line_id: {...override} }
  const [snippets, setSnippets] = useState([]);
  const [showSnippets, setShowSnippets] = useState(false);
  const [notes, setNotes] = useState('');
  const [lessPayment, setLessPayment] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Hydrate local overrides from server payload (only on full reload).
        const map = {};
        (json.overrides || []).forEach(o => { map[o.item_id] = o; });
        setOverrides(map);
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

  // Build flat ordered list of (room, trade, scope-line) tuples
  const rooms = useMemo(() => {
    const html = data?.scope_document || '';
    const projectRooms = data?.rooms || [];
    const parsed = parseScopeDocument(html, projectRooms);
    const assigned = (kind === 'trade')
      ? (portal.assigned_trades && portal.assigned_trades.length
          ? portal.assigned_trades.map(t => (t || '').toUpperCase())
          : [(portal.trade_name || '').toUpperCase()])
      : null;

    const order = [];
    const byRoom = {};
    parsed.items.forEach(item => {
      const rName = (item.roomName || 'GENERAL').toUpperCase();
      const tradeKeys = item.trades && item.trades.length ? item.trades : [];
      const primaryTrade = (tradeKeys[0] || 'GENERAL').toUpperCase();
      if (assigned && tradeKeys.length && !tradeKeys.some(t => assigned.includes(t.toUpperCase()))) return;
      if (assigned && !tradeKeys.length) return;  // no-trade lines hidden from trades
      if (!byRoom[rName]) { byRoom[rName] = { roomName: rName, room: item.room, lines: [] }; order.push(rName); }
      byRoom[rName].lines.push({
        line_id: stableLineId(rName, primaryTrade, item.text),
        div: primaryTrade,
        text: item.text,
        html: item.html,
      });
    });
    return order.map(rn => byRoom[rn]);
  }, [data, kind, portal]);

  // Server-save (debounced). Optimistic local update happens immediately
  // inside saveOverride before this fires.
  const debouncedPersist = useDebounced(async (lineId, fullOverride) => {
    try {
      await fetch(`${API_URL}/api/builder/${accessCode}/proposal/override`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: lineId, ...fullOverride }),
      });
    } catch (e) { console.error('save override failed', e); }
  }, 350);

  const saveOverride = (lineId, patch) => {
    if (!editEnabled) return;
    setOverrides(prev => {
      const next = { ...prev, [lineId]: { ...(prev[lineId] || { item_id: lineId }), ...patch } };
      debouncedPersist(lineId, next[lineId]);
      return next;
    });
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

  // Section subtotals + grand totals (live, recomputed from local overrides)
  const { sectionSubtotals, grandTotals } = useMemo(() => {
    const subtotals = [];
    let amount = 0, total = 0, cost = 0;
    rooms.forEach(rg => {
      let secAmount = 0, secTotal = 0;
      rg.lines.forEach(line => {
        const o = overrides[line.line_id] || {};
        const tq = (kind === 'builder' && tradeQuotes[line.line_id]) || null;
        const qty = o.quantity ?? 1;
        const c = (o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0);
        const m = o.markup_percent ?? 0;
        const a = computeAmount(qty, c);
        const t = compute(qty, c, m);
        secAmount += a; secTotal += t; cost += a;
      });
      subtotals.push({ amount: secAmount, total: secTotal });
      amount += secAmount; total += secTotal;
    });
    const tax = total * (Number(portal.tax_rate || 0) / 100);
    const pmFee = total * (Number(portal.pm_fee_rate || 0) / 100);
    const less = Number(lessPayment || 0);
    const totalDue = total + tax + pmFee - less;
    return {
      sectionSubtotals: subtotals,
      grandTotals: { subtotal: total, amount, tax, pmFee, less, totalDue, profit: total - cost },
    };
  }, [rooms, overrides, tradeQuotes, kind, portal.tax_rate, portal.pm_fee_rate, lessPayment]);

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
  const colSpan = showProfit ? 7 : 6;

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 60 }} data-testid="proposal-view">
      <style>{NUM_INPUT_CSS}</style>

      <ProposalHeader company={company} projectName={projectName} portal={portal} />

      {/* Accept bar (read-only / unlocked) */}
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

      {/* MAIN PROPOSAL TABLE */}
      <div style={{ padding: 12 }}>
        {rooms.length === 0 ? (
          <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', padding: 24, borderRadius: 4, color: '#D4C5A9', textAlign: 'center' }}>
            {kind === 'trade'
              ? `No scope items assigned to ${(portal.assigned_trades || []).join(', ') || portal.trade_name || 'your trade'} yet.`
              : 'The Scope of Work is empty. The designer needs to add scope items.'}
          </div>
        ) : (
          <table className="proposal-cell w-full border-collapse" style={{ background: '#000', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <Th w="6%">DIV.</Th>
                <Th w="42%" align="left">DESCRIPTION</Th>
                <Th w="6%">QUANTITY</Th>
                <Th w="11%">UNIT COST</Th>
                <Th w="11%">AMOUNT</Th>
                <Th w="11%">TOTAL</Th>
                {showProfit && <Th w="9%">Profit</Th>}
              </tr>
            </thead>
            <tbody>
              {rooms.map((rg, rIdx) => {
                const roomColor = rg.room?.color || '#D4A574';
                const banner = getMutedRoomHeaderStyleStandalone(roomColor);
                return (
                  <React.Fragment key={rg.roomName}>
                    {/* ROOM BANNER ROW (single row spanning the whole table) */}
                    <tr>
                      <td colSpan={colSpan} style={{ ...banner, padding: '8px 14px', border: '1px solid #B49B7E' }}>
                        <span style={{ color: '#D4C5A9', fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>{rg.roomName}</span>
                      </td>
                    </tr>
                    {rg.lines.map((line, idx) => {
                      const o = overrides[line.line_id] || {};
                      const tq = (kind === 'builder' && tradeQuotes[line.line_id]) || null;
                      const qty = o.quantity ?? 1;
                      const cost = (o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0);
                      const markup = o.markup_percent ?? 0;
                      const amount = computeAmount(qty, cost);
                      const total = compute(qty, cost, markup);
                      const profit = total - amount;
                      const tradeColor = TRADE_COLORS[line.div] || '#B49B7E';
                      return (
                        <tr key={line.line_id} style={{ background: idx % 2 === 0 ? '#0a0a0a' : '#0f0e0e' }}>
                          <td style={tdCell}>
                            <span style={{ color: tradeColor, fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>{line.div}</span>
                          </td>
                          <td style={{ ...tdCell, textAlign: 'left', padding: '6px 10px' }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                              <span style={{ color: '#B49B7E', fontWeight: 700, minWidth: 16, fontSize: 12 }}>{idx + 1}.</span>
                              <div style={{ flex: 1, color: '#D4C5A9', fontSize: 13, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: line.html }} />
                            </div>
                            {tq && <div style={{ marginTop: 2, marginLeft: 22, color: '#10B981', fontSize: 10, letterSpacing: 1 }}>✓ Quoted by {tq.trade_name}: {fmtUSD(tq.cost)}</div>}
                          </td>
                          <NumCell value={qty} editable={editEnabled} onChange={v => saveOverride(line.line_id, { quantity: v })} />
                          <NumCell value={cost} editable={editEnabled} onChange={v => saveOverride(line.line_id, { cost: v })} prefix="$" />
                          <td style={{ ...tdCell, fontWeight: 600, color: '#D4C5A9' }}>{fmtUSD(amount)}</td>
                          <td style={{ ...tdCell, fontWeight: 700, color: '#D4A574' }}>
                            {fmtUSD(total)}
                            {editEnabled && <span style={{ display: 'block', fontSize: 9, color: '#B49B7E', marginTop: 1 }}>+<NumInline value={markup} onChange={v => saveOverride(line.line_id, { markup_percent: v })} suffix="%" />markup</span>}
                          </td>
                          {showProfit && <td style={{ ...tdCell, color: '#10B981', fontWeight: 700 }}>{fmtUSD(profit)}</td>}
                        </tr>
                      );
                    })}
                    {/* Section Subtotal */}
                    <tr style={{ background: '#1a1208' }}>
                      <td colSpan={colSpan - 2} style={{ ...tdCell, textAlign: 'right', color: '#D4A574', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>SECTION SUBTOTAL</td>
                      <td style={{ ...tdCell, color: '#D4C5A9', fontWeight: 700 }}>{fmtUSD(sectionSubtotals[rIdx]?.amount || 0)}</td>
                      <td style={{ ...tdCell, color: '#D4A574', fontWeight: 800 }}>{fmtUSD(sectionSubtotals[rIdx]?.total || 0)}</td>
                      {showProfit && <td style={{ ...tdCell, color: '#10B981', fontWeight: 700 }}>{fmtUSD((sectionSubtotals[rIdx]?.total || 0) - (sectionSubtotals[rIdx]?.amount || 0))}</td>}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* GRAND TOTALS — bottom of estimate */}
      {rooms.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 12px 8px' }}>
          <table style={{ minWidth: 380, borderCollapse: 'collapse' }}>
            <tbody>
              <TotalRow label="SUB TOTAL" value={fmtUSD(grandTotals.subtotal)} bold />
              <TotalRow
                label="Less Payment (deposit)"
                value={editEnabled
                  ? <NumInline value={lessPayment} onChange={v => { setLessPayment(v); debouncedLessPayment(v); }} prefix="$" />
                  : fmtUSD(lessPayment)}
              />
              <TotalRow
                label={editEnabled
                  ? <span>Project Mgmt Fee &nbsp;<NumInline value={portal.pm_fee_rate || 0} onChange={v => debouncedRate({ pm_fee_rate: v })} suffix="%" /></span>
                  : `Project Mgmt Fee (${portal.pm_fee_rate || 0}%)`}
                value={fmtUSD(grandTotals.pmFee)}
              />
              <TotalRow
                label={editEnabled
                  ? <span>Tax &nbsp;<NumInline value={portal.tax_rate || 0} onChange={v => debouncedRate({ tax_rate: v })} suffix="%" /></span>
                  : `Tax (${portal.tax_rate || 0}%)`}
                value={fmtUSD(grandTotals.tax)}
              />
              <tr><td style={{ padding: '10px 14px', background: '#D4A574', color: '#1a1f2e', fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>TOTAL DUE</td><td style={{ padding: '10px 14px', background: '#D4A574', color: '#1a1f2e', fontWeight: 900, fontSize: 14, textAlign: 'right' }}>{fmtUSD(grandTotals.totalDue)}</td></tr>
              {showProfit && <tr><td style={{ padding: '6px 14px', background: '#064e3b', color: '#D4C5A9', fontSize: 11 }}>Profit (your eyes only)</td><td style={{ padding: '6px 14px', background: '#064e3b', color: '#D4C5A9', fontSize: 11, textAlign: 'right', fontWeight: 700 }}>{fmtUSD(grandTotals.profit)}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* NOTES + SIGNATURE LINE */}
      {rooms.length > 0 && (
        <div style={{ padding: '20px 24px', borderTop: '1px solid #2a3040', marginTop: 16 }}>
          <div style={{ color: '#D4A574', fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>NOTES</div>
          {editEnabled ? (
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); debouncedNotes(e.target.value); }}
              rows={4}
              placeholder="Add any notes for the customer here..."
              style={{ width: '100%', background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', borderRadius: 4, padding: 10, fontSize: 13, lineHeight: 1.5, resize: 'vertical' }}
            />
          ) : (
            <p style={{ color: '#D4C5A9', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{notes || <span style={{ opacity: 0.5 }}>No notes.</span>}</p>
          )}
          <p style={{ color: '#D4A574', fontSize: 12, marginTop: 24, textAlign: 'center', letterSpacing: 1 }}>THANK YOU FOR YOUR CONSIDERATION!</p>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ borderBottom: '1px solid #D4A574', height: 32 }}></div>
              <div style={{ color: '#D4C5A9', fontSize: 11, marginTop: 4 }}>Customer Signature</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ borderBottom: '1px solid #D4A574', height: 32 }}></div>
              <div style={{ color: '#D4C5A9', fontSize: 11, marginTop: 4 }}>Date</div>
            </div>
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

const tdCell = { border: '1px solid #B49B7E', padding: '6px 10px', color: '#D4C5A9', fontSize: 13, textAlign: 'right', verticalAlign: 'top' };

function Th({ children, w, align = 'right' }) {
  return <th className="border border-[#B49B7E] px-2 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ width: w, background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)', color: '#D4C5A9', textAlign: align }}>{children}</th>;
}

function NumCell({ value, editable, onChange, prefix = '', suffix = '' }) {
  // Local state so typing doesn't fight with parent re-render. Parent's
  // optimistic state is updated on each keystroke via onChange.
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  return (
    <td style={tdCell}>
      {editable ? (
        <input
          type="number"
          value={v}
          onChange={e => { setV(e.target.value); onChange(parseFloat(e.target.value) || 0); }}
          style={{ textAlign: 'right' }}
        />
      ) : (<>{prefix}{fmt(value)}{suffix}</>)}
    </td>
  );
}

function NumInline({ value, onChange, prefix = '', suffix = '' }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      {prefix}
      <input
        type="number"
        value={v}
        onChange={e => { setV(e.target.value); onChange(parseFloat(e.target.value) || 0); }}
        style={{ width: 50, textAlign: 'right', color: '#D4A574', borderBottom: '1px dotted #D4A574', padding: '0 2px' }}
      />
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
// Snippets panel (unchanged from prior version)
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
        <button onClick={() => setAdding(!adding)} style={{ background: '#10B981', color: '#D4C5A9', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{adding ? '✕ CANCEL' : '+ NEW SNIPPET'}</button>
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
