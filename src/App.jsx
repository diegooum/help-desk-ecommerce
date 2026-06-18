import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Activos from './pages/Activos';
import Cambios from './pages/Cambios';
import Conocimiento from './pages/Conocimiento';
import Login from './pages/Login';
import { supabase } from './supabaseClient';

// 1. LISTA OFICIAL DE AGENTES (RBAC)
const EMAILS_AGENTES = [
  'soporte.ti@utalca.cl',
  'csoledad@utalca.cl',
  'mvelis@utalca.cl',
  'mcastro@utalca.cl',
  'lbarra@utalca.cl'
];

// 2. CONFIGURACIÓN DEL MENÚ (Agregamos la propiedad "requiereAgente")
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Login onLoginSuccess={setSession} />;
  }

  // 3. IDENTIFICAR ROL DEL USUARIO ACTUAL
  const userEmail = session.user?.email;
  const esAgente = EMAILS_AGENTES.includes(userEmail);

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

        /* ── TEMA CLARO (COLORES INSTITUCIONALES) ── */
        [data-theme="light"] {
          --brand:          #9A0015; /* Rojo UTalca Oficial */
          --brand-hover:    #7A0010;
          --bg:             #F8F9FA;
          --surface:        #FFFFFF;
          --surface-2:      #F0F2F5;
          --surface-hover:  #F8F9FA;
          --border:         #E5E7EB;
          --border-strong:  #D1D5DB;
          --text-primary:   #111827;
          --text-secondary: #4B5563;
          --text-muted:     #9CA3AF;
          --sidebar-bg:     #FFFFFF;
          --sidebar-border: #E5E7EB;
          --sidebar-text:   #6B7280;
          --sidebar-hover:  #FEF2F2; /* Fondo rojizo suave al pasar el mouse */
          --sidebar-active: #FEF2F2;
          --sidebar-accent: #9A0015; /* Línea indicadora roja */
          --accent:         #9A0015;
          --accent-hover:   #7A0010;
          --accent-dim:     #FEF2F2;
          --success:        #16A34A;
          --success-dim:    #F0FDF4;
          --warning:        #D97706;
          --warning-dim:    #FFFBEB;
          --danger:         #DC2626;
          --danger-dim:     #FEF2F2;
          --info:           #4F46E5;
          --info-dim:       #EEF2FF;
          --overlay:        rgba(0,0,0,0.3);
        }

        /* ── TEMA OSCURO (MODO NOCHE ELEGANTE) ── */
        [data-theme="dark"] {
          --brand:          #E53935; /* Rojo más brillante para contraste en negro */
          --brand-hover:    #EF5350;
          --bg:             #0F1115;
          --surface:        #16191F;
          --surface-2:      #1F232B;
          --surface-hover:  #1F232B;
          --border:         #2D323B;
          --border-strong:  #4B5563;
          --text-primary:   #F3F4F6;
          --text-secondary: #9CA3AF;
          --text-muted:     #6B7280;
          --sidebar-bg:     #16191F;
          --sidebar-border: #2D323B;
          --sidebar-text:   #9CA3AF;
          --sidebar-hover:  rgba(229, 57, 53, 0.08);
          --sidebar-active: rgba(229, 57, 53, 0.12);
          --sidebar-accent: #E53935;
          --accent:         #E53935;
          --accent-hover:   #EF5350;
          --accent-dim:     rgba(229, 57, 53, 0.15);
          --success:        #22C55E;
          --success-dim:    #052E16;
          --warning:        #F59E0B;
          --warning-dim:    #451A03;
          --danger:         #EF4444;
          --danger-dim:     #450A0A;
          --info:           #6366F1;
          --info-dim:       #1E1B4B;
          --overlay:        rgba(0,0,0,0.7);
        }

        body {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── INYECCIÓN GLOBAL PARA BOTONES Y LINKS ── 
           Esto fuerza a que todos los botones principales de tus otras 
           pantallas adopten el rojo institucional sin tener que editarlos. */
        .btn-primary, .btn-submit {
          background-color: var(--brand) !important;
          border-color: var(--brand) !important;
          color: #FFFFFF !important;
        }
        .btn-primary:hover:not(:disabled), .btn-submit:hover:not(:disabled) {
          background-color: var(--brand-hover) !important;
        }
        .nav-link.active {
          color: var(--brand) !important;
          font-weight: 600 !important;
        }
        .nav-link.active .nav-link-icon {
          color: var(--brand) !important;
        }
        .toggle-track.on {
          background: var(--brand) !important;
          border-color: var(--brand) !important;
        }

        /* ── SHELL ── */
        .app-shell { display: flex; height: 100vh; width: 100vw; overflow: hidden; }

        /* ── SIDEBAR ── */
        .sidebar { width: 220px; min-width: 220px; background: var(--sidebar-bg); display: flex; flex-direction: column; border-right: 1px solid var(--sidebar-border); overflow-y: auto; scrollbar-width: none; }
        .sidebar::-webkit-scrollbar { display: none; }
        .sidebar-header { padding: 22px 18px 18px; border-bottom: 1px solid var(--sidebar-border); }
        .sidebar-logo { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-logo-title { font-size: 13px; font-weight: 700; color: var(--brand); letter-spacing: -0.01em; line-height: 1.3; text-transform: uppercase; }
        .sidebar-logo-sub { font-size: 10.5px; color: var(--text-muted); font-family: var(--mono); letter-spacing: 0.02em; }
        
        .sidebar-section { padding: 18px 12px 8px; flex: 1; }
        .sidebar-section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); padding: 0 8px; margin-bottom: 6px; }
        .sidebar-nav { list-style: none; display: flex; flex-direction: column; gap: 2px; }
        
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 12.5px; font-weight: 500; color: var(--sidebar-text); text-decoration: none; transition: all 0.15s; position: relative; letter-spacing: 0.01em; line-height: 1.3; }
        .nav-link:hover { background: var(--sidebar-hover); color: var(--brand); }
        .nav-link.active { background: var(--sidebar-active); }
        .nav-link.active::before { content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%); width: 4px; height: 20px; background: var(--sidebar-accent); border-radius: 0 4px 4px 0; }
        
        .nav-link-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.6; transition: color 0.15s; }
        .nav-link:hover .nav-link-icon { opacity: 1; color: var(--brand); }
        .nav-link.active .nav-link-icon { opacity: 1; }

        /* ── SIDEBAR FOOTER ── */
        .sidebar-footer { padding: 12px; border-top: 1px solid var(--sidebar-border); display: flex; flex-direction: column; gap: 4px; }
        .theme-toggle { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 6px; cursor: pointer; border: none; background: none; width: 100%; font-family: var(--font); transition: background 0.15s; }
        .theme-toggle:hover { background: var(--surface-2); }
        .theme-toggle-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--sidebar-text); font-weight: 500; }
        
        .toggle-track { width: 32px; height: 18px; border-radius: 99px; background: var(--surface-2); position: relative; transition: all 0.2s; flex-shrink: 0; border: 1px solid var(--border-strong); }
        .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--text-muted); transition: all 0.2s; }
        .toggle-track.on .toggle-thumb { transform: translateX(14px); background: var(--surface); }

        .sidebar-footer-user { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
        .sidebar-footer-user:hover { background: var(--surface-2); }
        .user-avatar { width: 28px; height: 28px; border-radius: 6px; background: var(--brand); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; letter-spacing: 0.05em; font-family: var(--mono); }
        .user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
        .user-role { font-size: 9px; font-family: var(--mono); margin-top: 2px; letter-spacing: 0.04em; text-transform: uppercase; }

        /* ── MAIN ── */
        .main-content { flex: 1; overflow-y: auto; background: var(--bg); min-width: 0; position: relative; }
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: transparent; }
        .main-content::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 10px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
      `}</style>

      <div className="app-shell" data-theme={dark ? 'dark' : 'light'}>
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-title">Mesa de Ayuda</div>
              <div className="sidebar-logo-sub">Universidad de Talca</div>
            </div>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-section-label">Operaciones</p>
            <ul className="sidebar-nav">
              {/* 4. FILTRAR MENÚ LATERAL: Oculta los links de admin si no es Agente */}
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
            <button className="theme-toggle" onClick={() => setDark(d => !d)}>
              <span className="theme-toggle-label">
                {dark
                  ? <SunIcon style={{ width: 13, height: 13 }} />
                  : <MoonIcon style={{ width: 13, height: 13 }} />
                }
                <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
              </span>
              <div className={`toggle-track${dark ? ' on' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </button>

            <div className="sidebar-footer-user" onClick={handleLogout} title="Hacer clic para cerrar sesión">
              <div className="user-avatar">{userEmail?.substring(0, 2).toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div className="user-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {userEmail}
                </div>
                <div className="user-role" style={{ color: esAgente ? 'var(--info)' : 'var(--danger)' }}>
                  {esAgente ? 'Agente TI' : 'Cerrar Sesión'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-content">
          <Routes>
            {/* 5. PROTECCIÓN DE RUTAS: Redirecciona a los usuarios no autorizados a la vista de Tickets */}
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

/* ── Icons ── */
function GridIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>; }
function TicketIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1.5 1.5 0 0 0 0 3v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1.5 1.5 0 0 0 0-3V5z"/></svg>; }
function ServerIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2" width="13" height="4.5" rx="1"/><rect x="1.5" y="9.5" width="13" height="4.5" rx="1"/><circle cx="4.5" cy="4.25" r="0.6" fill="currentColor" stroke="none"/><circle cx="4.5" cy="11.75" r="0.6" fill="currentColor" stroke="none"/></svg>; }
function RefreshIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 8A6.5 6.5 0 1 0 3.3 3.3"/><polyline points="1.5,1 1.5,4.5 5,4.5"/></svg>; }
function BookIcon({ className }) { return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3"/><line x1="3" y1="2" x2="3" y2="14"/><line x1="7" y1="6" x2="11" y2="6"/><line x1="7" y1="9" x2="11" y2="9"/></svg>; }
function MoonIcon({ style }) { return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z"/></svg>; }
function SunIcon({ style }) { return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.8"/><line x1="8" y1="1.5" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="14.5" y2="8"/><line x1="3.4" y1="3.4" x2="4.4" y2="4.4"/><line x1="11.6" y1="11.6" x2="12.6" y2="12.6"/><line x1="12.6" y1="3.4" x2="11.6" y2="4.4"/><line x1="4.4" y1="11.6" x2="3.4" y2="12.6"/></svg>; }

export default App;