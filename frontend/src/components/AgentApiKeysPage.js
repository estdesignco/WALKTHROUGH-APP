/**
 * AgentApiKeysPage — admin UI to mint, list, and revoke API keys for
 * external automation (ChatGPT GPT Actions, MCP servers, Zapier, n8n, etc.).
 *
 * Route: /admin/agent-keys (mounted inside the authenticated app shell).
 */
import React, { useState, useEffect } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

export default function AgentApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [justCreated, setJustCreated] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [k, p] = await Promise.all([
        fetch(`${API_URL}/agent/admin/api-keys`).then(r => r.json()),
        fetch(`${API_URL}/projects`).then(r => r.json()),
      ]);
      setKeys(k.keys || []);
      setProjects(p || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const mint = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/agent/admin/api-keys`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), project_id: projectId || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setJustCreated(data);
        setName('');
        load();
      } else {
        alert(data.detail || 'Failed to mint key');
      }
    } finally { setCreating(false); }
  };

  const revoke = async (id) => {
    if (!window.confirm('Revoke this key? Agents using it will be cut off immediately.')) return;
    await fetch(`${API_URL}/agent/admin/api-keys/${id}`, { method: 'DELETE' });
    load();
  };

  const copy = (s) => navigator.clipboard.writeText(s);

  const inp = { background: '#0f1218', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '8px 10px', fontSize: 13, borderRadius: 4 };
  const lbl = { color: '#D4A574', fontSize: 11, letterSpacing: 2, fontWeight: 700, display: 'block', marginBottom: 4 };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#D4C5A9', padding: 32 }} data-testid="agent-keys-page">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ color: '#D4A574', fontSize: 24, letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>AGENT API KEYS</h1>
        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 24 }}>
          Mint keys to let ChatGPT GPT Actions, MCP servers, Zapier or n8n write items into your projects.
          Each key can be scoped to a single project, or workspace-wide. See <a href="/AGENT_API.md" style={{ color: '#D4A574' }}>docs</a>.
        </p>

        {justCreated && (
          <div style={{ background: '#064e3b', border: '1px solid #10B981', padding: 16, borderRadius: 6, marginBottom: 24 }} data-testid="just-created-key">
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>✓ Key created — save it now, you won't see it again.</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ background: '#000', padding: '8px 12px', borderRadius: 4, color: '#D4A574', flex: 1, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                {justCreated.api_key}
              </code>
              <button onClick={() => copy(justCreated.api_key)} style={{ background: '#10B981', color: '#fff', padding: '8px 14px', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>COPY</button>
              <button onClick={() => setJustCreated(null)} style={{ background: 'transparent', color: '#D4C5A9', padding: '8px 14px', border: '1px solid #4b5563', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
            </div>
          </div>
        )}

        <div style={{ background: '#1a1f2e', border: '1px solid #B49B7E', borderRadius: 6, padding: 20, marginBottom: 24 }}>
          <h2 style={{ color: '#D4A574', fontSize: 14, letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>MINT NEW KEY</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 10 }}>
            <div>
              <label style={lbl}>NAME</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ChatGPT Canva agent" data-testid="key-name-input" style={{ ...inp, width: '100%' }} />
            </div>
            <div>
              <label style={lbl}>SCOPE</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} data-testid="key-project-select" style={{ ...inp, width: '100%' }}>
                <option value="">Workspace-wide (all projects)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={mint} disabled={creating || !name.trim()} data-testid="mint-key-btn"
                style={{ background: creating ? '#4b5563' : '#D4A574', color: '#1a1f2e', padding: '8px 18px', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, letterSpacing: 1, cursor: 'pointer' }}>
                {creating ? 'Minting…' : '+ MINT KEY'}
              </button>
            </div>
          </div>
        </div>

        <h2 style={{ color: '#D4A574', fontSize: 14, letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>ACTIVE KEYS</h2>
        {loading ? (
          <div style={{ padding: 20, opacity: 0.7 }}>Loading…</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: 20, opacity: 0.7, background: '#1a1f2e', borderRadius: 6, border: '1px dashed #B49B7E', textAlign: 'center' }}>
            No keys yet. Mint your first key above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1f2e', borderRadius: 6, overflow: 'hidden' }} data-testid="keys-table">
            <thead>
              <tr style={{ background: '#0f1218', color: '#D4A574', fontSize: 11, letterSpacing: 2 }}>
                <th style={th}>NAME</th>
                <th style={th}>PREFIX</th>
                <th style={th}>SCOPE</th>
                <th style={th}>CREATED</th>
                <th style={th}>LAST USED</th>
                <th style={th}>STATE</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => {
                const proj = projects.find(p => p.id === k.project_id);
                return (
                  <tr key={k.id} style={{ borderTop: '1px solid #2a3040', opacity: k.revoked ? 0.45 : 1 }} data-testid={`key-row-${k.id}`}>
                    <td style={td}>{k.name}</td>
                    <td style={{ ...td, fontFamily: 'monospace', color: '#D4A574' }}>{k.prefix}…</td>
                    <td style={td}>{proj ? proj.name : <em style={{ opacity: 0.7 }}>workspace-wide</em>}</td>
                    <td style={td}>{new Date(k.created_at).toLocaleDateString()}</td>
                    <td style={td}>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : <span style={{ opacity: 0.5 }}>never</span>}</td>
                    <td style={td}>{k.revoked ? <span style={{ color: '#ef4444', fontWeight: 700 }}>REVOKED</span> : <span style={{ color: '#10B981', fontWeight: 700 }}>ACTIVE</span>}</td>
                    <td style={td}>
                      {!k.revoked && (
                        <button onClick={() => revoke(k.id)} data-testid={`revoke-${k.id}`}
                          style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
                          REVOKE
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 32, padding: 16, background: '#0f1218', border: '1px solid #2a3040', borderRadius: 6, fontSize: 12 }}>
          <div style={{ color: '#D4A574', fontWeight: 700, marginBottom: 6 }}>Quick test</div>
          <p style={{ opacity: 0.85, marginBottom: 10 }}>Once you have a key, verify it from a terminal:</p>
          <pre style={{ background: '#000', padding: 10, borderRadius: 4, color: '#D4C5A9', overflow: 'auto', fontSize: 11 }}>
{`curl -H "X-API-Key: edk_xxx" \\
  ${window.location.origin}/api/agent/v1/ping`}
          </pre>
        </div>
      </div>
    </div>
  );
}

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 700 };
const td = { padding: '8px 12px', fontSize: 12, color: '#D4C5A9' };
