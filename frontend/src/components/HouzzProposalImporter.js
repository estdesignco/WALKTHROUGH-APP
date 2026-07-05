import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, X, Sparkles, ExternalLink, Package, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const currency = (v) => v == null ? '—' : '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * HouzzProposalImporter
 *
 * Modal that drives the Chrome Extension v7.43 to import a Houzz Pro
 * proposal / estimate / PO into the app.
 *
 * Flow:
 *   1. User pastes a pro.houzz.com URL.
 *   2. We open it in a coordinator popup with `#design-ready-houzz-scrape` in
 *      the hash — extension picks it up, scrapes line items, POSTs to
 *      /api/houzz/proposal-import.
 *   3. We poll /api/houzz/import-session/{id} until we see items.
 *   4. User picks a target — spreadsheet items OR a Purchase Order — and
 *      commits.
 *
 * Alt path: user uploads a Houzz proposal PDF; we call
 * /api/houzz/proposal-import-pdf and land at the same review screen.
 */
const HouzzProposalImporter = ({ projectId, roomId, onClose, onImportedToPO, onImportedToItems }) => {
  const [houzzUrl, setHouzzUrl] = useState('');
  const [phase, setPhase] = useState('input');  // input | waiting | review | committing | done
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState('purchase_order');
  const [poStatus, setPoStatus] = useState('pending');
  const [coordinator, setCoordinator] = useState(null);

  const sessionId = React.useMemo(() => `hz_${Math.random().toString(36).slice(2, 12)}`, []);

  const cleanUrl = (u) => {
    try {
      const url = new URL(u);
      return url.origin + url.pathname + url.search;
    } catch { return u; }
  };

  const startScrape = () => {
    setError(null);
    const trimmed = houzzUrl.trim();
    if (!trimmed) { setError('Paste a pro.houzz.com URL first.'); return; }
    if (!/^https?:\/\//i.test(trimmed)) { setError('URL must start with https:// (paste the full URL from your browser address bar).'); return; }
    if (!/\bpro\.houzz\.com\b/i.test(trimmed)) {
      setError('Only pro.houzz.com URLs are supported. The URL should look like https://pro.houzz.com/manage/d/estimates/…/edit');
      return;
    }
    if (!/(estimates?|proposals?|purchase-orders?|purchase-documents?|invoices?|orders?)\//i.test(trimmed)) {
      setError('URL must point at a Houzz estimate, proposal, purchase-document, purchase-order, or invoice page.');
      return;
    }

    const backend = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);
    const params = new URLSearchParams({
      backend: backend,
      session: sessionId,
      project: projectId || '',
      close: '1',
    });
    // Build fragment: #design-ready-houzz-scrape&backend=...&session=...
    const hash = 'design-ready-houzz-scrape&' + params.toString();
    const full = cleanUrl(trimmed) + '#' + hash;

    const popup = window.open(full, 'design-ready-houzz-coordinator', 'width=1100,height=800');
    if (!popup) {
      setError('Popup was blocked. Allow popups for this app and try again.');
      return;
    }
    setCoordinator(popup);
    setPhase('waiting');
  };

  // Poll for the session
  const pollOnce = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE}/houzz/import-session/${sessionId}`);
      if (r.data && r.data.item_count > 0) {
        setSession(r.data);
        setPhase('review');
        return true;
      }
    } catch (e) {
      // 404 while extension is still working is expected — swallow
    }
    return false;
  }, [sessionId]);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const iv = setInterval(async () => {
      const done = await pollOnce();
      if (done) clearInterval(iv);
    }, 1500);
    // Also listen for direct postMessage from the coordinator (faster path)
    const onMsg = (e) => {
      if (!e.data || e.data.source !== 'design-ready-houzz-scrape') return;
      if (e.data.status === 'done') { pollOnce(); }
      if (e.data.status === 'error') {
        setError('Extension error: ' + (e.data.error || 'unknown'));
        setPhase('input');
      }
    };
    window.addEventListener('message', onMsg);
    return () => { clearInterval(iv); window.removeEventListener('message', onMsg); };
  }, [phase, pollOnce]);

  // PDF fallback upload
  const handlePdfUpload = async (file) => {
    if (!file) return;
    setPhase('waiting'); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (projectId) fd.append('project_id', projectId);
      fd.append('kind', 'proposal');
      const r = await axios.post(`${API_BASE}/houzz/proposal-import-pdf`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSession(r.data);
      setPhase('review');
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setPhase('input');
    }
  };

  const handleCommit = async () => {
    if (!session || !projectId) { toast.error('Select a project first'); return; }
    setPhase('committing');
    try {
      const r = await axios.post(`${API_BASE}/houzz/commit`, {
        session_id: session.session_id,
        project_id: projectId,
        room_id: roomId || null,
        target: target,
        po_status: poStatus,
      });
      setPhase('done');
      toast.success(target === 'purchase_order'
        ? `Purchase Order ${r.data.purchase_order_id} created (${r.data.line_count} items)`
        : `${r.data.count} items added to spreadsheet`);
      if (target === 'purchase_order' && onImportedToPO) onImportedToPO(r.data.purchase_order_id);
      if (target === 'items' && onImportedToItems) onImportedToItems(r.data.inserted_item_ids);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setPhase('review');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto" data-testid="houzz-importer-modal">
      <div className="bg-[#1a1611] border-2 border-[#B49B7E]/40 rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
        <div className="sticky top-0 bg-[#1a1611] border-b border-[#B49B7E]/30 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#B49B7E]">Import from Houzz</div>
            <div className="text-2xl font-bold text-[#F5F5DC]">🏠 Houzz Proposal → Design Ready</div>
            <div className="text-xs text-stone-400 mt-1">Chrome Extension v7.43+ required · Uses ONLY your approved manufacturer sites</div>
          </div>
          <button data-testid="houzz-importer-close-btn" onClick={onClose} className="text-stone-400 hover:text-white p-2"><X size={22}/></button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-rose-500/20 border border-rose-500/40 rounded-lg p-3 text-rose-200 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5"/><span>{error}</span>
            </div>
          )}

          {phase === 'input' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#B49B7E]">Houzz Pro URL</label>
                <input data-testid="houzz-url-input" placeholder="https://pro.houzz.com/manage/d/estimates/…/edit"
                  className="w-full bg-black/40 border border-stone-700 rounded-lg px-3 py-2 text-white"
                  value={houzzUrl} onChange={(e) => setHouzzUrl(e.target.value)} />
                <div className="text-xs text-stone-400">
                  You must be logged into Houzz Pro in this browser. We&apos;ll open the URL in a small window,
                  the extension will read every line item, and we&apos;ll pull the actual manufacturer product page
                  from your approved vendor list (Uttermost, Four Hands, Bernhardt, HVL, Loloi, Visual Comfort,
                  Regina Andrew, Bassett Mirror, Rowe, Gabby, Global Views, Surya, Safavieh, V and H, Flow Decor,
                  Crestview Collection, Eichholtz, MOH America, Phillip Jeffries, York Wallcoverings, Classic Home).
                </div>
              </div>

              <button data-testid="houzz-start-btn" onClick={startScrape}
                className="w-full bg-gradient-to-r from-[#B49B7E] to-[#8B7355] hover:from-[#D4C5A9] hover:to-[#A08B6F] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                <Sparkles size={18}/> Import Houzz Proposal
              </button>

              <div className="text-center text-stone-500 text-xs">— or —</div>

              <label data-testid="houzz-pdf-upload-label" className="flex flex-col items-center gap-2 border-2 border-dashed border-[#B49B7E]/40 rounded-lg p-6 text-sm text-stone-300 hover:bg-stone-900/40 cursor-pointer">
                <Package size={20} className="text-[#B49B7E]"/>
                Upload a Houzz proposal PDF instead
                <span className="text-xs text-stone-500">Text-based PDFs only (not scanned images)</span>
                <input data-testid="houzz-pdf-upload-input" type="file" accept="application/pdf" className="hidden"
                  onChange={(e) => handlePdfUpload(e.target.files && e.target.files[0])} />
              </label>
            </>
          )}

          {phase === 'waiting' && (
            <div className="py-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-[#B49B7E]" size={36}/>
              <div className="text-lg text-[#F5F5DC] font-bold">Reading your Houzz page…</div>
              <div className="text-sm text-stone-400 mt-2">Keep the popup window open until it says &ldquo;imported N items&rdquo;.</div>
              {coordinator && (
                <button onClick={() => { try { coordinator.focus(); } catch (e) { /* ignore */ } }}
                  className="mt-3 text-xs underline text-stone-400 hover:text-stone-200">Bring coordinator window forward</button>
              )}
            </div>
          )}

          {phase === 'review' && session && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryCell label="Items" value={session.item_count} />
                <SummaryCell label="Matched to Manufacturer" value={`${session.resolved_item_count} / ${session.item_count}`}
                  accent={session.unresolved_manufacturer_count > 0 ? 'text-amber-300' : 'text-emerald-300'} />
                <SummaryCell label="Subtotal" value={currency(session.subtotal)} />
                <SummaryCell label="Total" value={currency(session.total)} />
              </div>

              {session.warnings && session.warnings.map((w, i) => (
                <div key={i} className="bg-amber-500/20 border border-amber-500/40 rounded-lg p-3 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5"/>{w}
                </div>
              ))}

              <div className="overflow-x-auto rounded-lg border border-stone-700 max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-900/70 text-xs uppercase text-stone-400 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-left px-3 py-2">Brand</th>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Unit</th>
                      <th className="text-right px-3 py-2">Ext.</th>
                      <th className="text-left px-3 py-2">Manufacturer</th>
                    </tr>
                  </thead>
                  <tbody className="text-stone-200">
                    {(session.items || []).map((it, idx) => (
                      <tr key={idx} className="border-t border-stone-800" data-testid={`houzz-item-preview-${idx}`}>
                        <td className="px-3 py-2">
                          <div className="font-medium">{it.name || '—'}</div>
                          {it.dimensions && <div className="text-xs text-stone-400">{it.dimensions}</div>}
                        </td>
                        <td className="px-3 py-2">{it.brand || '—'}</td>
                        <td className="px-3 py-2 font-mono text-xs">{it.sku || '—'}</td>
                        <td className="px-3 py-2 text-right">{it.quantity ?? '—'}</td>
                        <td className="px-3 py-2 text-right">{currency(it.unit_price)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{currency(it.extended_price)}</td>
                        <td className="px-3 py-2">
                          {it.manufacturer_link ? (
                            <a href={it.manufacturer_link} target="_blank" rel="noreferrer"
                               className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs">
                              <ExternalLink size={12}/> {new URL(it.manufacturer_link).hostname.replace(/^www\./, '')}
                            </a>
                          ) : (
                            <span className="text-xs text-amber-400" title={it.manufacturer_link_reason}>
                              Unresolved — {it.manufacturer_link_reason || 'no manufacturer found'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-stone-900/40 border border-[#B49B7E]/30 rounded-lg p-4 space-y-3">
                <div className="text-sm font-bold text-[#B49B7E]">Send these items to…</div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input data-testid="target-po-radio" type="radio" name="tgt" checked={target === 'purchase_order'} onChange={() => setTarget('purchase_order')} />
                    <span className="text-white text-sm">Create a Purchase Order</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input data-testid="target-items-radio" type="radio" name="tgt" checked={target === 'items'} onChange={() => setTarget('items')} />
                    <span className="text-white text-sm">Add to Project Spreadsheet</span>
                  </label>
                </div>
                {target === 'purchase_order' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-300">Initial status:</span>
                    <select data-testid="po-init-status-select" value={poStatus} onChange={(e) => setPoStatus(e.target.value)}
                      className="bg-black/40 border border-stone-700 rounded px-2 py-1 text-xs text-white">
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid (already paid)</option>
                    </select>
                  </div>
                )}
              </div>

              <button data-testid="houzz-commit-btn" onClick={handleCommit}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                <ShoppingBag size={18}/>
                {target === 'purchase_order' ? 'Create Purchase Order' : 'Add Items to Project'}
              </button>
            </>
          )}

          {phase === 'committing' && (
            <div className="py-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-[#B49B7E]" size={32}/>
              <div className="text-stone-300">Saving…</div>
            </div>
          )}

          {phase === 'done' && (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={56}/>
              <div className="text-xl font-bold text-[#F5F5DC]">Imported!</div>
              <div className="text-sm text-stone-400 mt-2">You can close this window now.</div>
              <button data-testid="houzz-importer-done-btn" onClick={onClose} className="mt-4 bg-[#B49B7E] hover:bg-[#D4C5A9] text-black font-bold px-6 py-2 rounded-lg">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCell = ({ label, value, accent }) => (
  <div className="bg-stone-900/60 border border-stone-700 rounded-lg px-3 py-2">
    <div className="text-[10px] uppercase tracking-widest text-stone-400">{label}</div>
    <div className={`text-lg font-bold ${accent || 'text-white'}`}>{value}</div>
  </div>
);

export default HouzzProposalImporter;
