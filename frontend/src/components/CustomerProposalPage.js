/**
 * CustomerProposalPage — public, read-only proposal for the homeowner.
 * URL: /customer-proposal/:accessCode/:token
 *
 * The homeowner clicks "Accept & Sign Online" in the email and lands here.
 * We fetch the read-only proposal payload (token-validated server-side),
 * render it with the same gorgeous Checklist-style layout, then collect a
 * typed signature to mark the proposal accepted.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMutedRoomHeaderStyle, getMutedRoomHeaderStyleStandalone, getRoomColor } from '../utils/roomColors';
import { parseScopeDocument, TRADE_COLORS } from './ScopeDocumentEditor';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

const fmt = (n) => (n === null || n === undefined || n === '' || isNaN(n)) ? '' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUSD = (n) => `$${fmt(n || 0)}`;
const compute = (qty, cost, markup) => (Number(qty) || 0) * (Number(cost) || 0) * (1 + (Number(markup) || 0) / 100);

const stripTradePills = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('[data-tag="trade"], .trade-pill').forEach(el => el.remove());
  return div.innerHTML.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
};

const stableLineId = (room, trade, text) => {
  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  let h = 5381;
  const s = `${norm(room)}|${norm(trade)}|${norm(text)}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `sl_${(h >>> 0).toString(36)}`;
};

export default function CustomerProposalPage() {
  const { accessCode, token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/customer-proposal/${accessCode}/${token}`)
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.detail || 'Could not load proposal');
        }
        return r.json();
      })
      .then(json => {
        setData(json);
        setAccepted(!!json.portal?.customer_accepted);
        setRecipientEmail(json.portal?.customer_accept_sent_to || '');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [accessCode, token]);

  const accept = async () => {
    if (!signature.trim()) { alert('Please type your full legal name to accept.'); return; }
    setAccepting(true);
    try {
      const res = await fetch(`${API_URL}/api/customer-proposal/${accessCode}/${token}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signature.trim(), accepted_by_email: recipientEmail || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || 'Could not accept');
      }
      setAccepted(true);
    } catch (e) {
      alert(e.message);
    }
    setAccepting(false);
  };

  if (loading) return <div style={loadingStyle}>Loading your proposal…</div>;
  if (error) return <ErrorPage message={error} />;
  if (!data) return <ErrorPage message="Proposal not found" />;

  const portal = data.portal || {};
  const company = data.company || {};
  const projectName = data.project_name || '';
  const grouped = buildGrouped(data);

  let total = 0;
  grouped.forEach(tg => tg.roomGroups.forEach(rg => rg.lines.forEach(line => {
    total += compute(line.qty, line.cost, line.markup);
  })));
  const tax = total * (Number(portal.tax_rate || 0) / 100);
  const pmFee = total * (Number(portal.pm_fee_rate || 0) / 100);
  const less = Number(portal.proposal_less_payment || 0);
  const totalDue = total + tax + pmFee - less;

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 60 }} data-testid="customer-proposal-page">
      <ProposalHeader company={company} projectName={projectName} portal={portal} />

      {accepted ? (
        <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065F46 100%)', padding: '18px 24px', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', textAlign: 'center' }} data-testid="customer-accepted-banner">
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>✓ PROPOSAL ACCEPTED</div>
          <div style={{ color: '#D4C5A9', fontSize: 12, marginTop: 4 }}>
            Accepted by <strong>{portal.customer_accepted_signature || signature}</strong>
            {portal.customer_accepted_at && ` on ${new Date(portal.customer_accepted_at).toLocaleDateString()}`}
            {' — '}{company.company_name || 'your contractor'} has been notified.
          </div>
        </div>
      ) : (
        <div style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)', padding: '14px 24px', borderTop: '1px solid #D4A574', borderBottom: '1px solid #D4A574', color: '#D4C5A9', fontSize: 13, textAlign: 'center' }}>
          Review the proposal below. To accept, type your name in the signature box at the bottom.
        </div>
      )}

      <div style={{ padding: 16 }}>
        {grouped.length === 0 && (
          <div style={{ background: '#1a1f2e', border: '1px solid #D4A574', padding: 24, color: '#D4C5A9', textAlign: 'center', borderRadius: 4 }}>
            This proposal is being prepared. Please check back shortly.
          </div>
        )}
        {grouped.map(tg => {
          const tradeColor = TRADE_COLORS[tg.tradeName] || '#065F46';
          return (
            <div key={tg.tradeName} style={{ marginBottom: 24 }}>
              <div style={{ ...getMutedRoomHeaderStyle(tradeColor), padding: '10px 14px', border: '1px solid #B49B7E', color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 3 }}>
                {tg.displayName}
              </div>
              {tg.roomGroups.map(rg => (
                <div key={`${tg.tradeName}::${rg.roomName}`} style={{ marginTop: 6, marginBottom: 12 }}>
                  <div style={{ ...getMutedRoomHeaderStyleStandalone(rg.color), padding: '6px 14px', border: '1px solid #B49B7E', color: '#D4C5A9', fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>
                    {rg.displayName}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#000' }}>
                    <thead>
                      <tr>
                        <Th w="6%">#</Th>
                        <Th w="55%" align="left">DESCRIPTION</Th>
                        <Th w="8%">QTY</Th>
                        <Th w="6%">UNIT</Th>
                        <Th w="12%">UNIT COST</Th>
                        <Th w="13%">TOTAL</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rg.lines.map((line, idx) => (
                        <tr key={line.line_id} style={{ background: idx % 2 === 0
                          ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(15,15,25,0.95) 70%, rgba(0,0,0,0.95) 100%)'
                          : 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(45,45,55,0.9) 30%, rgba(25,25,35,0.95) 70%, rgba(15,15,25,0.95) 100%)' }}>
                          <td style={{ ...td, color: '#B49B7E', fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ ...td, textAlign: 'left', padding: '6px 10px' }} dangerouslySetInnerHTML={{ __html: line.descriptionHtml }} />
                          <td style={td}>{fmt(line.qty)}</td>
                          <td style={td}>{line.unit}</td>
                          <td style={td}>{fmtUSD(line.cost)}</td>
                          <td style={{ ...td, fontWeight: 700, color: '#D4A574' }}>{fmtUSD(compute(line.qty, line.cost, line.markup))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          );
        })}

        {grouped.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0 8px' }}>
            <table style={{ minWidth: 360 }}>
              <tbody>
                <Row label="Subtotal" value={fmtUSD(total)} bold />
                <Row label={`Project Mgmt Fee (${portal.pm_fee_rate || 0}%)`} value={fmtUSD(pmFee)} />
                <Row label={`Tax (${portal.tax_rate || 0}%)`} value={fmtUSD(tax)} />
                {less > 0 && <Row label="Less Deposit" value={`− ${fmtUSD(less)}`} />}
                <tr>
                  <td style={{ padding: '10px 14px', background: '#D4A574', color: '#1a1f2e', fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>TOTAL DUE</td>
                  <td style={{ padding: '10px 14px', background: '#D4A574', color: '#1a1f2e', fontWeight: 900, fontSize: 14, textAlign: 'right' }}>{fmtUSD(totalDue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {portal.proposal_notes && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #2a3040', marginTop: 16 }}>
            <div style={{ color: '#D4A574', fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>NOTES</div>
            <p style={{ color: '#D4C5A9', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{portal.proposal_notes}</p>
          </div>
        )}

        {!accepted && grouped.length > 0 && (
          <div style={{ marginTop: 28, padding: 24, background: '#0f1218', border: '1px solid #D4A574', borderRadius: 8 }}>
            <h3 style={{ color: '#D4A574', fontSize: 16, marginBottom: 8, letterSpacing: 1 }}>ACCEPT THIS PROPOSAL</h3>
            <p style={{ color: '#D4C5A9', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
              By typing your full legal name below and clicking ACCEPT, you agree to the scope and pricing as shown.
              {company.company_name && <> An emailed confirmation will be sent to <strong>{company.company_name}</strong>.</>}
            </p>
            <input
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Type your full legal name"
              data-testid="customer-signature-input"
              style={{ width: '100%', padding: '12px 14px', background: '#1a1f2e', border: '1px solid #D4A574', color: '#D4C5A9', borderRadius: 4, fontSize: 15, marginBottom: 12 }}
            />
            <input
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="Your email (optional, for confirmation)"
              style={{ width: '100%', padding: '10px 14px', background: '#1a1f2e', border: '1px solid #4b5563', color: '#D4C5A9', borderRadius: 4, fontSize: 13, marginBottom: 14 }}
            />
            <button onClick={accept} disabled={accepting || !signature.trim()} data-testid="customer-accept-btn"
              style={{ width: '100%', background: accepting ? '#4b5563' : '#D4A574', color: '#1a1f2e', padding: '14px 24px', borderRadius: 6, border: 'none', cursor: accepting || !signature.trim() ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>
              {accepting ? 'Accepting…' : '✓ ACCEPT PROPOSAL'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function buildGrouped(data) {
  const html = data.scope_document || '';
  const projectRooms = data.rooms || [];
  const parsed = parseScopeDocument(html, projectRooms);
  const overrides = {};
  (data.overrides || []).forEach(o => { overrides[o.item_id] = o; });
  const extras = data.extras || [];
  const tradeQuotes = data.trade_quotes || {};
  const layout = data.portal?.proposal_layout || {};

  const byTrade = {};
  const tradeOrder = [];
  parsed.items.forEach(item => {
    const rName = (item.roomName || 'GENERAL').toUpperCase();
    const tradeKeys = (item.trades && item.trades.length ? item.trades : ['GENERAL']).map(t => (t || '').toUpperCase());
    tradeKeys.forEach(T => {
      if (!byTrade[T]) { byTrade[T] = { tradeName: T, rooms: {}, roomOrder: [] }; tradeOrder.push(T); }
      if (!byTrade[T].rooms[rName]) { byTrade[T].rooms[rName] = []; byTrade[T].roomOrder.push(rName); }
      byTrade[T].rooms[rName].push({
        line_id: stableLineId(rName, T, item.text),
        text: item.text,
        html: item.html,
        source: 'scope',
      });
    });
  });
  extras.forEach(e => {
    if (e.parent_kind !== 'trade-room' && e.parent_kind !== 'trade-only') return;
    const [T, R] = (e.parent_id || '').split('::');
    const TT = (T || 'GENERAL').toUpperCase();
    const RR = (R || 'GENERAL').toUpperCase();
    if (!byTrade[TT]) { byTrade[TT] = { tradeName: TT, rooms: {}, roomOrder: [] }; tradeOrder.push(TT); }
    if (!byTrade[TT].rooms[RR]) { byTrade[TT].rooms[RR] = []; byTrade[TT].roomOrder.push(RR); }
    byTrade[TT].rooms[RR].push({ line_id: e.id, text: e.name, html: e.name, source: 'extra', extra: e });
  });

  const persistedTrades = (layout.trade_order || []).filter(t => byTrade[t]);
  const persistedSet = new Set(persistedTrades);
  const finalTrades = [...persistedTrades, ...tradeOrder.filter(t => !persistedSet.has(t))];

  return finalTrades.map(T => {
    const tg = byTrade[T];
    const persistedRooms = (layout.room_order?.[T] || []).filter(r => tg.rooms[r]);
    const prSet = new Set(persistedRooms);
    const finalRooms = [...persistedRooms, ...tg.roomOrder.filter(r => !prSet.has(r))];

    const roomGroups = finalRooms.map(R => {
      const orderKey = `${T}::${R}`;
      const persistedLineOrder = layout.line_order?.[orderKey] || [];
      const idx = new Map(persistedLineOrder.map((id, i) => [id, i]));
      const allLines = tg.rooms[R].slice().sort((a, b) => {
        const ai = idx.has(a.line_id) ? idx.get(a.line_id) : 1e9;
        const bi = idx.has(b.line_id) ? idx.get(b.line_id) : 1e9;
        return ai - bi;
      });
      const visible = allLines.filter(l => !overrides[l.line_id]?.hidden).map(line => {
        const o = overrides[line.line_id] || {};
        const isExtra = line.source === 'extra';
        const tq = tradeQuotes[line.line_id] || null;
        const qty = isExtra ? (o.quantity ?? line.extra.quantity) : (o.quantity ?? 1);
        const unit = isExtra ? (o.unit ?? line.extra.unit ?? 'LS') : (o.unit ?? 'LS');
        const cost = isExtra ? (o.cost ?? line.extra.cost ?? 0)
          : ((o.cost !== undefined && o.cost !== null) ? o.cost : (tq ? tq.cost : 0));
        const markup = isExtra ? (o.markup_percent ?? line.extra.markup_percent ?? 0) : (o.markup_percent ?? 0);
        const descriptionHtml = isExtra ? (o.name ?? line.extra.name) : (o.description ?? stripTradePills(line.html));
        return { ...line, qty, unit, cost, markup, descriptionHtml };
      });
      const roomColor = (projectRooms.find(r => (r.name || '').toUpperCase() === R)?.color) || getRoomColor(R);
      return { roomName: R, displayName: layout.room_renames?.[orderKey] || R, lines: visible, color: roomColor };
    }).filter(rg => rg.lines.length > 0);

    return { tradeName: T, displayName: layout.trade_renames?.[T] || T, roomGroups };
  }).filter(tg => tg.roomGroups.length > 0);
}

function ProposalHeader({ company, projectName, portal }) {
  const today = new Date().toLocaleDateString();
  const estNo = portal?.id ? portal.id.slice(0, 8).toUpperCase() : '';
  return (
    <div style={{ borderBottom: '2px solid #D4A574', padding: 24, background: 'linear-gradient(135deg, #0f1218 0%, #1a1f2e 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: '1 1 auto', minWidth: 280 }}>
          {company.logo_data ? (
            <img src={company.logo_data} alt="logo" style={{ height: 64, maxWidth: 200, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 64, height: 64, background: '#1a1f2e', border: '1px dashed #D4A574', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4C5A9', fontSize: 9 }}>LOGO</div>
          )}
          <div>
            <h1 style={{ color: '#D4A574', fontSize: 22, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>{company.company_name || 'PROPOSAL'}</h1>
            <p style={{ color: '#D4C5A9', fontSize: 12, lineHeight: 1.5 }}>
              {company.address || ''}<br />
              {company.phone || ''}{company.phone && company.email ? ' · ' : ''}{company.email || ''}<br />
              {company.license_number ? `License # ${company.license_number}` : ''}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: '0 0 auto', minWidth: 200 }}>
          <div style={{ color: '#D4A574', fontSize: 16, letterSpacing: 4, fontWeight: 800 }}>PROPOSAL</div>
          <div style={{ marginTop: 8, color: '#D4C5A9', fontSize: 12 }}>
            EST. NO. <span style={{ color: '#D4C5A9' }}>{estNo}</span><br />
            DATE <span style={{ color: '#D4C5A9' }}>{today}</span><br />
            PROJECT <span style={{ color: '#D4C5A9' }}>{projectName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, w, align = 'right' }) {
  return <th style={{ width: w, background: 'linear-gradient(135deg, #8B4444EE 0%, #8B4444 50%, #8B4444EE 100%)', color: '#D4C5A9', textAlign: align, padding: '8px 6px', fontSize: 11, fontWeight: 700, letterSpacing: 1, border: '1px solid #B49B7E', textTransform: 'uppercase' }}>{children}</th>;
}

function Row({ label, value, bold }) {
  return <tr><td style={{ padding: '6px 14px', color: '#D4C5A9', fontSize: 13, fontWeight: bold ? 700 : 400 }}>{label}</td><td style={{ padding: '6px 14px', color: '#D4C5A9', fontSize: 13, textAlign: 'right', fontWeight: bold ? 700 : 400 }}>{value}</td></tr>;
}

const td = { border: '1px solid #B49B7E', padding: '6px 10px', color: '#D4C5A9', fontSize: 13, textAlign: 'right', verticalAlign: 'top' };
const loadingStyle = { padding: 40, color: '#D4C5A9', background: '#000', minHeight: '100vh' };

function ErrorPage({ message }) {
  return (
    <div style={{ background: '#0f1218', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1a1f2e', border: '1px solid #ef4444', borderRadius: 8, padding: 32, textAlign: 'center', maxWidth: 480 }}>
        <h2 style={{ color: '#ef4444', fontSize: 18, marginBottom: 8 }}>Link unavailable</h2>
        <p style={{ color: '#D4C5A9', fontSize: 13 }}>{message}</p>
        <p style={{ color: '#D4C5A9', fontSize: 12, marginTop: 16, opacity: 0.7 }}>If you believe this is a mistake, please reply to the email you received.</p>
      </div>
    </div>
  );
}
