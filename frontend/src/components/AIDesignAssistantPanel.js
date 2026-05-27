/**
 * AIDesignAssistantPanel — in-app side panel hosting the user's Canva
 * refinement / vendor-matching agent (Gemini 3.1 Pro vision).
 *
 * Mounted on every project page. Opens with a floating ✨ button.
 * - Drag/drop or paste Canva screenshots
 * - Per-project conversation memory persists across reloads
 * - One-click push of detected items into the existing /agent/v1/items/bulk
 * - "⚙ Edit brain" lets the user customize the system prompt without code
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = ((window.ENV?.REACT_APP_BACKEND_URL) || (process.env.REACT_APP_BACKEND_URL) || window.location.origin) + '/api';

export default function AIDesignAssistantPanel({ projectId, projectName = '', open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [memory, setMemory] = useState({});
  const [draft, setDraft] = useState('');
  const [pendingImages, setPendingImages] = useState([]);   // [{base64, mime_type, name, preview}]
  const [pendingPdf, setPendingPdf] = useState(null);       // {base64, name, page_count}
  const [pendingFloorPlan, setPendingFloorPlan] = useState(null); // {base64, mime_type, name, preview}
  const [pdfRoom, setPdfRoom] = useState('');
  const [pdfSheet, setPdfSheet] = useState('checklist');
  const [pdfIngestStatus, setPdfIngestStatus] = useState('');
  const [projectRooms, setProjectRooms] = useState([]);     // suggestions for the room dropdown
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [canvaStatus, setCanvaStatus] = useState(null); // {connected:bool, configured:bool}
  const [reEnrichStatus, setReEnrichStatus] = useState(null); // {scanning:bool, summary:obj}
  const [selectedForPush, setSelectedForPush] = useState({});  // {messageId-itemIdx: true}
  const [pushStatus, setPushStatus] = useState(null);
  const scrollRef = useRef(null);

  const loadConversation = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${API}/ai-assist/conversations/${projectId}`);
      if (res.ok) {
        const j = await res.json();
        setMessages(j.messages || []);
        setMemory(j.memory || {});
      }
    } catch (e) { console.error(e); }
  }, [projectId]);

  useEffect(() => { if (open) loadConversation(); }, [open, loadConversation]);

  // Canva connection status — drives the header chip (connect button vs ✅).
  useEffect(() => {
    if (!open) return;
    fetch(`${API}/canva/status`)
      .then(r => r.json())
      .then(d => setCanvaStatus(d))
      .catch(() => setCanvaStatus({ connected: false }));
  }, [open]);

  const reEnrichMissing = async () => {
    setReEnrichStatus({ scanning: true });
    try {
      const r = await fetch(`${API}/ai-assist/re-enrich`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, only_missing: true }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || 'Re-enrich failed');
      setReEnrichStatus({ scanning: false, summary: j.summary });
    } catch (e) {
      setReEnrichStatus({ scanning: false, error: e.message });
    }
  };


  const connectCanva = async () => {
    try {
      const r = await fetch(`${API}/canva/auth`, { cache: 'no-store' });
      const text = await r.text();
      let d;
      try {
        d = JSON.parse(text);
      } catch (parseErr) {
        // Surface the raw body so we can see what came back instead of JSON
        alert('Canva connect failed: response was not JSON.\n\nStatus: ' + r.status + '\nBody:\n' + text.slice(0, 400));
        return;
      }
      if (!d.authorization_url || d.authorization_url.includes('client_id=&') || d.authorization_url.includes('client_id=None')) {
        alert(
          'Canva not yet configured.\n\n' +
          'Add these 2 values to backend/.env from developers.canva.com:\n\n' +
          'CANVA_CLIENT_ID=...\n' +
          'CANVA_CLIENT_SECRET=...\n\n' +
          'Then restart the backend. The redirect URI to register on Canva is already set:\n' +
          window.location.origin + '/canva/callback'
        );
        return;
      }
      const w = 600, h = 700;
      const left = window.screen.width / 2 - w / 2, top = window.screen.height / 2 - h / 2;
      const popup = window.open(d.authorization_url, 'Canva', `width=${w},height=${h},left=${left},top=${top}`);
      const poll = setInterval(async () => {
        if (popup && popup.closed) {
          clearInterval(poll);
          const s = await fetch(`${API}/canva/status`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({}));
          setCanvaStatus(s);
        }
      }, 1000);
    } catch (e) {
      alert('Canva connect failed: ' + e.message);
    }
  };

  // Pre-load the project's rooms so the PDF room dropdown has real options.
  useEffect(() => {
    if (!open || !projectId) return;
    fetch(`${API}/projects/${projectId}?sheet_type=checklist`)
      .then(r => r.json())
      .then(d => {
        const names = Array.from(new Set((d.rooms || []).map(r => r.name).filter(Boolean)));
        setProjectRooms(names);
      })
      .catch(() => {});
  }, [open, projectId]);
  useEffect(() => { setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, 50); }, [messages, sending]);

  const handleFiles = (files) => {
    Array.from(files).slice(0, 5).forEach(f => {
      // PDFs take a separate path — they're one-room ingests.
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = String(reader.result).split(',')[1];
          setPendingPdf({ base64, name: f.name, size: f.size });
        };
        reader.readAsDataURL(f);
        return;
      }
      if (!f.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = String(dataUrl).split(',')[1];
        setPendingImages(prev => [...prev, { base64, mime_type: f.type, name: f.name, preview: dataUrl }]);
      };
      reader.readAsDataURL(f);
    });
  };

  // Paste-from-clipboard support (Cmd+V into the panel) — common Canva flow.
  const onPaste = (e) => {
    const items = e.clipboardData?.items || [];
    const imgs = Array.from(items).filter(i => i.type.startsWith('image/'));
    if (imgs.length) {
      e.preventDefault();
      handleFiles(imgs.map(i => i.getAsFile()).filter(Boolean));
    }
  };

  const removeImage = (idx) => setPendingImages(prev => prev.filter((_, i) => i !== idx));

  // Dedicated floor-plan attach (separate from regular room images so the
  // agent knows which image is the spatial plan vs. which is the room
  // character/finish reference). Only one floor plan per turn.
  const handleFloorPlanFile = (files) => {
    const f = Array.from(files || [])[0];
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(',')[1];
      setPendingFloorPlan({ base64, mime_type: f.type, name: f.name, preview: dataUrl });
    };
    reader.readAsDataURL(f);
  };
  const clearFloorPlan = () => setPendingFloorPlan(null);

  const ingestPdf = async () => {
    if (!pendingPdf) return;
    if (!pdfRoom.trim()) { setError('Pick a room for this PDF (one PDF = one room).'); return; }
    setError(''); setSending(true); setPdfIngestStatus('Reading PDF + extracting embedded links…');
    try {
      const res = await fetch(`${API}/ai-assist/ingest-pdf`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          room_name: pdfRoom.trim(),
          sheet_type: pdfSheet,
          pdf_base64: pendingPdf.base64,
          extra_message: draft || '',
          floor_plan: pendingFloorPlan
            ? { base64: pendingFloorPlan.base64, mime_type: pendingFloorPlan.mime_type }
            : null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || 'PDF ingest failed');
      }
      const data = await res.json();
      // Synthesize a fake assistant message so the items show in the thread.
      const fakeId = `pdf-${Date.now()}`;
      const summary = `Imported ${data.pages_rendered} page(s) from "${pendingPdf.name}". Found ${data.vendor_urls_found} vendor links and detected ${data.detected_items.length} items in ${data.room_name}. Enrichment: ${data.enrichment.filter(e => e.status === 'ok').length}/${data.enrichment.length} links scraped.`;
      const assistantMsg = {
        id: fakeId, role: 'assistant',
        content: summary + (data.assistant_message ? '\n\n' + data.assistant_message : ''),
        design_notes: data.design_notes || '',
        detected_items: data.detected_items,
      };
      setMessages(prev => [...prev, assistantMsg]);
      // Pre-select all items so the user can push in one click.
      const next = { ...selectedForPush };
      data.detected_items.forEach((_, idx) => { next[`${fakeId}-${idx}`] = true; });
      setSelectedForPush(next);
      setPendingPdf(null); setPdfRoom(''); setDraft('');
      setPendingFloorPlan(null);
      setPdfIngestStatus('');
      loadConversation();
    } catch (e) {
      setError(e.message);
      setPdfIngestStatus('');
    } finally {
      setSending(false);
    }
  };

  const cancelPdf = () => { setPendingPdf(null); setPdfRoom(''); setPdfIngestStatus(''); };

  const send = async () => {
    if (sending) return;
    if (!draft.trim() && pendingImages.length === 0) {
      setError('Type a message or drop a Canva image.');
      return;
    }
    setError(''); setSending(true);
    try {
      const res = await fetch(`${API}/ai-assist/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          message: draft,
          images: pendingImages.map(p => ({ base64: p.base64, mime_type: p.mime_type })),
          floor_plan: pendingFloorPlan
            ? { base64: pendingFloorPlan.base64, mime_type: pendingFloorPlan.mime_type }
            : null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || 'Chat failed');
      }
      const data = await res.json();
      // Optimistically append both messages; loadConversation would also work.
      setMessages(prev => [...prev, data.user_message, data.assistant_message]);
      setDraft(''); setPendingImages([]);
      setPendingFloorPlan(null);
      setPushStatus(null);
      // Refresh memory snapshot
      loadConversation();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Clear this project\'s conversation and memory? Cannot be undone.')) return;
    await fetch(`${API}/ai-assist/conversations/${projectId}`, { method: 'DELETE' });
    setMessages([]); setMemory({}); setSelectedForPush({});
  };

  const toggleItem = (msgId, idx) => {
    const k = `${msgId}-${idx}`;
    setSelectedForPush(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const pushSelected = async () => {
    // Collect all detected items the user has ticked.
    const items = [];
    messages.forEach(m => {
      (m.detected_items || []).forEach((it, idx) => {
        if (selectedForPush[`${m.id}-${idx}`]) {
          items.push({ ...it, external_id: it.external_id || `aiassist-${m.id}-${idx}` });
        }
      });
    });
    if (items.length === 0) { setError('Select at least one item to push.'); return; }
    setError(''); setPushStatus({ status: 'pushing' });
    try {
      const res = await fetch(`${API}/ai-assist/push-items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, items }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.detail || 'Push failed');
      // Surface per-item errors that the bulk endpoint silently swallows.
      // The most common cause is "Project not found" when the URL's project id
      // got wiped from the DB; before this fix the panel just said "Pushed: 0
      // new, 0 errors" and the user had no idea what went wrong.
      if (j.errors > 0) {
        const firstErr = (j.results || []).find(r => r.status === 'error');
        const code = firstErr?.error?.code;
        const detail = firstErr?.error?.detail || firstErr?.error?.message || 'unknown error';
        let msg = `Pushed ${j.created} item${j.created === 1 ? '' : 's'}, but ${j.errors} failed.`;
        if (code === 404 && String(detail).toLowerCase().includes('project')) {
          msg = `❌ Push failed: this project (${projectId}) no longer exists in the database. Navigate to a real project from the home page and try again.`;
        } else if (code) {
          msg += `\n\nFirst error (${code}): ${detail}`;
        } else {
          msg += `\n\nFirst error: ${detail}`;
        }
        setError(msg);
      }
      setPushStatus({ status: 'done', summary: j });
      setSelectedForPush({});
    } catch (e) {
      setError(e.message); setPushStatus(null);
    }
  };

  const selectAllInMessage = (msg) => {
    const next = { ...selectedForPush };
    (msg.detected_items || []).forEach((_, idx) => { next[`${msg.id}-${idx}`] = true; });
    setSelectedForPush(next);
  };

  const selectedCount = Object.values(selectedForPush).filter(Boolean).length;
  const hasMemory = memory && Object.keys(memory).some(k => {
    const v = memory[k];
    return (Array.isArray(v) && v.length) || (typeof v === 'object' && v && Object.keys(v).length) || (typeof v === 'string' && v.length);
  });

  if (!open) return null;

  return (
    <div data-testid="ai-assistant-panel" style={panel}>
      {/* Header */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div>
            <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>DESIGN AGENT</div>
            <div style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.7 }}>{projectName || projectId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {canvaStatus && !canvaStatus.connected && (
            <button data-testid="aiassist-connect-canva" onClick={connectCanva} title="Connect your Canva account so you can paste design URLs instead of uploading PDFs"
              style={{ background: 'transparent', color: '#14b8a6', border: '1px solid #14b8a6', padding: '3px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 1, borderRadius: 3, cursor: 'pointer' }}>
              📐 CONNECT CANVA
            </button>
          )}
          {canvaStatus && canvaStatus.connected && (
            <span data-testid="aiassist-canva-connected" title="Canva connected"
              style={{ color: '#10B981', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>✅ CANVA</span>
          )}
          <button data-testid="aiassist-re-enrich" onClick={reEnrichMissing} title="Backfill empty image / size / finish / price on existing checklist items"
            disabled={reEnrichStatus?.scanning}
            style={{ background: 'transparent', color: '#D4A574', border: '1px solid #D4A574', padding: '3px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 1, borderRadius: 3, cursor: reEnrichStatus?.scanning ? 'wait' : 'pointer' }}>
            {reEnrichStatus?.scanning ? '⏳ ENRICHING…' : (reEnrichStatus?.summary ? `✓ ${reEnrichStatus.summary.updated} UPDATED` : '🔄 BACKFILL')}
          </button>
          <a data-testid="aiassist-download-bundle" href={`${API}/ai-assist/chatgpt-bundle`} download="CHATGPT_BUNDLE.md" title="Download the ChatGPT/Claude/Gemini handoff bundle" style={{ ...iconBtn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⤓</a>
          <button data-testid="aiassist-edit-prompt" onClick={() => setShowPromptEditor(true)} title="Edit agent brain" style={iconBtn}>⚙</button>
          <button data-testid="aiassist-reset" onClick={reset} title="Clear conversation + memory" style={iconBtn}>🗑</button>
          <button data-testid="aiassist-close" onClick={onClose} title="Close" style={iconBtn}>✕</button>
        </div>
      </div>

      {/* Memory chip */}
      {hasMemory && (
        <div data-testid="aiassist-memory-chip" style={{ background: '#0a0a0a', padding: '6px 14px', borderBottom: '1px solid #2a3040', fontSize: 11, color: '#10B981' }}>
          🧠 Memory: {summarizeMemory(memory)}
        </div>
      )}

      {/* Message thread */}
      <div ref={scrollRef} style={thread} onPaste={onPaste} tabIndex={0}>
        {messages.length === 0 && (
          <div style={emptyState}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>✨</div>
            <div style={{ color: '#D4A574', fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>READY</div>
            <p style={{ color: '#D4C5A9', fontSize: 12, opacity: 0.8, maxWidth: 240 }}>
              Drop a Canva board screenshot, paste an image (Cmd+V), or describe a room.
              The agent identifies items, suggests vendor matches, and you push them into your checklist.
            </p>
          </div>
        )}
        {messages.map(m => (
          <MessageBubble
            key={m.id}
            msg={m}
            onToggleItem={toggleItem}
            onSelectAll={() => selectAllInMessage(m)}
            selected={selectedForPush}
          />
        ))}
        {sending && (
          <div data-testid="aiassist-thinking" style={{ ...bubbleAssistant, opacity: 0.75 }}>
            <span style={{ color: '#D4A574', letterSpacing: 1, fontSize: 11, fontWeight: 700 }}>AGENT</span>
            <div style={{ marginTop: 6, color: '#D4C5A9', fontSize: 13 }}>Thinking… (vision call ~10-20s)</div>
          </div>
        )}
      </div>

      {/* Push bar */}
      {selectedCount > 0 && (
        <div data-testid="aiassist-push-bar" style={pushBar}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{selectedCount} item{selectedCount === 1 ? '' : 's'} selected</div>
          <button data-testid="aiassist-push-btn" onClick={pushSelected} disabled={pushStatus?.status === 'pushing'} style={pushBtn}>
            {pushStatus?.status === 'pushing' ? 'Pushing…' : `↑ PUSH TO CHECKLIST`}
          </button>
        </div>
      )}
      {pushStatus?.status === 'done' && (
        <div data-testid="aiassist-push-summary" style={{ padding: '8px 14px', background: '#064e3b', borderTop: '1px solid #10B981', color: '#fff', fontSize: 12 }}>
          ✓ Pushed: {pushStatus.summary.created} new, {pushStatus.summary.exists} already existed, {pushStatus.summary.errors} errors
        </div>
      )}

      {/* Composer */}
      <div style={composer}>
        {pendingPdf && (
          <div data-testid="aiassist-pdf-picker" style={{ padding: 12, background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderBottom: '1px solid #D4A574' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ color: '#D4A574', fontSize: 11, letterSpacing: 2, fontWeight: 800 }}>📄 PDF READY — ONE ROOM ONLY</div>
                <div style={{ color: '#D4C5A9', fontSize: 11, marginTop: 2, opacity: 0.85 }}>{pendingPdf.name} · {(pendingPdf.size / 1024).toFixed(0)} KB</div>
              </div>
              <button onClick={cancelPdf} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6, marginBottom: 8 }}>
              <div>
                <label style={{ color: '#D4A574', fontSize: 10, letterSpacing: 1, fontWeight: 700, display: 'block', marginBottom: 2 }}>ROOM</label>
                <input
                  list="ai-pdf-rooms"
                  value={pdfRoom}
                  onChange={e => setPdfRoom(e.target.value)}
                  placeholder="e.g. Great Room, Master Bath…"
                  data-testid="aiassist-pdf-room"
                  style={{ width: '100%', background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}
                />
                <datalist id="ai-pdf-rooms">
                  {projectRooms.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <label style={{ color: '#D4A574', fontSize: 10, letterSpacing: 1, fontWeight: 700, display: 'block', marginBottom: 2 }}>SHEET</label>
                <select value={pdfSheet} onChange={e => setPdfSheet(e.target.value)} data-testid="aiassist-pdf-sheet"
                  style={{ width: '100%', background: '#0a0a0a', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '6px 8px', fontSize: 12, borderRadius: 3 }}>
                  <option value="checklist">Checklist</option>
                  <option value="ffe">FF&E</option>
                  <option value="walkthrough">Walkthrough</option>
                </select>
              </div>
            </div>
            <button onClick={ingestPdf} disabled={sending || !pdfRoom.trim()} data-testid="aiassist-pdf-ingest"
              style={{ width: '100%', background: sending ? '#4b5563' : '#10B981', color: '#fff', border: 'none', padding: '8px 12px', fontSize: 12, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: sending ? 'not-allowed' : 'pointer' }}>
              {sending ? (pdfIngestStatus || 'Working…') : `↑ INGEST PDF INTO ${pdfRoom || 'ROOM'}`}
            </button>
            <div style={{ marginTop: 6, fontSize: 10, color: '#D4C5A9', opacity: 0.65 }}>
              Vendor links in the PDF will be auto-scraped for prices, images &amp; finishes. <a href="/admin/vendor-portals" target="_blank" rel="noreferrer" style={{ color: '#D4A574' }}>Manage vendor logins →</a>
            </div>
          </div>
        )}
        {pendingFloorPlan && (
          <div data-testid="aiassist-floorplan-chip" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderBottom: '1px solid #2a3040', background: 'rgba(20,184,166,0.06)' }}>
            <img src={pendingFloorPlan.preview} alt="floor plan" style={{ height: 56, borderRadius: 4, border: '1px solid #14b8a6' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#14b8a6', fontSize: 11, letterSpacing: 2, fontWeight: 800 }}>📐 FLOOR PLAN ATTACHED</div>
              <div style={{ color: '#D4C5A9', fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pendingFloorPlan.name}</div>
              <div style={{ color: '#D4C5A9', fontSize: 10, opacity: 0.55 }}>Agent will use this for spatial fit (sizing + placement).</div>
            </div>
            <button onClick={clearFloorPlan} data-testid="aiassist-floorplan-remove"
              style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        )}
        {pendingImages.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px', overflowX: 'auto', borderBottom: '1px solid #2a3040' }}>
            {pendingImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', flex: '0 0 auto' }}>
                <img src={img.preview} alt={img.name} style={{ height: 56, borderRadius: 4, border: '1px solid #B49B7E' }} />
                <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <DragDropZone onFiles={handleFiles}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onPaste={onPaste}
            placeholder="Drop a Canva PDF (one room) or image, paste (⌘V), or type instructions…"
            data-testid="aiassist-input"
            rows={3}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#D4C5A9', padding: '10px 12px', fontSize: 13, resize: 'none', fontFamily: 'inherit' }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          />
        </DragDropZone>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderTop: '1px solid #2a3040' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <label style={attachBtn} data-testid="aiassist-attach">
              📎 Attach
              <input type="file" multiple accept="image/*,application/pdf" onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
            </label>
            <label style={{ ...attachBtn, borderColor: pendingFloorPlan ? '#14b8a6' : attachBtn.borderColor, color: pendingFloorPlan ? '#14b8a6' : attachBtn.color }} data-testid="aiassist-attach-floorplan" title="Attach a dedicated floor plan (room dimensions + circulation)">
              📐 {pendingFloorPlan ? 'Plan attached' : 'Floor plan'}
              <input type="file" accept="image/*" onChange={e => handleFloorPlanFile(e.target.files)} style={{ display: 'none' }} />
            </label>
            {error && <span data-testid="aiassist-error" style={{ color: '#ef4444', fontSize: 11 }}>{error}</span>}
          </div>
          <button data-testid="aiassist-send" onClick={send} disabled={sending} style={sendBtn}>
            {sending ? 'Sending…' : 'SEND →'}
          </button>
        </div>
      </div>

      {showPromptEditor && (
        <PromptEditorModal projectId={projectId} onClose={() => setShowPromptEditor(false)} />
      )}
    </div>
  );
}

function MessageBubble({ msg, onToggleItem, onSelectAll, selected }) {
  const isUser = msg.role === 'user';
  return (
    <div style={isUser ? bubbleUser : bubbleAssistant} data-testid={`aiassist-msg-${msg.role}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#D4A574', letterSpacing: 1, fontSize: 11, fontWeight: 700 }}>{isUser ? 'YOU' : 'AGENT'}</span>
        {msg.image_count > 0 && <span style={{ fontSize: 10, color: '#10B981' }}>📎 {msg.image_count} img</span>}
      </div>
      {msg.content && <div style={{ marginTop: 6, color: '#D4C5A9', fontSize: 13, whiteSpace: 'pre-wrap' }}>{msg.content}</div>}
      {msg.design_notes && (
        <div style={{ marginTop: 8, padding: 8, background: '#0a0a0a', borderLeft: '2px solid #D4A574', borderRadius: 3, color: '#D4C5A9', fontSize: 12, fontStyle: 'italic' }}>
          {msg.design_notes}
        </div>
      )}
      {msg.detected_items && msg.detected_items.length > 0 && (
        <div style={{ marginTop: 10 }} data-testid={`detected-items-${msg.id}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ color: '#10B981', fontSize: 11, letterSpacing: 1, fontWeight: 700 }}>
              DETECTED ITEMS · {msg.detected_items.length}
            </span>
            <button data-testid={`select-all-${msg.id}`} onClick={onSelectAll}
              style={{ background: 'transparent', color: '#D4A574', border: '1px solid #D4A574', padding: '2px 8px', fontSize: 10, fontWeight: 700, borderRadius: 3, cursor: 'pointer' }}>
              ☑ ALL
            </button>
          </div>
          {msg.detected_items.map((it, idx) => {
            const k = `${msg.id}-${idx}`;
            const chosen = !!selected[k];
            return (
              <label key={idx}
                data-testid={`detected-item-${msg.id}-${idx}`}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: 6, marginBottom: 4,
                  background: chosen ? 'rgba(212,165,116,0.12)' : '#0a0a0a',
                  border: `1px solid ${chosen ? '#D4A574' : '#2a3040'}`, borderRadius: 4, cursor: 'pointer'
                }}>
                <input type="checkbox" checked={chosen} onChange={() => onToggleItem(msg.id, idx)} style={{ marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{it.name || '(unnamed)'}</div>
                  <div style={{ color: '#D4C5A9', fontSize: 10, marginTop: 2, opacity: 0.85 }}>
                    {it.vendor || '—'}
                    {it.sku && <> · SKU {it.sku}</>}
                    {it.cost > 0 && <> · ${Number(it.cost).toLocaleString()}</>}
                    {' · '}{it.room_name || '—'} › {it.category_name || '—'} › {it.subcategory_name || '—'}
                    {it.sheet_type && it.sheet_type !== 'checklist' && <> · {it.sheet_type.toUpperCase()}</>}
                  </div>
                  {it.remarks && <div style={{ color: '#10B981', fontSize: 10, marginTop: 2, opacity: 0.85 }}>{it.remarks}</div>}
                  {typeof it.confidence === 'number' && (
                    <div style={{ marginTop: 4, height: 3, background: '#1a1f2e', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(it.confidence * 100)}%`, height: '100%', background: it.confidence >= 0.75 ? '#10B981' : it.confidence >= 0.5 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
      {msg.clarification_needed && (
        <div data-testid={`clarification-${msg.id}`} style={{ marginTop: 8, padding: 8, background: '#1a1f2e', border: '1px solid #f59e0b', borderRadius: 4, color: '#f59e0b', fontSize: 12 }}>
          ❓ {msg.clarification_needed}
        </div>
      )}
    </div>
  );
}

function DragDropZone({ children, onFiles }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
      style={{ background: over ? 'rgba(212,165,116,0.12)' : 'transparent', transition: 'background 100ms' }}
    >
      {children}
    </div>
  );
}

function PromptEditorModal({ projectId, onClose }) {
  const [scope, setScope] = useState('project');
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [original, setOriginal] = useState('');

  useEffect(() => {
    fetch(`${API}/ai-assist/prompt?project_id=${projectId}`).then(r => r.json()).then(j => {
      setPrompt(j.prompt || '');
      setOriginal(j.prompt || '');
      setScope(j.scope || 'default');
    });
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/ai-assist/prompt`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, project_id: scope === 'project' ? projectId : null }),
      });
      onClose();
    } finally { setSaving(false); }
  };

  const dirty = prompt !== original;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} data-testid="aiassist-prompt-editor" style={{ background: '#0f1218', border: '1px solid #D4A574', borderRadius: 8, maxWidth: 800, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #2a3040' }}>
          <h3 style={{ color: '#D4A574', fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>⚙ AGENT BRAIN</h3>
          <p style={{ color: '#D4C5A9', fontSize: 11, opacity: 0.8, marginTop: 4 }}>
            Edit the system prompt that drives the design agent. Saved changes take effect immediately on the next message.
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => setScope('project')} data-testid="prompt-scope-project"
              style={{ background: scope === 'project' ? '#D4A574' : 'transparent', color: scope === 'project' ? '#1a1f2e' : '#D4C5A9', border: '1px solid #D4A574', padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: 'pointer' }}>
              THIS PROJECT
            </button>
            <button onClick={() => setScope('workspace')} data-testid="prompt-scope-workspace"
              style={{ background: scope === 'workspace' ? '#D4A574' : 'transparent', color: scope === 'workspace' ? '#1a1f2e' : '#D4C5A9', border: '1px solid #D4A574', padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: 'pointer' }}>
              WORKSPACE DEFAULT
            </button>
          </div>
        </div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} data-testid="prompt-textarea"
          style={{ flex: 1, minHeight: 400, background: '#0a0a0a', color: '#D4C5A9', border: 'none', padding: 16, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5, resize: 'none', outline: 'none' }} />
        <div style={{ padding: 12, borderTop: '1px solid #2a3040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#D4C5A9', fontSize: 11, opacity: 0.7 }}>{prompt.length} chars{dirty && ' · unsaved'}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onClose} style={{ background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={!dirty || saving} data-testid="prompt-save"
              style={{ background: dirty ? '#D4A574' : '#4b5563', color: '#1a1f2e', padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, border: 'none', cursor: dirty ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function summarizeMemory(memory) {
  const parts = [];
  const items = memory.visible_item_set || [];
  if (items.length) parts.push(`${items.length} items`);
  const vendors = memory.vendor_matches || {};
  if (Object.keys(vendors).length) parts.push(`${Object.keys(vendors).length} vendor matches`);
  const dnc = memory.do_not_change_constraints || [];
  if (dnc.length) parts.push(`${dnc.length} do-not-change rules`);
  const paint = memory.paint_references || {};
  if (Object.keys(paint).length) parts.push('paint locked');
  return parts.length ? parts.join(' · ') : 'tracking room continuity';
}

const panel = {
  position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '92vw',
  background: '#0f1218', borderLeft: '1px solid #D4A574', zIndex: 1090,
  display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 28px rgba(0,0,0,0.5)',
};
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', borderBottom: '1px solid #D4A574' };
const iconBtn = { background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 13 };
const thread = { flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 };
const bubbleUser = { background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 6, padding: 10, alignSelf: 'stretch' };
const bubbleAssistant = { background: '#0a0a0a', border: '1px solid #D4A574', borderRadius: 6, padding: 10, alignSelf: 'stretch' };
const emptyState = { textAlign: 'center', padding: 40, color: '#D4C5A9' };
const composer = { borderTop: '1px solid #D4A574', background: '#0a0a0a' };
const attachBtn = { background: '#1a1f2e', color: '#D4A574', border: '1px solid #D4A574', padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 3, cursor: 'pointer' };
const sendBtn = { background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '6px 16px', fontSize: 12, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: 'pointer' };
const pushBar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'linear-gradient(135deg, #064e3b 0%, #065F46 100%)', borderTop: '1px solid #10B981' };
const pushBtn = { background: '#10B981', color: '#fff', border: 'none', padding: '6px 14px', fontSize: 11, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: 'pointer' };
