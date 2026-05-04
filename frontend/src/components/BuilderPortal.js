import React, { useState, useEffect } from 'react';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

export default function BuilderPortal() {
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ffe');
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentSection, setCommentSection] = useState('general');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});

  // Get access code from URL
  const accessCode = window.location.pathname.split('/builder/')[1];

  useEffect(() => {
    if (accessCode) loadPortal();
  }, [accessCode]);

  const loadPortal = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/builder/${accessCode}`);
      if (!res.ok) throw new Error('Portal not found');
      const data = await res.json();
      setPortalData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !commentAuthor.trim()) return;
    try {
      await fetch(`${API_URL}/api/builder/${accessCode}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: commentSection,
          author: commentAuthor,
          text: commentText,
          reference_id: null,
        }),
      });
      setCommentText('');
      setShowCommentForm(false);
      loadPortal();
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1218', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #D4A574', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#D4A574', fontSize: 16 }}>Loading Builder Portal...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1218', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#1a1f2e', borderRadius: 16, border: '2px solid #ef4444' }}>
          <p style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Access Denied</p>
          <p style={{ color: '#9CA3AF' }}>Invalid or expired portal link.</p>
        </div>
      </div>
    );
  }

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
      <header style={{
        background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1218 100%)',
        borderBottom: '3px solid #D4A574',
        padding: '24px 32px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        </div>
      </header>

      {/* TABS */}
      <nav style={{ background: '#1a1f2e', borderBottom: '1px solid #2a3040', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`builder-tab-${tab.id}`}
              style={{
                padding: '14px 20px',
                color: activeTab === tab.id ? '#D4A574' : '#6B7280',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #D4A574' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: 0.5,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>

        {/* FFE TAB */}
        {activeTab === 'ffe' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>FF&E Schedule</h2>
            {rooms.map(room => (
              <div key={room.id} style={{ marginBottom: 24 }}>
                <div
                  onClick={() => setExpandedRooms(prev => ({ ...prev, [room.id]: !prev[room.id] }))}
                  style={{
                    background: room.color || '#2a3040',
                    padding: '12px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{room.name.toUpperCase()}</span>
                  <span>{expandedRooms[room.id] ? '▼' : '▶'}</span>
                </div>
                {expandedRooms[room.id] && room.categories?.map(cat => (
                  <div key={cat.id} style={{ marginTop: 8, marginLeft: 12 }}>
                    <div style={{ background: '#065F46', padding: '8px 12px', borderRadius: 4, fontWeight: 600, fontSize: 13 }}>
                      {cat.name.toUpperCase()}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                      <thead>
                        <tr style={{ background: '#1a1f2e' }}>
                          <th style={thStyle}>Item</th>
                          <th style={thStyle}>Vendor</th>
                          <th style={thStyle}>Size</th>
                          <th style={thStyle}>Finish/Color</th>
                          <th style={thStyle}>SKU</th>
                          <th style={thStyle}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.subcategories?.map(sub => sub.items?.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #2a3040' }}>
                            <td style={tdStyle}>{item.name}</td>
                            <td style={tdStyle}>{item.vendor || ''}</td>
                            <td style={tdStyle}>{item.size || ''}</td>
                            <td style={tdStyle}>{item.finish_color || ''}</td>
                            <td style={tdStyle}>{item.sku || ''}</td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                background: item.status === 'INSTALLED' ? '#065F46' : item.status === 'ORDERED' ? '#92400E' : '#374151',
                                color: '#fff',
                              }}>{item.status || 'PENDING'}</span>
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Photos & Attachments</h2>
            {rooms.map(room => (
              <div key={room.id} style={{ marginBottom: 24 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{room.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {(photos[room.id] || []).map((photo, idx) => (
                    <div key={idx} style={{ width: 160, height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a3040' }}>
                      <img src={photo.url || photo.photo_data} alt={photo.file_name || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  {(!photos[room.id] || photos[room.id].length === 0) && (
                    <p style={{ color: '#6B7280', fontSize: 13 }}>No photos for this room</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCOPE OF WORK TAB */}
        {activeTab === 'scope' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Scope of Work</h2>
            {(portal.scope_of_work || []).length > 0 ? (
              portal.scope_of_work.map((scope, idx) => {
                const room = rooms.find(r => r.id === scope.room_id);
                return (
                  <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12, borderLeft: '4px solid #D4A574' }}>
                    <h3 style={{ color: '#D4A574', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{room?.name || scope.room_id}</h3>
                    <p style={{ color: '#E5E7EB', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{scope.description}</p>
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#6B7280' }}>No scope of work defined yet.</p>
            )}
          </div>
        )}

        {/* TO-DO TAB */}
        {activeTab === 'todos' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>To-Do List</h2>
            {todos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todos.map(todo => (
                  <div key={todo.id} style={{
                    background: '#1a1f2e', padding: '12px 16px', borderRadius: 8,
                    borderLeft: `4px solid ${todo.status === 'completed' ? '#10B981' : todo.status === 'in_progress' ? '#F59E0B' : '#6B7280'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{todo.title || todo.text}</p>
                      {todo.assigned_to && <p style={{ color: '#9CA3AF', fontSize: 12 }}>Assigned: {todo.assigned_to}</p>}
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      background: todo.status === 'completed' ? '#065F46' : todo.status === 'in_progress' ? '#92400E' : '#374151',
                      color: '#fff',
                    }}>{(todo.status || 'pending').toUpperCase()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280' }}>No to-do items yet.</p>
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Schedule & Timeline</h2>
            {(portal.schedule || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {portal.schedule.map((event, idx) => (
                  <div key={idx} style={{
                    background: '#1a1f2e', padding: 16, borderRadius: 8,
                    borderLeft: `4px solid ${event.status === 'completed' ? '#10B981' : event.status === 'in_progress' ? '#F59E0B' : '#D4A574'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{event.title}</h3>
                      <span style={{ color: '#D4A574', fontSize: 13, fontWeight: 600 }}>{event.date}</span>
                    </div>
                    {event.notes && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{event.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280' }}>No schedule items yet.</p>
            )}
          </div>
        )}

        {/* ROOM FINISHES TAB */}
        {activeTab === 'finishes' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Room Finishes</h2>
            {rooms.map(room => (
              <div key={room.id} style={{ marginBottom: 20, background: '#1a1f2e', padding: 16, borderRadius: 8 }}>
                <h3 style={{ color: room.color || '#D4A574', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{room.name}</h3>
                {room.categories?.map(cat => (
                  <div key={cat.id} style={{ marginBottom: 8 }}>
                    <p style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{cat.name}</p>
                    {cat.subcategories?.map(sub => sub.items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #2a3040', alignItems: 'center' }}>
                        {item.finish_image && <img src={item.finish_image} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />}
                        <div>
                          <p style={{ color: '#fff', fontSize: 13 }}>{item.name}</p>
                          <p style={{ color: '#6B7280', fontSize: 11 }}>{item.size} • {item.finish_color}</p>
                        </div>
                      </div>
                    )))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* CHANGE ORDERS TAB */}
        {activeTab === 'changes' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Change Orders</h2>
            {(portal.change_orders || []).length > 0 ? (
              portal.change_orders.map((co, idx) => (
                <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12, borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{co.title}</h3>
                    <span style={{ color: '#F59E0B', fontSize: 12 }}>{co.date}</span>
                  </div>
                  <p style={{ color: '#E5E7EB', fontSize: 13, marginTop: 8 }}>{co.description}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#6B7280' }}>No change orders.</p>
            )}
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <div>
            <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Project Contacts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {(portal.contacts || []).map((contact, idx) => (
                <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, border: '1px solid #2a3040' }}>
                  <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{contact.name}</p>
                  <p style={{ color: '#D4A574', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{contact.role}</p>
                  {contact.phone && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>{contact.phone}</p>}
                  {contact.email && <p style={{ color: '#9CA3AF', fontSize: 13 }}>{contact.email}</p>}
                </div>
              ))}
              {(portal.contacts || []).length === 0 && <p style={{ color: '#6B7280' }}>No contacts added.</p>}
            </div>
          </div>
        )}

        {/* COMMENTS TAB */}
        {activeTab === 'comments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: '#D4A574', fontSize: 20, fontWeight: 700 }}>Comments & Notes</h2>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                data-testid="builder-add-comment-btn"
                style={{
                  background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 20px',
                  borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                + Add Comment
              </button>
            </div>

            {showCommentForm && (
              <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
                <input
                  data-testid="builder-comment-author"
                  placeholder="Your name"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  style={{ width: '100%', background: '#0f1218', border: '1px solid #2a3040', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 8 }}
                />
                <select
                  value={commentSection}
                  onChange={e => setCommentSection(e.target.value)}
                  style={{ width: '100%', background: '#0f1218', border: '1px solid #2a3040', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 8 }}
                >
                  <option value="general">General</option>
                  <option value="ffe">FF&E</option>
                  <option value="scope">Scope of Work</option>
                  <option value="schedule">Schedule</option>
                  <option value="todo">To-Do</option>
                </select>
                <textarea
                  data-testid="builder-comment-text"
                  placeholder="Type your comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={4}
                  style={{ width: '100%', background: '#0f1218', border: '1px solid #2a3040', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, resize: 'vertical', marginBottom: 8 }}
                />
                <button
                  onClick={submitComment}
                  data-testid="builder-submit-comment"
                  style={{ background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                >
                  Submit Comment
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comments.length > 0 ? comments.map(c => (
                <div key={c.id} style={{ background: '#1a1f2e', padding: 12, borderRadius: 8, borderLeft: '3px solid #D4A574' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#D4A574', fontSize: 13, fontWeight: 700 }}>{c.author}</span>
                    <span style={{ color: '#6B7280', fontSize: 11 }}>{c.section} • {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ color: '#E5E7EB', fontSize: 14 }}>{c.text}</p>
                </div>
              )) : (
                <p style={{ color: '#6B7280' }}>No comments yet. Click "+ Add Comment" to leave a note.</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #2a3040', padding: '16px 32px', textAlign: 'center', marginTop: 40 }}>
        <p style={{ color: '#4B5563', fontSize: 12 }}>ESTABLISHED DESIGN CO. — Builder Portal</p>
      </footer>
    </div>
  );
}

const thStyle = { padding: '8px 12px', textAlign: 'left', color: '#9CA3AF', fontSize: 11, fontWeight: 700, letterSpacing: 1, borderBottom: '1px solid #2a3040' };
const tdStyle = { padding: '10px 12px', color: '#E5E7EB', fontSize: 13, verticalAlign: 'middle' };
