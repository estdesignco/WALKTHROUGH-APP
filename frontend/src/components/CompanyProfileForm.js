/**
 * CompanyProfileForm
 * ==================
 * White-label company profile editor used by both the builder
 * (`/builder/:accessCode`) and the trade (`/trade/:accessCode`).
 * Uploaded logo is stored as a base64 data URL so the proposal renders
 * with the right branding for whichever portal is viewing it.
 */
import React, { useEffect, useState } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function CompanyProfileForm({ accessCode, onClose, onSaved }) {
  const [profile, setProfile] = useState({
    company_name: '', logo_data: '', address: '', phone: '', email: '',
    license_number: '', payment_terms: '', deposit_percent: 0, accent_color: '#D4A574',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/builder/${accessCode}/company`).then(r => r.json()).then(p => {
      if (p && Object.keys(p).length) setProfile(prev => ({ ...prev, ...p }));
    });
  }, [accessCode]);

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) return alert('Logo too large — max 1.5MB.');
    const reader = new FileReader();
    reader.onload = () => setProfile(p => ({ ...p, logo_data: reader.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    await fetch(`${API_URL}/api/builder/${accessCode}/company`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, deposit_percent: Number(profile.deposit_percent) || 0 }),
    });
    setSaving(false);
    onSaved?.(profile);
    onClose?.();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0f1218', border: '1px solid #D4A574', maxWidth: 640, width: '100%', padding: 24, borderRadius: 8, maxHeight: '90vh', overflowY: 'auto' }} data-testid="company-profile-form">
        <h2 style={{ color: '#D4A574', fontSize: 18, marginBottom: 12 }}>Your Company Profile</h2>
        <p style={{ color: '#D4C5A9', fontSize: 12, marginBottom: 16 }}>This branding shows on every quote you send. The designer never sees your numbers.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Company name">
            <input value={profile.company_name} onChange={e => setProfile({ ...profile, company_name: e.target.value })} style={inp} />
          </Field>
          <Field label="License #">
            <input value={profile.license_number} onChange={e => setProfile({ ...profile, license_number: e.target.value })} style={inp} />
          </Field>
          <Field label="Address" full>
            <input value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} style={inp} />
          </Field>
          <Field label="Phone">
            <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} style={inp} />
          </Field>
          <Field label="Email">
            <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} style={inp} />
          </Field>
          <Field label="Payment terms" full>
            <input placeholder="e.g. 30% deposit, 30% midpoint, 40% on completion" value={profile.payment_terms} onChange={e => setProfile({ ...profile, payment_terms: e.target.value })} style={inp} />
          </Field>
          <Field label="Deposit %">
            <input type="number" value={profile.deposit_percent} onChange={e => setProfile({ ...profile, deposit_percent: e.target.value })} style={inp} />
          </Field>
          <Field label="Accent color (hex)">
            <input value={profile.accent_color} onChange={e => setProfile({ ...profile, accent_color: e.target.value })} style={inp} />
          </Field>
          <Field label="Logo" full>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {profile.logo_data ? (
                <img src={profile.logo_data} alt="logo" style={{ height: 60, maxWidth: 180, objectFit: 'contain', background: '#fff', padding: 4, borderRadius: 4 }} />
              ) : (
                <div style={{ height: 60, width: 120, background: '#1a1f2e', border: '1px dashed #D4A574', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 11 }}>No logo</div>
              )}
              <label style={{ background: '#D4A574', color: '#000', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                UPLOAD
                <input type="file" accept="image/*" onChange={onLogo} style={{ display: 'none' }} />
              </label>
              {profile.logo_data && (
                <button onClick={() => setProfile({ ...profile, logo_data: '' })} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>REMOVE</button>
              )}
            </div>
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={save} disabled={saving} data-testid="save-company-btn" style={{ background: '#D4A574', color: '#000', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <label style={{ color: '#D4A574', fontSize: 11, letterSpacing: 1, display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inp = { width: '100%', background: '#1a1f2e', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '8px 10px', fontSize: 13, borderRadius: 4 };
