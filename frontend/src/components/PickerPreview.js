/**
 * PickerPreview — public, unauthenticated preview of the new Tasks ItemPicker.
 * URL: /picker-preview
 *
 * Pulls real Checklist+FFE data from the Wheeler Ridge seed project so the
 * user can interact with the new picker before redeploying to production.
 * This route is intentionally OUTSIDE the password gate for fast preview.
 */
import React, { useEffect, useState } from 'react';
import ItemPicker from './ItemPicker';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin) + '/api';
const PREVIEW_PROJECT_ID = '4d4a56dc-2f79-4269-93a9-bea4d3e85109';

export default function PickerPreview() {
  const [items, setItems] = useState([]);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [chk, ffe] = await Promise.all([
          fetch(`${API_URL}/projects/${PREVIEW_PROJECT_ID}?sheet_type=checklist`).then(r => r.json()),
          fetch(`${API_URL}/projects/${PREVIEW_PROJECT_ID}?sheet_type=ffe`).then(r => r.json()),
        ]);
        const flat = [];
        const walk = (proj, sourceType) => {
          (proj.rooms || []).forEach(room => {
            (room.categories || []).forEach(cat => {
              (cat.subcategories || []).forEach(sub => {
                (sub.items || []).forEach(it => {
                  flat.push({
                    id: it.id,
                    name: it.name,
                    roomName: room.name,
                    categoryName: cat.name,
                    vendor: it.vendor,
                    sku: it.sku,
                    sourceType,
                  });
                });
              });
            });
          });
        };
        walk(chk, 'CHECKLIST');
        walk(ffe, 'FFE');
        setItems(flat);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: 32, color: '#D4C5A9' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ borderBottom: '1px solid #B49B7E', paddingBottom: 12, marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, color: '#D4A574', letterSpacing: 1, fontWeight: 800 }}>NEW TASKS ITEM-PICKER — PREVIEW</h1>
          <p style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>
            This is exactly the picker you'll see when you click <strong>+ Add Item</strong> on the Tasks tab.
            Realistic seed data ({items.length} items across 4 rooms — Living Room, Bar Area, Kitchen, Master Bathroom).
          </p>
          <p style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>
            Try: click the doc-toggle pills, pick a room, type "faucet" or "pendant" in search.
          </p>
        </div>

        <div style={{ background: '#1a1f2e', padding: 20, borderRadius: 8, border: '1px solid #B49B7E' }}>
          <label style={{ color: '#D4A574', fontSize: 11, letterSpacing: 2, fontWeight: 700, display: 'block', marginBottom: 10 }}>
            🔗 LINK TO FFE / CHECKLIST ITEM
          </label>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', opacity: 0.7 }}>Loading items…</div>
          ) : picked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, background: 'rgba(212,165,116,0.1)', border: '1px solid rgba(212,165,116,0.5)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 3, color: '#fff', background: picked.sourceType === 'CHECKLIST' ? '#2563eb' : '#16a34a' }}>
                {picked.sourceType === 'CHECKLIST' ? 'CHECKLIST' : 'FF&E'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{picked.name}</div>
                <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                  {picked.roomName}
                  {picked.categoryName && ` · ${picked.categoryName}`}
                  {picked.vendor && ` · ${picked.vendor}`}
                  {picked.sku && ` · SKU: ${picked.sku}`}
                </div>
              </div>
              <button onClick={() => setPicked(null)} style={{ background: 'transparent', color: '#f87171', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <ItemPicker items={items} onSelect={setPicked} testIdPrefix="preview" />
          )}
        </div>

        <div style={{ marginTop: 24, padding: 14, background: '#0f1218', border: '1px solid #2a3040', borderRadius: 6, fontSize: 12 }}>
          <div style={{ color: '#D4A574', fontWeight: 700, marginBottom: 6 }}>Notes:</div>
          <ul style={{ paddingLeft: 18, lineHeight: 1.7 }}>
            <li>This is the EXACT same component used in the real Tasks &gt; + Add Item form.</li>
            <li>In production, the items list will be your actual Diehl Lakehouse / project Checklist + FF&amp;E items, not this seed.</li>
            <li>If anything looks off — colors, button order, spacing — just tell me and I'll fix it before you redeploy.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
