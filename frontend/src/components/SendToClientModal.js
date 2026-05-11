/**
 * SendToClientModal
 * =================
 * Builder/Trade clicks "SEND TO CLIENT" → this modal captures the on-screen
 * proposal as a PDF (via html2pdf.js), takes recipient email/subject/message,
 * and POSTs to the backend which sends from the builder's own white-label.
 *
 * The PDF is generated client-side from the same DOM the user is looking at
 * so it's pixel-identical to the on-screen quote (gradients, banners, totals).
 */
import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function SendToClientModal({ accessCode, defaultTo = '', defaultName = '', defaultCc = '', defaultSubject = '', isResend = false, companyName = '', projectName = '', onClose, onSent }) {
  const [toEmail, setToEmail] = useState(defaultTo);
  const [toName, setToName] = useState(defaultName);
  const [cc, setCc] = useState(defaultCc);
  const [subject, setSubject] = useState(defaultSubject || '');
  const [message, setMessage] = useState('');
  const [includeAccept, setIncludeAccept] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    // When this is a RESEND, keep the prior subject; otherwise build a default.
    const proj = projectName || 'your project';
    const co = companyName || 'our team';
    if (!defaultSubject) {
      setSubject(`Your proposal for ${proj}`);
    }
    setMessage(
      (isResend
        ? `Hi${defaultName ? ' ' + defaultName.split(' ')[0] : ''},\n\nFollowing up — re-sending the latest proposal for ${proj}. The previous accept link has been replaced with a fresh one below.\n\nThank you,\n${co}`
        : `Hi${defaultName ? ' ' + defaultName.split(' ')[0] : ''},\n\nPlease find the proposal for ${proj} attached as a PDF.\n\nOnce you've reviewed it, you can accept the proposal online using the button below — or just reply to this email with any questions.\n\nThank you,\n${co}`
      )
    );
  }, [projectName, companyName, defaultName, defaultSubject, isResend]);

  const generatePdf = async () => {
    setProgress('Generating PDF…');
    const node = document.querySelector('[data-testid="proposal-view"]');
    if (!node) throw new Error('Proposal view not found on screen. Open the Proposal tab and try again.');

    // Force expand any collapsed accordions so the PDF captures the whole quote.
    // We toggle chevrons via a quick DOM scan, then restore after capture.
    const collapsedExpanded = [];
    node.querySelectorAll('[data-testid^="trade-toggle-"], [data-testid^="room-toggle-"]').forEach(btn => {
      if ((btn.textContent || '').trim() === '▶') {
        btn.click();
        collapsedExpanded.push(btn);
      }
    });
    // Allow re-render to flush
    await new Promise(r => setTimeout(r, 200));

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${(projectName || 'proposal').replace(/[^a-z0-9]+/gi, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000', logging: false },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    const pdfBlob = await html2pdf().set(opt).from(node).outputPdf('blob');

    // Restore collapsed state
    collapsedExpanded.forEach(btn => btn.click());

    // Read blob as base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
    return { base64, blob: pdfBlob, filename: opt.filename };
  };

  const sendNow = async () => {
    setError('');
    if (!toEmail.trim()) { setError('Recipient email required.'); return; }
    setSending(true);
    try {
      const { base64, filename } = await generatePdf();
      setProgress('Sending email…');
      const res = await fetch(`${API_URL}/api/builder/${accessCode}/proposal/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: toEmail.trim(),
          to_name: toName.trim(),
          cc_emails: cc.split(',').map(s => s.trim()).filter(Boolean),
          subject,
          message,
          pdf_base64: base64,
          pdf_filename: filename,
          include_accept_link: includeAccept,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Send failed');
      if (mounted.current) {
        setProgress('✓ Sent!');
        onSent?.(data);
        setTimeout(() => onClose?.(), 800);
      }
    } catch (e) {
      if (mounted.current) setError(e.message);
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  const downloadOnly = async () => {
    try {
      setError('');
      setSending(true);
      const node = document.querySelector('[data-testid="proposal-view"]');
      if (!node) throw new Error('Proposal view not found on screen.');
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${(projectName || 'proposal').replace(/[^a-z0-9]+/gi, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000', logging: false },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(node).save();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const inp = { width: '100%', background: '#1a1f2e', color: '#D4C5A9', border: '1px solid #B49B7E', padding: '8px 10px', fontSize: 13, borderRadius: 4 };
  const lbl = { color: '#D4A574', fontSize: 11, letterSpacing: 2, fontWeight: 700, display: 'block', marginBottom: 4 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} data-testid="send-to-client-modal"
        style={{ background: '#0f1218', border: '1px solid #D4A574', borderRadius: 8, maxWidth: 560, width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: 24 }}>
        <h2 style={{ color: '#D4A574', fontSize: 18, marginBottom: 4 }}>
          {isResend ? '↻ Resend Proposal' : '📨 Send Proposal to Client'}
        </h2>
        <p style={{ color: '#D4C5A9', fontSize: 12, marginBottom: 16, opacity: 0.85 }}>
          {isResend
            ? 'This re-sends the latest proposal PDF and generates a fresh accept link (the previous link becomes inactive).'
            : 'The PDF will be attached and the email sent from your white-label address.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>TO (email)</label>
              <input value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="homeowner@email.com" data-testid="send-to-email" style={inp} />
            </div>
            <div>
              <label style={lbl}>TO (name)</label>
              <input value={toName} onChange={e => setToName(e.target.value)} placeholder="Optional" style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>CC (comma-separated, optional)</label>
            <input value={cc} onChange={e => setCc(e.target.value)} placeholder="builder@yourco.com, partner@yourco.com" data-testid="send-cc" style={inp} />
          </div>
          <div>
            <label style={lbl}>SUBJECT</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} data-testid="send-subject" style={inp} />
          </div>
          <div>
            <label style={lbl}>MESSAGE</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} data-testid="send-message" style={{ ...inp, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <label style={{ color: '#D4C5A9', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={includeAccept} onChange={e => setIncludeAccept(e.target.checked)} data-testid="include-accept-link" />
            Include "Accept &amp; Sign Online" button (recommended — generates a one-time link)
          </label>
        </div>

        {error && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: 8, borderRadius: 4 }} data-testid="send-error">{error}</div>}
        {progress && !error && <div style={{ marginTop: 12, color: '#D4A574', fontSize: 12 }} data-testid="send-progress">{progress}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={downloadOnly} disabled={sending} data-testid="download-pdf-btn"
            style={{ background: 'transparent', color: '#D4A574', border: '1px solid #D4A574', padding: '8px 16px', borderRadius: 4, cursor: sending ? 'not-allowed' : 'pointer', fontSize: 12 }}>
            📄 Download PDF only
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ background: 'transparent', color: '#D4C5A9', border: '1px solid #4b5563', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            <button onClick={sendNow} disabled={sending || !toEmail.trim()} data-testid="confirm-send-btn"
              style={{ background: sending ? '#4b5563' : '#D4A574', color: '#1a1f2e', padding: '8px 20px', borderRadius: 4, border: 'none', cursor: sending ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
              {sending ? 'Sending…' : (isResend ? '↻ RESEND NOW' : '✉ SEND TO CLIENT')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
