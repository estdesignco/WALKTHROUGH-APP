import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

/**
 * ExtensionDownloadButton
 *
 * Reads the current Chrome Extension version straight from the backend
 * (/api/extension/version, which reads manifest.json), and renders a
 * prominent download button. Use this ANYWHERE the user might need to
 * grab the latest scraper — Purchase Orders header, AI panel, Burst
 * modal, Houzz importer, etc. Never hardcode the version again.
 */
const ExtensionDownloadButton = ({ variant = 'default', className = '', dataTestId = 'download-extension-btn' }) => {
  const [info, setInfo] = useState({ version: '', filename: 'design-ready-scraper.zip' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API_BASE}/extension/version`);
        if (!cancelled) setInfo(r.data);
      } catch (e) {
        // fail silently — button still works with default label
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const versionLabel = info.version && info.version !== 'unknown' ? `v${info.version}` : 'latest';
  const href = `${API_BASE}/download/chrome-extension?v=${encodeURIComponent(info.version || 'x')}_${Date.now()}`;

  if (variant === 'compact') {
    return (
      <a data-testid={dataTestId} href={href}
        title={`Download Design Ready Scraper Chrome Extension (${versionLabel})`}
        className={`inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black font-bold px-2.5 py-1 rounded text-[11px] tracking-wide shadow ${className}`}>
        ⬇ SCRAPER {versionLabel}
      </a>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-amber-500/15 border border-amber-500/40 rounded-lg p-3 flex items-center justify-between gap-3 ${className}`}>
        <div className="text-sm text-amber-100">
          <div className="font-bold">Chrome Extension {versionLabel} required</div>
          <div className="text-xs text-amber-200/80">If your extension is older than {versionLabel}, download &amp; reinstall it first (drag the folder onto chrome://extensions after unzipping).</div>
        </div>
        <a data-testid={dataTestId} href={href}
          className="whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-lg text-sm shadow">
          ⬇ Download {versionLabel}
        </a>
      </div>
    );
  }

  // default variant — prominent button for headers
  return (
    <a data-testid={dataTestId} href={href}
      title={`Download the Design Ready Product Scraper Chrome Extension (${versionLabel}) — required for Burst Backfill and Houzz import.`}
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold px-4 py-2 rounded-lg text-sm shadow ${className}`}>
      ⬇ Download Scraper {versionLabel}
    </a>
  );
};

export default ExtensionDownloadButton;
