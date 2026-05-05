import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

// Module-level cache so multiple badges per page share one fetch/parse
const _cache = { projectId: null, scopeDoc: '', refs: new Map(), fetching: null };
const _listeners = new Set();
const _emit = () => _listeners.forEach(fn => fn());

/**
 * Extract item references from a scope_document HTML string.
 * Returns Map<itemId, Array<{ html, text, snippet, trade, roomName }>>.
 * Walks block elements and, when a block contains a product tag, buckets
 * the whole block under that product's id so hovering shows the sentence.
 */
export function extractScopeReferences(html) {
  const map = new Map();
  if (!html || !html.trim()) return map;

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstChild;
  if (!root) return map;

  let currentRoomName = null;

  const addRef = (itemId, block, trades) => {
    const arr = map.get(itemId) || [];
    const text = (block.textContent || '').trim();
    const snippet = text.length > 120 ? text.slice(0, 120) + '…' : text;
    arr.push({
      html: block.innerHTML,
      text,
      snippet,
      trades: trades,
      roomName: currentRoomName,
    });
    map.set(itemId, arr);
  };

  const visit = (node) => {
    if (!node || node.nodeType !== 1) return;
    const tag = (node.tagName || '').toUpperCase();

    if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
      currentRoomName = (node.textContent || '').trim().toUpperCase() || null;
      return;
    }

    if (tag === 'OL' || tag === 'UL') {
      Array.from(node.children).forEach(visit);
      return;
    }

    if (tag === 'LI' || tag === 'P' || tag === 'DIV' || tag === 'BLOCKQUOTE') {
      const productNodes = node.querySelectorAll('[data-tag="product"]');
      if (productNodes.length === 0) return;
      const tradeNodes = node.querySelectorAll('[data-tag="trade"]');
      const trades = Array.from(tradeNodes).map(n => n.getAttribute('data-trade')).filter(Boolean);
      Array.from(productNodes).forEach(pn => {
        const id = pn.getAttribute('data-product-id');
        if (id) addRef(id, node, trades);
      });
      return;
    }

    // other elements - recurse
    Array.from(node.children || []).forEach(visit);
  };

  Array.from(root.children).forEach(visit);
  return map;
}

async function loadScopeForProject(projectId) {
  if (_cache.projectId === projectId && _cache.fetching === null) return _cache.refs;
  if (_cache.fetching && _cache.projectId === projectId) return _cache.fetching;

  _cache.projectId = projectId;
  _cache.fetching = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/builder-portal/project/${projectId}`);
      if (!res.ok) { _cache.scopeDoc = ''; _cache.refs = new Map(); return _cache.refs; }
      const data = await res.json();
      _cache.scopeDoc = data.scope_document || '';
      _cache.refs = extractScopeReferences(_cache.scopeDoc);
      return _cache.refs;
    } catch {
      _cache.scopeDoc = '';
      _cache.refs = new Map();
      return _cache.refs;
    } finally {
      _cache.fetching = null;
      _emit();
    }
  })();
  return _cache.fetching;
}

// Invalidate the cache when scope is saved elsewhere
export function invalidateScopeRefs() {
  _cache.projectId = null;
  _cache.refs = new Map();
  _emit();
}

/**
 * Hook that returns the refs Map for a given projectId.
 * Cached across components; auto-updates when invalidateScopeRefs() is called.
 */
export function useScopeReferences(projectId) {
  const [refs, setRefs] = useState(_cache.projectId === projectId ? _cache.refs : new Map());

  useEffect(() => {
    if (!projectId) { setRefs(new Map()); return; }
    let alive = true;
    loadScopeForProject(projectId).then(r => { if (alive) setRefs(r); });
    const listener = () => { if (alive) setRefs(_cache.projectId === projectId ? _cache.refs : new Map()); };
    _listeners.add(listener);
    return () => { alive = false; _listeners.delete(listener); };
  }, [projectId]);

  return refs;
}

/**
 * Small badge displayed next to an item name, showing how many times the
 * item is referenced in the scope of work. Hover → see the scope sentences
 * inline. Click → navigate to the Builder Portal Manager (Scope tab).
 */
export default function ScopeReferenceBadge({ itemId, projectId, itemName, onJumpToScope }) {
  const refs = useScopeReferences(projectId);
  const itemRefs = refs.get(itemId);
  const [hover, setHover] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const anchor = useRef(null);

  if (!itemRefs || itemRefs.length === 0) return null;

  const onEnter = () => {
    if (anchor.current) {
      const r = anchor.current.getBoundingClientRect();
      const top = r.bottom + 6;
      const left = Math.min(r.left, window.innerWidth - 320);
      setCoords({ top, left });
    }
    setHover(true);
  };

  const onClick = (e) => {
    e.stopPropagation();
    if (onJumpToScope) onJumpToScope(itemId);
    else window.dispatchEvent(new CustomEvent('jump-to-scope', { detail: { projectId, itemId } }));
  };

  return (
    <>
      <span
        ref={anchor}
        onMouseEnter={onEnter}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        data-testid={`scope-ref-badge-${itemId}`}
        title={`Referenced in ${itemRefs.length} scope ${itemRefs.length === 1 ? 'item' : 'items'} · click to open`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          background: '#D4A57420',
          border: '1px solid #D4A574',
          color: '#D4A574',
          padding: '1px 6px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.5,
          cursor: 'pointer',
          verticalAlign: 'middle',
          lineHeight: 1.2,
          marginLeft: 6,
          userSelect: 'none',
          transition: 'transform 0.1s, filter 0.1s',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        📋 {itemRefs.length}
      </span>
      {hover && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 99999,
            background: '#0f1218',
            border: '1px solid #D4A574',
            borderRadius: 8,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            width: 320,
            maxHeight: 300,
            overflowY: 'auto',
            pointerEvents: 'none',
          }}
          data-testid="scope-ref-popup"
        >
          <div style={{ background: '#D4A57420', padding: '8px 12px', borderBottom: '1px solid #D4A57440' }}>
            <div style={{ color: '#D4A574', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
              REFERENCED IN SCOPE · {itemRefs.length}
            </div>
            {itemName && <div style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemName}</div>}
          </div>
          <div style={{ padding: 4 }}>
            {itemRefs.map((r, i) => (
              <div key={i} style={{ padding: '6px 8px', borderRadius: 4, background: i % 2 === 0 ? 'transparent' : '#1a1f2e' }}>
                {r.roomName && <div style={{ fontSize: 9, color: '#D4A574', fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>{r.roomName}</div>}
                <div style={{ color: '#E5E7EB', fontSize: 11, lineHeight: 1.4 }}>{r.snippet}</div>
                {r.trades && r.trades.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
                    {r.trades.map((t, ti) => (
                      <span key={ti} style={{ background: '#374151', color: '#F5F5DC', fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '6px 10px', fontSize: 9, color: '#6B7280', borderTop: '1px solid #2a3040', textAlign: 'center' }}>
            Click badge → jump to Scope editor
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
