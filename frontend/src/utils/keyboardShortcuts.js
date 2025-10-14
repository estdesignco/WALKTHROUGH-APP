/**
 * Keyboard Shortcuts Manager
 * Handles global keyboard shortcuts for the Interior Design Hub
 * 
 * DO NOT MODIFY EXISTING SPREADSHEET BEHAVIOR
 * This is an ADD-ON feature that enhances but doesn't replace existing functionality
 */

export const initializeKeyboardShortcuts = () => {
  // Check if already initialized
  if (window.__keyboardShortcutsInitialized) {
    return;
  }
  
  window.__keyboardShortcutsInitialized = true;
  
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    );
    
    // Ctrl/Cmd + key combinations
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    
    // CANVA SHORTCUTS
    if (ctrl && shift && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      const projectId = getCurrentProjectId();
      if (projectId) {
        const canvaUrl = `https://designhub-74.preview.emergentagent.com/canva-BIDIRECTIONAL-SYNC.js?projectId=${projectId}`;
        window.open(canvaUrl, '_blank', 'width=1200,height=800');
      }
      return;
    }
    
    if (ctrl && shift && e.key.toLowerCase() === 's') {
      e.preventDefault();
      // Trigger Canva scanner if extension is installed
      alert('🔍 Canva Scanner\n\nMake sure you:\n1. Are on a Canva design page\n2. Have the Chrome extension installed\n3. Click the extension icon to scan');
      return;
    }
    
    // HELP SHORTCUT
    if (ctrl && e.key === '/') {
      e.preventDefault();
      window.open('/keyboard-shortcuts.html', '_blank');
      return;
    }
    
    // SEARCH SHORTCUT (only if not already typing)
    if (!isTyping && ctrl && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="text"][placeholder*="Search"], input[type="search"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }
    
    // ESC to close modals
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
      if (modals.length > 0) {
        const topModal = modals[modals.length - 1];
        const closeButton = topModal.querySelector('button[aria-label="Close"], button.close, [data-dismiss="modal"]');
        if (closeButton) {
          closeButton.click();
        }
      }
      return;
    }
  });
  
  // Show shortcuts hint on first load
  if (!localStorage.getItem('shortcuts_hint_shown')) {
    setTimeout(() => {
      const hint = document.createElement('div');
      hint.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #D4A574, #B49B7E);
        color: #000;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(212, 165, 116, 0.5);
        font-weight: 600;
        z-index: 10000;
        cursor: pointer;
        animation: slideIn 0.5s ease-out;
      `;
      hint.innerHTML = '✨ Press <kbd style="background: #000; color: #D4A574; padding: 2px 6px; border-radius: 4px; font-family: monospace;">Ctrl</kbd> + <kbd style="background: #000; color: #D4A574; padding: 2px 6px; border-radius: 4px; font-family: monospace;">/</kbd> for keyboard shortcuts';
      
      document.body.appendChild(hint);
      
      hint.onclick = () => {
        window.open('/keyboard-shortcuts.html', '_blank');
        hint.remove();
      };
      
      setTimeout(() => {
        hint.style.transition = 'opacity 0.5s';
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 500);
      }, 8000);
      
      localStorage.setItem('shortcuts_hint_shown', 'true');
    }, 3000);
  }
};

// Helper to get current project ID from URL or state
function getCurrentProjectId() {
  // Try URL first
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId') || urlParams.get('project_id');
  
  if (projectId) return projectId;
  
  // Try to get from React state (if available)
  try {
    const reactRoot = document.querySelector('[data-reactroot]');
    if (reactRoot && reactRoot.__reactContainer$) {
      // React 18+
      const fiber = reactRoot._reactRootContainer?._internalRoot?.current;
      if (fiber) {
        // Try to find project in state
        let currentFiber = fiber;
        while (currentFiber) {
          if (currentFiber.memoizedState?.project?.id) {
            return currentFiber.memoizedState.project.id;
          }
          currentFiber = currentFiber.child || currentFiber.sibling || currentFiber.return;
        }
      }
    }
  } catch (e) {
    console.log('Could not extract project ID from React state');
  }
  
  return null;
}

export const showShortcutHint = (message, duration = 3000) => {
  const hint = document.createElement('div');
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, rgba(212, 165, 116, 0.95), rgba(180, 155, 126, 0.95));
    color: #000;
    padding: 12px 18px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    font-weight: 600;
    z-index: 10000;
    animation: slideInDown 0.3s ease-out;
  `;
  hint.textContent = message;
  
  document.body.appendChild(hint);
  
  setTimeout(() => {
    hint.style.transition = 'opacity 0.3s, transform 0.3s';
    hint.style.opacity = '0';
    hint.style.transform = 'translateY(-20px)';
    setTimeout(() => hint.remove(), 300);
  }, duration);
};
