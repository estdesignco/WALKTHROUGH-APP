import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * Simple fullscreen viewer for uploaded images/PDFs/files.
 * - Images show full-size
 * - PDFs render in an iframe
 * - Other files get a download button
 * - Keyboard: ← → navigate, Esc close
 */
export default function FileLightbox({ files, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setIdx(i => Math.min(files.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [files.length, onClose]);

  if (!files || files.length === 0) return null;
  const f = files[idx] || {};
  const src = f.data || f.url || f.photo_data || '';
  const name = f.name || f.file_name || `file-${idx + 1}`;
  const type = f.type || (src.startsWith('data:image') ? 'image/' : src.startsWith('data:application/pdf') ? 'application/pdf' : '');
  const isImage = type.startsWith('image') || /\.(png|jpe?g|gif|webp|heic|heif|bmp|svg)$/i.test(name);
  const isPdf = type === 'application/pdf' || /\.pdf$/i.test(name);

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      data-testid="file-lightbox"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)',
        zIndex: 99999, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Header */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '12px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      >
        <div style={{ color: '#F5F5DC', fontSize: 14, fontWeight: 700, maxWidth: '60vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
          {files.length > 1 && <span style={{ color: '#9CA3AF', marginLeft: 12, fontSize: 12, fontWeight: 500 }}>{idx + 1} / {files.length}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={src}
            download={name}
            onClick={e => e.stopPropagation()}
            data-testid="lightbox-download"
            style={{ background: '#D4A574', color: '#1a1f2e', textDecoration: 'none', padding: '8px 14px', borderRadius: 6, fontWeight: 800, fontSize: 12, letterSpacing: 1 }}
          >
            ⬇ DOWNLOAD
          </a>
          <button
            onClick={onClose}
            data-testid="lightbox-close"
            style={{ background: '#374151', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 800, fontSize: 12, letterSpacing: 1 }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>

      {/* Prev/Next */}
      {files.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); }}
            disabled={idx === 0}
            data-testid="lightbox-prev"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(15,18,24,0.8)', color: '#fff', border: '1px solid #2a3040', width: 46, height: 46, borderRadius: '50%', fontSize: 20, cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
          >‹</button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => Math.min(files.length - 1, i + 1)); }}
            disabled={idx === files.length - 1}
            data-testid="lightbox-next"
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(15,18,24,0.8)', color: '#fff', border: '1px solid #2a3040', width: 46, height: 46, borderRadius: '50%', fontSize: 20, cursor: 'pointer', opacity: idx === files.length - 1 ? 0.3 : 1 }}
          >›</button>
        </>
      )}

      {/* Content */}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isImage && src && (
          <img src={src} alt={name} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', borderRadius: 4 }} />
        )}
        {isPdf && src && (
          <iframe src={src} title={name} style={{ width: '90vw', height: '85vh', border: '1px solid #2a3040', borderRadius: 6, background: '#fff' }} />
        )}
        {!isImage && !isPdf && (
          <div style={{ background: '#1a1f2e', border: '1px solid #2a3040', padding: 40, borderRadius: 8, textAlign: 'center', color: '#F5F5DC', maxWidth: 420 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{name}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Preview not supported for this file type.</div>
            <a
              href={src}
              download={name}
              style={{ display: 'inline-block', background: '#D4A574', color: '#1a1f2e', textDecoration: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 800, fontSize: 12, letterSpacing: 1 }}
            >
              ⬇ DOWNLOAD TO OPEN
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
