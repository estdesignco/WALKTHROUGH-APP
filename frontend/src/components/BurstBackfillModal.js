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

  // Build the auto-scrape URL for a given link
  const buildAutoscrapeUrl = (link) => {
    const base = link.split('#')[0];
    return `${base}#design-ready-autoscrape&close=1`;
  };

  // Open ONE item's URL in a new tab
  const openOne = (item) => {
    const url = buildAutoscrapeUrl(item.link);
    const win = window.open(url, '_blank', 'noopener');
    if (!win) {
      // eslint-disable-next-line no-alert
      alert('Popup blocked. Please allow popups for this site and try again.');
      return false;
    }
    setOpened(prev => ({ ...prev, [item.item_id]: true }));
    return true;
  };

  // Open ALL queue items in tabs, staggered so Chrome doesn't kill them
  const openAll = async () => {
    let blocked = false;
    for (let i = 0; i < queue.length; i++) {
      const it = queue[i];
      const ok = openOne(it);
      if (!ok) { blocked = true; break; }
      // 600ms stagger so the browser allows the burst
      await new Promise(r => setTimeout(r, 600));
    }
    if (!blocked) startPolling();
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
                  <li>Click <strong>OPEN ALL & AUTO-SCRAPE</strong> below. {queue.length} tabs will open.</li>
                  <li>Each tab loads the vendor page in YOUR browser (where you're logged in) and the Chrome extension auto-scrapes it.</li>
                  <li>Each tab shows a gold banner → green when done → closes itself.</li>
                  <li>Watch the rows below tick to ✓ as data arrives.</li>
                  <li>Click <strong>MERGE INTO CHECKLIST</strong> when you're done.</li>
                </ol>
                <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>
                  ⚠ Requires <strong>Design Ready Scraper extension v7.39+</strong> installed and logged into your vendor sites.
                  <a href={`${API.replace(/\/api$/, '')}/api/download-scraper`} style={{ color: '#14b8a6', marginLeft: 6 }} target="_blank" rel="noreferrer">↓ Get latest extension</a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button data-testid="burst-backfill-open-all" onClick={openAll}
                  style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 800, letterSpacing: 1, borderRadius: 4, cursor: 'pointer' }}>
                  🚀 OPEN ALL {queue.length} & AUTO-SCRAPE
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
