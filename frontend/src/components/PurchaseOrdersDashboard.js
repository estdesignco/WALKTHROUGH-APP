import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Search, Filter, RefreshCw, Upload, DollarSign, Package, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import PurchaseOrderDetailModal from './PurchaseOrderDetailModal';
import HouzzProposalImporter from './HouzzProposalImporter';
import ExtensionDownloadButton from './ExtensionDownloadButton';

const API_BASE = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const STATUS_COLORS = {
  draft:        'bg-stone-500/20 text-stone-300 border-stone-500/50',
  pending:      'bg-amber-500/20 text-amber-300 border-amber-500/50',
  deposit_paid: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  paid:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  shipped:      'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
  received:     'bg-teal-500/20 text-teal-300 border-teal-500/50',
  cancelled:    'bg-rose-500/20 text-rose-300 border-rose-500/50',
};

const STATUS_LABELS = {
  draft: 'Draft', pending: 'Pending', deposit_paid: 'Deposit Paid',
  paid: 'Paid', shipped: 'Shipped', received: 'Received', cancelled: 'Cancelled',
};

const currency = (v) => v == null ? '—' : '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (iso) => { try { return new Date(iso).toLocaleDateString(); } catch { return iso || '—'; } };

/**
 * PurchaseOrdersDashboard
 *
 * Central UI for tracking Purchase Orders.
 * - `projectId` prop optional. When missing, shows GLOBAL list (all projects).
 * - When provided, filters to that project only.
 */
const PurchaseOrdersDashboard = ({ projectId }) => {
  const [pos, setPos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const [activePoId, setActivePoId] = useState(null);
  const [showHouzz, setShowHouzz] = useState(false);
  const [showPdfImport, setShowPdfImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (projectId) params.project_id = projectId;
      if (statusFilter) params.status = statusFilter;
      const [posR, sumR] = await Promise.all([
        axios.get(`${API_BASE}/purchase-orders`, { params }),
        axios.get(`${API_BASE}/purchase-orders/summary`, { params: projectId ? { project_id: projectId } : {} }),
      ]);
      setPos(posR.data);
      setSummary(sumR.data);
    } catch (e) {
      toast.error('Failed to load POs: ' + (e.response?.data?.detail || e.message));
    } finally { setLoading(false); }
  }, [projectId, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = pos.filter(p => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (p.po_number || '').toLowerCase().includes(needle)
        || (p.vendor || '').toLowerCase().includes(needle)
        || (p.notes || '').toLowerCase().includes(needle);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1611] p-4 md:p-8" data-testid="po-dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#B49B7E]">Financial Tracking</div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5DC]">📦 Purchase Orders</h1>
            <div className="text-sm text-stone-400 mt-1">
              {projectId ? 'Showing POs for this project' : 'All Purchase Orders across every project'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExtensionDownloadButton dataTestId="po-download-extension-btn" />
            <button data-testid="po-import-houzz-btn" onClick={() => setShowHouzz(true)}
              className="bg-gradient-to-r from-[#B49B7E] to-[#8B7355] hover:from-[#D4C5A9] hover:to-[#A08B6F] text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
              <Sparkles size={16}/> Import from Houzz
            </button>
            <label data-testid="po-import-pdf-label"
              className="bg-stone-800 hover:bg-stone-700 border border-[#B49B7E]/40 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm cursor-pointer">
              <Upload size={16}/> Upload PO PDF
              <input data-testid="po-import-pdf-input" type="file" accept="application/pdf" className="hidden"
                onChange={async (e) => {
                  const f = e.target.files && e.target.files[0];
                  if (!f) return;
                  setShowPdfImport(true);
                  const fd = new FormData();
                  fd.append('file', f);
                  if (projectId) fd.append('project_id', projectId);
                  try {
                    const r = await axios.post(`${API_BASE}/purchase-orders/import-from-pdf`, fd, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    toast.success(`PO ${r.data.po_number} created`);
                    load();
                    setActivePoId(r.data.id);
                  } catch (err) {
                    toast.error(err.response?.data?.detail || err.message);
                  } finally { setShowPdfImport(false); e.target.value = ''; }
                }} />
            </label>
            <button data-testid="po-refresh-btn" onClick={load}
              className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
              <RefreshCw size={16}/>
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard icon={<Package size={20}/>} label="Total POs" value={summary.count} accent="text-white" />
            <SummaryCard icon={<DollarSign size={20}/>} label="Total Value" value={currency(summary.total_value)} accent="text-[#F5F5DC]" />
            <SummaryCard icon={<TrendingUp size={20}/>} label="Paid" value={currency(summary.total_paid)} accent="text-emerald-300" />
            <SummaryCard icon={<AlertCircle size={20}/>} label="Outstanding" value={currency(summary.total_outstanding)}
              accent={summary.total_outstanding > 0 ? 'text-amber-300' : 'text-stone-400'} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-stone-900/40 border border-stone-700 rounded-lg p-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search size={16} className="text-stone-400"/>
            <input data-testid="po-search-input" placeholder="Search PO #, vendor, notes…"
              className="flex-1 bg-transparent text-sm text-white placeholder-stone-500 outline-none"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-stone-400"/>
            <select data-testid="po-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/40 border border-stone-700 rounded px-2 py-1 text-xs text-white">
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-stone-900/40 border border-stone-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-stone-400 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin"/> Loading purchase orders…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={40} className="mx-auto text-stone-600 mb-3"/>
              <div className="text-lg text-stone-300 font-bold">No purchase orders yet</div>
              <div className="text-sm text-stone-500 mt-2">Import a Houzz proposal or upload a PDF to get started.</div>
              <div className="mt-4 flex justify-center gap-2">
                <button data-testid="po-empty-import-houzz-btn" onClick={() => setShowHouzz(true)}
                  className="bg-[#B49B7E] hover:bg-[#D4C5A9] text-black font-bold px-4 py-2 rounded-lg text-sm">
                  🏠 Import from Houzz
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/70 text-xs uppercase text-stone-400">
                  <tr>
                    <th className="text-left px-3 py-2">PO #</th>
                    <th className="text-left px-3 py-2">Vendor</th>
                    <th className="text-left px-3 py-2">Items</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="text-right px-3 py-2">Paid</th>
                    <th className="text-right px-3 py-2">Outstanding</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Created</th>
                    {!projectId && <th className="text-left px-3 py-2">Project</th>}
                  </tr>
                </thead>
                <tbody className="text-stone-200">
                  {filtered.map(po => {
                    const paid = (po.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
                    const outstanding = Math.max(0, Number(po.total || 0) - paid);
                    return (
                      <tr key={po.id} className="border-t border-stone-800 hover:bg-stone-800/40 cursor-pointer"
                          data-testid={`po-row-${po.id}`}
                          onClick={() => setActivePoId(po.id)}>
                        <td className="px-3 py-2 font-mono text-xs">{po.po_number}</td>
                        <td className="px-3 py-2 font-medium">{po.vendor}</td>
                        <td className="px-3 py-2">{(po.line_items || []).length}</td>
                        <td className="px-3 py-2 text-right font-semibold">{currency(po.total)}</td>
                        <td className="px-3 py-2 text-right text-emerald-300">{currency(paid)}</td>
                        <td className={`px-3 py-2 text-right ${outstanding > 0 ? 'text-amber-300' : 'text-stone-400'}`}>{currency(outstanding)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${STATUS_COLORS[po.status] || STATUS_COLORS.draft}`}>
                            {STATUS_LABELS[po.status] || po.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-stone-400">{shortDate(po.created_at)}</td>
                        {!projectId && (
                          <td className="px-3 py-2 text-xs text-stone-400">{po.project_id || <span className="italic">— unassigned —</span>}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {activePoId && (
        <PurchaseOrderDetailModal
          poId={activePoId}
          onClose={() => setActivePoId(null)}
          onSaved={load}
        />
      )}

      {showHouzz && (
        <HouzzProposalImporter
          projectId={projectId}
          onClose={() => { setShowHouzz(false); load(); }}
          onImportedToPO={(newId) => { setShowHouzz(false); load(); setActivePoId(newId); }}
        />
      )}

      {showPdfImport && (
        <div className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center">
          <div className="bg-stone-900 border border-[#B49B7E]/40 rounded-lg p-6 text-center">
            <Loader2 className="animate-spin mx-auto mb-3 text-[#B49B7E]" size={32}/>
            <div className="text-white font-bold">Parsing PO PDF…</div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ icon, label, value, accent }) => (
  <div className="bg-stone-900/60 border border-stone-700 rounded-lg px-4 py-3 flex items-center gap-3">
    <div className="text-[#B49B7E]">{icon}</div>
    <div className="flex-1">
      <div className="text-xs uppercase tracking-widest text-stone-400">{label}</div>
      <div className={`text-lg md:text-xl font-bold ${accent}`}>{value}</div>
    </div>
  </div>
);

export default PurchaseOrdersDashboard;
