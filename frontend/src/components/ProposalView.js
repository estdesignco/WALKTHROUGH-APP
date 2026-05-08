/**
 * ProposalView — Scope-Document Driven
 * =====================================
 * The Proposal IS the Scope of Work, with editable pricing columns next to
 * every scope sentence. Builder receives the designer's scope, accepts, then
 * fills in numbers. Trade subs see only their portion of the scope filtered
 * by `assigned_trades`. When a sub fills in their cost, it auto-flows back
 * into the Builder's Cost column.
 *
 * Layout (matches admin Checklist/FFE recipes EXACTLY):
 *   ROOM banner (full width, muted gradient)
 *   ┗ TRADE bar (green #065F46)
 *     ┗ Column header row (dusty red #8B4444 gradient)
 *     ┗ Numbered scope lines (Description • Qty • Unit • Cost • Markup • Total)
 *     ┗ + ADD LINE / + FROM SNIPPET
 */
import React, { useEffect, useState, useMemo } from 'react';
import { getMutedRoomHeaderStyleStandalone } from '../utils/roomColors';
import { parseScopeDocument, TRADE_COLORS } from './ScopeDocumentEditor';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const fmt = (n) => {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtUSD = (n) => `$${fmt(n || 0)}`;

const computeLine = (qty, cost, markup) => {
  const q = Number(qty) || 0;
  const c = Number(cost) || 0;
  const m = Number(markup) || 0;
  return q * c * (1 + m / 100);
};

// Stable line id derived from the scope sentence's normalized text + room +
// trade. If the user lightly edits a scope sentence the id changes — that's
// expected; they re-enter pricing. Major rewrites should be rare.
const stableLineId = (room, trade, text) => {
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let h = 5381;
  const str = `${norm(room)}|${norm(trade)}|${norm(text)}`;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return `sl_${(h >>> 0).toString(36)}`;
};

export default function ProposalView({ accessCode, kind = 'builder', onPortalChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccept, setShowAccept] = useState(false);
  const [signature, setSignature] = useState('');
  const [snippets, setSnippets] = useState([]);
  const [showSnippets, setShowSnippets] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error('proposal load failed', e);
    } finally {
      setLoading(false);
    }
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

  const overridesByLineId = useMemo(() => {
    const map = {};
    (data?.overrides || []).forEach(o => { map[o.item_id] = o; });
    return map;
  }, [data]);

  const tradeQuotes = data?.trade_quotes || {};

  // Parse scope document and group: room → trade → lines.
  // Trade portals filter to assigned_trades (ALL CAPS match).
  const grouped = useMemo(() => {
    const html = data?.scope_document || '';
    const rooms = data?.rooms || [];
    const parsed = parseScopeDocument(html, rooms);
    const assigned = (kind === 'trade')
      ? (portal.assigned_trades && portal.assigned_trades.length
          ? portal.assigned_trades.map(t => (t || '').toUpperCase())
          : [(portal.trade_name || '').toUpperCase()])
      : null; // null = no filter (builder sees everything)

    // out: ordered array of { roomName, room, trades: [{ name, items }] }
    const roomOrder = [];
    const byRoom = {};
    parsed.items.forEach(item => {
      const rName = (item.roomName || 'GENERAL').toUpperCase();
      if (!byRoom[rName]) { byRoom[rName] = { roomName: rName, room: item.room, trades: {} }; roomOrder.push(rName); }
      const tradeKeys = item.trades && item.trades.length ? item.trades : ['GENERAL'];
      tradeKeys.forEach(t => {
        const T = (t || 'GENERAL').toUpperCase();
        if (assigned && !assigned.includes(T)) return;  // trade-portal filter
        if (!byRoom[rName].trades[T]) byRoom[rName].trades[T] = [];
        byRoom[rName].trades[T].push({
          ...item,
          line_id: stableLineId(rName, T, item.text),
          trade_key: T,
          room_key: rName,
        });
      });
    });
    return roomOrder.map(rn => ({ roomName: rn, room: byRoom[rn].room, trades: byRoom[rn].trades }));
  }, [data, kind, portal]);

  const totals = useMemo(() => {
    let subtotal = 0, cost = 0;
    grouped.forEach(rg => {
      Object.values(rg.trades).forEach(lines => {
        lines.forEach(line => {
          const o = overridesByLineId[line.line_id] || {};
          const tq = (kind === 'builder' && tradeQuotes[line.line_id]) || null;
          const qty = o.quantity ?? 1;
          const c = (o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0);
          const m = o.markup_percent ?? 0;
          subtotal += computeLine(qty, c, m);
          cost += (Number(qty) * Number(c)) || 0;
        });
      });
    });
    (data?.extras || []).forEach(e => {
      subtotal += computeLine(e.quantity, e.cost, e.markup_percent);
      cost += (Number(e.quantity || 0) * Number(e.cost || 0));
    });
    const tax = subtotal * (Number(portal.tax_rate || 0) / 100);
    const pmFee = subtotal * (Number(portal.pm_fee_rate || 0) / 100);
    return { subtotal, tax, pmFee, total: subtotal + tax + pmFee, profit: subtotal - cost, cost };
  }, [grouped, overridesByLineId, tradeQuotes, kind, portal.tax_rate, portal.pm_fee_rate, data]);

  const saveOverride = async (lineId, patch) => {
    if (!editEnabled) return;
    const existing = overridesByLineId[lineId] || {};
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/override`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: lineId, ...existing, ...patch }),
    });
    load();
  };
  const addExtra = async (parentKind, parentId, fromSnippet = null) => {
    if (!editEnabled) return;
    const body = fromSnippet
      ? { parent_kind: parentKind, parent_id: parentId, name: fromSnippet.name, quantity: fromSnippet.default_quantity, unit: fromSnippet.default_unit, cost: fromSnippet.default_cost, markup_percent: fromSnippet.default_markup_percent, notes: fromSnippet.notes || '' }
      : { parent_kind: parentKind, parent_id: parentId, name: 'New Line Item', quantity: 1, unit: 'EA', cost: 0, markup_percent: 0, notes: '' };
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    load();
  };
  const updateExtra = async (extraId, patch) => {
    if (!editEnabled) return;
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra/${extraId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    load();
  };
  const deleteExtra = async (extraId) => {
    if (!editEnabled) return;
    if (!window.confirm('Delete this line item?')) return;
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra/${extraId}`, { method: 'DELETE' });
    load();
  };

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
      <p>The designer hasn't enabled the proposal view yet. Check back soon.</p>
    </div>
  );

  const company = data?.company || {};
  const projectName = data?.project_name || '';
  const extrasByParentId = {};
  (data?.extras || []).forEach(e => { const k = `${e.parent_kind}:${e.parent_id}`; (extrasByParentId[k] = extrasByParentId[k] || []).push(e); });

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 60 }} data-testid="proposal-view">
      <ProposalHeader company={company} projectName={projectName} portal={portal} />
      {!accepted && (
        <div style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: '#D4C5A9', fontSize: 13 }}>🔒 <strong>READ-ONLY</strong> — Accept this scope to start entering your numbers.</div>
          <button onClick={() => setShowAccept(true)} data-testid="accept-job-btn" style={{ background: '#D4A574', color: '#1a1f2e', padding: '8px 18px', fontWeight: 700, borderRadius: 4, fontSize: 13, border: 'none', cursor: 'pointer' }}>✓ ACCEPT JOB &amp; START QUOTE</button>
        </div>
      )}
      {accepted && editEnabled && (
        <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065F46 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#D4C5A9', fontSize: 12 }}>✓ Accepted by <strong>{portal.proposal_accepted_signature}</strong>{portal.proposal_accepted_at ? ` on ${new Date(portal.proposal_accepted_at).toLocaleDateString()}` : ''} — editing UNLOCKED</div>
          <button onClick={() => setShowSnippets(!showSnippets)} style={{ background: '#0f1218', color: '#D4A574', border: '1px solid #D4A574', padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>{showSnippets ? '✕ CLOSE LIBRARY' : '📚 SNIPPET LIBRARY'}</button>
        </div>
      )}
      {showSnippets && <SnippetsPanel snippets={snippets} ownerKind={kind} ownerId={accessCode} onChange={loadSnippets} />}

      {/* SCOPE-DRIVEN PROPOSAL TABLE */}
      <div style={{ padding: 12 }}>
        {grouped.length === 0 && (
          <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', padding: 24, borderRadius: 4, color: '#D4C5A9', textAlign: 'center' }}>
            {kind === 'trade'
              ? `No scope items assigned to ${(portal.assigned_trades || []).join(', ') || portal.trade_name || 'your trade'} yet.`
              : 'The Scope of Work for this project is empty. The designer needs to add scope items first.'}
          </div>
        )}
        {grouped.map((rg) => {
          const roomColor = rg.room?.color || '#D4A574';
          const roomBanner = getMutedRoomHeaderStyleStandalone(roomColor);
          return (
            <div key={rg.roomName} style={{ marginBottom: 24 }}>
              {/* ROOM BANNER — full width, muted-gradient (Checklist/FFE recipe) */}
              <div style={{ ...roomBanner, border: '1px solid #D4A574', padding: '8px 16px' }}>
                <span style={{ color: '#D4C5A9', fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>{rg.roomName}</span>
              </div>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, #D4A574 30%, #D4A574 70%, transparent 100%)' }} />

              {Object.keys(rg.trades).map(tradeKey => {
                const lines = rg.trades[tradeKey];
                const tradeColor = TRADE_COLORS[tradeKey] || '#065F46';
                return (
                  <div key={tradeKey} style={{ marginTop: 12 }}>
                    {/* TRADE BAR (green #065F46) */}
                    <div style={{ background: '#065F46', border: '1px solid #D4A574', padding: '6px 14px' }}>
                      <span style={{ color: '#D4C5A9', fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>{tradeKey}</span>
                      <span style={{ color: '#D4C5A9', fontSize: 11, marginLeft: 12, opacity: 0.7 }}>{lines.length} item{lines.length === 1 ? '' : 's'}</span>
                    </div>
                    <table className="w-full border-collapse" style={{ background: '#000' }}>
                      <thead>
                        <tr>
                          {['#', 'Description', 'Qty', 'Unit', 'Cost', 'Markup %', 'Line Total'].map((h, i) => (
                            <th key={i} className="border border-[#B49B7E] px-2 py-2 text-xs font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)', color: '#D4C5A9' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line, idx) => {
                          const o = overridesByLineId[line.line_id] || {};
                          const tq = (kind === 'builder' && tradeQuotes[line.line_id]) || null;
                          const qty = o.quantity ?? 1;
                          const unit = o.unit ?? 'LS';
                          const cost = (o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0);
                          const markup = o.markup_percent ?? 0;
                          const lineTotal = computeLine(qty, cost, markup);
                          const evenRow = idx % 2 === 0;
                          return (
                            <tr key={line.line_id} style={{ background: evenRow
                              ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                              : 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(45,45,55,0.9) 30%, rgba(25,25,35,0.95) 70%, rgba(15,15,25,0.95) 100%)' }}>
                              <td className="border border-[#B49B7E] px-2 py-2 text-center" style={{ color: '#B49B7E', fontSize: 12, fontWeight: 700 }}>{idx + 1}</td>
                              <td className="border border-[#B49B7E] px-3 py-2" style={{ color: '#D4C5A9', fontSize: 13, lineHeight: 1.5 }}>
                                <div dangerouslySetInnerHTML={{ __html: line.html }} />
                                {tq && (
                                  <div style={{ marginTop: 4, fontSize: 10, color: '#10B981', letterSpacing: 1 }}>
                                    ✓ Quoted by {tq.trade_name}: {fmtUSD(tq.cost)}
                                  </div>
                                )}
                              </td>
                              <NumCell value={qty} editable={editEnabled} onChange={v => saveOverride(line.line_id, { quantity: v })} />
                              <TextCell value={unit} editable={editEnabled} onChange={v => saveOverride(line.line_id, { unit: v })} />
                              <NumCell value={cost} editable={editEnabled} onChange={v => saveOverride(line.line_id, { cost: v })} prefix="$" />
                              <NumCell value={markup} editable={editEnabled} onChange={v => saveOverride(line.line_id, { markup_percent: v })} suffix="%" />
                              <td className="border border-[#B49B7E] px-2 py-2 text-right" style={{ color: '#D4A574', fontSize: 13, fontWeight: 800 }}>{fmtUSD(lineTotal)}</td>
                            </tr>
                          );
                        })}
                        {/* Add-line under each trade */}
                        {editEnabled && (
                          <AddLineRow snippets={snippets} onAdd={(snip) => addExtra('trade', `${rg.roomName}::${tradeKey}`, snip)} />
                        )}
                        {(extrasByParentId[`trade:${rg.roomName}::${tradeKey}`] || []).map(e => (
                          <ExtraRow key={e.id} extra={e} editable={editEnabled} onChange={(p) => updateExtra(e.id, p)} onDelete={() => deleteExtra(e.id)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <ProposalTotals totals={totals} portal={portal} editEnabled={editEnabled} accessCode={accessCode} onSave={load} showProfit={kind === 'builder' || kind === 'trade'} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 24px' }}>
        <button onClick={() => window.print()} style={{ background: '#D4A574', color: '#1a1f2e', padding: '8px 16px', fontWeight: 700, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12 }}>🖨 PRINT / SAVE PDF</button>
      </div>

      {showAccept && (
        <div onClick={() => setShowAccept(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f1218', border: '1px solid #D4A574', maxWidth: 520, width: '92%', padding: 24, borderRadius: 8 }}>
            <h2 style={{ color: '#D4A574', fontSize: 18, marginBottom: 8 }}>Accept Job</h2>
            <p style={{ color: '#D4C5A9', fontSize: 13, marginBottom: 16 }}>By typing your full legal name below and clicking Accept, you agree to the scope of work as presented and unlock editing for your quote.</p>
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

function ProposalHeader({ company, projectName, portal }) {
  return (
    <div style={{ borderBottom: '2px solid #D4A574', padding: 24, background: 'linear-gradient(135deg, #0f1218 0%, #1a1f2e 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {company.logo_data ? (
            <img src={company.logo_data} alt="logo" style={{ height: 64, maxWidth: 200, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 64, height: 64, background: '#1a1f2e', border: '1px dashed #D4A574', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4C5A9', fontSize: 9 }}>LOGO</div>
          )}
          <div>
            <h1 style={{ color: '#D4A574', fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>{company.company_name || 'YOUR COMPANY NAME'}</h1>
            <p style={{ color: '#D4C5A9', fontSize: 12, lineHeight: 1.4 }}>
              {company.address || ''}<br />
              {company.phone || ''} {company.email ? ` · ${company.email}` : ''}<br />
              {company.license_number ? `License # ${company.license_number}` : ''}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#D4A574', fontSize: 13, letterSpacing: 2 }}>PROPOSAL</div>
          <h2 style={{ color: '#D4C5A9', fontSize: 18, fontWeight: 600, marginTop: 4 }}>{projectName}</h2>
          {portal.proposal_accepted_at && <p style={{ color: '#D4C5A9', fontSize: 11, marginTop: 6 }}>Accepted {new Date(portal.proposal_accepted_at).toLocaleDateString()}</p>}
        </div>
      </div>
    </div>
  );
}

function NumCell({ value, editable, onChange, prefix = '', suffix = '' }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  return (
    <td className="border border-[#B49B7E] px-2 py-2 text-right" style={{ color: '#D4C5A9', fontSize: 13 }}>
      {editable ? (
        <input type="number" value={v} onChange={e => setV(e.target.value)} onBlur={() => onChange(parseFloat(v) || 0)} className="w-full bg-transparent text-right outline-none" style={{ color: '#D4C5A9' }} />
      ) : (<>{prefix}{fmt(value)}{suffix}</>)}
    </td>
  );
}
function TextCell({ value, editable, onChange }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  return (
    <td className="border border-[#B49B7E] px-2 py-2 text-center" style={{ color: '#D4C5A9', fontSize: 13 }}>
      {editable ? (
        <input value={v} onChange={e => setV(e.target.value)} onBlur={() => onChange(v)} className="w-full bg-transparent text-center outline-none" style={{ color: '#D4C5A9' }} />
      ) : (value || '')}
    </td>
  );
}

function ExtraRow({ extra, editable, onChange, onDelete }) {
  const [local, setLocal] = useState(extra);
  useEffect(() => { setLocal(extra); }, [extra]);
  const lineTotal = computeLine(local.quantity, local.cost, local.markup_percent);
  return (
    <tr style={{ background: 'linear-gradient(135deg, rgba(212,165,116,0.06) 0%, rgba(15,18,24,0.95) 100%)' }}>
      <td className="border border-[#B49B7E] px-2 py-2 text-center" style={{ color: '#D4A574', fontSize: 13 }}>+</td>
      <td className="border border-[#B49B7E] px-3 py-2" style={{ color: '#D4C5A9', fontSize: 13 }}>
        {editable ? <input value={local.name} onChange={e => setLocal({ ...local, name: e.target.value })} onBlur={() => onChange({ name: local.name })} className="w-full bg-transparent outline-none" style={{ color: '#D4C5A9' }} /> : local.name}
      </td>
      <NumCell value={local.quantity} editable={editable} onChange={v => onChange({ quantity: v })} />
      <TextCell value={local.unit} editable={editable} onChange={v => onChange({ unit: v })} />
      <NumCell value={local.cost} editable={editable} onChange={v => onChange({ cost: v })} prefix="$" />
      <NumCell value={local.markup_percent} editable={editable} onChange={v => onChange({ markup_percent: v })} suffix="%" />
      <td className="border border-[#B49B7E] px-2 py-2 text-right" style={{ color: '#D4A574', fontSize: 13, fontWeight: 800 }}>
        {fmtUSD(lineTotal)}
        {editable && <button onClick={onDelete} style={{ marginLeft: 8, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11 }}>✕</button>}
      </td>
    </tr>
  );
}

function AddLineRow({ onAdd, snippets }) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <tr>
      <td colSpan="7" className="border border-[#B49B7E] px-2 py-1" style={{ background: '#0f1218', position: 'relative' }}>
        <button onClick={() => onAdd(null)} style={{ color: '#10B981', fontSize: 11, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer', marginRight: 12 }}>+ ADD LINE</button>
        {snippets?.length > 0 && <button onClick={() => setShowMenu(!showMenu)} style={{ color: '#D4A574', fontSize: 11, fontWeight: 700, background: 'transparent', border: 'none', cursor: 'pointer' }}>+ FROM SNIPPET</button>}
        {showMenu && (
          <div style={{ position: 'absolute', top: '100%', left: 12, background: '#0f1218', border: '1px solid #D4A574', zIndex: 50, maxHeight: 280, overflowY: 'auto', minWidth: 280 }}>
            {snippets.map(s => (
              <div key={s.id} onClick={() => { onAdd(s); setShowMenu(false); }} style={{ padding: '8px 12px', borderBottom: '1px solid #1a1f2e', cursor: 'pointer', color: '#D4C5A9', fontSize: 12 }}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.6 }}>{s.default_quantity} {s.default_unit} · {fmtUSD(s.default_cost)} · {s.default_markup_percent}%</div>
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

function ProposalTotals({ totals, portal, editEnabled, accessCode, onSave, showProfit }) {
  const [tax, setTax] = useState(portal.tax_rate || 0);
  const [pm, setPm] = useState(portal.pm_fee_rate || 0);
  useEffect(() => { setTax(portal.tax_rate || 0); setPm(portal.pm_fee_rate || 0); }, [portal.tax_rate, portal.pm_fee_rate]);
  const commit = async (patch) => {
    if (!editEnabled) return;
    if (portal.access_code) {
      await fetch(`${API_URL}/api/builder-portal/${portal.id}/proposal-settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    } else if (portal.trade_access_code) {
      await fetch(`${API_URL}/api/builder/${portal.builder_access_code}/trades/${portal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    }
    onSave?.();
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 20px 8px' }}>
      <table style={{ minWidth: 360 }}>
        <tbody>
          <Row label="Subtotal" value={fmtUSD(totals.subtotal)} />
          <Row label="Tax" value={
            <span>{editEnabled ? <input type="number" value={tax} onChange={e => setTax(e.target.value)} onBlur={() => commit({ tax_rate: parseFloat(tax) || 0 })} style={{ width: 50, background: '#1a1f2e', color: '#D4A574', border: '1px solid #B49B7E', textAlign: 'right', padding: 2 }} /> : (portal.tax_rate || 0)}% — {fmtUSD(totals.tax)}</span>
          } />
          <Row label="PM Fee" value={
            <span>{editEnabled ? <input type="number" value={pm} onChange={e => setPm(e.target.value)} onBlur={() => commit({ pm_fee_rate: parseFloat(pm) || 0 })} style={{ width: 50, background: '#1a1f2e', color: '#D4A574', border: '1px solid #B49B7E', textAlign: 'right', padding: 2 }} /> : (portal.pm_fee_rate || 0)}% — {fmtUSD(totals.pmFee)}</span>
          } />
          <tr><td style={{ padding: '10px 12px', background: '#D4A574', color: '#1a1f2e', fontWeight: 800, fontSize: 14 }}>TOTAL DUE</td><td style={{ padding: '10px 12px', background: '#D4A574', color: '#1a1f2e', fontWeight: 800, fontSize: 14, textAlign: 'right' }}>{fmtUSD(totals.total)}</td></tr>
          {showProfit && <tr><td style={{ padding: '8px 12px', background: '#064e3b', color: '#D4C5A9', fontSize: 11 }}>Profit (your eyes only)</td><td style={{ padding: '8px 12px', background: '#064e3b', color: '#D4C5A9', fontSize: 11, textAlign: 'right' }}>{fmtUSD(totals.profit)}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
function Row({ label, value }) {
  return <tr><td style={{ padding: '6px 12px', color: '#D4C5A9', fontSize: 12, borderBottom: '1px solid #1a1f2e' }}>{label}</td><td style={{ padding: '6px 12px', color: '#D4C5A9', fontSize: 12, borderBottom: '1px solid #1a1f2e', textAlign: 'right' }}>{value}</td></tr>;
}

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
    <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', margin: 12, padding: 12, borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 700 }}>📚 SNIPPET LIBRARY — reusable line items</div>
        <button onClick={() => setAdding(!adding)} style={{ background: '#10B981', color: '#D4C5A9', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{adding ? '✕ CANCEL' : '+ NEW SNIPPET'}</button>
      </div>
      {adding && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 12 }}>
          <input placeholder="Name (e.g. Dumpster, Permit Fee)" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inp} />
          <input type="number" placeholder="Qty" value={draft.default_quantity} onChange={e => setDraft({ ...draft, default_quantity: e.target.value })} style={inp} />
          <input placeholder="Unit" value={draft.default_unit} onChange={e => setDraft({ ...draft, default_unit: e.target.value })} style={inp} />
          <input type="number" placeholder="Cost" value={draft.default_cost} onChange={e => setDraft({ ...draft, default_cost: e.target.value })} style={inp} />
          <input type="number" placeholder="Markup %" value={draft.default_markup_percent} onChange={e => setDraft({ ...draft, default_markup_percent: e.target.value })} style={inp} />
          <button onClick={create} style={{ background: '#D4A574', color: '#1a1f2e', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>SAVE</button>
        </div>
      )}
      {snippets.length === 0 && <p style={{ color: '#D4C5A9', fontSize: 12 }}>No snippets yet. Create one for things you reuse on every job.</p>}
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
