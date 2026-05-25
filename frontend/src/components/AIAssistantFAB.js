/**
 * AIAssistantFAB — floating "✨ AI" button that toggles the design agent panel.
 * Mounts inside ProjectDetailPage. Keyboard shortcut: ⌘J / Ctrl+J.
 */
import React, { useState, useEffect } from 'react';
import AIDesignAssistantPanel from './AIDesignAssistantPanel';

export default function AIAssistantFAB({ projectId, projectName }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!projectId) return null;
  return (
    <>
      {!open && (
        <button
          data-testid="ai-assist-fab"
          onClick={() => setOpen(true)}
          title="Design Agent — Cmd/Ctrl+J"
          style={{
            position: 'fixed', bottom: 84, right: 24, zIndex: 1080,
            background: 'linear-gradient(135deg, #D4A574 0%, #B8895C 100%)',
            color: '#1a1f2e', border: '2px solid #D4A574',
            borderRadius: 999, padding: '12px 18px',
            fontSize: 14, fontWeight: 800, letterSpacing: 1, cursor: 'pointer',
            boxShadow: '0 8px 22px rgba(212,165,116,0.45), 0 0 0 4px rgba(212,165,116,0.18)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>✨</span> AI
        </button>
      )}
      <AIDesignAssistantPanel
        projectId={projectId}
        projectName={projectName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
