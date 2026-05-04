import React, { useState, useEffect, useCallback } from 'react';
import ExactFFESpreadsheet from './FFEView';

const API_URL = (window.ENV?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || window.location.origin);

// SPANISH TRANSLATIONS
const translations = {
  en: {
    builderPortal: 'BUILDER PORTAL', welcome: 'Welcome', dashboard: 'Dashboard',
    scopeOfWork: 'Scope of Work', ffeSchedule: 'FF&E Schedule', photos: 'Photos & Files',
    todoList: 'To-Do List', schedule: 'Schedule', roomFinishes: 'Room Finishes',
    changeOrders: 'Change Orders', contacts: 'Contacts', comments: 'Comments',
    instructions: 'How to Use This Portal',
    inst1: 'Review the Scope of Work and check off completed items',
    inst2: 'View the FF&E Schedule for all materials and finishes (read-only)',
    inst3: 'Upload photos and files to document progress',
    inst4: 'Add items to the To-Do list and assign team members',
    inst5: 'Submit Change Orders when modifications are needed',
    inst6: 'Leave comments for the design team on any section',
    quickStats: 'Project Overview', scopeItems: 'Scope Items', completedTasks: 'Completed',
    openTodos: 'Open Tasks', totalRooms: 'Rooms', addTask: '+ Add Task', addComment: '+ Add Comment',
    addContact: '+ Add Contact', newChangeOrder: '+ New Change Order', submit: 'Submit',
    cancel: 'Cancel', uploadFiles: 'Upload Files', yourName: 'Your name', username: 'Username',
    switchLang: 'Español', contactName: 'Contact name', role: 'Role', phone: 'Phone', email: 'Email',
  },
  es: {
    builderPortal: 'PORTAL DEL CONSTRUCTOR', welcome: 'Bienvenido', dashboard: 'Tablero',
    scopeOfWork: 'Alcance del Trabajo', ffeSchedule: 'Programa FF&E', photos: 'Fotos y Archivos',
    todoList: 'Lista de Tareas', schedule: 'Calendario', roomFinishes: 'Acabados',
    changeOrders: 'Órdenes de Cambio', contacts: 'Contactos', comments: 'Comentarios',
    instructions: 'Cómo Usar Este Portal',
    inst1: 'Revise el Alcance del Trabajo y marque los elementos completados',
    inst2: 'Vea el Programa FF&E para todos los materiales y acabados (solo lectura)',
    inst3: 'Suba fotos y archivos para documentar el progreso',
    inst4: 'Agregue elementos a la Lista de Tareas y asigne miembros del equipo',
    inst5: 'Envíe Órdenes de Cambio cuando se necesiten modificaciones',
    inst6: 'Deje comentarios para el equipo de diseño en cualquier sección',
    quickStats: 'Resumen del Proyecto', scopeItems: 'Elementos', completedTasks: 'Completados',
    openTodos: 'Tareas Abiertas', totalRooms: 'Habitaciones', addTask: '+ Agregar Tarea', addComment: '+ Agregar Comentario',
    addContact: '+ Agregar Contacto', newChangeOrder: '+ Nueva Orden de Cambio', submit: 'Enviar',
    cancel: 'Cancelar', uploadFiles: 'Subir Archivos', yourName: 'Su nombre', username: 'Nombre de usuario',
    switchLang: 'English', contactName: 'Nombre del contacto', role: 'Rol', phone: 'Teléfono', email: 'Correo',
  }
};

export default function BuilderPortal() {
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState(localStorage.getItem('builder_lang') || 'en');
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(localStorage.getItem('builder_name') || '');
  const [commentSection, setCommentSection] = useState('general');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newChangeOrder, setNewChangeOrder] = useState(null);
  const [newContact, setNewContact] = useState(null);
  const [todos, setTodos] = useState([]);

  const t = translations[lang];
  const accessCode = window.location.pathname.split('/builder/')[1];

  const toggleLang = () => {
    const next = lang === 'en' ? 'es' : 'en';
    setLang(next);
    localStorage.setItem('builder_lang', next);
  };

  const loadPortal = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/builder/${accessCode}`);
      if (!res.ok) throw new Error('Portal not found');
      const data = await res.json();
      setPortalData(data);
      // Load todos separately for real-time sync
      const todosRes = await fetch(`${API_URL}/api/todos/${data.portal.project_id}`);
      if (todosRes.ok) {
        const todosData = await todosRes.json();
        setTodos(Array.isArray(todosData) ? todosData : todosData.todos || []);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [accessCode]);

  useEffect(() => { if (accessCode) loadPortal(); }, [accessCode, loadPortal]);

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

  const { portal, project, rooms, photos } = portalData;
  const comments = portal.comments || [];
  const scopeItems = portal.scope_of_work || [];
  const completedScope = scopeItems.filter(s => s.completed).length;
  const completedTodos = todos.filter(td => td.status === 'completed' || td.completed).length;
  const openTodos = todos.filter(td => td.status !== 'completed' && !td.completed).length;

  const builderProject = { ...project, id: portal.project_id, rooms };

  const tabs = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'scope', label: t.scopeOfWork },
    { id: 'ffe', label: t.ffeSchedule },
    { id: 'photos', label: t.photos },
    { id: 'todos', label: t.todoList },
    { id: 'schedule', label: t.schedule },
    { id: 'changes', label: t.changeOrders },
    { id: 'contacts', label: t.contacts },
    { id: 'comments', label: t.comments },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f1218', color: '#F5F5DC' }}>
      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1218 100%)', borderBottom: '3px solid #D4A574', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#D4A574', fontSize: 11, letterSpacing: 4, fontWeight: 700, marginBottom: 4 }}>{t.builderPortal}</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>{project.name}</h1>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{project.client_info?.address}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={toggleLang} style={{ background: '#2a3040', border: '1px solid #D4A574', padding: '6px 14px', borderRadius: 6, color: '#D4A574', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {t.switchLang}
            </button>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#D4A574', fontSize: 12, fontWeight: 700 }}>ESTABLISHED DESIGN CO.</p>
              <p style={{ color: '#6B7280', fontSize: 11 }}>{project.client_info?.full_name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ background: '#1a1f2e', borderBottom: '1px solid #2a3040', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '12px 16px', color: activeTab === tab.id ? '#D4A574' : '#6B7280', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 12, background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '3px solid #D4A574' : '3px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>

        {/* ===== DASHBOARD - IMPRESSIVE FIRST PAGE ===== */}
        {activeTab === 'dashboard' && (
          <div>
            {/* WELCOME BANNER */}
            <div style={{ background: 'linear-gradient(135deg, #2a2218 0%, #3d3020 50%, #2a2218 100%)', borderRadius: 16, padding: '32px 40px', marginBottom: 24, border: '2px solid #D4A574', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #D4A574 10px, #D4A574 11px)' }} />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#D4A574', marginBottom: 8 }}>{t.welcome}</h2>
                <p style={{ color: '#E5E7EB', fontSize: 16, lineHeight: 1.6 }}>
                  {lang === 'en' 
                    ? `This is your project portal for ${project.name}. Here you'll find everything you need — materials, schedules, scope of work, and more.`
                    : `Este es su portal de proyecto para ${project.name}. Aquí encontrará todo lo que necesita — materiales, horarios, alcance del trabajo y más.`
                  }
                </p>
              </div>
            </div>

            {/* QUICK STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: t.totalRooms, value: rooms.length, color: '#D4A574' },
                { label: t.scopeItems, value: `${completedScope}/${scopeItems.length}`, color: '#10B981' },
                { label: t.openTodos, value: openTodos, color: '#F59E0B' },
                { label: t.completedTasks, value: completedTodos, color: '#3B82F6' },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#1a1f2e', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: `1px solid ${stat.color}30` }}>
                  <p style={{ color: stat.color, fontSize: 32, fontWeight: 900, margin: 0 }}>{stat.value}</p>
                  <p style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, marginTop: 4, letterSpacing: 1 }}>{stat.label.toUpperCase()}</p>
                </div>
              ))}
            </div>

            {/* INSTRUCTIONS */}
            <div style={{ background: '#1a1f2e', borderRadius: 12, padding: 24, border: '1px solid #2a3040', marginBottom: 24 }}>
              <h3 style={{ color: '#D4A574', fontSize: 16, fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>{t.instructions}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[t.inst1, t.inst2, t.inst3, t.inst4, t.inst5, t.inst6].map((inst, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: '#D4A574', color: '#000', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ color: '#E5E7EB', fontSize: 13, lineHeight: 1.5 }}>{inst}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK LINKS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { tab: 'scope', label: t.scopeOfWork, desc: lang === 'en' ? 'Review & check off items' : 'Revisar y marcar elementos', color: '#10B981' },
                { tab: 'ffe', label: t.ffeSchedule, desc: lang === 'en' ? 'All materials & finishes' : 'Todos los materiales', color: '#3B82F6' },
                { tab: 'todos', label: t.todoList, desc: lang === 'en' ? 'Your assigned tasks' : 'Sus tareas asignadas', color: '#F59E0B' },
              ].map((link, i) => (
                <div key={i} onClick={() => setActiveTab(link.tab)} style={{ background: '#1a1f2e', borderRadius: 12, padding: 20, border: `1px solid ${link.color}30`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <h4 style={{ color: link.color, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{link.label}</h4>
                  <p style={{ color: '#6B7280', fontSize: 12 }}>{link.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SCOPE OF WORK - WITH CHECKBOXES ===== */}
        {activeTab === 'scope' && (
          <ScopeSection portal={portal} rooms={rooms} accessCode={accessCode} lang={lang} t={t} onReload={loadPortal} />
        )}

        {/* ===== FFE (READ ONLY) ===== */}
        {activeTab === 'ffe' && (
          <ExactFFESpreadsheet project={builderProject} roomColors={{}} categoryColors={{}} onReload={loadPortal} builderMode={true} />
        )}

        {/* ===== PHOTOS & FILES - BUILDER CAN UPLOAD ===== */}
        {activeTab === 'photos' && (
          <PhotosSection rooms={rooms} photos={photos} projectId={portal.project_id} accessCode={accessCode} t={t} lang={lang} onReload={loadPortal} />
        )}

        {/* ===== TO-DO LIST (SYNCED) ===== */}
        {activeTab === 'todos' && (
          <TodoSection projectId={portal.project_id} todos={todos} contacts={portal.contacts || []} t={t} onReload={loadPortal} />
        )}

        {/* ===== SCHEDULE (SYNCED - BUILDER CAN ADD) ===== */}
        {activeTab === 'schedule' && (
          <ScheduleSection portal={portal} accessCode={accessCode} t={t} lang={lang} onReload={loadPortal} />
        )}

        {/* ===== ROOM FINISHES ===== */}
        {activeTab === 'finishes' && (
          <ExactFFESpreadsheet project={builderProject} roomColors={{}} categoryColors={{}} onReload={loadPortal} builderMode={true} />
        )}

        {/* ===== CHANGE ORDERS ===== */}
        {activeTab === 'changes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={sectionTitle}>{t.changeOrders}</h2>
              <button onClick={() => setNewChangeOrder({ title: '', date: new Date().toISOString().split('T')[0], description: '', author: commentAuthor })}
                style={btnPrimary}>{t.newChangeOrder}</button>
            </div>
            {newChangeOrder && (
              <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #F59E0B' }}>
                <input placeholder={t.yourName} value={newChangeOrder.author} onChange={e => setNewChangeOrder({ ...newChangeOrder, author: e.target.value })} style={inputStyle} />
                <input placeholder="Title" value={newChangeOrder.title} onChange={e => setNewChangeOrder({ ...newChangeOrder, title: e.target.value })} style={inputStyle} />
                <input type="date" value={newChangeOrder.date} onChange={e => setNewChangeOrder({ ...newChangeOrder, date: e.target.value })} style={inputStyle} />
                <textarea placeholder="Description..." value={newChangeOrder.description} onChange={e => setNewChangeOrder({ ...newChangeOrder, description: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    localStorage.setItem('builder_name', newChangeOrder.author);
                    await fetch(`${API_URL}/api/builder/${accessCode}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'change_order', author: newChangeOrder.author, text: JSON.stringify(newChangeOrder) }) });
                    setNewChangeOrder(null); loadPortal();
                  }} style={btnPrimary}>{t.submit}</button>
                  <button onClick={() => setNewChangeOrder(null)} style={btnSecondary}>{t.cancel}</button>
                </div>
              </div>
            )}
            {(portal.change_orders || []).concat(comments.filter(c => c.section === 'change_order').map(c => { try { return { ...JSON.parse(c.text), _fromComment: true, _date: c.created_at }; } catch { return null; } }).filter(Boolean)).map((co, idx) => (
              <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12, borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{co.title}</h3><span style={{ color: '#F59E0B', fontSize: 12 }}>{co.date}</span></div>
                <p style={{ color: '#E5E7EB', fontSize: 13, marginTop: 8 }}>{co.description}</p>
                {co.author && <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>By: {co.author}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ===== CONTACTS - WITH USERNAME FIELD ===== */}
        {activeTab === 'contacts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={sectionTitle}>{t.contacts}</h2>
              <button onClick={() => setNewContact({ name: '', username: '', role: '', phone: '', email: '' })} style={btnPrimary}>{t.addContact}</button>
            </div>
            {newContact && (
              <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
                <input placeholder={t.contactName} value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} style={inputStyle} />
                <input placeholder={t.username + ' (for tagging in to-do)'} value={newContact.username} onChange={e => setNewContact({ ...newContact, username: e.target.value })} style={inputStyle} />
                <input placeholder={t.role} value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} style={inputStyle} />
                <input placeholder={t.phone} value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} style={inputStyle} />
                <input placeholder={t.email} value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} style={inputStyle} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    await fetch(`${API_URL}/api/builder/${accessCode}/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'contact', author: newContact.username || newContact.name, text: JSON.stringify(newContact) }) });
                    setNewContact(null); loadPortal();
                  }} style={btnPrimary}>{t.submit}</button>
                  <button onClick={() => setNewContact(null)} style={btnSecondary}>{t.cancel}</button>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {(portal.contacts || []).concat(comments.filter(c => c.section === 'contact').map(c => { try { return JSON.parse(c.text); } catch { return null; } }).filter(Boolean)).map((c, idx) => (
                <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, border: '1px solid #2a3040' }}>
                  <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{c.name}</p>
                  {c.username && <p style={{ color: '#D4A574', fontSize: 11 }}>@{c.username}</p>}
                  <p style={{ color: '#D4A574', fontSize: 12, fontWeight: 600, marginTop: 2 }}>{c.role}</p>
                  {c.phone && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>{c.phone}</p>}
                  {c.email && <p style={{ color: '#9CA3AF', fontSize: 13 }}>{c.email}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== COMMENTS ===== */}
        {activeTab === 'comments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={sectionTitle}>{t.comments}</h2>
              <button onClick={() => setShowCommentForm(!showCommentForm)} style={btnPrimary}>{t.addComment}</button>
            </div>
            {showCommentForm && (
              <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
                <input placeholder={t.yourName} value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} style={inputStyle} />
                <select value={commentSection} onChange={e => setCommentSection(e.target.value)} style={inputStyle}>
                  <option value="general">General</option><option value="ffe">FF&E</option><option value="scope">Scope</option><option value="schedule">Schedule</option>
                </select>
                <textarea placeholder="..." value={commentText} onChange={e => setCommentText(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                <button onClick={submitComment} style={btnPrimary}>{t.submit}</button>
              </div>
            )}
            {comments.filter(c => !['change_order', 'contact'].includes(c.section)).map(c => (
              <div key={c.id} style={{ background: '#1a1f2e', padding: 12, borderRadius: 8, marginBottom: 8, borderLeft: '3px solid #D4A574' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#D4A574', fontSize: 13, fontWeight: 700 }}>{c.author}</span>
                  <span style={{ color: '#6B7280', fontSize: 11 }}>{c.section} • {new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ color: '#E5E7EB', fontSize: 14 }}>{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #2a3040', padding: '16px 32px', textAlign: 'center', marginTop: 40 }}>
        <p style={{ color: '#4B5563', fontSize: 12 }}>ESTABLISHED DESIGN CO. — Builder Portal</p>
      </footer>
    </div>
  );
}

// ===== SCOPE SECTION WITH CHECKBOXES =====
function ScopeSection({ portal, rooms, accessCode, lang, t, onReload }) {
  const toggleScope = async (idx) => {
    const updated = [...(portal.scope_of_work || [])];
    updated[idx] = { ...updated[idx], completed: !updated[idx].completed };
    await fetch(`${API_URL}/api/builder-portal/${portal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope_of_work: updated }),
    });
    onReload();
  };

  return (
    <div>
      <h2 style={sectionTitle}>{t.scopeOfWork}</h2>
      {(portal.scope_of_work || []).length > 0 ? portal.scope_of_work.map((scope, idx) => {
        const room = rooms.find(r => r.id === scope.room_id);
        return (
          <div key={idx} onClick={() => toggleScope(idx)} style={{ background: '#1a1f2e', padding: '14px 16px', borderRadius: 8, marginBottom: 8, borderLeft: `4px solid ${scope.completed ? '#10B981' : room?.color || '#D4A574'}`, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, border: scope.completed ? '2px solid #10B981' : '2px solid #6B7280', background: scope.completed ? '#10B981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              {scope.completed && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: room?.color || '#D4A574', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{room?.name || 'General'}</p>
              <p style={{ color: scope.completed ? '#6B7280' : '#E5E7EB', fontSize: 14, textDecoration: scope.completed ? 'line-through' : 'none' }}>{scope.description}</p>
            </div>
          </div>
        );
      }) : <p style={{ color: '#6B7280' }}>{lang === 'en' ? 'No scope items defined yet.' : 'No hay elementos definidos.'}</p>}
    </div>
  );
}

// ===== PHOTOS SECTION - BUILDER CAN UPLOAD =====
function PhotosSection({ rooms, photos, projectId, accessCode, t, lang, onReload }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (roomId, files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      // Convert to base64 for the API
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = async () => {
          const base64 = reader.result;
          await fetch(`${API_URL}/api/photos/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: projectId,
              room_id: roomId,
              file_name: file.name,
              photo_data: base64,
              metadata: { source: 'builder', uploaded_by: localStorage.getItem('builder_name') || 'Builder' }
            }),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
    onReload();
  };

  return (
    <div>
      <h2 style={sectionTitle}>{t.photos}</h2>
      {rooms.map(room => (
        <div key={room.id} style={{ marginBottom: 32 }}>
          {/* ROOM HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: room.color || '#2a3040', padding: '10px 16px', borderRadius: 8, borderLeft: `5px solid ${room.color || '#D4A574'}` }}>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{room.name.toUpperCase()}</h3>
            <label style={{ background: '#D4A574', color: '#1a1f2e', padding: '8px 16px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : t.uploadFiles}
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.txt" capture="environment" onChange={e => handleUpload(room.id, Array.from(e.target.files))} style={{ display: 'none' }} />
            </label>
          </div>

          {/* PHOTOS GRID - organized by room */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: '0 8px' }}>
            {(photos[room.id] || []).map((photo, idx) => (
              <div key={idx} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #2a3040', background: '#1a1f2e' }}>
                <div style={{ width: '100%', height: 140, overflow: 'hidden' }}>
                  <img src={photo.url || photo.photo_data} alt={photo.file_name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '6px 10px' }}>
                  <p style={{ color: '#9CA3AF', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.file_name || `Photo ${idx + 1}`}</p>
                  {photo.uploaded_at && <p style={{ color: '#4B5563', fontSize: 10 }}>{new Date(photo.uploaded_at).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
          {(!photos[room.id] || photos[room.id].length === 0) && (
            <p style={{ color: '#6B7280', fontSize: 13, padding: '0 8px' }}>{lang === 'en' ? 'No photos yet — upload some above' : 'Sin fotos — suba algunas arriba'}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== TODO SECTION - SYNCED =====
function TodoSection({ projectId, todos, contacts, t, onReload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTodo, setNewTodo] = useState({ text: '', priority: 'Medium', assigned_to: '', deadline: '' });

  const allContacts = contacts || [];

  const addTodo = async () => {
    if (!newTodo.text.trim()) return;
    await fetch(`${API_URL}/api/todos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTodo, project_id: projectId, source_type: 'builder' }),
    });
    setNewTodo({ text: '', priority: 'Medium', assigned_to: '', deadline: '' });
    setShowAdd(false);
    onReload();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={sectionTitle}>{t.todoList}</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>{t.addTask}</button>
      </div>
      {showAdd && (
        <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
          <input placeholder="Task description" value={newTodo.text} onChange={e => setNewTodo({ ...newTodo, text: e.target.value })} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select value={newTodo.priority} onChange={e => setNewTodo({ ...newTodo, priority: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
              <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option>
            </select>
            <select value={newTodo.assigned_to} onChange={e => setNewTodo({ ...newTodo, assigned_to: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
              <option value="">Assign to...</option>
              {allContacts.map((c, i) => <option key={i} value={c.username || c.name}>@{c.username || c.name} ({c.role})</option>)}
            </select>
            <input type="date" value={newTodo.deadline} onChange={e => setNewTodo({ ...newTodo, deadline: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <button onClick={addTodo} style={btnPrimary}>{t.submit}</button>
        </div>
      )}
      {todos.length > 0 ? todos.map(todo => (
        <div key={todo.id} style={{ background: '#1a1f2e', padding: '12px 16px', borderRadius: 8, marginBottom: 8,
          borderLeft: `4px solid ${todo.status === 'completed' ? '#10B981' : todo.priority === 'Urgent' ? '#EF4444' : todo.priority === 'High' ? '#F59E0B' : '#6B7280'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{todo.text}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              {todo.assigned_to && <span style={{ color: '#D4A574', fontSize: 11, fontWeight: 700 }}>@{todo.assigned_to}</span>}
              {todo.deadline && <span style={{ color: '#9CA3AF', fontSize: 11 }}>Due: {todo.deadline}</span>}
            </div>
          </div>
          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
            background: todo.status === 'completed' ? '#065F46' : todo.status === 'in_progress' ? '#92400E' : '#374151', color: '#fff' }}>
            {(todo.status || 'pending').toUpperCase()}
          </span>
        </div>
      )) : <p style={{ color: '#6B7280' }}>No tasks yet.</p>}
    </div>
  );
}

// ===== SCHEDULE SECTION - BUILDER CAN ADD =====
function ScheduleSection({ portal, accessCode, t, lang, onReload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', date: '', status: 'pending', notes: '' });

  const addScheduleItem = async () => {
    if (!newItem.title.trim()) return;
    const updated = [...(portal.schedule || []), newItem];
    await fetch(`${API_URL}/api/builder-portal/${portal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: updated }),
    });
    setNewItem({ title: '', date: '', status: 'pending', notes: '' });
    setShowAdd(false);
    onReload();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={sectionTitle}>{t.schedule}</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>+ {lang === 'en' ? 'Add to Schedule' : 'Agregar al Calendario'}</button>
      </div>

      {showAdd && (
        <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
          <input placeholder={lang === 'en' ? 'Milestone / Event title' : 'Título del evento'} value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="date" value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            <select value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
              <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
            </select>
          </div>
          <textarea placeholder={lang === 'en' ? 'Notes (optional)' : 'Notas (opcional)'} value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addScheduleItem} style={btnPrimary}>{t.submit}</button>
            <button onClick={() => setShowAdd(false)} style={btnSecondary}>{t.cancel}</button>
          </div>
        </div>
      )}

      {(portal.schedule || []).length > 0 ? portal.schedule.map((event, idx) => (
        <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 12,
          borderLeft: `4px solid ${event.status === 'completed' ? '#10B981' : event.status === 'in_progress' ? '#F59E0B' : '#D4A574'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{event.title}</h3>
            <span style={{ color: '#D4A574', fontSize: 13, fontWeight: 600 }}>{event.date}</span>
          </div>
          {event.notes && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{event.notes}</p>}
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 6, display: 'inline-block',
            background: event.status === 'completed' ? '#065F46' : event.status === 'in_progress' ? '#92400E' : '#374151', color: '#fff' }}>
            {event.status?.toUpperCase() || 'PENDING'}
          </span>
        </div>
      )) : <p style={{ color: '#6B7280' }}>{lang === 'en' ? 'No schedule items yet. Add one above.' : 'No hay elementos. Agregue uno arriba.'}</p>}
    </div>
  );
}

const sectionTitle = { color: '#D4A574', fontSize: 20, fontWeight: 700, marginBottom: 16 };
const inputStyle = { width: '100%', background: '#0f1218', border: '1px solid #2a3040', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 14, marginBottom: 8, display: 'block', boxSizing: 'border-box' };
const btnPrimary = { background: '#D4A574', color: '#1a1f2e', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const btnSecondary = { background: '#374151', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' };
