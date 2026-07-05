import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign, FileText, Calendar, CreditCard, ExternalLink, Package, Truck, CheckCircle2, AlertCircle, Trash2, Upload } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const STATUS_META = {
  draft:         { label: 'Draft',         color: 'bg-stone-500/20 text-stone-300 border-stone-500/50',   icon: FileText },
  pending:       { label: 'Pending',       color: 'bg-amber-500/20 text-amber-300 border-amber-500/50',   icon: AlertCircle },
  deposit_paid:  { label: 'Deposit Paid',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',     icon: DollarSign },
  paid:          { label: 'Paid',          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', icon: CheckCircle2 },
  shipped:       { label: 'Shipped',       color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50', icon: Truck },
  received:      { label: 'Received',      color: 'bg-teal-500/20 text-teal-300 border-teal-500/50',     icon: Package },
  cancelled:     { label: 'Cancelled',     color: 'bg-rose-500/20 text-rose-300 border-rose-500/50',     icon: X },
};

const currency = (v) => v == null ? '—' : '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const shortDate = (iso) => { try { return new Date(iso).toLocaleDateString(); } catch { return iso || '—'; } };

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const Icon = meta.icon;
  return (
    <span data-testid={`po-status-${status}`} className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${meta.color}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
};

/**
 * PurchaseOrderDetailModal
 *
 * Full view of a single Purchase Order.
 * - Line items table with manufacturer_link column (no retailer links, ever)
 * - Payments list (deposit / balance / one-off)
 * - Receipt attachments
 * - Add payment form
 * - Status editor
 */
const PurchaseOrderDetailModal = ({ poId, onClose, onSaved }) => {
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('credit_card');
  const [payKind, setPayKind] = useState('payment');
  const [payReference, setPayReference] = useState('');
  const [payNote, setPayNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/purchase-orders/${poId}`);
      setPo(r.data);
    } catch (e) {
      toast.error('Failed to load PO: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (poId) load(); /* eslint-disable-line */ }, [poId]);

  const totalPaid = (po?.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const outstanding = Math.max(0, Number(po?.total || 0) - totalPaid);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid payment amount'); return; }
    setSaving(true);
    try {
      const r = await axios.post(`${API_BASE}/purchase-orders/${poId}/payments`, {
        amount: amt,
        method: payMethod,
        kind: payKind,
        reference: payReference || null,
        note: payNote || null,
      });
      setPo(r.data);
      setPayAmount(''); setPayReference(''); setPayNote('');
      toast.success('Payment recorded');
      onSaved && onSaved();
    } catch (err) {
      toast.error('Payment failed: ' + (err.response?.data?.detail || err.message));
    } finally { setSaving(false); }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      const r = await axios.delete(`${API_BASE}/purchase-orders/${poId}/payments/${paymentId}`);
      setPo(r.data);
      onSaved && onSaved();
    } catch (err) { toast.error(err.response?.data?.detail || err.message); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const r = await axios.patch(`${API_BASE}/purchase-orders/${poId}`, { status: newStatus });
      setPo(r.data);
      onSaved && onSaved();
    } catch (err) { toast.error(err.response?.data?.detail || err.message); }
  };

  const handleReceiptUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB per receipt'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const r = await axios.post(`${API_BASE}/purchase-orders/${poId}/receipts`, {
          data_base64: String(reader.result).split(',')[1],
          filename: file.name,
          content_type: file.type,
          label: file.name,
        });
        setPo(r.data);
        toast.success('Receipt attached');
        onSaved && onSaved();
      } catch (err) { toast.error(err.response?.data?.detail || err.message); }
    };
    reader.readAsDataURL(file);
  };

  if (!poId) return null;
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto" data-testid="po-detail-modal">
      <div className="bg-[#1a1611] border-2 border-[#B49B7E]/40 rounded-2xl max-w-6xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1611] border-b border-[#B49B7E]/30 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#B49B7E]">Purchase Order</div>
            <div className="text-2xl font-bold text-[#F5F5DC] flex items-center gap-3">
              {po?.po_number || '…'}
              {po && <StatusPill status={po.status} />}
            </div>
            {po?.vendor && <div className="text-sm text-stone-400 mt-1">Vendor: <span className="text-stone-200">{po.vendor}</span></div>}
          </div>
          <button data-testid="po-detail-close-btn" onClick={onClose} className="text-stone-400 hover:text-white p-2"><X size={22} /></button>
        </div>

        {loading || !po ? (
          <div className="p-12 flex items-center justify-center text-stone-400"><Loader2 className="animate-spin mr-2" /> Loading…</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Total" value={currency(po.total)} accent="text-[#F5F5DC]" />
              <SummaryCard label="Paid" value={currency(totalPaid)} accent="text-emerald-300" />
              <SummaryCard label="Outstanding" value={currency(outstanding)} accent={outstanding > 0 ? 'text-amber-300' : 'text-stone-400'} />
              <SummaryCard label="Line Items" value={(po.line_items || []).length} accent="text-blue-300" />
            </div>

            {po.houzz_url && (
              <div className="text-xs text-stone-400 bg-stone-900/40 border border-stone-700 rounded-lg px-3 py-2">
                Imported from: <a href={po.houzz_url} target="_blank" rel="noreferrer" className="text-[#D4C5A9] underline">{po.houzz_url}</a>
              </div>
            )}

            {/* Line Items */}
            <div>
              <h3 className="text-lg font-bold text-[#B49B7E] mb-3 flex items-center gap-2"><Package size={18}/> Line Items</h3>
              <div className="overflow-x-auto rounded-lg border border-stone-700">
                <table className="w-full text-sm">
                  <thead className="bg-stone-900/60 text-xs uppercase tracking-widest text-stone-400">
                    <tr>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-left px-3 py-2">Brand</th>
                      <th className="text-left px-3 py-2">SKU</th>
                      <th className="text-right px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">Unit</th>
                      <th className="text-right px-3 py-2">Ext.</th>
                      <th className="text-left px-3 py-2">Manufacturer Link</th>
                    </tr>
                  </thead>
                  <tbody className="text-stone-200">
                    {(po.line_items || []).map((it, idx) => (
                      <tr key={idx} className="border-t border-stone-800" data-testid={`po-line-item-${idx}`}>
                        <td className="px-3 py-2">
                          <div className="font-medium">{it.name || it.description || '—'}</div>
                          {it.dimensions && <div className="text-xs text-stone-400">{it.dimensions}</div>}
                          {it.finish_color && <div className="text-xs text-stone-400">Finish: {it.finish_color}</div>}
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
                              <ExternalLink size={12}/> Manufacturer
                            </a>
                          ) : (
                            <span className="text-xs text-amber-400" title={it.manufacturer_link_reason}>Unresolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!po.line_items || !po.line_items.length) && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center text-stone-500">No line items</td></tr>
                    )}
                  </tbody>
                  <tfoot className="bg-stone-900/40 text-stone-300">
                    <tr><td colSpan={5} className="px-3 py-2 text-right">Subtotal</td><td className="px-3 py-2 text-right font-semibold">{currency(po.subtotal)}</td><td/></tr>
                    {po.tax != null && <tr><td colSpan={5} className="px-3 py-2 text-right">Tax</td><td className="px-3 py-2 text-right">{currency(po.tax)}</td><td/></tr>}
                    {po.shipping != null && <tr><td colSpan={5} className="px-3 py-2 text-right">Shipping</td><td className="px-3 py-2 text-right">{currency(po.shipping)}</td><td/></tr>}
                    <tr><td colSpan={5} className="px-3 py-2 text-right font-bold text-[#F5F5DC]">TOTAL</td><td className="px-3 py-2 text-right font-bold text-[#F5F5DC]">{currency(po.total)}</td><td/></tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payments */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-[#B49B7E] mb-3 flex items-center gap-2"><DollarSign size={18}/> Payments</h3>
                <div className="space-y-2 mb-4">
                  {(po.payments || []).length === 0 && (
                    <div className="text-sm text-stone-500 italic">No payments recorded yet.</div>
                  )}
                  {(po.payments || []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-stone-900/50 border border-stone-700 rounded-lg px-3 py-2 text-sm">
                      <div className="flex-1">
                        <div className="font-semibold text-[#F5F5DC]">{currency(p.amount)} <span className="text-xs text-stone-400">({p.kind})</span></div>
                        <div className="text-xs text-stone-400">
                          {p.method} · {shortDate(p.date)}
                          {p.reference && <> · <span className="font-mono">{p.reference}</span></>}
                        </div>
                        {p.note && <div className="text-xs text-stone-400 italic">{p.note}</div>}
                      </div>
                      <button data-testid={`delete-payment-${p.id}`} onClick={() => handleDeletePayment(p.id)} className="text-rose-400 hover:text-rose-300 p-1"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddPayment} className="bg-stone-900/40 border border-[#B49B7E]/30 rounded-lg p-4 space-y-3">
                  <div className="text-sm font-bold text-[#B49B7E]">Record a Payment</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input data-testid="pay-amount-input" type="number" step="0.01" required placeholder="Amount"
                      className="bg-black/40 border border-stone-700 rounded px-2 py-1.5 text-sm text-white"
                      value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                    <select data-testid="pay-kind-select" value={payKind} onChange={(e) => setPayKind(e.target.value)}
                      className="bg-black/40 border border-stone-700 rounded px-2 py-1.5 text-sm text-white">
                      <option value="deposit">Deposit</option>
                      <option value="balance">Balance</option>
                      <option value="payment">Payment</option>
                    </select>
                    <select data-testid="pay-method-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                      className="bg-black/40 border border-stone-700 rounded px-2 py-1.5 text-sm text-white">
                      <option value="credit_card">Credit Card</option>
                      <option value="ach">ACH / Bank</option>
                      <option value="check">Check</option>
                      <option value="wire">Wire</option>
                      <option value="cash">Cash</option>
                      <option value="unknown">Other</option>
                    </select>
                    <input placeholder="Reference (check #, last-4)" data-testid="pay-reference-input"
                      className="bg-black/40 border border-stone-700 rounded px-2 py-1.5 text-sm text-white"
                      value={payReference} onChange={(e) => setPayReference(e.target.value)} />
                  </div>
                  <input placeholder="Note (optional)" data-testid="pay-note-input"
                    className="w-full bg-black/40 border border-stone-700 rounded px-2 py-1.5 text-sm text-white"
                    value={payNote} onChange={(e) => setPayNote(e.target.value)} />
                  <button data-testid="pay-submit-btn" disabled={saving} type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-600 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="animate-spin" size={14}/> : <CreditCard size={14}/>} Record Payment
                  </button>
                </form>
              </div>

              {/* Receipts + Status */}
              <div>
                <h3 className="text-lg font-bold text-[#B49B7E] mb-3 flex items-center gap-2"><FileText size={18}/> Receipts</h3>
                <div className="space-y-2 mb-3">
                  {(po.receipts || []).length === 0 && <div className="text-sm text-stone-500 italic">No receipts uploaded.</div>}
                  {(po.receipts || []).map(r => (
                    <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                       className="flex items-center justify-between gap-2 bg-stone-900/50 border border-stone-700 rounded-lg px-3 py-2 text-sm hover:border-[#B49B7E]/60">
                      <span className="truncate text-stone-200">{r.label || r.filename || 'Receipt'}</span>
                      <span className="text-xs text-stone-400">{shortDate(r.uploaded_at)}</span>
                    </a>
                  ))}
                </div>
                <label data-testid="upload-receipt-label" className="flex items-center justify-center gap-2 border-2 border-dashed border-[#B49B7E]/40 rounded-lg p-3 text-sm text-stone-300 hover:bg-stone-900/40 cursor-pointer">
                  <Upload size={14}/> Attach receipt (PDF / image, ≤ 5 MB)
                  <input data-testid="upload-receipt-input" type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={(e) => handleReceiptUpload(e.target.files && e.target.files[0])} />
                </label>

                <h3 className="text-lg font-bold text-[#B49B7E] mb-3 mt-6 flex items-center gap-2"><Calendar size={18}/> Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(STATUS_META).map(s => (
                    <button key={s} data-testid={`set-status-${s}`} onClick={() => handleStatusChange(s)}
                      className={`text-xs px-2 py-1 rounded-full border ${po.status === s ? 'bg-[#B49B7E] text-black border-[#B49B7E]' : 'bg-stone-900/60 text-stone-300 border-stone-700 hover:border-[#B49B7E]/60'}`}>
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
                {(po.deposit_paid_at || po.balance_paid_at) && (
                  <div className="mt-3 text-xs text-stone-400 space-y-1">
                    {po.deposit_paid_at && <div>Deposit paid: {shortDate(po.deposit_paid_at)}</div>}
                    {po.balance_paid_at && <div>Balance paid: {shortDate(po.balance_paid_at)}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, accent }) => (
  <div className="bg-stone-900/60 border border-stone-700 rounded-lg px-4 py-3">
    <div className="text-xs uppercase tracking-widest text-stone-400">{label}</div>
    <div className={`text-xl font-bold ${accent || 'text-white'}`}>{value}</div>
  </div>
);

export default PurchaseOrderDetailModal;
