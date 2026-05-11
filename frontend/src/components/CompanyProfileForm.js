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
    // BYO email config
    email_provider: '', email_from_name: '', email_from_address: '', email_reply_to: '',
    resend_api_key_enc: '',
    smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password_enc: '', smtp_use_tls: true,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  // Track whether secrets are already saved on the server (so we can show
  // "saved · click to change" instead of a blank password field).
  const [resendKeySet, setResendKeySet] = useState(false);
  const [smtpPasswordSet, setSmtpPasswordSet] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/builder/${accessCode}/company`).then(r => r.json()).then(p => {
      if (p && Object.keys(p).length) {
        setResendKeySet(!!p.resend_api_key_set);
        setSmtpPasswordSet(!!p.smtp_password_set);
        // Strip the *_set flags before merging into form state
        const { resend_api_key_set, smtp_password_set, ...rest } = p;
        setProfile(prev => ({ ...prev, ...rest, resend_api_key_enc: '', smtp_password_enc: '' }));
      }
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

  // Provider presets so builders just have to pick "Gmail" and enter username+app-password.
  const applyProviderPreset = (provider) => {
    const presets = {
      gmail: { smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_use_tls: true },
      outlook: { smtp_host: 'smtp.office365.com', smtp_port: 587, smtp_use_tls: true },
    };
    setProfile(p => ({ ...p, email_provider: provider, ...(presets[provider] || {}) }));
  };

  const save = async () => {
    setSaving(true);
    // Only send credential cleartext when the field was actually edited
    // (a non-empty string in *_enc means new input the user typed).
    const body = { ...profile, deposit_percent: Number(profile.deposit_percent) || 0 };
    if (!body.resend_api_key_enc) delete body.resend_api_key_enc;
    if (!body.smtp_password_enc) delete body.smtp_password_enc;
    const res = await fetch(`${API_URL}/api/builder/${accessCode}/company`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      const saved = await res.json();
      setResendKeySet(!!saved.resend_api_key_set);
      setSmtpPasswordSet(!!saved.smtp_password_set);
    }
    setSaving(false);
    onSaved?.(profile);
    onClose?.();
  };

  const sendTest = async () => {
    if (!profile.email_from_address) {
      setTestResult('⚠ Set "Send-as email" first.');
      return;
    }
    setTesting(true);
    setTestResult('');
    // We must save the latest creds before testing so the server has them.
    const body = { ...profile, deposit_percent: Number(profile.deposit_percent) || 0 };
    if (!body.resend_api_key_enc) delete body.resend_api_key_enc;
    if (!body.smtp_password_enc) delete body.smtp_password_enc;
    await fetch(`${API_URL}/api/builder/${accessCode}/company`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const target = window.prompt('Send a test email to which address?', profile.email_from_address) || '';
    if (!target.trim()) { setTesting(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal/test-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: target.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setTestResult(`✓ Sent! Check ${target.trim()} (id ${json.message_id || '—'})`);
      else setTestResult(`✕ ${json.detail || 'Send failed'}`);
    } catch (err) {
      setTestResult(`✕ ${err.message}`);
    }
    setTesting(false);
  };

  const provider = (profile.email_provider || '').toLowerCase();
  const showSmtpFields = provider && provider !== 'resend';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0f1218', border: '1px solid #D4A574', maxWidth: 720, width: '100%', padding: 24, borderRadius: 8, maxHeight: '92vh', overflowY: 'auto' }} data-testid="company-profile-form">
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

        {/* ===== EMAIL SETUP (BYO white-label sending) ===== */}
        <div style={{ marginTop: 24, padding: 16, background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 6 }} data-testid="email-setup-section">
          <h3 style={{ color: '#D4A574', fontSize: 14, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>EMAIL SETUP</h3>
          <p style={{ color: '#D4C5A9', fontSize: 11, lineHeight: 1.5, marginBottom: 12, opacity: 0.85 }}>
            Send proposals from your own email so homeowners see <em>your</em> brand — not ours. Pick a provider, paste credentials, send a test, you're done.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Provider">
              <select value={profile.email_provider || ''} onChange={e => applyProviderPreset(e.target.value)} style={inp} data-testid="email-provider-select">
                <option value="">— Pick one —</option>
                <option value="resend">Resend (recommended)</option>
                <option value="gmail">Gmail (App Password)</option>
                <option value="outlook">Outlook 365</option>
                <option value="smtp">Custom SMTP</option>
              </select>
            </Field>
            <Field label="Send-as name">
              <input placeholder="e.g. Steve's Construction" value={profile.email_from_name || ''} onChange={e => setProfile({ ...profile, email_from_name: e.target.value })} style={inp} />
            </Field>
            <Field label="Send-as email" full>
              <input placeholder="quotes@yourdomain.com" value={profile.email_from_address || ''} onChange={e => setProfile({ ...profile, email_from_address: e.target.value })} style={inp} data-testid="email-from-address" />
            </Field>
            <Field label="Reply-to (optional)" full>
              <input placeholder="(defaults to send-as email)" value={profile.email_reply_to || ''} onChange={e => setProfile({ ...profile, email_reply_to: e.target.value })} style={inp} />
            </Field>

            {provider === 'resend' && (
              <Field label={`Resend API key ${resendKeySet ? '· saved' : ''}`} full>
                <input
                  type="password"
                  placeholder={resendKeySet ? 'Saved — leave blank to keep, paste new key to replace' : 're_xxxxxxxxxxxxxxxxxxxx'}
                  value={profile.resend_api_key_enc || ''}
                  onChange={e => setProfile({ ...profile, resend_api_key_enc: e.target.value })}
                  style={inp}
                  data-testid="resend-api-key-input"
                />
                <p style={{ color: '#D4C5A9', fontSize: 10, marginTop: 4, opacity: 0.8 }}>
                  Get one at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#D4A574' }}>resend.com/api-keys</a>. For best deliverability, also verify your domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" style={{ color: '#D4A574' }}>resend.com/domains</a>.
                </p>
              </Field>
            )}

            {showSmtpFields && (
              <>
                <Field label="SMTP host">
                  <input placeholder={provider === 'gmail' ? 'smtp.gmail.com' : provider === 'outlook' ? 'smtp.office365.com' : 'smtp.example.com'} value={profile.smtp_host || ''} onChange={e => setProfile({ ...profile, smtp_host: e.target.value })} style={inp} data-testid="smtp-host" />
                </Field>
                <Field label="SMTP port">
                  <input type="number" placeholder="587" value={profile.smtp_port || 587} onChange={e => setProfile({ ...profile, smtp_port: e.target.value })} style={inp} />
                </Field>
                <Field label="SMTP username">
                  <input placeholder="(usually your email address)" value={profile.smtp_username || ''} onChange={e => setProfile({ ...profile, smtp_username: e.target.value })} style={inp} data-testid="smtp-username" />
                </Field>
                <Field label={`SMTP password ${smtpPasswordSet ? '· saved' : ''}`}>
                  <input type="password" placeholder={smtpPasswordSet ? 'Saved — leave blank to keep' : '••••••••'} value={profile.smtp_password_enc || ''} onChange={e => setProfile({ ...profile, smtp_password_enc: e.target.value })} style={inp} data-testid="smtp-password" />
                </Field>
                <Field label="Use TLS" full>
                  <label style={{ color: '#D4C5A9', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={!!profile.smtp_use_tls} onChange={e => setProfile({ ...profile, smtp_use_tls: e.target.checked })} /> START_TLS (default on port 587)
                  </label>
                </Field>
                {provider === 'gmail' && (
                  <div style={{ gridColumn: '1 / -1', background: '#0f1218', border: '1px solid #2a3040', padding: 10, borderRadius: 4, color: '#D4C5A9', fontSize: 11, lineHeight: 1.5 }}>
                    <strong style={{ color: '#D4A574' }}>Gmail setup:</strong> Use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#D4A574' }}>App Password</a> (NOT your real Gmail password). Requires 2-Step Verification enabled on the Google account.
                  </div>
                )}
              </>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={sendTest} disabled={testing || !provider || !profile.email_from_address} data-testid="send-test-email-btn"
                style={{ background: testing ? '#4b5563' : '#10B981', color: '#fff', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: testing ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}>
                {testing ? 'Sending…' : '✉ SEND TEST EMAIL'}
              </button>
              {testResult && <span style={{ color: testResult.startsWith('✓') ? '#10B981' : '#ef4444', fontSize: 12 }}>{testResult}</span>}
            </div>
          </div>
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
