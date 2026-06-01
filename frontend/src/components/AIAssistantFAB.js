/**
 * AIAssistantFAB — floating "✨ AI" button that toggles the design agent panel.
 * Mounts inside ProjectDetailPage. Keyboard shortcut: ⌘J / Ctrl+J.
 */
import React, { useState, useEffect } from 'react';
import AIDesignAssistantPanel from './AIDesignAssistantPanel';

export default function AIAssistantFAB({ projectId, projectName }) {
  const [open, setOpen] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);

    // Any component in the tree can call window.openAIPanel(roomName) to
    // open the panel pre-configured for a specific room. Used by the
    // consolidated "✨ AI IMPORT" button on each room header.
    const handleOpenEvent = (e) => {
      const roomName = e?.detail?.roomName || '';
      setPreselectedRoom(roomName);
      setOpen(true);
    };
    window.addEventListener('aiassist:open', handleOpenEvent);
    window.openAIPanel = (roomName) => {
      window.dispatchEvent(new CustomEvent('aiassist:open', { detail: { roomName } }));
    };

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('aiassist:open', handleOpenEvent);
      delete window.openAIPanel;
    };
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
        preselectedRoom={preselectedRoom}
        open={open}
        onClose={() => { setOpen(false); setPreselectedRoom(''); }}
      />
    </>
  );
}
