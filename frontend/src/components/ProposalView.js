/**
 * ProposalView
 * ============
 * Read-only OR editable scope tree styled IDENTICALLY to the admin FFE
 * (`ExactFFESpreadsheet.js`) — same gold borders, gradient room headers, dark
 * green category bars, alternating-row item rows. NEVER deviate.
 *
 * Used by both BUILDER (`/builder/:accessCode`) and TRADE (`/trade/:accessCode`).
 * Both fetch from `/api/builder/{access_code}/proposal` — backend's
 * `_get_portal_by_access` resolves to the right portal type automatically.
 *
 * Editable when `proposal_edit_enabled` is true on the portal record. The
 * accept-job flow flips that bit.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { getRoomColor, getMutedRoomHeaderStyle } from '../utils/roomColors';
import FileLightbox from './FileLightbox';

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
  const base = q * c;
  return base * (1 + m / 100);
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
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
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

  useEffect(() => {
    load();
    loadSnippets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessCode]);

  const portal = data?.portal || {};
  const editEnabled = !!portal.proposal_edit_enabled;
  const viewEnabled = !!portal.proposal_view_enabled;
  const accepted = !!portal.proposal_accepted;

  const overridesByItemId = useMemo(() => {
    const map = {};
    (data?.overrides || []).forEach(o => { map[o.item_id] = o; });
    return map;
  }, [data]);

  const extrasByParentId = useMemo(() => {
    const map = {};
    (data?.extras || []).forEach(e => {
      const k = `${e.parent_kind}:${e.parent_id}`;
      (map[k] = map[k] || []).push(e);
    });
    return map;
  }, [data]);

  // ============================================================
  // Sums
  // ============================================================
  const totals = useMemo(() => {
    let subtotal = 0;
    let cost = 0;
    (data?.rooms || []).forEach(r => {
      r.categories?.forEach(c => {
        c.subcategories?.forEach(s => {
          s.items?.forEach(it => {
            const o = overridesByItemId[it.id] || {};
            const q = o.quantity ?? 1;
            const cc = o.cost ?? 0;
            const m = o.markup_percent ?? 0;
            subtotal += computeLine(q, cc, m);
            cost += (Number(q) * Number(cc)) || 0;
          });
        });
      });
    });
    (data?.extras || []).forEach(e => {
      subtotal += computeLine(e.quantity, e.cost, e.markup_percent);
      cost += (Number(e.quantity || 0) * Number(e.cost || 0));
    });
    const tax = subtotal * (Number(portal.tax_rate || 0) / 100);
    const pmFee = subtotal * (Number(portal.pm_fee_rate || 0) / 100);
    const total = subtotal + tax + pmFee;
    const profit = subtotal - cost;
    return { subtotal, tax, pmFee, total, profit, cost };
  }, [data, overridesByItemId, portal.tax_rate, portal.pm_fee_rate]);

  // ============================================================
  // Mutations
  // ============================================================
  const saveOverride = async (itemId, patch) => {
    if (!editEnabled) return;
    const existing = overridesByItemId[itemId] || {};
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/override`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, ...existing, ...patch }),
    });
    load();
  };

  const addExtra = async (parentKind, parentId, fromSnippet = null) => {
    if (!editEnabled) return;
    const body = fromSnippet
      ? {
          parent_kind: parentKind,
          parent_id: parentId,
          name: fromSnippet.name,
          quantity: fromSnippet.default_quantity,
          unit: fromSnippet.default_unit,
          cost: fromSnippet.default_cost,
          markup_percent: fromSnippet.default_markup_percent,
          notes: fromSnippet.notes || '',
        }
      : { parent_kind: parentKind, parent_id: parentId, name: 'New Line Item', quantity: 1, unit: 'EA', cost: 0, markup_percent: 0, notes: '' };
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    load();
  };

  const updateExtra = async (extraId, patch) => {
    if (!editEnabled) return;
    await fetch(`${API_URL}/api/builder/${accessCode}/proposal/extra/${extraId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature }),
    });
    if (res.ok) {
      setShowAccept(false);
      setSignature('');
      load();
      onPortalChange?.();  // Notify parent only on the actual accept event
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Accept failed');
    }
  };

  // ============================================================
  // Render
  // ============================================================
  if (loading) return <div style={{ padding: 40, color: '#D4A574' }}>Loading proposal…</div>;
  if (!viewEnabled) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#D4A574' }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Proposal not yet released</h2>
        <p style={{ color: '#D4C5A9' }}>The designer hasn't enabled the proposal view yet. Check back soon.</p>
      </div>
    );
  }

  const company = data?.company || {};
  const projectName = data?.project_name || '';

  return (
    <div className="bg-black min-h-screen" style={{ paddingBottom: 60 }} data-testid="proposal-view">
      {/* ============ HEADER (white-label) ============ */}
      <ProposalHeader company={company} projectName={projectName} portal={portal} />

      {/* ============ ACCEPT BAR ============ */}
      {!accepted && (
        <div style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: '#D4C5A9', fontSize: 13 }}>
            🔒 <strong>READ-ONLY</strong> — Accept this scope to start entering your numbers.
          </div>
          <button onClick={() => setShowAccept(true)} style={{ background: '#D4A574', color: '#000', padding: '8px 18px', fontWeight: 700, borderRadius: 4, fontSize: 13, border: 'none', cursor: 'pointer' }} data-testid="accept-job-btn">
            ✓ ACCEPT JOB &amp; START QUOTE
          </button>
        </div>
      )}

      {accepted && editEnabled && (
        <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065F46 100%)', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#D4C5A9', fontSize: 12 }}>
            ✓ Accepted by <strong>{portal.proposal_accepted_signature}</strong> on {portal.proposal_accepted_at ? new Date(portal.proposal_accepted_at).toLocaleDateString() : ''} — editing UNLOCKED
          </div>
          <button onClick={() => setShowSnippets(!showSnippets)} style={{ background: '#0f1218', color: '#D4A574', border: '1px solid #D4A574', padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
            {showSnippets ? '✕ CLOSE LIBRARY' : '📚 SNIPPET LIBRARY'}
          </button>
        </div>
      )}

      {showSnippets && (
        <SnippetsPanel
          snippets={snippets}
          ownerKind={kind}
          ownerId={accessCode}
          onChange={loadSnippets}
        />
      )}

      {/* ============ SCOPE TABLE (FFE-styled) ============ */}
      <div style={{ padding: 12 }}>
        <table className="w-full border-collapse" style={{ background: '#000' }}>
          <tbody>
            {(data?.rooms || []).map((room) => {
              const roomColor = room.color || getRoomColor(room.name);
              const roomBanner = getMutedRoomHeaderStyle(roomColor);
              const roomExtras = extrasByParentId[`room:${room.id}`] || [];
              return (
                <React.Fragment key={room.id}>
                  {/* ROOM BANNER — once at top of each room (assigned color) */}
                  <tr>
                    <td colSpan="9" className="border border-[#D4A574] px-3 py-2 text-[#D4C5A9] text-sm font-bold" style={roomBanner}>
                      {room.name?.toUpperCase()} {room.floor ? <span style={{ opacity: 0.7, fontSize: 11, marginLeft: 8 }}>· {room.floor}</span> : null}
                    </td>
                  </tr>
                  {(room.categories || []).map(cat => {
                    const catExtras = extrasByParentId[`category:${cat.id}`] || [];
                    return (
                    <React.Fragment key={cat.id}>
                      {/* CATEGORY BAR (green) */}
                      <tr>
                        <td colSpan="9" className="border border-[#D4A574] px-3 py-1.5 text-[#D4C5A9] text-xs font-bold uppercase tracking-wider" style={{ background: '#065F46' }}>
                          {cat.name}
                        </td>
                      </tr>
                      {/* COLUMN HEADERS — repeated under EVERY green category bar.
                          Uses the EXACT same recipe as admin Checklist/FFE:
                          135° #8B4444 dusty-red gradient, white bold text,
                          #B49B7E gold border. NEVER deviates. */}
                      <tr>
                        {['#', 'Description', 'Vendor', 'SKU / Notes', 'Qty', 'Unit', 'Cost', 'Markup %', 'Line Total'].map((h, i) => (
                          <th
                            key={i}
                            className="border border-[#B49B7E] px-2 py-2 text-xs font-bold text-white uppercase tracking-wider"
                            style={{ background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)' }}
                          >{h}</th>
                        ))}
                      </tr>
                      {(cat.subcategories || []).map(sub => {
                        const subExtras = extrasByParentId[`subcategory:${sub.id}`] || [];
                        return (
                          <React.Fragment key={sub.id}>
                            {/* SUB-CATEGORY BAR — exact same recipe as admin Checklist:
                                tan/gold gradient, gold border, gold bold text. */}
                            <tr style={{ background: 'linear-gradient(135deg, rgba(180, 155, 126, 0.3) 0%, rgba(212, 165, 116, 0.2) 100%)' }}>
                              <td colSpan="9" className="border border-[#B49B7E] px-3 py-2">
                                <span className="text-[#D4A574] font-bold text-sm">{sub.name?.toUpperCase()}</span>
                              </td>
                            </tr>
                            {(sub.items || []).map((item, idx) => {
                                const o = overridesByItemId[item.id] || {};
                                const qty = o.quantity ?? 1;
                                const unit = o.unit ?? 'EA';
                                const cost = o.cost ?? 0;
                                const markup = o.markup_percent ?? 0;
                                const lineTotal = computeLine(qty, cost, markup);
                                const evenRow = idx % 2 === 0;
                                return (
                                  <tr key={item.id} style={{
                                    background: evenRow
                                      ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                                      : 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(45,45,55,0.9) 30%, rgba(25,25,35,0.95) 70%, rgba(15,15,25,0.95) 100%)',
                                  }}>
                                    <td className="border border-[#B49B7E] px-2 py-1 text-center text-[#B49B7E] text-xs">{idx + 1}</td>
                                    <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-xs">{item.name}</td>
                                    <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-xs">{item.vendor || ''}</td>
                                    <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-xs">{item.sku || item.notes || ''}</td>
                                    <NumCell value={qty} editable={editEnabled} onChange={v => saveOverride(item.id, { quantity: v })} />
                                    <TextCell value={unit} editable={editEnabled} onChange={v => saveOverride(item.id, { unit: v })} />
                                    <NumCell value={cost} editable={editEnabled} onChange={v => saveOverride(item.id, { cost: v })} prefix="$" />
                                    <NumCell value={markup} editable={editEnabled} onChange={v => saveOverride(item.id, { markup_percent: v })} suffix="%" />
                                    <td className="border border-[#B49B7E] px-2 py-1 text-right text-[#D4A574] text-xs font-bold">{fmtUSD(lineTotal)}</td>
                                  </tr>
                                );
                              })}
                              {/* SUB-CATEGORY EXTRAS + ADD ROW */}
                              {subExtras.map(e => (
                                <ExtraRow key={e.id} extra={e} editable={editEnabled} onChange={(p) => updateExtra(e.id, p)} onDelete={() => deleteExtra(e.id)} snippets={snippets} />
                              ))}
                              {editEnabled && (
                                <AddLineRow snippets={snippets} onAdd={(snip) => addExtra('subcategory', sub.id, snip)} />
                              )}
                            </React.Fragment>
                          );
                        })}
                        {/* CATEGORY EXTRAS + ADD ROW */}
                        {catExtras.map(e => (
                          <ExtraRow key={e.id} extra={e} editable={editEnabled} onChange={(p) => updateExtra(e.id, p)} onDelete={() => deleteExtra(e.id)} snippets={snippets} />
                        ))}
                        {editEnabled && (
                          <AddLineRow snippets={snippets} onAdd={(snip) => addExtra('category', cat.id, snip)} />
                        )}
                      </React.Fragment>
                    );
                  })}
                  {/* ROOM EXTRAS + ADD ROW */}
                  {roomExtras.map(e => (
                    <ExtraRow key={e.id} extra={e} editable={editEnabled} onChange={(p) => updateExtra(e.id, p)} onDelete={() => deleteExtra(e.id)} snippets={snippets} />
                  ))}
                  {editEnabled && (
                    <AddLineRow snippets={snippets} onAdd={(snip) => addExtra('room', room.id, snip)} />
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ============ TOTALS ============ */}
      <ProposalTotals
        totals={totals}
        portal={portal}
        editEnabled={editEnabled}
        accessCode={accessCode}
        onSave={load}
        showProfit={kind === 'builder' || kind === 'trade'}
      />

      {/* ============ PRINT BAR ============ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 24px' }}>
        <button onClick={() => window.print()} style={{ background: '#D4A574', color: '#000', padding: '8px 16px', fontWeight: 700, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12 }}>
          🖨 PRINT / SAVE PDF
        </button>
      </div>

      {/* ============ ACCEPT MODAL ============ */}
      {showAccept && (
        <div onClick={() => setShowAccept(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f1218', border: '1px solid #D4A574', maxWidth: 520, width: '92%', padding: 24, borderRadius: 8 }}>
            <h2 style={{ color: '#D4A574', fontSize: 18, marginBottom: 8 }}>Accept Job</h2>
            <p style={{ color: '#D4C5A9', fontSize: 13, marginBottom: 16 }}>
              By typing your full legal name below and clicking Accept, you agree to the scope of work as presented and unlock editing for your quote.
            </p>
            <input
              autoFocus
              type="text"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Type your full legal name"
              data-testid="accept-signature-input"
              style={{ width: '100%', padding: '10px 12px', background: '#1a1f2e', border: '1px solid #D4A574', color: '#D4C5A9', borderRadius: 4, fontSize: 14, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAccept(false)} style={{ background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={acceptProposal} data-testid="confirm-accept-btn" style={{ background: '#D4A574', color: '#000', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>✓ Accept &amp; Sign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// White-label header
// ====================================================================
function ProposalHeader({ company, projectName, portal }) {
  return (
    <div style={{ borderBottom: '2px solid #D4A574', padding: 24, background: 'linear-gradient(135deg, #0f1218 0%, #1a1f2e 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {company.logo_data ? (
            <img src={company.logo_data} alt="logo" style={{ height: 64, maxWidth: 200, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 64, height: 64, background: '#1a1f2e', border: '1px dashed #D4A574', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 9 }}>LOGO</div>
          )}
          <div>
            <h1 style={{ color: '#D4A574', fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>
              {company.company_name || 'YOUR COMPANY NAME'}
            </h1>
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
          {portal.proposal_accepted_at && (
            <p style={{ color: '#D4C5A9', fontSize: 11, marginTop: 6 }}>
              Accepted {new Date(portal.proposal_accepted_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// Inline editable cells
// ====================================================================
function NumCell({ value, editable, onChange, prefix = '', suffix = '' }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  return (
    <td className="border border-[#B49B7E] px-2 py-1 text-right text-[#D4A574] text-xs">
      {editable ? (
        <input
          type="number"
          value={v}
          onChange={e => setV(e.target.value)}
          onBlur={() => onChange(parseFloat(v) || 0)}
          className="w-full bg-transparent text-right outline-none"
          style={{ color: '#D4A574' }}
        />
      ) : (
        <>{prefix}{fmt(value)}{suffix}</>
      )}
    </td>
  );
}

function TextCell({ value, editable, onChange }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => { setV(value ?? ''); }, [value]);
  return (
    <td className="border border-[#B49B7E] px-2 py-1 text-center text-[#B49B7E] text-xs">
      {editable ? (
        <input
          value={v}
          onChange={e => setV(e.target.value)}
          onBlur={() => onChange(v)}
          className="w-full bg-transparent text-center outline-none"
          style={{ color: '#B49B7E' }}
        />
      ) : (value || '')}
    </td>
  );
}

function ExtraRow({ extra, editable, onChange, onDelete }) {
  const [local, setLocal] = useState(extra);
  useEffect(() => { setLocal(extra); }, [extra]);
  const lineTotal = computeLine(local.quantity, local.cost, local.markup_percent);
  const commit = (patch) => onChange(patch);
  return (
    <tr style={{ background: 'linear-gradient(135deg, rgba(212,165,116,0.06) 0%, rgba(15,18,24,0.95) 100%)' }}>
      <td className="border border-[#B49B7E] px-2 py-1 text-center text-[#D4A574] text-xs">+</td>
      <td className="border border-[#B49B7E] px-2 py-1 text-[#D4A574] text-xs">
        {editable ? (
          <input
            value={local.name}
            onChange={e => setLocal({ ...local, name: e.target.value })}
            onBlur={() => commit({ name: local.name })}
            className="w-full bg-transparent outline-none"
            style={{ color: '#D4A574' }}
          />
        ) : local.name}
      </td>
      <td className="border border-[#B49B7E] px-2 py-1 text-[#B49B7E] text-xs" colSpan="2">
        {editable ? (
          <input
            placeholder="notes"
            value={local.notes || ''}
            onChange={e => setLocal({ ...local, notes: e.target.value })}
            onBlur={() => commit({ notes: local.notes })}
            className="w-full bg-transparent outline-none"
            style={{ color: '#B49B7E' }}
          />
        ) : (local.notes || '')}
      </td>
      <NumCell value={local.quantity} editable={editable} onChange={v => commit({ quantity: v })} />
      <TextCell value={local.unit} editable={editable} onChange={v => commit({ unit: v })} />
      <NumCell value={local.cost} editable={editable} onChange={v => commit({ cost: v })} prefix="$" />
      <NumCell value={local.markup_percent} editable={editable} onChange={v => commit({ markup_percent: v })} suffix="%" />
      <td className="border border-[#B49B7E] px-2 py-1 text-right text-[#D4A574] text-xs font-bold">
        {fmtUSD(lineTotal)}
        {editable && (
          <button onClick={onDelete} style={{ marginLeft: 8, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11 }}>✕</button>
        )}
      </td>
    </tr>
  );
}

function AddLineRow({ onAdd, snippets }) {
  const [showSnippetMenu, setShowSnippetMenu] = useState(false);
  return (
    <tr>
      <td colSpan="9" className="border border-[#B49B7E] px-2 py-1 text-left" style={{ background: '#0f1218', position: 'relative' }}>
        <button onClick={() => onAdd(null)} className="text-[#10B981] text-[11px] hover:underline" style={{ marginRight: 12 }}>+ ADD LINE</button>
        {snippets?.length > 0 && (
          <>
            <button onClick={() => setShowSnippetMenu(!showSnippetMenu)} className="text-[#D4A574] text-[11px] hover:underline">+ FROM SNIPPET</button>
            {showSnippetMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 12, background: '#0f1218', border: '1px solid #D4A574', zIndex: 50, maxHeight: 280, overflowY: 'auto', minWidth: 280 }}>
                {snippets.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { onAdd(s); setShowSnippetMenu(false); }}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #1a1f2e', cursor: 'pointer', color: '#D4C5A9', fontSize: 12 }}
                  >
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 10 }}>{s.default_quantity} {s.default_unit} · {fmtUSD(s.default_cost)} · {s.default_markup_percent}%</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

// ====================================================================
// Totals + tax/PM editing
// ====================================================================
function ProposalTotals({ totals, portal, editEnabled, accessCode, onSave, showProfit }) {
  const [tax, setTax] = useState(portal.tax_rate || 0);
  const [pm, setPm] = useState(portal.pm_fee_rate || 0);
  useEffect(() => { setTax(portal.tax_rate || 0); setPm(portal.pm_fee_rate || 0); }, [portal.tax_rate, portal.pm_fee_rate]);

  const commit = async (patch) => {
    if (!editEnabled) return;
    // Use the right toggle endpoint depending on portal kind
    if (portal.access_code) {
      // Builder portal — designer-set settings, but tax + pm_fee live with the
      // builder. Use the proposal-settings endpoint.
      await fetch(`${API_URL}/api/builder-portal/${portal.id}/proposal-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } else if (portal.trade_access_code) {
      // Trade portal — update via trade endpoint
      await fetch(`${API_URL}/api/builder/${portal.builder_access_code}/trades/${portal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    }
    onSave?.();
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 20px 8px' }}>
      <table style={{ minWidth: 360 }}>
        <tbody>
          <Row label="Subtotal" value={fmtUSD(totals.subtotal)} />
          <Row
            label="Tax"
            value={
              <span>
                {editEnabled ? (
                  <input type="number" value={tax} onChange={e => setTax(e.target.value)} onBlur={() => commit({ tax_rate: parseFloat(tax) || 0 })} style={{ width: 50, background: '#1a1f2e', color: '#D4A574', border: '1px solid #B49B7E', textAlign: 'right', padding: 2 }} />
                ) : (portal.tax_rate || 0)}% — {fmtUSD(totals.tax)}
              </span>
            }
          />
          <Row
            label="PM Fee"
            value={
              <span>
                {editEnabled ? (
                  <input type="number" value={pm} onChange={e => setPm(e.target.value)} onBlur={() => commit({ pm_fee_rate: parseFloat(pm) || 0 })} style={{ width: 50, background: '#1a1f2e', color: '#D4A574', border: '1px solid #B49B7E', textAlign: 'right', padding: 2 }} />
                ) : (portal.pm_fee_rate || 0)}% — {fmtUSD(totals.pmFee)}
              </span>
            }
          />
          <tr>
            <td style={{ padding: '10px 12px', background: '#D4A574', color: '#000', fontWeight: 800, fontSize: 14 }}>TOTAL DUE</td>
            <td style={{ padding: '10px 12px', background: '#D4A574', color: '#000', fontWeight: 800, fontSize: 14, textAlign: 'right' }}>{fmtUSD(totals.total)}</td>
          </tr>
          {showProfit && (
            <tr>
              <td style={{ padding: '8px 12px', background: '#064e3b', color: '#D4C5A9', fontSize: 11 }}>Profit (your eyes only)</td>
              <td style={{ padding: '8px 12px', background: '#064e3b', color: '#D4C5A9', fontSize: 11, textAlign: 'right' }}>{fmtUSD(totals.profit)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ padding: '6px 12px', color: '#D4C5A9', fontSize: 12, borderBottom: '1px solid #1a1f2e' }}>{label}</td>
      <td style={{ padding: '6px 12px', color: '#D4C5A9', fontSize: 12, borderBottom: '1px solid #1a1f2e', textAlign: 'right' }}>{value}</td>
    </tr>
  );
}

// ====================================================================
// Snippets panel — manage pre-made line item templates
// ====================================================================
function SnippetsPanel({ snippets, ownerKind, ownerId, onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', default_quantity: 1, default_unit: 'EA', default_cost: 0, default_markup_percent: 0, notes: '' });
  const create = async () => {
    if (!draft.name.trim()) return;
    await fetch(`${API_URL}/api/proposal/snippets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_kind: ownerKind, owner_id: ownerId, ...draft, default_quantity: Number(draft.default_quantity), default_cost: Number(draft.default_cost), default_markup_percent: Number(draft.default_markup_percent) }),
    });
    setDraft({ name: '', default_quantity: 1, default_unit: 'EA', default_cost: 0, default_markup_percent: 0, notes: '' });
    setAdding(false);
    onChange?.();
  };
  const remove = async (id) => {
    if (!window.confirm('Delete snippet?')) return;
    await fetch(`${API_URL}/api/proposal/snippets/${id}`, { method: 'DELETE' });
    onChange?.();
  };
  return (
    <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', margin: 12, padding: 12, borderRadius: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 700 }}>📚 SNIPPET LIBRARY — reusable line items</div>
        <button onClick={() => setAdding(!adding)} style={{ background: '#10B981', color: '#D4C5A9', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
          {adding ? '✕ CANCEL' : '+ NEW SNIPPET'}
        </button>
      </div>
      {adding && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 12 }}>
          <input placeholder="Name (e.g. Dumpster, Permit Fee)" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inputCell} />
          <input type="number" placeholder="Qty" value={draft.default_quantity} onChange={e => setDraft({ ...draft, default_quantity: e.target.value })} style={inputCell} />
          <input placeholder="Unit" value={draft.default_unit} onChange={e => setDraft({ ...draft, default_unit: e.target.value })} style={inputCell} />
          <input type="number" placeholder="Cost" value={draft.default_cost} onChange={e => setDraft({ ...draft, default_cost: e.target.value })} style={inputCell} />
          <input type="number" placeholder="Markup %" value={draft.default_markup_percent} onChange={e => setDraft({ ...draft, default_markup_percent: e.target.value })} style={inputCell} />
          <button onClick={create} style={{ background: '#D4A574', color: '#000', padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>SAVE</button>
        </div>
      )}
      {snippets.length === 0 && <p style={{ color: '#6b7280', fontSize: 12 }}>No snippets yet. Create one for things you reuse on every job.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {snippets.map(s => (
          <div key={s.id} style={{ background: '#0f1218', border: '1px solid #B49B7E', padding: 8, borderRadius: 4, position: 'relative' }}>
            <div style={{ color: '#D4A574', fontSize: 12, fontWeight: 700 }}>{s.name}</div>
            <div style={{ color: '#D4C5A9', fontSize: 10 }}>{s.default_quantity} {s.default_unit} · {fmtUSD(s.default_cost)} · {s.default_markup_percent}%</div>
            <button onClick={() => remove(s.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCell = { background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 4 };
