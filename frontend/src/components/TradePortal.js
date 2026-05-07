/**
 * TradePortal — `/trade/:accessCode`
 * ===================================
 * Opened by a sub/trade after their builder shares them a link. Reuses
 * ProposalView (kind="trade") so layout matches the Builder Portal pixel-for-
 * pixel. Trade enters their own numbers; designer NEVER sees them.
 *
 * "Disabled" links render a polite read-only "link unavailable" page —
 * no scope is leaked.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProposalView from './ProposalView';
import CompanyProfileForm from './CompanyProfileForm';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function TradePortal() {
  const { accessCode } = useParams();
  const [enabled, setEnabled] = useState(null);  // null = loading, false = disabled, true = ok
  const [tradeName, setTradeName] = useState('');
  const [showCompany, setShowCompany] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/builder/${accessCode}/proposal`).then(async r => {
      if (!r.ok) { setEnabled(false); return; }
      const data = await r.json();
      const portal = data.portal || {};
      setTradeName(portal.trade_name || data.project_name || '');
      // Trades have an `enabled` flag controlled by the builder. If false,
      // hide everything.
      if (portal.enabled === false) {
        setEnabled(false);
      } else {
        setEnabled(true);
      }
    }).catch(() => setEnabled(false));
  }, [accessCode]);

  if (enabled === null) return <div style={{ padding: 60, color: '#D4A574', textAlign: 'center', background: '#0f1218', minHeight: '100vh' }}>Loading…</div>;
  if (enabled === false) {
    return (
      <div style={{ padding: 60, color: '#D4A574', textAlign: 'center', background: '#0f1218', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Link unavailable</h1>
        <p style={{ color: '#9ca3af', fontSize: 14 }}>This trade portal is currently disabled by the builder. Please contact them for access.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f1218', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #2a3040' }}>
        <div style={{ color: '#D4A574', fontSize: 13, letterSpacing: 1 }}>
          🛠 TRADE PORTAL — {tradeName}
        </div>
        <button onClick={() => setShowCompany(true)} data-testid="trade-edit-company" style={{ background: 'transparent', color: '#D4A574', border: '1px solid #D4A574', padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
          ✎ MY COMPANY INFO
        </button>
      </div>
      <ProposalView accessCode={accessCode} kind="trade" />
      {showCompany && <CompanyProfileForm accessCode={accessCode} onClose={() => setShowCompany(false)} />}
    </div>
  );
}
