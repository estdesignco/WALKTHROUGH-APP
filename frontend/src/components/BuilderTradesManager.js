/**
 * BuilderTradesManager
 * ====================
 * Inside Builder Portal → "TRADES" tab. Lets the builder spawn one sub-link
 * per trade (Plumbing, Tile, Electrical, etc.), pick which CATEGORIES that
 * trade can see, toggle each link on/off, and copy the share URL.
 *
 * Trade sub-portal layout matches the Builder Portal exactly (FFE-styled).
 */
import React, { useEffect, useState } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function BuilderTradesManager({ accessCode, portal, rooms }) {
  const [trades, setTrades] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ trade_name: '', contact_name: '', contact_email: '', category_filter: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/trades`);
    if (res.ok) setTrades(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [accessCode]);

  // Flatten all categories the builder has visibility into, so they can
  // pick exactly which ones each trade gets.
  const allCategories = [];
  (rooms || []).forEach(r => {
    (r.categories || []).forEach(c => {
      allCategories.push({ id: c.id, label: `${r.name} → ${c.name}` });
    });
  });

  const create = async () => {
    if (!draft.trade_name.trim()) return alert('Trade name required.');
    await fetch(`${API_URL}/api/builder/${accessCode}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, builder_access_code: accessCode }),
    });
    setShowCreate(false);
    setDraft({ trade_name: '', contact_name: '', contact_email: '', category_filter: [] });
    load();
  };

  const toggle = async (trade, patch) => {
    await fetch(`${API_URL}/api/builder/${accessCode}/trades/${trade.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    load();
  };

  const removeTrade = async (trade) => {
    if (!window.confirm(`Delete trade portal for "${trade.trade_name}"? This cannot be undone.`)) return;
    await fetch(`${API_URL}/api/builder/${accessCode}/trades/${trade.id}`, { method: 'DELETE' });
    load();
  };

  const tradeUrl = (code) => `${window.location.origin}/trade/${code}`;

  const proposalEnabled = !!portal?.proposal_view_enabled;
  const proposalAccepted = !!portal?.proposal_accepted;

  if (!proposalEnabled || !proposalAccepted) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#D4A574' }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Accept the Proposal first</h2>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>
          Once you accept the proposal, you can spawn per-trade sub-links here so your subs can quote the work.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700 }}>Trade Sub-Portals</h2>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-trade-btn" style={{ background: '#10B981', color: '#fff', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          {showCreate ? '✕ CANCEL' : '+ NEW TRADE LINK'}
        </button>
      </div>

      <p style={{ color: '#6B7280', fontSize: 12, marginBottom: 16 }}>
        Generate a private link per sub. Each link can be toggled on/off any time. Subs only see the categories you give them; your numbers stay private.
      </p>

      {showCreate && (
        <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', padding: 16, borderRadius: 4, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input placeholder="Trade name (e.g. Plumbing)" value={draft.trade_name} onChange={e => setDraft({ ...draft, trade_name: e.target.value })} style={inp} />
            <input placeholder="Contact name (optional)" value={draft.contact_name} onChange={e => setDraft({ ...draft, contact_name: e.target.value })} style={inp} />
            <input placeholder="Contact email (optional)" value={draft.contact_email} onChange={e => setDraft({ ...draft, contact_email: e.target.value })} style={inp} />
          </div>
          <div style={{ marginBottom: 8, color: '#D4A574', fontSize: 11, letterSpacing: 1 }}>VISIBLE CATEGORIES (leave empty for FULL scope)</div>
          <div style={{ maxHeight: 180, overflowY: 'auto', background: '#0f1218', border: '1px solid #2a3040', padding: 8, borderRadius: 4, marginBottom: 12 }}>
            {allCategories.map(c => (
              <label key={c.id} style={{ display: 'block', color: '#D4C5A9', fontSize: 12, padding: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={draft.category_filter.includes(c.id)}
                  onChange={e => setDraft({ ...draft, category_filter: e.target.checked ? [...draft.category_filter, c.id] : draft.category_filter.filter(x => x !== c.id) })}
                  style={{ marginRight: 8 }}
                />
                {c.label}
              </label>
            ))}
            {allCategories.length === 0 && <p style={{ color: '#6B7280', fontSize: 12 }}>No categories available yet.</p>}
          </div>
          <button onClick={create} style={{ background: '#D4A574', color: '#000', padding: '6px 16px', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 4, cursor: 'pointer' }}>CREATE LINK</button>
        </div>
      )}

      {loading && <p style={{ color: '#9ca3af', fontSize: 12 }}>Loading…</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {trades.map(t => (
          <div key={t.id} style={{ background: '#0f1218', border: '1px solid #2a3040', borderRadius: 4, padding: 16, opacity: t.enabled ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ color: '#D4A574', fontSize: 14, fontWeight: 700 }}>{t.trade_name}</h3>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: t.enabled ? '#064e3b' : '#7f1d1d', color: '#fff' }}>
                {t.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            {t.contact_name && <p style={{ color: '#9ca3af', fontSize: 12 }}>{t.contact_name}{t.contact_email ? ` · ${t.contact_email}` : ''}</p>}
            <div style={{ marginTop: 8, padding: 8, background: '#1a1f2e', borderRadius: 4, fontSize: 11, color: '#D4C5A9', wordBreak: 'break-all', cursor: 'pointer' }}
                 onClick={() => { navigator.clipboard?.writeText(tradeUrl(t.trade_access_code)); }}
                 title="Click to copy">
              {tradeUrl(t.trade_access_code)}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => toggle(t, { enabled: !t.enabled })} data-testid={`toggle-trade-${t.id}`} style={btnSmall(t.enabled ? '#7f1d1d' : '#064e3b')}>{t.enabled ? 'DISABLE' : 'ENABLE'}</button>
              <button onClick={() => navigator.clipboard?.writeText(tradeUrl(t.trade_access_code))} style={btnSmall('#1f2937')}>COPY URL</button>
              <a href={tradeUrl(t.trade_access_code)} target="_blank" rel="noreferrer" style={{ ...btnSmall('#1f2937'), textDecoration: 'none', display: 'inline-block' }}>OPEN</a>
              <button onClick={() => removeTrade(t)} style={btnSmall('#7f1d1d')}>DELETE</button>
            </div>
            {t.proposal_accepted && (
              <p style={{ color: '#10B981', fontSize: 11, marginTop: 8 }}>
                ✓ Accepted by {t.proposal_accepted_signature} on {t.proposal_accepted_at ? new Date(t.proposal_accepted_at).toLocaleDateString() : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inp = { background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 4 };
const btnSmall = (bg) => ({ background: bg, color: '#fff', padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700 });
