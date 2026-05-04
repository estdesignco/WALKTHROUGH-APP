import React, { useState, useEffect } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function BuilderPortal() {
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ffe');
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(localStorage.getItem('builder_name') || '');
  const [commentSection, setCommentSection] = useState('general');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [newChangeOrder, setNewChangeOrder] = useState(null);
  const [newContact, setNewContact] = useState(null);

  const accessCode = window.location.pathname.split('/builder/')[1];

  useEffect(() => { if (accessCode) loadPortal(); }, [accessCode]);

  const loadPortal = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/builder/${accessCode}`);
      if (!res.ok) throw new Error('Portal not found');
      setPortalData(await res.json());
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !commentAuthor.trim()) return;
    localStorage.setItem('builder_name', commentAuthor);
    await fetch(`${API_URL}/api/builder/${accessCode}/comment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: commentSection, author: commentAuthor, text: commentText }),
    });
    setCommentText(''); setShowCommentForm(false); loadPortal();
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1218', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 48, height: 48, border: '3px solid #D4A574', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f1218', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40, background: '#1a1f2e', borderRadius: 16, border: '2px solid #ef4444' }}>
        <p style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold' }}>Access Denied</p>
        <p style={{ color: '#9CA3AF' }}>Invalid or expired portal link.</p>
      </div>
    </div>
  );

  const { portal, project, rooms, photos, todos } = portalData;
  const comments = portal.comments || [];

  const tabs = [
    { id: 'ffe', label: 'FF&E Schedule' },
    { id: 'photos', label: 'Photos & Attachments' },
    { id: 'scope', label: 'Scope of Work' },
    { id: 'todos', label: 'To-Do List' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'finishes', label: 'Room Finishes' },
    { id: 'changes', label: 'Change Orders' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'comments', label: 'Comments' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f1218', color: '#F5F5DC' }}>
      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1218 100%)', borderBottom: '3px solid #D4A574', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#D4A574', fontSize: 11, letterSpacing: 4, fontWeight: 700, marginBottom: 4 }}>BUILDER PORTAL</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>{project.name}</h1>
            <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>{project.client_info?.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#D4A574', fontSize: 12, fontWeight: 700 }}>ESTABLISHED DESIGN CO.</p>
            <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>{project.client_info?.full_name}</p>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ background: '#1a1f2e', borderBottom: '1px solid #2a3040', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`builder-tab-${tab.id}`}
              style={{ padding: '14px 20px', color: activeTab === tab.id ? '#D4A574' : '#6B7280', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '3px solid #D4A574' : '3px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>

        {/* ===== FFE TAB - EXACT MATCH TO APP ===== */}
        {activeTab === 'ffe' && (
          <div style={{ overflowX: 'auto' }}>
            {rooms.map((room) => {
              const isRoomExpanded = expandedRooms[room.id] !== false;
              return (
                <div key={room.id} style={{ marginBottom: 24 }}>
                  {/* ROOM HEADER - Gradient colored bar matching app */}
                  <div onClick={() => setExpandedRooms(p => ({ ...p, [room.id]: !isRoomExpanded }))}
                    style={{
                      background: `linear-gradient(135deg, ${room.color || '#4A2040'} 0%, ${room.color || '#4A2040'}CC 50%, ${room.color || '#4A2040'} 100%)`,
                      padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderLeft: `5px solid ${room.color || '#D4A574'}`,
                      boxShadow: `0 0 20px ${room.color || '#4A2040'}40, inset 0 0 40px rgba(255,255,255,0.08), inset 0 0 80px rgba(0,0,0,0.3)`,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#fff', fontSize: 14 }}>{isRoomExpanded ? '▼' : '▶'}</span>
                      <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 1, textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
                        {room.name.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* CATEGORIES + ITEMS TABLE */}
                  {isRoomExpanded && room.categories?.map(cat => {
                    const isCatExpanded = expandedCategories[cat.id] !== false;
                    return (
                      <div key={cat.id}>
                        {/* CATEGORY HEADER - teal/emerald gradient */}
                        <div onClick={() => setExpandedCategories(p => ({ ...p, [cat.id]: !isCatExpanded }))}
                          style={{
                            background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #065F46 100%)',
                            padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            borderBottom: '1px solid #10B981',
                          }}>
                          <span style={{ color: '#fff', fontSize: 12 }}>{isCatExpanded ? '▼' : '▶'}</span>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{cat.name.toUpperCase()}</span>
                        </div>

                        {/* COLUMN HEADERS - tan/gold gradient - MATCHING APP EXACTLY */}
                        {isCatExpanded && (
                          <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                              <colgroup>
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '12%' }} />
                                <col style={{ width: '6%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '12%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '15%' }} />
                              </colgroup>
                              <thead>
                                <tr>
                                  <th colSpan="4" style={thGroupStyle}></th>
                                  <th colSpan="2" style={thGroupStyle}>ADDITIONAL INFO.</th>
                                  <th colSpan="2" style={thGroupStyle}>STOCK INFO.</th>
                                </tr>
                                <tr style={{ background: 'linear-gradient(180deg, #8B4513 0%, #654321 100%)' }}>
                                  <th style={thStyle}>INSTALLED</th>
                                  <th style={thStyle}>VENDOR/SKU</th>
                                  <th style={thStyle}>QTY</th>
                                  <th style={thStyle}>SIZE</th>
                                  <th style={thStyle}>FINISH/COLOR</th>
                                  <th style={thStyle}>IMAGE</th>
                                  <th style={thStyle}>STOCK STATUS/QTY</th>
                                  <th style={thStyle}>NOTES</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.subcategories?.map(sub => sub.items?.map(item => (
                                  <tr key={item.id} style={{ background: '#1a1f2e', borderBottom: '1px solid #2a3040' }}>
                                    <td style={tdStyle}>
                                      <span style={{ color: '#F5F5DC', fontSize: 13 }}>{item.name}</span>
                                    </td>
                                    <td style={tdStyle}>{item.vendor || item.sku || ''}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty || item.quantity || ''}</td>
                                    <td style={tdStyle}>{item.size || ''}</td>
                                    <td style={tdStyle}>{item.finish_color || ''}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                                      {(item.image || item.finish_image || item.product_image) ? (
                                        <img src={item.image || item.finish_image || item.product_image} alt=""
                                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #374151' }} />
                                      ) : <span style={{ color: '#4B5563' }}>—</span>}
                                    </td>
                                    <td style={tdStyle}>
                                      <span style={{
                                        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                        background: item.status === 'INSTALLED' ? '#065F46' : item.status === 'ORDERED' ? '#92400E' : item.status === 'APPROVED' ? '#1E40AF' : '#374151',
                                        color: '#fff',
                                      }}>{item.status || '—'}</span>
                                    </td>
                                    <td style={tdStyle}>{item.notes || ''}</td>
                                  </tr>
                                )))}
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== PHOTOS TAB ===== */}
        {activeTab === 'photos' && (
          <div>
            <h2 style={sectionTitle}>Photos & Attachments</h2>
            {rooms.map(room => (
              <div key={room.id} style={{ marginBottom: 24 }}>
                <h3 style={{ color: room.color || '#fff', fontSize: 16, fontWeight: 700, marginBottom: 8, borderLeft: `4px solid ${room.color || '#D4A574'}`, paddingLeft: 12 }}>{room.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {(photos[room.id] || []).map((photo, idx) => (
                    <div key={idx} style={{ width: 160, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a3040' }}>
                      <img src={photo.url || photo.photo_data} alt={photo.file_name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  {(!photos[room.id] || photos[room.id].length === 0) && <p style={{ color: '#6B7280', fontSize: 13 }}>No photos for this room</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== SCOPE OF WORK ===== */}
        {activeTab === 'scope' && (
          <div>
            <h2 style={sectionTitle}>Scope of Work</h2>
            {(portal.scope_of_work || []).length > 0 ? portal.scope_of_work.map((scope, idx) => {
              const room = rooms.find(r => r.id === scope.room_id);
              return (
                <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12, borderLeft: `4px solid ${room?.color || '#D4A574'}` }}>
                  <h3 style={{ color: room?.color || '#D4A574', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{room?.name || 'General'}</h3>
                  <p style={{ color: '#E5E7EB', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{scope.description}</p>
                </div>
              );
            }) : <p style={{ color: '#6B7280' }}>No scope of work defined yet.</p>}
          </div>
        )}

        {/* ===== TO-DO LIST ===== */}
        {activeTab === 'todos' && (
          <div>
            <h2 style={sectionTitle}>To-Do List</h2>
            {todos.length > 0 ? todos.map(todo => (
              <div key={todo.id} style={{ background: '#1a1f2e', padding: '12px 16px', borderRadius: 8, marginBottom: 8,
                borderLeft: `4px solid ${todo.status === 'completed' ? '#10B981' : todo.status === 'in_progress' ? '#F59E0B' : '#6B7280'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{todo.title || todo.text}</p>
                  {todo.assigned_to && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Assigned: {todo.assigned_to}</p>}
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: todo.status === 'completed' ? '#065F46' : todo.status === 'in_progress' ? '#92400E' : '#374151', color: '#fff' }}>
                  {(todo.status || 'pending').toUpperCase()}
                </span>
              </div>
            )) : <p style={{ color: '#6B7280' }}>No to-do items yet.</p>}
          </div>
        )}

        {/* ===== SCHEDULE ===== */}
        {activeTab === 'schedule' && (
          <div>
            <h2 style={sectionTitle}>Schedule & Timeline</h2>
            {(portal.schedule || []).length > 0 ? portal.schedule.map((event, idx) => (
              <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12,
                borderLeft: `4px solid ${event.status === 'completed' ? '#10B981' : event.status === 'in_progress' ? '#F59E0B' : '#D4A574'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{event.title}</h3>
                  <span style={{ color: '#D4A574', fontSize: 13, fontWeight: 600 }}>{event.date}</span>
                </div>
                {event.notes && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{event.notes}</p>}
              </div>
            )) : <p style={{ color: '#6B7280' }}>No schedule items yet.</p>}
          </div>
        )}

        {/* ===== ROOM FINISHES - pulled from actual room data ===== */}
        {activeTab === 'finishes' && (
          <div>
            <h2 style={sectionTitle}>Room Finishes</h2>
            {rooms.map(room => (
              <div key={room.id} style={{ marginBottom: 24 }}>
                <div style={{ background: room.color || '#2a3040', padding: '10px 16px', borderRadius: 6, marginBottom: 8, borderLeft: `5px solid ${room.color || '#D4A574'}`,
                  boxShadow: `0 0 15px ${room.color || '#4A2040'}30` }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>{room.name.toUpperCase()}</span>
                </div>
                {room.categories?.map(cat => (
                  <div key={cat.id} style={{ marginLeft: 8, marginBottom: 12 }}>
                    <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{cat.name.toUpperCase()}</p>
                    {cat.subcategories?.map(sub => sub.items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1f2e', alignItems: 'center' }}>
                        {(item.image || item.finish_image || item.product_image) && (
                          <img src={item.image || item.finish_image || item.product_image} alt="" style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', border: '1px solid #374151' }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                          <p style={{ color: '#6B7280', fontSize: 11 }}>{[item.vendor, item.size, item.finish_color].filter(Boolean).join(' • ')}</p>
                        </div>
                        {item.status && (
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                            background: item.status === 'INSTALLED' ? '#065F46' : item.status === 'ORDERED' ? '#92400E' : '#1E40AF', color: '#fff' }}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    )))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ===== CHANGE ORDERS - BUILDER CAN ADD/EDIT ===== */}
        {activeTab === 'changes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={sectionTitle}>Change Orders</h2>
              <button onClick={() => setNewChangeOrder({ title: '', date: new Date().toISOString().split('T')[0], description: '', author: commentAuthor })}
                style={{ background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                + New Change Order
              </button>
            </div>

            {newChangeOrder && (
              <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #F59E0B' }}>
                <input placeholder="Your name" value={newChangeOrder.author} onChange={e => setNewChangeOrder({ ...newChangeOrder, author: e.target.value })}
                  style={inputStyle} />
                <input placeholder="Change order title" value={newChangeOrder.title} onChange={e => setNewChangeOrder({ ...newChangeOrder, title: e.target.value })}
                  style={inputStyle} />
                <input type="date" value={newChangeOrder.date} onChange={e => setNewChangeOrder({ ...newChangeOrder, date: e.target.value })}
                  style={inputStyle} />
                <textarea placeholder="Description..." value={newChangeOrder.description} onChange={e => setNewChangeOrder({ ...newChangeOrder, description: e.target.value })}
                  rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    localStorage.setItem('builder_name', newChangeOrder.author);
                    await fetch(`${API_URL}/api/builder/${accessCode}/comment`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ section: 'change_order', author: newChangeOrder.author, text: JSON.stringify(newChangeOrder) }),
                    });
                    setNewChangeOrder(null); loadPortal();
                  }} style={{ background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                    Submit Change Order
                  </button>
                  <button onClick={() => setNewChangeOrder(null)} style={{ background: '#374151', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {(portal.change_orders || []).map((co, idx) => (
              <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12, borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{co.title}</h3>
                  <span style={{ color: '#F59E0B', fontSize: 12 }}>{co.date}</span>
                </div>
                <p style={{ color: '#E5E7EB', fontSize: 13, marginTop: 8, whiteSpace: 'pre-wrap' }}>{co.description}</p>
                {co.author && <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>By: {co.author}</p>}
              </div>
            ))}

            {/* Also show change order comments */}
            {comments.filter(c => c.section === 'change_order').map(c => {
              try { const co = JSON.parse(c.text); return (
                <div key={c.id} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12, borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{co.title}</h3>
                    <span style={{ color: '#F59E0B', fontSize: 12 }}>{co.date}</span>
                  </div>
                  <p style={{ color: '#E5E7EB', fontSize: 13, marginTop: 8, whiteSpace: 'pre-wrap' }}>{co.description}</p>
                  <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>By: {co.author} • {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              ); } catch { return (
                <div key={c.id} style={{ background: '#1a1f2e', padding: 12, borderRadius: 8, marginBottom: 8, borderLeft: '4px solid #F59E0B' }}>
                  <p style={{ color: '#E5E7EB', fontSize: 13 }}>{c.text}</p>
                  <p style={{ color: '#6B7280', fontSize: 11 }}>By: {c.author}</p>
                </div>
              ); }
            })}
          </div>
        )}

        {/* ===== CONTACTS - BUILDER CAN ADD ===== */}
        {activeTab === 'contacts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={sectionTitle}>Project Contacts</h2>
              <button onClick={() => setNewContact({ name: '', role: '', phone: '', email: '', added_by: commentAuthor })}
                style={{ background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                + Add Contact
              </button>
            </div>

            {newContact && (
              <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
                <input placeholder="Contact name" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} style={inputStyle} />
                <input placeholder="Role (e.g. Plumber, Electrician)" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} style={inputStyle} />
                <input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} style={inputStyle} />
                <input placeholder="Email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} style={inputStyle} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    await fetch(`${API_URL}/api/builder/${accessCode}/comment`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ section: 'contact', author: newContact.added_by || 'Builder', text: JSON.stringify(newContact) }),
                    });
                    setNewContact(null); loadPortal();
                  }} style={{ background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                    Add Contact
                  </button>
                  <button onClick={() => setNewContact(null)} style={{ background: '#374151', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {(portal.contacts || []).map((contact, idx) => (
                <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, border: '1px solid #2a3040' }}>
                  <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{contact.name}</p>
                  <p style={{ color: '#D4A574', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{contact.role}</p>
                  {contact.phone && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>{contact.phone}</p>}
                  {contact.email && <p style={{ color: '#9CA3AF', fontSize: 13 }}>{contact.email}</p>}
                </div>
              ))}
              {/* Show builder-added contacts from comments */}
              {comments.filter(c => c.section === 'contact').map(c => {
                try { const ct = JSON.parse(c.text); return (
                  <div key={c.id} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, border: '1px solid #2a3040' }}>
                    <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{ct.name}</p>
                    <p style={{ color: '#D4A574', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{ct.role}</p>
                    {ct.phone && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>{ct.phone}</p>}
                    {ct.email && <p style={{ color: '#9CA3AF', fontSize: 13 }}>{ct.email}</p>}
                    <p style={{ color: '#4B5563', fontSize: 10, marginTop: 4 }}>Added by builder</p>
                  </div>
                ); } catch { return null; }
              })}
            </div>
          </div>
        )}

        {/* ===== COMMENTS TAB ===== */}
        {activeTab === 'comments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={sectionTitle}>Comments & Notes</h2>
              <button onClick={() => setShowCommentForm(!showCommentForm)}
                style={{ background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                + Add Comment
              </button>
            </div>

            {showCommentForm && (
              <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
                <input placeholder="Your name" value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} style={inputStyle} />
                <select value={commentSection} onChange={e => setCommentSection(e.target.value)} style={inputStyle}>
                  <option value="general">General</option>
                  <option value="ffe">FF&E</option>
                  <option value="scope">Scope of Work</option>
                  <option value="schedule">Schedule</option>
                  <option value="todo">To-Do</option>
                </select>
                <textarea placeholder="Type your comment..." value={commentText} onChange={e => setCommentText(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                <button onClick={submitComment} style={{ background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Submit</button>
              </div>
            )}

            {comments.filter(c => c.section !== 'change_order' && c.section !== 'contact').map(c => (
              <div key={c.id} style={{ background: '#1a1f2e', padding: 12, borderRadius: 8, marginBottom: 8, borderLeft: '3px solid #D4A574' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#D4A574', fontSize: 13, fontWeight: 700 }}>{c.author}</span>
                  <span style={{ color: '#6B7280', fontSize: 11 }}>{c.section} • {new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ color: '#E5E7EB', fontSize: 14 }}>{c.text}</p>
              </div>
            ))}
            {comments.filter(c => c.section !== 'change_order' && c.section !== 'contact').length === 0 && (
              <p style={{ color: '#6B7280' }}>No comments yet.</p>
            )}
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #2a3040', padding: '16px 32px', textAlign: 'center', marginTop: 40 }}>
        <p style={{ color: '#4B5563', fontSize: 12 }}>ESTABLISHED DESIGN CO. — Builder Portal</p>
      </footer>
    </div>
  );
}

const sectionTitle = { color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 };
const thGroupStyle = { padding: '4px 8px', textAlign: 'center', color: '#D4A574', fontSize: 10, fontWeight: 700, letterSpacing: 1, background: '#2a2218', borderBottom: '1px solid #3d3020' };
const thStyle = { padding: '8px 10px', textAlign: 'left', color: '#F5F5DC', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: 'linear-gradient(180deg, #8B6914 0%, #654321 100%)', borderBottom: '2px solid #D4A574' };
const tdStyle = { padding: '10px 10px', color: '#E5E7EB', fontSize: 13, verticalAlign: 'middle', borderBottom: '1px solid #2a3040' };
const inputStyle = { width: '100%', background: '#0f1218', border: '1px solid #2a3040', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 8, display: 'block', boxSizing: 'border-box' };
