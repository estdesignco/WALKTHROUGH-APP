import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ExactFFESpreadsheet from './FFEView';
import RichTextEditor from './RichTextEditor';
import { parseScopeDocument } from './ScopeDocumentEditor';
import FileLightbox from './FileLightbox';
import { getRoomColor, getMutedRoomHeaderStyle } from '../utils/roomColors';

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
  // Count scope items from the parsed scope_document (the new master doc)
  // Legacy scope_of_work[] still counted as fallback for old portals.
  const parsedScope = parseScopeDocument(portal.scope_document || '', rooms);
  const legacyScopeItems = portal.scope_of_work || [];
  const scopeTotal = parsedScope.items.length + legacyScopeItems.length;
  const completedScope = legacyScopeItems.filter(s => s.completed).length;
  const completedTodos = todos.filter(td => td.status === 'completed' || td.completed).length;
  const openTodos = todos.filter(td => td.status !== 'completed' && !td.completed).length;

  // Build room/category color maps from the live project data so the builder
  // FFE renders identical to the admin FFE (no "hideous" defaults).
  const roomColors = {};
  rooms.forEach(r => { if (r.color) roomColors[r.id] = r.color; });
  const categoryColors = {};
  rooms.forEach(r => (r.categories || []).forEach(c => { if (c.color) categoryColors[c.id] = c.color; }));

  const FFE_ITEM_STATUSES = ['PICKED', 'ORDERED', 'SHIPPED', 'DELIVERED TO RECEIVER', 'DELIVERED TO JOB SITE', 'INSTALLED'];
  const FFE_VENDOR_TYPES = ['Four Hands', 'Uttermost', 'Visual Comfort'];
  const FFE_CARRIER_TYPES = ['FedEx', 'UPS', 'USPS', 'DHL'];

  const builderProject = { ...project, id: portal.project_id, rooms };

  const tabs = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'scope', label: t.scopeOfWork },
    { id: 'ffe', label: t.ffeSchedule },
    { id: 'uploads', label: lang === 'en' ? 'Uploads' : 'Subidas' },
    { id: 'photos', label: lang === 'en' ? 'Room Photos' : 'Fotos por Hab.' },
    { id: 'todos', label: t.todoList },
    { id: 'schedule', label: t.schedule },
    { id: 'changes', label: t.changeOrders },
    { id: 'contacts', label: t.contacts },
    { id: 'comments', label: t.comments },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f1218', color: '#F5F5DC' }}>
      {/* Global mobile-responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .bp-header { padding: 14px 16px !important; }
          .bp-header-inner { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .bp-header-title { font-size: 20px !important; }
          .bp-header-right { width: 100% !important; justify-content: space-between !important; gap: 8px !important; }
          .bp-header-firm-block { text-align: left !important; }
          .bp-tab-btn { padding: 10px 12px !important; font-size: 11px !important; }
          .bp-main { padding: 14px 10px !important; }
          .bp-welcome { padding: 18px 16px !important; }
          .bp-welcome h2 { font-size: 20px !important; }
          .bp-welcome p { font-size: 13px !important; }
          .bp-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .bp-section-title { font-size: 18px !important; }
          /* Make wide FFE table horizontally scrollable on phones */
          .bp-ffe-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      {/* HEADER */}
      <header className="bp-header" style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1218 100%)', borderBottom: '3px solid #D4A574', padding: '20px 32px' }}>
        <div className="bp-header-inner" style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#D4A574', fontSize: 11, letterSpacing: 4, fontWeight: 700, marginBottom: 4 }}>{t.builderPortal}</p>
            <h1 className="bp-header-title" style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>{project.name}</h1>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{project.client_info?.address}</p>
          </div>
          <div className="bp-header-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={toggleLang} style={{ background: '#2a3040', border: '1px solid #D4A574', padding: '6px 14px', borderRadius: 6, color: '#D4A574', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {t.switchLang}
            </button>
            <div className="bp-header-firm-block" style={{ textAlign: 'right' }}>
              <p style={{ color: '#D4A574', fontSize: 12, fontWeight: 700 }}>ESTABLISHED DESIGN CO.</p>
              <p style={{ color: '#6B7280', fontSize: 11 }}>{project.client_info?.full_name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ background: '#1a1f2e', borderBottom: '1px solid #2a3040', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="bp-tab-btn"
              style={{ padding: '12px 16px', color: activeTab === tab.id ? '#D4A574' : '#6B7280', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 12, background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '3px solid #D4A574' : '3px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="bp-main" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>

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
                { label: t.scopeItems, value: scopeTotal > 0 ? `${completedScope}/${scopeTotal}` : '0', color: '#10B981' },
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
          <ScopeSection portal={portal} rooms={rooms} accessCode={accessCode} lang={lang} t={t} onReload={loadPortal} setActiveTab={setActiveTab} />
        )}

        {/* ===== FFE (READ ONLY) ===== */}
        {activeTab === 'ffe' && (
          <div className="bp-ffe-wrap">
            <ExactFFESpreadsheet
              project={builderProject}
              roomColors={roomColors}
              categoryColors={categoryColors}
              itemStatuses={FFE_ITEM_STATUSES}
              vendorTypes={FFE_VENDOR_TYPES}
              carrierTypes={FFE_CARRIER_TYPES}
              onReload={loadPortal}
              builderMode={true}
            />
          </div>
        )}

        {/* ===== GENERAL UPLOADS - DEDICATED PLACE ===== */}
        {activeTab === 'uploads' && (
          <GeneralUploadsSection projectId={portal.project_id} accessCode={accessCode} t={t} lang={lang} onReload={loadPortal} />
        )}

        {/* ===== ROOM PHOTOS - PER ROOM WITH CAMERA ===== */}
        {activeTab === 'photos' && (
          <RoomPhotosSection rooms={rooms} photos={photos} projectId={portal.project_id} accessCode={accessCode} t={t} lang={lang} onReload={loadPortal} />
        )}

        {/* ===== TO-DO LIST (SYNCED) ===== */}
        {activeTab === 'todos' && (
          <TodoSection projectId={portal.project_id} todos={todos} contacts={portal.contacts || []} rooms={rooms} t={t} onReload={loadPortal} />
        )}

        {/* ===== SCHEDULE (SYNCED - BUILDER CAN ADD) ===== */}
        {activeTab === 'schedule' && (
          <ScheduleSection portal={portal} accessCode={accessCode} rooms={rooms} contacts={portal.contacts || []} t={t} lang={lang} onReload={loadPortal} />
        )}

        {/* ===== ROOM FINISHES ===== */}
        {activeTab === 'finishes' && (
          <div className="bp-ffe-wrap">
            <ExactFFESpreadsheet
              project={builderProject}
              roomColors={roomColors}
              categoryColors={categoryColors}
              itemStatuses={FFE_ITEM_STATUSES}
              vendorTypes={FFE_VENDOR_TYPES}
              carrierTypes={FFE_CARRIER_TYPES}
              onReload={loadPortal}
              builderMode={true}
            />
          </div>
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
                <RichTextEditor
                  value={newChangeOrder.description}
                  onChange={(val) => setNewChangeOrder({ ...newChangeOrder, description: val })}
                  placeholder="Description..."
                />
                {/* TAG PRODUCTS & PEOPLE */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
                  <select onChange={e => { if (e.target.value) setNewChangeOrder(prev => ({ ...prev, tagged_products: [...(prev.tagged_products||[]), e.target.value] })); e.target.value=''; }}
                    style={{ ...inputStyle, flex: 1, color: '#93C5FD' }}>
                    <option value="">Tag product...</option>
                    {rooms.flatMap(r => r.categories?.flatMap(c => c.subcategories?.flatMap(sub => sub.items?.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({r.name})</option>
                    )))) || [])}
                  </select>
                  <select onChange={e => { if (e.target.value) setNewChangeOrder(prev => ({ ...prev, tagged_people: [...(prev.tagged_people||[]), e.target.value] })); e.target.value=''; }}
                    style={{ ...inputStyle, flex: 1, color: '#D4A574' }}>
                    <option value="">Tag person...</option>
                    {(portal.contacts||[]).map((c,i) => <option key={i} value={c.username||c.name}>@{c.username||c.name} ({c.role})</option>)}
                  </select>
                </div>
                {(newChangeOrder.tagged_products||[]).length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>{newChangeOrder.tagged_products.map((p,i) => <span key={i} style={{ background: '#1E3A5F', border: '1px solid #3B82F6', color: '#93C5FD', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{p} <span onClick={() => setNewChangeOrder(prev => ({...prev, tagged_products: prev.tagged_products.filter((_,idx)=>idx!==i)}))} style={{cursor:'pointer',color:'#EF4444'}}>x</span></span>)}</div>}
                {(newChangeOrder.tagged_people||[]).length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>{newChangeOrder.tagged_people.map((p,i) => <span key={i} style={{ background: '#D4A57420', border: '1px solid #D4A574', color: '#D4A574', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>@{p} <span onClick={() => setNewChangeOrder(prev => ({...prev, tagged_people: prev.tagged_people.filter((_,idx)=>idx!==i)}))} style={{cursor:'pointer',color:'#EF4444'}}>x</span></span>)}</div>}
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

        {/* ===== CONTACTS - EDITABLE + TAG PEOPLE ===== */}
        {activeTab === 'contacts' && (
          <ContactsSection portal={portal} accessCode={accessCode} comments={comments} t={t} lang={lang} onReload={loadPortal} />
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

// ===== SCOPE SECTION (driven by parsed scope_document) =====
function ScopeSection({ portal, rooms, accessCode, lang, t, onReload, setActiveTab }) {
  const [viewMode, setViewMode] = useState('overall');
  const [tradeFilter, setTradeFilter] = useState(null); // for "click trade chip" navigation
  const [productModal, setProductModal] = useState(null); // live item object when opened

  // Build itemsById lookup for live resolution of product tags
  const itemsById = {};
  rooms.forEach(r => {
    (r.categories || []).forEach(c => {
      (c.subcategories || []).forEach(sub => {
        (sub.items || []).forEach(item => {
          itemsById[item.id] = { ...item, _room: r.name, _roomColor: r.color };
        });
      });
    });
  });

  const tradeColors = {
    'DEMOLITION': '#EF4444', 'FRAMING': '#F97316', 'ELECTRICAL': '#EAB308', 'PLUMBING': '#3B82F6',
    'HVAC': '#6366F1', 'DRYWALL': '#A3A3A3', 'PAINT': '#EC4899', 'TILE': '#14B8A6', 'FLOORING': '#8B5CF6',
    'CABINETRY': '#D97706', 'COUNTERTOPS': '#7C3AED', 'MILLWORK': '#B45309',
    'TRIM CARPENTER': '#92400E', 'HARDWARE': '#78716C',
    'GLASS & MIRRORS': '#06B6D4', 'APPLIANCES': '#64748B', 'FIXTURES': '#0EA5E9', 'ROOFING': '#DC2626',
    'EXTERIOR': '#059669', 'LANDSCAPING': '#16A34A', 'GENERAL': '#6B7280',
  };

  // Status phases that map to "CHECKLIST" (everything else → FFE)
  const CHK_STATUSES = new Set([
    'ORDER SAMPLES', 'SAMPLES ARRIVED', 'ASK NEIL', 'ASK CHARLENE', 'ASK JALA',
    'GET QUOTE', 'WAITING ON QT', 'READY FOR PRESENTATION',
    'TO BE SELECTED', 'RESEARCHING', 'PENDING APPROVAL', '', null,
  ]);
  const isChecklistItem = (status) => CHK_STATUSES.has(status || '');

  // Click handlers
  const handleTradeClick = (trade) => {
    setViewMode('trade');
    setTradeFilter(trade);
    setTimeout(() => {
      document.querySelector(`[data-testid="by-trade-${trade}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const handleProductClick = (id) => {
    const item = itemsById[id];
    if (item) setProductModal(item);
    else setProductModal({ _missing: true, id });
  };
  const handlePersonClick = (name) => {
    setActiveTab?.('contacts');
    setTimeout(() => {
      document.querySelector(`[data-contact="${name}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  // Render helper: convert stored HTML → React tree.
  // BUILDER SIDE BEHAVIOR: trade pills hidden completely.
  // Product and person pills are kept (so we can navigate to items / contacts).
  const renderScope = (html) => {
    if (!html) return null;
    const container = document.createElement('div');
    container.innerHTML = html;
    let key = 0;
    const walk = (node) => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return null;
      const tagType = node.getAttribute('data-tag');
      if (tagType === 'trade') {
        // hide trade pills on builder side per user request
        return null;
      }
      if (tagType === 'product') {
        const id = node.getAttribute('data-product-id');
        const fallback = node.getAttribute('data-product-name');
        return <LiveProductChip key={`k${key++}`} id={id} fallbackName={fallback} item={itemsById[id]} isChecklist={itemsById[id] ? isChecklistItem(itemsById[id].status) : false} onClick={() => handleProductClick(id)} />;
      }
      if (tagType === 'person') {
        const pname = node.getAttribute('data-person');
        const role = node.getAttribute('data-role');
        return <LivePersonChip key={`k${key++}`} name={pname} role={role} contact={(portal.contacts || []).find(c => (c.username || c.name) === pname)} onClick={() => handlePersonClick(pname)} />;
      }
      const TagName = (node.tagName || 'span').toLowerCase();
      const children = Array.from(node.childNodes).map(walk);
      const props = { key: `k${key++}` };
      if (node.getAttribute('class')) props.className = node.getAttribute('class');
      const styleAttr = node.getAttribute('style');
      if (styleAttr) {
        props.style = styleAttr.split(';').reduce((acc, s) => {
          const [k2, v2] = s.split(':').map(x => x && x.trim());
          if (k2 && v2) {
            const camelK = k2.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            acc[camelK] = v2;
          }
          return acc;
        }, {});
      }
      return React.createElement(TagName, props, ...children);
    };
    return Array.from(container.childNodes).map(walk);
  };

  const scopeDoc = portal.scope_document || '';
  const parsed = parseScopeDocument(scopeDoc, rooms);
  const hasDoc = !!scopeDoc.trim();

  let tradeKeys = Object.keys(parsed.byTrade).sort((a, b) => {
    if (a === '__UNTAGGED__') return 1;
    if (b === '__UNTAGGED__') return -1;
    return a.localeCompare(b);
  });
  if (tradeFilter) tradeKeys = tradeKeys.filter(k => k === tradeFilter);

  const orderedRoomNames = (() => {
    const projectRoomNames = rooms.map(r => r.name.toUpperCase());
    const docRoomNames = Object.keys(parsed.byRoom);
    const matched = projectRoomNames.filter(n => docRoomNames.includes(n));
    const extras = docRoomNames.filter(n => !projectRoomNames.includes(n));
    return [...matched, ...extras];
  })();

  // Render a block's items (used for By Room / By Trade lists)
  const renderBlockItems = (items) => items.map((item, idx) => (
    <div key={idx} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
      <span style={{ color: '#6B7280', fontWeight: 700, minWidth: 22, fontSize: 13 }}>{idx + 1}.</span>
      <div style={{ color: '#E5E7EB', fontSize: 14, lineHeight: 1.5, flex: 1 }}>{renderScope(`<p>${item.html}</p>`)}</div>
    </div>
  ));

  return (
    <div>
      <style>{`
        .qe-tag-trade, .qe-tag-product, .qe-tag-person {
          padding: 1px 8px; border-radius: 4px; font-weight: 800;
          font-size: 0.85em; margin: 0 2px; display: inline-flex; align-items: center; gap: 4px; line-height: 1.4;
          transition: transform 0.1s, filter 0.1s;
        }
        .qe-tag-trade:hover, .qe-tag-product:hover, .qe-tag-person:hover { filter: brightness(1.2); transform: translateY(-1px); }
        .qe-tag-trade { background: var(--pill-bg, #6B7280); color: #fff; letter-spacing: 1px; }
        .qe-tag-product { background: #1E3A5F; color: #93C5FD; border: 1px solid #3B82F6; font-weight: 700; }
        .qe-tag-product.chk { background: #064E3B; color: #86EFAC; border-color: #10B981; }
        .qe-tag-person { background: rgba(212,165,116,0.2); color: #D4A574; border: 1px solid #D4A574; font-weight: 700; }
        .scope-doc-readonly h1, .scope-doc-readonly h2, .scope-doc-readonly h3 { color: #D4A574; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-top: 18px; padding-bottom: 4px; border-bottom: 1px solid #D4A574; }
        .scope-doc-readonly h1 { font-size: 26px; }
        .scope-doc-readonly h2 { font-size: 21px; }
        .scope-doc-readonly h3 { font-size: 17px; }
        .scope-doc-readonly ol, .scope-doc-readonly ul { padding-left: 1.5em; }
        .scope-doc-readonly li { margin: 4px 0; }
        .scope-doc-readonly p { margin: 6px 0; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={sectionTitle}>{t.scopeOfWork}</h2>
        <div style={{ display: 'flex', gap: 4, background: '#1a1f2e', borderRadius: 8, padding: 4, border: '1px solid #2a3040' }}>
          <button data-testid="scope-view-overall" onClick={() => { setViewMode('overall'); setTradeFilter(null); }} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: viewMode === 'overall' ? '#D4A574' : 'transparent', color: viewMode === 'overall' ? '#1a1f2e' : '#6B7280' }}>
            {lang === 'en' ? 'Overall' : 'General'}
          </button>
          <button data-testid="scope-view-room" onClick={() => { setViewMode('room'); setTradeFilter(null); }} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: viewMode === 'room' ? '#D4A574' : 'transparent', color: viewMode === 'room' ? '#1a1f2e' : '#6B7280' }}>
            {lang === 'en' ? 'By Room' : 'Por Hab.'}
          </button>
          <button data-testid="scope-view-trade" onClick={() => { setViewMode('trade'); setTradeFilter(null); }} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: viewMode === 'trade' ? '#D4A574' : 'transparent', color: viewMode === 'trade' ? '#1a1f2e' : '#6B7280' }}>
            {lang === 'en' ? 'By Trade' : 'Por Oficio'}
          </button>
        </div>
      </div>

      {tradeFilter && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#6B7280' }}>Filtered to trade:</span>
          <span style={{ background: tradeColors[tradeFilter] || '#6B7280', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>#{tradeFilter}</span>
          <button onClick={() => setTradeFilter(null)} style={{ color: '#EF4444', fontSize: 11, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Clear filter</button>
        </div>
      )}

      {!hasDoc && <p style={{ color: '#6B7280' }}>{lang === 'en' ? 'No scope of work yet.' : 'No hay alcance del trabajo aún.'}</p>}

      {viewMode === 'overall' && hasDoc && (
        <div data-testid="overall-scope-doc" className="scope-doc-readonly" style={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, padding: '20px 28px', color: '#E5E7EB', fontSize: 15, lineHeight: 1.7 }}>
          {renderScope(scopeDoc)}
        </div>
      )}

      {viewMode === 'room' && hasDoc && orderedRoomNames.map(roomName => {
        const group = parsed.byRoom[roomName];
        if (!group) return null;
        const room = group.room;
        const headerColor = room?.color || '#D4A574';
        return (
          <div key={roomName} style={{ marginBottom: 24, background: `${headerColor}08`, borderRadius: 8, border: `1px solid ${headerColor}25`, overflow: 'hidden' }} data-testid={`by-room-${roomName}`}>
            <div style={{ background: `${headerColor}20`, borderLeft: `5px solid ${headerColor}`, padding: '12px 18px', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ color: headerColor, fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>{roomName}</h3>
              <span style={{ color: '#6B7280', fontSize: 11 }}>{group.items.length} {lang === 'en' ? 'items' : 'elementos'}</span>
            </div>
            <div style={{ padding: '12px 24px 16px 24px' }}>{renderBlockItems(group.items)}</div>
          </div>
        );
      })}

      {viewMode === 'trade' && hasDoc && tradeKeys.map(trade => {
        const items = parsed.byTrade[trade];
        const isUntagged = trade === '__UNTAGGED__';
        const tColor = isUntagged ? '#4B5563' : (tradeColors[trade] || '#6B7280');
        const label = isUntagged ? (lang === 'en' ? 'NO TRADE TAGGED' : 'SIN OFICIO') : trade;
        const roomGroups = {};
        items.forEach(item => {
          const rn = item.roomName || 'GENERAL';
          if (!roomGroups[rn]) roomGroups[rn] = { room: item.room, items: [] };
          roomGroups[rn].items.push(item);
        });
        return (
          <div key={trade} style={{ marginBottom: 24 }} data-testid={`by-trade-${trade}`}>
            <div style={{ background: `${tColor}15`, borderLeft: `5px solid ${tColor}`, padding: '12px 16px', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: tColor, fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>{label}</h3>
              <span style={{ color: '#6B7280', fontSize: 12 }}>{items.length} {lang === 'en' ? 'items' : 'elementos'}</span>
            </div>
            {Object.entries(roomGroups).map(([rName, group]) => (
              <div key={rName} style={{ marginLeft: 12, marginBottom: 12 }}>
                <p style={{ color: group.room?.color || '#D4A574', fontSize: 13, fontWeight: 700, marginBottom: 6, borderBottom: `1px solid ${group.room?.color || '#D4A574'}30`, paddingBottom: 4, letterSpacing: 1 }}>{rName}</p>
                {renderBlockItems(group.items)}
              </div>
            ))}
          </div>
        );
      })}

      {productModal && <ProductDetailModal item={productModal} onClose={() => setProductModal(null)} onGoToFFE={() => { setProductModal(null); setActiveTab?.('ffe'); }} onGoToChecklist={() => { setProductModal(null); setActiveTab?.('ffe'); }} lang={lang} />}
    </div>
  );
}

// ===== LIVE CHIP COMPONENTS =====
function LiveTradeChip({ trade, color, onClick }) {
  return (
    <span
      onClick={onClick}
      className="qe-tag-trade"
      style={{ '--pill-bg': color, cursor: 'pointer' }}
      title={`Click to view all ${trade} items`}
      data-testid={`chip-trade-${trade}`}
    >
      #{trade}
    </span>
  );
}

function LiveProductChip({ id, fallbackName, item, isChecklist, onClick }) {
  const [hover, setHover] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = React.useRef(null);
  const displayName = item?.name || fallbackName || 'Unknown item';
  const photo = item?.image_url;

  const onEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 280) });
    }
    setHover(true);
  };

  return (
    <>
      <span
        ref={ref}
        onClick={onClick}
        onMouseEnter={onEnter}
        onMouseLeave={() => setHover(false)}
        className={`qe-tag-product ${isChecklist ? 'chk' : ''}`}
        style={{ cursor: 'pointer' }}
        data-testid={`chip-product-${id}`}
      >
        {photo
          ? <img src={photo} alt="" style={{ width: 16, height: 16, borderRadius: 2, objectFit: 'cover' }} />
          : <span style={{ fontSize: 10 }}>{isChecklist ? '✓' : '🏷'}</span>}
        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
      </span>
      {hover && item && (
        <ProductHoverCard item={item} isChecklist={isChecklist} top={coords.top} left={coords.left} />
      )}
    </>
  );
}

function ProductHoverCard({ item, isChecklist, top, left }) {
  // Render via portal-style fixed position so it's not clipped by overflow
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top, left,
        zIndex: 99999,
        background: '#0f1218',
        border: '1px solid #2a3040',
        borderRadius: 8,
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        width: 260,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      data-testid="product-hover-card"
    >
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: 180, objectFit: 'cover', background: '#0f1218' }} />
      ) : (
        <div style={{ width: '100%', height: 80, background: '#1a1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', fontSize: 11, fontStyle: 'italic' }}>No photo yet</div>
      )}
      <div style={{ padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ background: isChecklist ? '#10B981' : '#3B82F6', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 3, letterSpacing: 0.5 }}>{isChecklist ? 'CHK' : 'FFE'}</span>
          {item._room && <span style={{ color: item._roomColor || '#D4A574', fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>{item._room}</span>}
        </div>
        <div style={{ color: '#F5F5DC', fontSize: 13, fontWeight: 800, marginBottom: 4, lineHeight: 1.25 }}>{item.name || '(unnamed)'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', fontSize: 10, color: '#9CA3AF' }}>
          {item.vendor && <span>{item.vendor}</span>}
          {item.sku && <span>SKU: {item.sku}</span>}
          {item.size && <span>Size: {item.size}</span>}
          {item.finish_color && <span>{item.finish_color}</span>}
        </div>
        {item.status && <div style={{ marginTop: 6, fontSize: 10, color: '#D4A574', fontWeight: 700 }}>● {item.status}</div>}
      </div>
    </div>,
    document.body
  );
}

function LivePersonChip({ name, role, contact, onClick }) {
  return (
    <span
      onClick={onClick}
      className="qe-tag-person"
      style={{ cursor: 'pointer' }}
      title={contact ? `${contact.name} • ${contact.role}${contact.phone ? ' • ' + contact.phone : ''}${contact.email ? ' • ' + contact.email : ''}` : name}
      data-testid={`chip-person-${name}`}
    >
      @{name}{role ? <span style={{ fontSize: '0.85em', opacity: 0.7 }}> ({role})</span> : null}
    </span>
  );
}

// ===== PRODUCT DETAIL MODAL =====
function ProductDetailModal({ item, onClose, onGoToFFE, onGoToChecklist, lang }) {
  if (!item) return null;
  if (item._missing) {
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 12, padding: 24, maxWidth: 380 }}>
          <h3 style={{ color: '#EF4444', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Item not found</h3>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>This item may have been deleted or hasn't been created yet. ID: <code style={{ color: '#6B7280' }}>{item.id}</code></p>
          <button onClick={onClose} style={{ marginTop: 16, padding: '8px 16px', background: '#D4A574', color: '#1a1f2e', border: 'none', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  }
  const CHK_STATUSES = new Set(['ORDER SAMPLES','SAMPLES ARRIVED','ASK NEIL','ASK CHARLENE','ASK JALA','GET QUOTE','WAITING ON QT','READY FOR PRESENTATION','TO BE SELECTED','RESEARCHING','PENDING APPROVAL','', null]);
  const isChk = CHK_STATUSES.has(item.status || '');
  return (
    <div onClick={onClose} data-testid="product-detail-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 12, padding: 0, maxWidth: 480, width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3040' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: isChk ? '#10B981' : '#3B82F6', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>{isChk ? 'CHECKLIST' : 'FF&E'}</span>
            <span style={{ color: item._roomColor || '#D4A574', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{item._room}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {item.image_url && (
          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: 280, objectFit: 'cover', background: '#0f1218' }} />
        )}
        <div style={{ padding: 20, overflowY: 'auto' }}>
          <h3 style={{ color: '#F5F5DC', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{item.name || '(unnamed)'}</h3>
          {item.vendor && <p style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 12 }}>{item.vendor}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 13, marginTop: 8 }}>
            {item.sku && (<><span style={{ color: '#6B7280' }}>SKU</span><span style={{ color: '#E5E7EB' }}>{item.sku}</span></>)}
            {item.size && (<><span style={{ color: '#6B7280' }}>Size</span><span style={{ color: '#E5E7EB' }}>{item.size}</span></>)}
            {item.finish_color && (<><span style={{ color: '#6B7280' }}>Finish</span><span style={{ color: '#E5E7EB' }}>{item.finish_color}</span></>)}
            {item.status && (<><span style={{ color: '#6B7280' }}>Status</span><span style={{ color: '#E5E7EB', fontWeight: 700 }}>{item.status}</span></>)}
            {item.quantity && (<><span style={{ color: '#6B7280' }}>Qty</span><span style={{ color: '#E5E7EB' }}>{item.quantity}</span></>)}
            {item.remarks && (<><span style={{ color: '#6B7280' }}>Notes</span><span style={{ color: '#E5E7EB' }}>{item.remarks}</span></>)}
          </div>
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #2a3040', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#374151', color: '#E5E7EB', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{lang === 'en' ? 'Close' : 'Cerrar'}</button>
          <button onClick={onGoToFFE} style={{ padding: '8px 16px', background: '#D4A574', color: '#1a1f2e', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>{lang === 'en' ? 'View in FF&E →' : 'Ver en FF&E →'}</button>
        </div>
      </div>
    </div>
  );
}

// ===== GENERAL UPLOADS SECTION =====
function GeneralUploadsSection({ projectId, accessCode, t, lang, onReload }) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { loadFiles(); }, [accessCode]);

  const loadFiles = async () => {
    const res = await fetch(`${API_URL}/api/builder/${accessCode}`);
    if (res.ok) {
      const data = await res.json();
      // Pull general files from comments with section='general_file'
      const fileComments = (data.portal?.comments || []).filter(c => c.section === 'general_file');
      const allFiles = [];
      fileComments.forEach(c => { try { const parsed = JSON.parse(c.text); if (Array.isArray(parsed)) allFiles.push(...parsed); } catch {} });
      setFiles(allFiles);
    }
  };

  const handleUpload = async (inputFiles) => {
    if (!inputFiles || inputFiles.length === 0) return;
    setUploading(true);
    const newFiles = [...files];
    for (const file of inputFiles) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          newFiles.push({ name: file.name, type: file.type, data: reader.result, uploaded_at: new Date().toISOString(), uploaded_by: localStorage.getItem('builder_name') || 'Builder' });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    await fetch(`${API_URL}/api/builder/${accessCode}/comment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'general_file', author: localStorage.getItem('builder_name') || 'Builder', text: JSON.stringify(newFiles) }),
    });
    setFiles(newFiles);
    setUploading(false);
  };

  const handleCamera = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
    input.onchange = (e) => handleUpload(Array.from(e.target.files));
    input.click();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={sectionTitle}>{lang === 'en' ? 'General Uploads' : 'Subidas Generales'}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCamera} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
            📷 {lang === 'en' ? 'Take Photo' : 'Tomar Foto'}
          </button>
          <label style={{ ...btnPrimary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            📁 {uploading ? '...' : (lang === 'en' ? 'Upload Files' : 'Subir Archivos')}
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.txt,.csv" onChange={e => handleUpload(Array.from(e.target.files))} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
      <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 16 }}>
        {lang === 'en' ? 'Upload general project documents — permits, plans, insurance, contracts, etc.' : 'Suba documentos generales — permisos, planos, seguros, contratos, etc.'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {files.map((file, idx) => (
          <div
            key={idx}
            onClick={() => setLightbox({ files, index: idx })}
            title={lang === 'en' ? 'Click to open' : 'Clic para abrir'}
            style={{ background: '#1a1f2e', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a3040', cursor: 'pointer', transition: 'transform 0.1s, border-color 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4A574'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3040'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {file.type?.startsWith('image/') || file.data?.startsWith('data:image') ? (
              <div style={{ width: '100%', height: 150, overflow: 'hidden' }}><img src={file.data} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
            ) : (
              <div style={{ width: '100%', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1218' }}><span style={{ fontSize: 40 }}>📄</span></div>
            )}
            <div style={{ padding: '8px 12px' }}>
              <p style={{ color: '#F5F5DC', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
              <p style={{ color: '#6B7280', fontSize: 10 }}>{file.uploaded_by} • {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : ''}</p>
            </div>
          </div>
        ))}
        {files.length === 0 && <p style={{ color: '#6B7280', fontSize: 13 }}>{lang === 'en' ? 'No files uploaded yet.' : 'No hay archivos.'}</p>}
      </div>
      {lightbox && <FileLightbox files={lightbox.files} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ===== ROOM PHOTOS SECTION - PER ROOM WITH CAMERA =====
function RoomPhotosSection({ rooms, photos, projectId, accessCode, t, lang, onReload }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const handleUpload = async (roomId, inputFiles) => {
    if (!inputFiles || inputFiles.length === 0) return;
    setUploading(true);
    for (const file of inputFiles) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = async () => {
          await fetch(`${API_URL}/api/photos/upload`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId, room_id: roomId, file_name: file.name, photo_data: reader.result, metadata: { source: 'builder', uploaded_by: localStorage.getItem('builder_name') || 'Builder' } }),
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setUploading(false);
    onReload();
  };

  const handleCamera = (roomId) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
    input.onchange = (e) => handleUpload(roomId, Array.from(e.target.files));
    input.click();
  };

  // Sort rooms by floor then order_index then name to match FFE order exactly
  const FLOOR_ORDER = ['Basement', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'];
  const sortedRooms = [...rooms].sort((a, b) => {
    const fa = FLOOR_ORDER.indexOf(a.floor || '1st Floor');
    const fb = FLOOR_ORDER.indexOf(b.floor || '1st Floor');
    if (fa !== fb) return fa - fb;
    const oa = a.order_index ?? 999;
    const ob = b.order_index ?? 999;
    if (oa !== ob) return oa - ob;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div>
      <h2 style={sectionTitle}>{lang === 'en' ? 'Room Photos' : 'Fotos por Habitación'}</h2>
      {sortedRooms.map(room => {
        // CANONICAL color: room.color from DB → fallback to deterministic name-hash
        // (same fn used by FFE / Checklist / Walkthrough so Living Room is the same color everywhere).
        const roomColor = room.color || getRoomColor(room.name);
        return (
        <div key={room.id} style={{ marginBottom: 24 }}>
          {/* Header — styled like FFE / Checklist (muted gradient) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            ...getMutedRoomHeaderStyle(roomColor),
            padding: '6px 12px',
            border: '1px solid #D4A574',
            borderRadius: 0,
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <h3 style={{ color: '#D4C5A9', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>{room.name.toUpperCase()}</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => handleCamera(room.id)} style={{ background: '#D4A574', color: '#1a1f2e', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer', border: 'none' }}>
                📷 {lang === 'en' ? 'Camera' : 'Cámara'}
              </button>
              <label style={{ background: '#374151', color: '#F5F5DC', padding: '6px 12px', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                📁 {uploading ? '...' : (lang === 'en' ? 'Upload' : 'Subir')}
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.txt" onChange={e => handleUpload(room.id, Array.from(e.target.files))} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: '0 8px' }}>
            {(photos[room.id] || []).map((photo, idx) => {
              const roomFiles = (photos[room.id] || []).map(p => ({ data: p.url || p.photo_data, name: p.file_name || 'photo', type: 'image/*' }));
              return (
                <div
                  key={idx}
                  onClick={() => setLightbox({ files: roomFiles, index: idx })}
                  title={lang === 'en' ? 'Click to open' : 'Clic para abrir'}
                  style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #2a3040', background: '#1a1f2e', cursor: 'pointer', transition: 'transform 0.1s, border-color 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4A574'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3040'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: '100%', height: 140, overflow: 'hidden' }}><img src={photo.url || photo.photo_data} alt={photo.file_name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                  <div style={{ padding: '6px 10px' }}>
                    <p style={{ color: '#9CA3AF', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.file_name || `Photo ${idx + 1}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {(!photos[room.id] || photos[room.id].length === 0) && (
            <p style={{ color: '#6B7280', fontSize: 13, padding: '0 8px' }}>{lang === 'en' ? 'No photos yet' : 'Sin fotos'}</p>
          )}
        </div>
        );
      })}
      {lightbox && <FileLightbox files={lightbox.files} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ===== TODO SECTION - FILTERED TO BUILDER/TRADES ONLY =====
function TodoSection({ projectId, todos, contacts, rooms, t, onReload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTodo, setNewTodo] = useState({ text: '', priority: 'Medium', assigned_to: '', deadline: '', tagged_products: [], tagged_people: [] });

  const allContacts = contacts || [];
  const contactNames = allContacts.map(c => (c.username || c.name || '').toLowerCase());
  const allItems = [];
  (rooms || []).forEach(room => {
    room.categories?.forEach(cat => {
      cat.subcategories?.forEach(sub => {
        sub.items?.forEach(item => { allItems.push({ id: item.id, name: item.name, room: room.name }); });
      });
    });
  });

  // FILTER: only show todos assigned to builder contacts or tagged as builder source
  const builderTodos = todos.filter(todo => {
    if (todo.source_type === 'builder') return true;
    const assignee = (todo.assigned_to || '').toLowerCase();
    if (contactNames.some(n => n && assignee.includes(n))) return true;
    if (assignee && allContacts.some(c => (c.role || '').toLowerCase().match(/builder|contractor|trade|plumber|electric|hvac|framer|paint|tile|floor|roof|cabinet|mason|carpen|drywall|demol/))) return true;
    return false;
  });

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
          <RichTextEditor
            value={newTodo.text}
            onChange={(val) => setNewTodo({ ...newTodo, text: val })}
            placeholder="Task description — use bold, lists, colors..."
          />
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
          {/* TAG PRODUCTS & PEOPLE */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select onChange={e => { if (e.target.value) setNewTodo(prev => ({ ...prev, tagged_products: [...(prev.tagged_products||[]), e.target.value] })); e.target.value=''; }}
              style={{ ...inputStyle, flex: 1, color: '#93C5FD' }}>
              <option value="">Tag product...</option>
              {allItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.room})</option>)}
            </select>
            <select onChange={e => { if (e.target.value) setNewTodo(prev => ({ ...prev, tagged_people: [...(prev.tagged_people||[]), e.target.value] })); e.target.value=''; }}
              style={{ ...inputStyle, flex: 1, color: '#D4A574' }}>
              <option value="">Tag person...</option>
              {allContacts.map((c, i) => <option key={i} value={c.username || c.name}>@{c.username || c.name} ({c.role})</option>)}
            </select>
          </div>
          {(newTodo.tagged_products||[]).length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>{newTodo.tagged_products.map((p,i) => <span key={i} style={{ background: '#1E3A5F', border: '1px solid #3B82F6', color: '#93C5FD', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{allItems.find(x=>x.id===p)?.name||p} <span onClick={() => setNewTodo(prev => ({...prev, tagged_products: prev.tagged_products.filter((_,idx)=>idx!==i)}))} style={{cursor:'pointer',color:'#EF4444'}}>x</span></span>)}</div>}
          {(newTodo.tagged_people||[]).length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>{newTodo.tagged_people.map((p,i) => <span key={i} style={{ background: '#D4A57420', border: '1px solid #D4A574', color: '#D4A574', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>@{p} <span onClick={() => setNewTodo(prev => ({...prev, tagged_people: prev.tagged_people.filter((_,idx)=>idx!==i)}))} style={{cursor:'pointer',color:'#EF4444'}}>x</span></span>)}</div>}
          <button onClick={addTodo} style={btnPrimary}>{t.submit}</button>
        </div>
      )}
      {builderTodos.length > 0 ? builderTodos.map(todo => (
        <div key={todo.id} style={{ background: '#1a1f2e', padding: '12px 16px', borderRadius: 8, marginBottom: 8,
          borderLeft: `4px solid ${todo.status === 'completed' ? '#10B981' : todo.priority === 'Urgent' ? '#EF4444' : todo.priority === 'High' ? '#F59E0B' : '#6B7280'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: todo.text }} />
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

// ===== CONTACTS SECTION - EDITABLE =====
function ContactsSection({ portal, accessCode, comments, t, lang, onReload }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', username: '', role: '', phone: '', email: '' });

  const allContacts = [...(portal.contacts || [])];
  // Include builder-added contacts from comments
  comments.filter(c => c.section === 'contact').forEach(c => {
    try { allContacts.push(JSON.parse(c.text)); } catch {}
  });

  const saveContacts = async (updatedList) => {
    await fetch(`${API_URL}/api/builder-portal/${portal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: updatedList }),
    });
    onReload();
  };

  const saveEdit = () => {
    const updated = [...(portal.contacts || [])];
    updated[editIdx] = editData;
    saveContacts(updated);
    setEditIdx(null);
  };

  const addContact = () => {
    const updated = [...(portal.contacts || []), newContact];
    saveContacts(updated);
    setNewContact({ name: '', username: '', role: '', phone: '', email: '' });
    setShowAdd(false);
  };

  const deleteContact = (idx) => {
    const updated = [...(portal.contacts || [])];
    updated.splice(idx, 1);
    saveContacts(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={sectionTitle}>{t.contacts}</h2>
        <button onClick={() => setShowAdd(true)} style={btnPrimary}>{t.addContact}</button>
      </div>

      {showAdd && (
        <div style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, marginBottom: 16, border: '2px solid #D4A574' }}>
          <input placeholder={t.contactName} value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} style={inputStyle} />
          <input placeholder={t.username + ' (for tagging)'} value={newContact.username} onChange={e => setNewContact({ ...newContact, username: e.target.value })} style={inputStyle} />
          <input placeholder={t.role + ' (e.g. Plumber, GC, Electrician)'} value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} style={inputStyle} />
          <input placeholder={t.phone} value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} style={inputStyle} />
          <input placeholder={t.email} value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addContact} style={btnPrimary}>{t.submit}</button>
            <button onClick={() => setShowAdd(false)} style={btnSecondary}>{t.cancel}</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {(portal.contacts || []).map((c, idx) => (
          <div key={idx} style={{ background: '#1a1f2e', padding: 16, borderRadius: 8, border: '1px solid #2a3040' }}>
            {editIdx === idx ? (
              <div>
                <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={inputStyle} placeholder="Name" />
                <input value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} style={inputStyle} placeholder="Username" />
                <input value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} style={inputStyle} placeholder="Role" />
                <input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} style={inputStyle} placeholder="Phone" />
                <input value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} style={inputStyle} placeholder="Email" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEdit} style={btnPrimary}>Save</button>
                  <button onClick={() => setEditIdx(null)} style={btnSecondary}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{c.name}</p>
                    {c.username && <p style={{ color: '#D4A574', fontSize: 11, fontWeight: 700 }}>@{c.username}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditIdx(idx); setEditData({ ...c }); }} style={{ background: 'none', border: 'none', color: '#D4A574', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Edit</button>
                    <button onClick={() => { if (window.confirm('Delete this contact?')) deleteContact(idx); }} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12 }}>X</button>
                  </div>
                </div>
                <p style={{ color: '#10B981', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{c.role}</p>
                {c.phone && <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>{c.phone}</p>}
                {c.email && <p style={{ color: '#9CA3AF', fontSize: 13 }}>{c.email}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SCHEDULE SECTION - BUILDER CAN ADD =====
function ScheduleSection({ portal, accessCode, rooms, contacts, t, lang, onReload }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', date: '', status: 'pending', notes: '', tagged_products: [], tagged_people: [] });

  const allItems = [];
  (rooms || []).forEach(room => {
    room.categories?.forEach(cat => {
      cat.subcategories?.forEach(sub => {
        sub.items?.forEach(item => { allItems.push({ id: item.id, name: item.name, room: room.name }); });
      });
    });
  });
  const allContacts = contacts || [];

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
          <RichTextEditor
            value={newItem.notes}
            onChange={(val) => setNewItem({ ...newItem, notes: val })}
            placeholder={lang === 'en' ? 'Notes (optional)' : 'Notas (opcional)'}
          />
          {/* TAG PRODUCTS & PEOPLE */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
            <select onChange={e => { if (e.target.value) setNewItem(prev => ({ ...prev, tagged_products: [...(prev.tagged_products||[]), e.target.value] })); e.target.value=''; }}
              style={{ ...inputStyle, flex: 1, color: '#93C5FD' }}>
              <option value="">Tag product...</option>
              {allItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.room})</option>)}
            </select>
            <select onChange={e => { if (e.target.value) setNewItem(prev => ({ ...prev, tagged_people: [...(prev.tagged_people||[]), e.target.value] })); e.target.value=''; }}
              style={{ ...inputStyle, flex: 1, color: '#D4A574' }}>
              <option value="">Tag person...</option>
              {allContacts.map((c, i) => <option key={i} value={c.username || c.name}>@{c.username || c.name} ({c.role})</option>)}
            </select>
          </div>
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
