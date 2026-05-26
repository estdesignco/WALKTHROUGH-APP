/**
 * VendorPortalsPage — minimal, focused page for managing vendor portal
 * credentials. Used by the AI Design Assistant to unlock authenticated
 * scraping (price, hi-res image, finish, size) on B2B vendor sites.
 *
 * Route: /admin/vendor-portals (inside the authenticated app shell).
 */
import React, { useEffect, useState } from 'react';

const API = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

export default function VendorPortalsPage() {
  const [portals, setPortals] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loginStatus, setLoginStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [loggingInKey, setLoggingInKey] = useState('');
  const [drafts, setDrafts] = useState({});  // { [vendor_key]: { username, password } }
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([
        fetch(`${API}/vendor-portals`).then(r => r.json()),
        fetch(`${API}/vendor-portals/saved-credentials`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/vendor-portals/login-status`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      ]);
      setPortals(Array.isArray(p) ? p : (p.portals || []));
      setCredentials(Array.isArray(c) ? c : (c.credentials || []));
      setLoginStatus(s.status || s || {});
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveCreds = async (vendorKey) => {
    const d = drafts[vendorKey];
    if (!d?.username || !d?.password) { setMessage('Enter both username and password.'); return; }
    setSavingKey(vendorKey); setMessage('');
    try {
      const res = await fetch(`${API}/vendor-portals/${vendorKey}/credentials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: d.username, password: d.password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || 'Save failed');
      }
      setMessage(`✓ Saved credentials for ${vendorKey}`);
      setDrafts(prev => ({ ...prev, [vendorKey]: { username: '', password: '' } }));
      load();
    } catch (e) {
      setMessage(`✗ ${e.message}`);
    } finally { setSavingKey(''); }
  };

  const testLogin = async (vendorKey) => {
    setLoggingInKey(vendorKey); setMessage('');
    try {
      const res = await fetch(`${API}/vendor-portals/${vendorKey}/login`, { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.detail || 'Login failed');
      setMessage(j.message ? `✓ ${vendorKey}: ${j.message}` : `✓ Logged into ${vendorKey}`);
      load();
    } catch (e) {
      setMessage(`✗ ${vendorKey}: ${e.message}`);
    } finally { setLoggingInKey(''); }
  };

  const hasCred = (vk) => credentials.some(c => (c.vendor_key === vk || c.vendor === vk));
  const loggedIn = (vk) => loginStatus[vk] === 'logged_in' || loginStatus[vk] === true;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#D4C5A9', padding: 32 }} data-testid="vendor-portals-page">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ color: '#D4A574', fontSize: 24, letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>VENDOR PORTAL LOGINS</h1>
        <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
          Save your vendor B2B logins ONCE. The AI Design Assistant uses them to fetch real prices, hi-res images, finish swatches, and sizes when ingesting Canva PDFs.
        </p>
        <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 24 }}>
          Credentials are encrypted at rest. Never shown back to you in plaintext.
        </p>

        {message && (
          <div style={{ background: message.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.startsWith('✓') ? '#10B981' : '#ef4444'}`, color: message.startsWith('✓') ? '#10B981' : '#ef4444', padding: 10, borderRadius: 4, marginBottom: 16, fontSize: 12 }} data-testid="vp-message">
            {message}
          </div>
        )}

        {loading ? <div style={{ padding: 20 }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
            {portals.map(p => {
              const vk = p.key || p.vendor_key;
              const d = drafts[vk] || {};
              const isSaved = hasCred(vk);
              const isLoggedIn = loggedIn(vk);
              return (
                <div key={vk} data-testid={`vp-card-${vk}`} style={{ background: '#1a1f2e', border: '1px solid #B49B7E', padding: 14, borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: '#D4A574', fontSize: 14, fontWeight: 800 }}>{p.name || vk}</div>
                      <div style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.7 }}>{p.url || p.domain || ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {isSaved && <span style={{ background: '#0f1218', color: '#10B981', fontSize: 9, padding: '2px 6px', borderRadius: 3, border: '1px solid #10B981', letterSpacing: 1, fontWeight: 700 }}>SAVED</span>}
                      {isLoggedIn && <span style={{ background: '#10B981', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 3, letterSpacing: 1, fontWeight: 700 }}>LIVE</span>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <input
                      placeholder={isSaved ? 'Saved · type to replace' : 'Username / email'}
                      value={d.username || ''}
                      onChange={e => setDrafts(prev => ({ ...prev, [vk]: { ...(prev[vk] || {}), username: e.target.value } }))}
                      data-testid={`vp-user-${vk}`}
                      style={{ background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #4b5563', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}
                    />
                    <input
                      type="password"
                      placeholder={isSaved ? 'Saved · type to replace' : 'Password'}
                      value={d.password || ''}
                      onChange={e => setDrafts(prev => ({ ...prev, [vk]: { ...(prev[vk] || {}), password: e.target.value } }))}
                      data-testid={`vp-pass-${vk}`}
                      style={{ background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #4b5563', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => saveCreds(vk)} disabled={savingKey === vk || !(d.username && d.password)} data-testid={`vp-save-${vk}`}
                      style={{ flex: 1, background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '6px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 1, borderRadius: 3, cursor: 'pointer' }}>
                      {savingKey === vk ? 'Saving…' : 'SAVE'}
                    </button>
                    <button onClick={() => testLogin(vk)} disabled={!isSaved || loggingInKey === vk} data-testid={`vp-test-${vk}`}
                      style={{ flex: 1, background: isSaved ? '#10B981' : '#4b5563', color: '#fff', border: 'none', padding: '6px 10px', fontSize: 11, fontWeight: 800, letterSpacing: 1, borderRadius: 3, cursor: isSaved ? 'pointer' : 'not-allowed' }}>
                      {loggingInKey === vk ? 'Testing…' : 'TEST LOGIN'}
                    </button>
                  </div>
                </div>
              );
            })}
            {portals.length === 0 && (
              <div style={{ padding: 20, opacity: 0.7, gridColumn: '1 / -1' }}>No vendor portals configured. Check backend/vendor_portals.py.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
