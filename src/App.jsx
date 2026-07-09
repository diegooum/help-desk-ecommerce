import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Activos from './pages/Activos';
import Cambios from './pages/Cambios';
import Conocimiento from './pages/Conocimiento';
import Login from './pages/Login';
import { supabase } from './supabaseClient';

const EMAILS_AGENTES = [
  'soporte.ti@utalca.cl',
  'csoledad@utalca.cl',
  'mvelis@utalca.cl',
  'mcastro@utalca.cl',
  'lbarra@utalca.cl'
];

const NAV_ITEMS = [
  { to: '/',             icon: GridIcon,    label: 'Dashboard',                   requiereAgente: true  },
  { to: '/tickets',      icon: TicketIcon,  label: 'Incidentes y Requerimientos', requiereAgente: false },
  { to: '/activos',      icon: ServerIcon,  label: 'Activos de TI',               requiereAgente: true  },
  { to: '/cambios',      icon: RefreshIcon, label: 'Control de Cambios',          requiereAgente: true  },
  { to: '/conocimiento', icon: BookIcon,    label: 'Base de Conocimiento',        requiereAgente: false },
];

export const ThemeContext = { dark: false };

function App() {
  const [dark, setDark] = useState(false);
  const [session, setSession] = useState(null);
  
  // ESTADOS NOTIFICACIONES
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) cargarNotificaciones(session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) cargarNotificaciones(session.user.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cargarNotificaciones = async (email) => {
    const { data } = await supabase.from('notificaciones').select('*').eq('usuario_destino', email).order('fecha_creacion', { ascending: false }).limit(20);
    if (data) setNotificaciones(data);

    supabase.channel('notifs_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_destino=eq.${email}` }, (payload) => {
        setNotificaciones(prev => [payload.new, ...prev]);
      }).subscribe();
  };

  const marcarComoLeida = async (id) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const marcarTodasLeidas = async () => {
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_destino', session?.user?.email);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const handleLogout = async () => await supabase.auth.signOut();

  if (!session) return <Login onLoginSuccess={setSession} />;

  const userEmail = session.user?.email;
  const esAgente = EMAILS_AGENTES.includes(userEmail);
  const unreadCount = notificaciones.filter(n => !n.leida).length;

  return (
    <Router>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; }
        :root {
          --font: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --mono: 'DM Mono', 'Courier New', Courier, monospace;
        }

        [data-theme="light"] {
          --brand: #9A0015; --brand-hover: #7A0010; --bg: #F8F9FA; --surface: #FFFFFF; --surface-2: #F0F2F5; --surface-hover: #F8F9FA;
          --border: #E5E7EB; --border-strong: #D1D5DB; --text-primary: #111827; --text-secondary: #4B5563; --text-muted: #9CA3AF;
          --sidebar-bg: #FFFFFF; --sidebar-border: #E5E7EB; --sidebar-text: #6B7280; --sidebar-hover: #FEF2F2; --sidebar-active: #FEF2F2;
          --sidebar-accent: #9A0015; --accent: #9A0015; --accent-hover: #7A0010; --accent-dim: #FEF2F2;
          --success: #16A34A; --warning: #D97706; --danger: #DC2626; --info: #4F46E5; --overlay: rgba(0,0,0,0.3);
        }

        [data-theme="dark"] {
          --brand: #E53935; --brand-hover: #EF5350; --bg: #0F1115; --surface: #16191F; --surface-2: #1F232B; --surface-hover: #1F232B;
          --border: #2D323B; --border-strong: #4B5563; --text-primary: #F3F4F6; --text-secondary: #9CA3AF; --text-muted: #6B7280;
          --sidebar-bg: #16191F; --sidebar-border: #2D323B; --sidebar-text: #9CA3AF; --sidebar-hover: rgba(229, 57, 53, 0.08);
          --sidebar-active: rgba(229, 57, 53, 0.12); --sidebar-accent: #E53935; --accent: #E53935; --accent-hover: #EF5350; --accent-dim: rgba(229, 57, 53, 0.15);
          --success: #22C55E; --warning: #F59E0B; --danger: #EF4444; --info: #6366F1; --overlay: rgba(0,0,0,0.7);
        }

        body { font-family: var(--font); background: var(--bg); color: var(--text-primary); }
        .btn-primary, .btn-submit { background-color: var(--brand) !important; border-color: var(--brand) !important; color: #FFFFFF !important; }
        .btn-primary:hover:not(:disabled), .btn-submit:hover:not(:disabled) { background-color: var(--brand-hover) !important; }
        .nav-link.active { color: var(--brand) !important; font-weight: 600 !important; }
        .nav-link.active .nav-link-icon { color: var(--brand) !important; }
        .toggle-track.on { background: var(--brand) !important; border-color: var(--brand) !important; }

        .app-shell { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
        .sidebar { width: 220px; min-width: 220px; background: var(--sidebar-bg); display: flex; flex-direction: column; border-right: 1px solid var(--sidebar-border); z-index: 50; }
        
        /* Modificaciones para incluir el Logo */
        .sidebar-header { padding: 22px 18px 18px; border-bottom: 1px solid var(--sidebar-border); display: flex; align-items: center; gap: 10px; }
        .sidebar-logo-img { width: 34px; height: 34px; object-fit: contain; flex-shrink: 0; }
        .sidebar-logo { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .sidebar-logo-title { font-size: 13px; font-weight: 700; color: var(--brand); letter-spacing: -0.01em; line-height: 1.3; text-transform: uppercase; white-space: nowrap; text-overflow: ellipsis; }
        .sidebar-logo-sub { font-size: 10.5px; color: var(--text-muted); font-family: var(--mono); letter-spacing: 0.02em; white-space: nowrap; text-overflow: ellipsis; }
        
        .sidebar-section { padding: 18px 12px 8px; flex: 1; overflow-y: auto; scrollbar-width: none; }
        .sidebar-section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); padding: 0 8px; margin-bottom: 6px; }
        .sidebar-nav { list-style: none; display: flex; flex-direction: column; gap: 2px; }
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 12.5px; font-weight: 500; color: var(--sidebar-text); text-decoration: none; transition: all 0.15s; position: relative; }
        .nav-link:hover { background: var(--sidebar-hover); color: var(--brand); }
        .nav-link.active { background: var(--sidebar-active); }
        .nav-link.active::before { content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%); width: 4px; height: 20px; background: var(--sidebar-accent); border-radius: 0 4px 4px 0; }
        .nav-link-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.6; transition: color 0.15s; }
        .nav-link:hover .nav-link-icon { opacity: 1; color: var(--brand); }
        .nav-link.active .nav-link-icon { opacity: 1; }

        .sidebar-footer { padding: 12px; border-top: 1px solid var(--sidebar-border); display: flex; flex-direction: column; gap: 4px; position: relative; }
        .theme-toggle { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 6px; cursor: pointer; border: none; background: none; width: 100%; font-family: var(--font); }
        .theme-toggle:hover { background: var(--surface-2); }
        .theme-toggle-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--sidebar-text); font-weight: 500; }
        .toggle-track { width: 32px; height: 18px; border-radius: 99px; background: var(--surface-2); position: relative; transition: all 0.2s; border: 1px solid var(--border-strong); }
        .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--text-muted); transition: all 0.2s; }
        .toggle-track.on .toggle-thumb { transform: translateX(14px); background: var(--surface); }

        .notif-btn { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; color: var(--sidebar-text); background: transparent; border: none; font-family: var(--font); font-size: 12px; font-weight: 500; width: 100%; }
        .notif-btn:hover { background: var(--surface-2); color: var(--text-primary); }
        .notif-badge { background: var(--brand); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 9px; font-weight: 700; margin-left: auto; }

        .notif-panel { position: absolute; bottom: 100%; left: 12px; width: 300px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-height: 400px; display: flex; flex-direction: column; overflow: hidden; z-index: 100; margin-bottom: 8px; }
        .notif-header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; }
        .notif-list { overflow-y: auto; flex: 1; }
        .notif-item { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
        .notif-item:hover { background: var(--surface-hover); }
        .notif-item.unread { background: var(--sidebar-hover); }
        
        .sidebar-footer-user { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
        .sidebar-footer-user:hover { background: var(--surface-2); }
        .user-avatar { width: 28px; height: 28px; border-radius: 6px; background: var(--brand); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
        .user-role { font-size: 9px; font-family: var(--mono); margin-top: 2px; letter-spacing: 0.04em; text-transform: uppercase; }

        .main-content { flex: 1; overflow-y: auto; background: var(--bg); min-width: 0; position: relative; }
      `}</style>

      <div className="app-shell" data-theme={dark ? 'dark' : 'light'}>
        <aside className="sidebar">
          
          {/* AQUÍ AÑADIMOS EL LOGO DINÁMICO DE LA UNIVERSIDAD */}
<div className="sidebar-header">
  <img 
    src={dark ? "/logo-utalca-blanco.png" : "/logo-utalca-negro.png"} 
    alt="UTalca" 
    className="sidebar-logo-img" 
    style={{ transition: 'all 0.3s ease' }}
  />
  <div className="sidebar-logo">
    <div className="sidebar-logo-title">Mesa de Ayuda</div>
    <div className="sidebar-logo-sub">Universidad de Talca</div>
  </div>
</div>

          <div className="sidebar-section">
            <p className="sidebar-section-label">Operaciones</p>
            <ul className="sidebar-nav">
              {NAV_ITEMS.filter(item => !item.requiereAgente || esAgente).map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <Icon className="nav-link-icon" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-footer">
            {mostrarNotifs && (
              <div className="notif-panel">
                <div className="notif-header">
                  <span>Notificaciones</span>
                  <button onClick={marcarTodasLeidas} style={{background:'none', border:'none', color:'var(--brand)', fontSize:11, cursor:'pointer'}}>Marcar leídas</button>
                </div>
                <div className="notif-list">
                  {notificaciones.length === 0 ? <div style={{padding:20, textAlign:'center', color:'var(--text-muted)', fontSize:12}}>No hay notificaciones</div> : 
                    notificaciones.map(n => (
                      <div key={n.id} className={`notif-item ${!n.leida ? 'unread' : ''}`} onClick={() => marcarComoLeida(n.id)}>
                        <div style={{fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4}}>{n.titulo}</div>
                        <div style={{fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3}}>{n.mensaje}</div>
                        
                        {/* HORA REPARADA CON CONVERSIÓN UTC -> LOCAL (24h) */}
                        <div style={{fontSize: 9, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--mono)'}}>
                          {new Date(n.fecha_creacion + (!n.fecha_creacion.endsWith('Z') ? 'Z' : '')).toLocaleString([], {
                            year: 'numeric', month: '2-digit', day: '2-digit', 
                            hour: '2-digit', minute:'2-digit', hour12: false
                          })}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            <button className="notif-btn" onClick={() => setMostrarNotifs(!mostrarNotifs)}>
              <BellIcon style={{width: 15, height: 15}} /> Avisos
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            <button className="theme-toggle" onClick={() => setDark(d => !d)}>
              <span className="theme-toggle-label">
                {dark ? <SunIcon style={{ width: 13, height: 13 }} /> : <MoonIcon style={{ width: 13, height: 13 }} />}
                <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
              </span>
              <div className={`toggle-track${dark ? ' on' : ''}`}><div className="toggle-thumb" /></div>
            </button>

            <div className="sidebar-footer-user" onClick={handleLogout} title="Cerrar sesión">
              <div className="user-avatar">{userEmail?.substring(0, 2).toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div className="user-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userEmail}</div>
                <div className="user-role" style={{ color: esAgente ? 'var(--info)' : 'var(--danger)' }}>{esAgente ? 'Agente TI' : 'Cerrar Sesión'}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-content" onClick={() => setMostrarNotifs(false)}>
          <Routes>
            <Route path="/"             element={esAgente ? <Dashboard /> : <Navigate to="/tickets" replace />} />
            <Route path="/tickets"      element={<Tickets />} />
            <Route path="/activos"      element={esAgente ? <Activos /> : <Navigate to="/tickets" replace />} />
            <Route path="/cambios"      element={esAgente ? <Cambios /> : <Navigate to="/tickets" replace />} />
            <Route path="/conocimiento" element={<Conocimiento />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function GridIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>; }
function TicketIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1.5 1.5 0 0 0 0 3v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1.5 1.5 0 0 0 0-3V5z"/></svg>; }
function ServerIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2" width="13" height="4.5" rx="1"/><rect x="1.5" y="9.5" width="13" height="4.5" rx="1"/><circle cx="4.5" cy="4.25" r="0.6" fill="currentColor" stroke="none"/><circle cx="4.5" cy="11.75" r="0.6" fill="currentColor" stroke="none"/></svg>; }
function RefreshIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 8A6.5 6.5 0 1 0 3.3 3.3"/><polyline points="1.5,1 1.5,4.5 5,4.5"/></svg>; }
function BookIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3"/><line x1="3" y1="2" x2="3" y2="14"/><line x1="7" y1="6" x2="11" y2="6"/><line x1="7" y1="9" x2="11" y2="9"/></svg>; }
function MoonIcon({ style }) { return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z"/></svg>; }
function SunIcon({ style }) { return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.8"/><line x1="8" y1="1.5" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="14.5" y2="8"/><line x1="3.4" y1="3.4" x2="4.4" y2="4.4"/><line x1="11.6" y1="11.6" x2="12.6" y2="12.6"/><line x1="12.6" y1="3.4" x2="11.6" y2="4.4"/><line x1="4.4" y1="11.6" x2="3.4" y2="12.6"/></svg>; }
function BellIcon({ style }) { return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>; }

export default App;