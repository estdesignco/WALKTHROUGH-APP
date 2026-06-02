/**
 * BurstBackfillModal — opens each missing-data vendor URL as a tab in the
 * USER's authenticated browser. The Chrome extension (v7.39+) auto-detects
 * the `#design-ready-autoscrape` hash, scrapes the page, and POSTs the
 * result to /api/extension-scrape. This panel then polls the cache and
 * merges results into items as they come in.
 *
 * Why this exists: B2B vendors (Uttermost, Four Hands, Gabby) block
 * headless cloud Playwright. Running the scrape inside the user's logged-in
 * Chrome session is the only reliable way to pull wholesale price + size +
 * finish from those sites.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = ((window.ENV?.REACT_APP_BACKEND_URL) || (process.env.REACT_APP_BACKEND_URL) || window.location.origin) + '/api';

export default function BurstBackfillModal({ projectId, onClose }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState({}); // {item_id: true}
  const [scraped, setScraped] = useState({}); // {item_id: fields_count}
  const [polling, setPolling] = useState(false);
  const [mergeStatus, setMergeStatus] = useState(null);
  const pollRef = useRef(null);

  // Load the queue once on open
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/ai-assist/backfill-queue?project_id=${projectId}`);
      const j = await r.json();
      setQueue(j.items || []);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Could not load backfill queue: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Build the auto-scrape URL for a given link. We embed the LIVE backend
  // URL in the hash so the extension posts the scrape to the SAME backend
  // the user is currently looking at — not the production fallback. This
  // fixes the "browser scraped fine but my checklist still shows nothing"
  // bug (data was landing in production cache instead of preview cache).
  const buildAutoscrapeUrl = (link) => {
    const base = link.split('#')[0];
    const backendOrigin = (window.ENV?.REACT_APP_BACKEND_URL) || (process.env.REACT_APP_BACKEND_URL) || window.location.origin;
    return `${base}#design-ready-autoscrape&backend=${encodeURIComponent(backendOrigin)}&close=1`;
  };

  // Build the HTML for the COORDINATOR window. The coordinator is a single
  // popup the user explicitly approves. Once it's open, IT advances ONE
  // shared scrape tab through every vendor URL — Chrome treats `window.open`
  // calls that reuse the same target name as navigations of an existing tab,
  // not new popups. This is the only pattern that reliably gets past Chrome's
  // popup-blocker rate limit, even with the site whitelisted.
  const buildCoordinatorHtml = (items) => {
    const itemsJson = JSON.stringify(items.map(it => ({
      id: it.item_id,
      name: it.name || '',
      vendor: it.vendor || '',
      url: buildAutoscrapeUrl(it.link),
      cleanUrl: it.link.split('#')[0],
      missing: (it.missing || []).join(', '),
    })));
    return `<!doctype html><html><head><title>🚀 Design Ready — Burst Scrape</title>
<style>
  body { font-family:-apple-system,sans-serif; background:#1a1f2e; color:#E5DCC9; margin:0; padding:24px; min-height:100vh }
  h1 { color:#D4A574; font-size:18px; letter-spacing:2px; margin:0 0 8px 0 }
  .sub { color:#D4C5A9; font-size:12px; opacity:0.75; margin-bottom:18px }
  .bar { background:#22293a; border:1px solid #2a3040; border-radius:6px; padding:16px; margin-bottom:14px }
  .row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #2a3040; font-size:12px }
  .row:last-child { border-bottom:none }
  .mark { width:22px; text-align:center; font-size:16px }
  .meta { flex:1; min-width:0 }
  .meta b { color:#fff; font-size:13px }
  .meta i { color:#D4A574; font-style:normal; margin-left:6px; font-weight:400 }
  .miss { color:#ef4444; font-size:11px }
  .ok { color:#10B981 }
  .pending { color:#86807a }
  .running { color:#f59e0b }
  button { background:#10B981; color:#fff; border:none; padding:10px 18px; font-size:13px; font-weight:800; letter-spacing:1; border-radius:4px; cursor:pointer }
  button.stop { background:#ef4444; margin-left:10px }
  button:disabled { background:#4b5563; cursor:not-allowed }
  .progress { color:#10B981; font-weight:700; margin-left:8px }
</style></head><body>
<h1>🚀 BURST SCRAPER — READY</h1>
<div class="sub">DO NOT CLOSE THIS WINDOW until "ALL DONE" shows. ONE scrape tab opens and walks through every vendor URL — the Chrome extension auto-scrapes each as it loads.</div>
<div class="bar">
  <button id="startBtn">▶ START — walk through ${items.length} vendor URLs</button>
  <button id="stopBtn" class="stop" disabled>■ STOP</button>
  <span class="progress" id="prog"></span>
</div>
<div class="bar" id="rows"></div>
<script>
  const items = ${itemsJson};
  const rowsEl = document.getElementById('rows');
  const progEl = document.getElementById('prog');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  let stopped = false;
  let doneCount = 0;
  let scrapeWin = null;
  let waitingFor = null;
  let resolveWait = null;

  items.forEach((it, i) => {
    const r = document.createElement('div');
    r.className = 'row';
    r.id = 'row-' + i;
    r.innerHTML = '<div class="mark pending">○</div>' +
      '<div class="meta"><b>' + (it.name || 'item ' + (i+1)) + '</b><i>· ' + (it.vendor || '—') + '</i><br><span class="miss">missing: ' + it.missing + '</span></div>';
    rowsEl.appendChild(r);
  });

  const markRow = (i, status, extra) => {
    const r = document.getElementById('row-' + i);
    if (!r) return;
    const m = r.querySelector('.mark');
    if (status === 'running') { m.textContent = '⏳'; m.className = 'mark running'; }
    else if (status === 'done')    { m.textContent = '✓'; m.className = 'mark ok'; }
    else if (status === 'fail')    { m.textContent = '✕'; m.className = 'mark miss'; }
    else if (status === 'timeout') { m.textContent = '⏱'; m.className = 'mark miss'; }
    if (extra) {
      const miss = r.querySelector('.miss');
      if (miss) miss.textContent = extra;
    }
  };

  const updateProg = () => { progEl.textContent = doneCount + ' of ' + items.length + ' processed'; };
  updateProg();

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Listen for the extension's "I'm done scraping THIS URL" signal so we
  // don't have to use a fixed sleep. Each scrape posts a message back.
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.source !== 'design-ready-autoscrape') return;
    if (waitingFor && d.url && d.url.split('#')[0].split('?')[0] === waitingFor.split('#')[0].split('?')[0]) {
      if (resolveWait) resolveWait({ status: d.status || 'done', fields: d.fields || [] });
    }
  });

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    progEl.textContent = 'opening scrape tab…';

    // Open ONE scrape tab. Reuse the same window name so subsequent
    // window.open() calls NAVIGATE it instead of opening N popups.
    scrapeWin = window.open(items[0].url, 'design-ready-scrape-tab');
    if (!scrapeWin) {
      progEl.textContent = '✕ Popup blocked. Click the popup icon in this window\\'s address bar → Always allow → click START again.';
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }
    markRow(0, 'running');

    for (let i = 0; i < items.length; i++) {
      if (stopped) break;
      if (i > 0) {
        // Navigate the SAME tab to the next URL — no new popup created
        try { scrapeWin.location.href = items[i].url; } catch (e) {
          markRow(i, 'fail', 'tab closed unexpectedly');
          break;
        }
        markRow(i, 'running');
      }
      waitingFor = items[i].cleanUrl;
      // Wait up to 20s for the autoscrape signal; otherwise time out and move on
      const result = await new Promise((resolve) => {
        let timer = null;
        resolveWait = (r) => { if (timer) clearTimeout(timer); resolveWait = null; resolve(r); };
        timer = setTimeout(() => { if (resolveWait) resolveWait({ status: 'timeout' }); }, 20000);
      });
      if (result.status === 'done') {
        markRow(i, 'done', '✓ scraped ' + (result.fields ? result.fields.join(', ') : '(no fields)'));
      } else if (result.status === 'error') {
        markRow(i, 'fail', '✕ ' + (result.error || 'scrape failed'));
      } else {
        markRow(i, 'timeout', '⏱ no response in 20s');
      }
      doneCount = i + 1;
      updateProg();
      // Small breather between URLs so the page can stabilize
      await sleep(800);
    }

    try { if (scrapeWin && !scrapeWin.closed) scrapeWin.close(); } catch (e) {}
    progEl.textContent = stopped ? '⏸ STOPPED at ' + doneCount + ' of ' + items.length : '✅ ALL DONE — ' + doneCount + ' of ' + items.length + '. Click MERGE INTO CHECKLIST in the main app, then close this window.';
    stopBtn.disabled = true;
    startBtn.disabled = false;
    startBtn.textContent = '↻ RUN AGAIN';
  });

  stopBtn.addEventListener('click', () => { stopped = true; });

  try { if (window.opener) window.opener.postMessage({ source:'design-ready-burst', status:'ready' }, '*'); } catch(e) {}
</script></body></html>`;
  };

  // Open ONE item — single user click = single window.open = always allowed by Chrome
  const openOne = (item) => {
    const url = buildAutoscrapeUrl(item.link);
    const w = window.open(url, '_blank');
    if (!w) {
      // eslint-disable-next-line no-alert
      alert('Popup blocked. Click the popup icon in your address bar → "Always allow popups from this site" → click OPEN again.');
      return false;
    }
    setOpened(prev => ({ ...prev, [item.item_id]: true }));
    if (!polling) startPolling();
    return true;
  };

  // Open the COORDINATOR window. ONE user-gesture popup, then THAT popup
  // spawns the rest of the vendor tabs from its own context (which Chrome
  // allows because the coordinator itself is user-approved). This is the
  // pattern that bypasses Chrome's "block N popups" policy.
  const openCoordinator = () => {
    if (queue.length === 0) return;
    const html = buildCoordinatorHtml(queue);
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, 'design-ready-burst', 'width=720,height=720');
    if (!w) {
      // eslint-disable-next-line no-alert
      alert('Popup blocked. Allow popups for this site once and click again.\n\nIn Chrome: click the popup icon (right side of address bar) → Always allow popups from this site → click OPEN AGAIN.');
      return;
    }
    // Mark every item as "opened" so the polling watcher starts immediately
    const allOpened = {};
    queue.forEach(it => { allOpened[it.item_id] = true; });
    setOpened(allOpened);
    startPolling();
    // Release the blob URL after the popup finished loading
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  };

  // Poll cache + merge endpoint every 3s
  const startPolling = () => {
    if (pollRef.current) return;
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        // Check cache for each opened item URL
        const cacheR = await fetch(`${API}/extension-scrape-cache`);
        const cacheJ = await cacheR.json();
        const cacheByUrl = {};
        (cacheJ.items || []).forEach(c => {
          const k = (c.url || '').split('?')[0].split('#')[0];
          cacheByUrl[k] = c;
        });
        const newScraped = { ...scraped };
        let anyNew = false;
        queue.forEach(it => {
          const k = (it.link || '').split('?')[0].split('#')[0];
          const c = cacheByUrl[k];
          if (c && !newScraped[it.item_id]) {
            const fields = ['name', 'sku', 'price', 'size', 'finish_color', 'finish_image', 'image_url'].filter(f => c[f]);
            newScraped[it.item_id] = fields.length;
            anyNew = true;
          }
        });
        if (anyNew) setScraped(newScraped);

        // Auto-stop polling once everything is scraped
        if (Object.keys(newScraped).length >= queue.length && queue.length > 0) {
          stopPolling();
        }
      } catch (e) {
        // silent — keep polling
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  };

  useEffect(() => () => stopPolling(), []);

  // Click "MERGE NOW" → call merge-cache → reload queue
  const mergeNow = async () => {
    setMergeStatus({ status: 'merging' });
    try {
      const r = await fetch(`${API}/ai-assist/merge-cache`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const j = await r.json();
      setMergeStatus({ status: 'done', summary: j });
      await loadQueue();
    } catch (e) {
      setMergeStatus({ status: 'error', error: e.message });
    }
  };

  return (
    <div data-testid="burst-backfill-modal"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', borderRadius: 6, width: 720, maxWidth: '92vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a3040' }}>
          <div>
            <div style={{ color: '#D4A574', fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>🚀 BURST BACKFILL</div>
            <div style={{ color: '#D4C5A9', fontSize: 11, opacity: 0.75, marginTop: 2 }}>
              Open each vendor URL in YOUR browser — the Chrome extension scrapes it in your logged-in session.
            </div>
          </div>
          <button onClick={onClose} data-testid="burst-backfill-close"
            style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading && <div style={{ color: '#D4C5A9', fontSize: 13 }}>Loading items…</div>}

          {!loading && queue.length === 0 && (
            <div data-testid="burst-backfill-empty" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
              <div style={{ color: '#10B981', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>NOTHING TO BACKFILL</div>
              <div style={{ color: '#D4C5A9', fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Every item with a vendor link already has image, price, size, and finish.
              </div>
            </div>
          )}

          {!loading && queue.length > 0 && (
            <>
              <div style={{ background: 'rgba(212,165,116,0.08)', border: '1px solid #B49B7E', borderRadius: 4, padding: 10, marginBottom: 12, fontSize: 12, color: '#D4C5A9', lineHeight: 1.5 }}>
                <strong style={{ color: '#D4A574' }}>How this works:</strong>
                <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Click <strong>OPEN COORDINATOR</strong> below. <em>ONE</em> popup opens (you only have to approve popups once).</li>
                  <li>In the coordinator popup, click <strong>▶ START</strong> — it opens each vendor URL as a tab from inside the coordinator (Chrome allows this because you already approved the coordinator).</li>
                  <li>Each vendor tab loads in YOUR browser (where you're logged in), the Chrome extension auto-scrapes it, and the tab closes itself.</li>
                  <li>This window (the backfill modal) ticks each row to ✓ as data lands.</li>
                  <li>Click <strong>MERGE INTO CHECKLIST</strong> when done.</li>
                </ol>
                <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>
                  ⚠ Requires <strong>Design Ready Scraper extension v7.39+</strong> installed and logged into your vendor sites.
                  <a href={`${API.replace(/\/api$/, '')}/api/download-scraper`} style={{ color: '#14b8a6', marginLeft: 6 }} target="_blank" rel="noreferrer">↓ Get latest extension</a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button data-testid="burst-backfill-open-all" onClick={openCoordinator}
                  style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: 'pointer' }}>
                  🚀 OPEN COORDINATOR → AUTO-SCRAPE {queue.length}
                </button>
                {!polling && Object.keys(opened).length > 0 && (
                  <button onClick={startPolling}
                    style={{ background: 'transparent', color: '#D4A574', border: '1px solid #D4A574', padding: '10px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
                    🔄 RESUME WATCH
                  </button>
                )}
                {polling && (
                  <button onClick={stopPolling}
                    style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 14px', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
                    ⏸ STOP WATCHING
                  </button>
                )}
              </div>

              {/* Item rows */}
              <div style={{ border: '1px solid #2a3040', borderRadius: 4 }}>
                {queue.map((it, i) => {
                  const isOpen = !!opened[it.item_id];
                  const scrapedCount = scraped[it.item_id] || 0;
                  const done = scrapedCount > 0;
                  return (
                    <div key={it.item_id}
                      data-testid={`burst-row-${it.item_id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderBottom: i < queue.length - 1 ? '1px solid #2a3040' : 'none', background: done ? 'rgba(16,185,129,0.08)' : '#0a0a0a' }}>
                      <div style={{ width: 22, textAlign: 'center', fontSize: 16 }}>
                        {done ? <span style={{ color: '#10B981' }}>✓</span> : (isOpen ? <span style={{ color: '#f59e0b' }}>⏳</span> : <span style={{ color: '#86807a' }}>○</span>)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.name || '(unnamed)'}
                          {it.vendor && <span style={{ color: '#D4A574', marginLeft: 6, fontWeight: 400 }}>· {it.vendor}</span>}
                          {it.sku && <span style={{ color: '#86807a', marginLeft: 6, fontSize: 10 }}>· {it.sku}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: '#D4C5A9', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                          missing: <span style={{ color: '#ef4444' }}>{it.missing.join(', ')}</span>
                          {done && <span style={{ color: '#10B981', marginLeft: 8 }}>· scraped {scrapedCount} fields</span>}
                        </div>
                      </div>
                      <button onClick={() => openOne(it)}
                        data-testid={`burst-row-open-${it.item_id}`}
                        title="Open just this URL"
                        style={{ background: 'transparent', color: '#14b8a6', border: '1px solid #14b8a6', padding: '4px 10px', fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {isOpen ? '↻ REOPEN' : '↗ OPEN'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {queue.length > 0 && (
          <div style={{ padding: 12, borderTop: '1px solid #2a3040', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#22293a' }}>
            <div style={{ fontSize: 11, color: '#D4C5A9' }}>
              {Object.keys(scraped).length} of {queue.length} scraped
              {polling && <span style={{ marginLeft: 6, color: '#10B981' }}>· watching…</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {mergeStatus?.status === 'done' && (
                <span data-testid="burst-merge-done" style={{ fontSize: 11, color: '#10B981' }}>
                  ✓ {mergeStatus.summary.updated_items} item{mergeStatus.summary.updated_items === 1 ? '' : 's'} merged
                </span>
              )}
              <button data-testid="burst-backfill-merge" onClick={mergeNow}
                disabled={mergeStatus?.status === 'merging' || Object.keys(scraped).length === 0}
                style={{ background: Object.keys(scraped).length > 0 ? '#D4A574' : '#4b5563', color: '#0a0a0a', border: 'none', padding: '8px 18px', fontSize: 12, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: Object.keys(scraped).length > 0 ? 'pointer' : 'not-allowed' }}>
                {mergeStatus?.status === 'merging' ? 'Merging…' : '↓ MERGE INTO CHECKLIST'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
