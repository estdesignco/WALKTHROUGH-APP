/**
 * BuilderTradesManager
 * ====================
 * Inside Builder Portal → "TRADES" tab. Spawns one sub-link per trade
 * (Plumbing, Tile, Electrical, etc.). Builder picks which TRADE TAGS each
 * sub gets — the sub-portal then shows ONLY scope-of-work sentences tagged
 * with those trades. Trade pricing flows back into the Builder's Proposal.
 */
import React, { useEffect, useState } from 'react';
import { TRADE_COLORS, DEFAULT_TRADES } from './ScopeDocumentEditor';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function BuilderTradesManager({ accessCode, portal }) {
  const [trades, setTrades] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ trade_name: '', contact_name: '', contact_email: '', assigned_trades: [] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/trades`);
    if (res.ok) setTrades(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [accessCode]);

  const create = async () => {
    if (!draft.trade_name.trim()) return alert('Trade name required.');
    const assigned = draft.assigned_trades.length ? draft.assigned_trades : [draft.trade_name.toUpperCase()];
    await fetch(`${API_URL}/api/builder/${accessCode}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, assigned_trades: assigned, builder_access_code: accessCode }),
    });
    setShowCreate(false);
    setDraft({ trade_name: '', contact_name: '', contact_email: '', assigned_trades: [] });
    load();
  };
  const toggle = async (trade, patch) => {
    await fetch(`${API_URL}/api/builder/${accessCode}/trades/${trade.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    load();
  };
  const removeTrade = async (trade) => {
    if (!window.confirm(`Delete trade portal for "${trade.trade_name}"? This cannot be undone.`)) return;
    await fetch(`${API_URL}/api/builder/${accessCode}/trades/${trade.id}`, { method: 'DELETE' });
    load();
  };
  const tradeUrl = (code) => `${window.location.origin}/trade/${code}`;

  if (!portal?.proposal_view_enabled || !portal?.proposal_accepted) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#D4C5A9' }}>
        <h2 style={{ color: '#D4A574', fontSize: 20, marginBottom: 8 }}>Accept the Proposal first</h2>
        <p style={{ fontSize: 13 }}>Once you accept the proposal, you can spawn per-trade sub-links here so your subs can quote the work.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#D4A574', fontSize: 30, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', paddingBottom: 8, borderBottom: '2px solid #D4A574', flex: 1, marginRight: 16 }}>Trade Sub-Portals</h2>
        <button onClick={() => setShowCreate(!showCreate)} data-testid="add-trade-btn" style={{ background: '#10B981', color: '#D4C5A9', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          {showCreate ? '✕ CANCEL' : '+ NEW TRADE LINK'}
        </button>
      </div>

      <p style={{ color: '#D4C5A9', fontSize: 12, marginBottom: 16 }}>
        Generate a private link per sub. Pick which trades they're responsible for — they'll only see scope items tagged with those trades. Their submitted cost flows back into your proposal automatically.
      </p>

      {showCreate && (
        <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', padding: 16, borderRadius: 4, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input placeholder="Sub-contractor company (e.g. Joe's Plumbing)" value={draft.trade_name} onChange={e => setDraft({ ...draft, trade_name: e.target.value })} style={inp} />
            <input placeholder="Contact name (optional)" value={draft.contact_name} onChange={e => setDraft({ ...draft, contact_name: e.target.value })} style={inp} />
            <input placeholder="Contact email (optional)" value={draft.contact_email} onChange={e => setDraft({ ...draft, contact_email: e.target.value })} style={inp} />
          </div>
          <div style={{ marginBottom: 8, color: '#D4A574', fontSize: 11, letterSpacing: 1 }}>ASSIGN TRADES — they'll only see scope tagged with these</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {DEFAULT_TRADES.map(t => {
              const on = draft.assigned_trades.includes(t);
              const c = TRADE_COLORS[t] || '#D4A574';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraft({ ...draft, assigned_trades: on ? draft.assigned_trades.filter(x => x !== t) : [...draft.assigned_trades, t] })}
                  style={{ background: on ? c : 'transparent', color: on ? '#fff' : c, border: `1px solid ${c}`, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}
                >{on ? '✓ ' : ''}{t}</button>
              );
            })}
          </div>
          <button onClick={create} style={{ background: '#D4A574', color: '#1a1f2e', padding: '6px 16px', fontWeight: 700, fontSize: 12, border: 'none', borderRadius: 4, cursor: 'pointer' }}>CREATE LINK</button>
        </div>
      )}

      {loading && <p style={{ color: '#D4C5A9', fontSize: 12 }}>Loading…</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {trades.map(t => (
          <div key={t.id} style={{ background: '#0f1218', border: '1px solid #2a3040', borderRadius: 4, padding: 16, opacity: t.enabled ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ color: '#D4A574', fontSize: 14, fontWeight: 700 }}>{t.trade_name}</h3>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: t.enabled ? '#064e3b' : '#7f1d1d', color: '#D4C5A9' }}>
                {t.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            {t.contact_name && <p style={{ color: '#D4C5A9', fontSize: 12 }}>{t.contact_name}{t.contact_email ? ` · ${t.contact_email}` : ''}</p>}
            {(t.assigned_trades || []).length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(t.assigned_trades || []).map(at => {
                  const c = TRADE_COLORS[at] || '#D4A574';
                  return <span key={at} style={{ background: c, color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 99, letterSpacing: 1, fontWeight: 700 }}>{at}</span>;
                })}
              </div>
            )}
            <div style={{ marginTop: 8, padding: 8, background: '#1a1f2e', borderRadius: 4, fontSize: 11, color: '#D4C5A9', wordBreak: 'break-all', cursor: 'pointer' }}
                 onClick={() => navigator.clipboard?.writeText(tradeUrl(t.trade_access_code))} title="Click to copy">
              {tradeUrl(t.trade_access_code)}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => toggle(t, { enabled: !t.enabled })} data-testid={`toggle-trade-${t.id}`} style={btnSmall(t.enabled ? '#7f1d1d' : '#064e3b')}>{t.enabled ? 'DISABLE' : 'ENABLE'}</button>
              <button onClick={() => navigator.clipboard?.writeText(tradeUrl(t.trade_access_code))} style={btnSmall('#1f2937')}>COPY URL</button>
              <a href={tradeUrl(t.trade_access_code)} target="_blank" rel="noreferrer" style={{ ...btnSmall('#1f2937'), textDecoration: 'none', display: 'inline-block' }}>OPEN</a>
              <button onClick={() => removeTrade(t)} style={btnSmall('#7f1d1d')}>DELETE</button>
            </div>
            {t.proposal_accepted && <p style={{ color: '#10B981', fontSize: 11, marginTop: 8 }}>✓ Accepted by {t.proposal_accepted_signature} on {t.proposal_accepted_at ? new Date(t.proposal_accepted_at).toLocaleDateString() : ''}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const inp = { background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 4 };
const btnSmall = (bg) => ({ background: bg, color: '#D4C5A9', padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700 });
