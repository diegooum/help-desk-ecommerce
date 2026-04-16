import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Activos from './pages/Activos';
import Cambios from './pages/Cambios';
import Conocimiento from './pages/Conocimiento';
import Login from './pages/Login';
import { supabase } from './supabaseClient';

const NAV_ITEMS = [
  { to: '/',             icon: GridIcon,    label: 'Dashboard'                   },
  { to: '/tickets',      icon: TicketIcon,  label: 'Incidentes y Requerimientos' },
  { to: '/activos',      icon: ServerIcon,  label: 'Activos de TI'               },
  { to: '/cambios',      icon: RefreshIcon, label: 'Control de Cambios'          },
  { to: '/conocimiento', icon: BookIcon,    label: 'Base de Conocimiento'        },
];

export const ThemeContext = { dark: false };

function App() {
  const [dark, setDark] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Revisar si ya hay una sesión guardada al abrir la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cuando el usuario entra o sale
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Si no hay sesión, mostramos ÚNICAMENTE la pantalla de Login con el video HD
  if (!session) {
    return <Login onLoginSuccess={setSession} />;
  }

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
          --bg:             #FAFAFA;
          --surface:        #FFFFFF;
          --surface-2:      #F5F5F5;
          --surface-hover:  #F0F0F0;
          --border:         #E8E8E8;
          --border-strong:  #0A0A0A;
          --text-primary:   #0A0A0A;
          --text-secondary: #555555;
          --text-muted:     #999999;
          --sidebar-bg:     #FFFFFF;
          --sidebar-border: #E8E8E8;
          --sidebar-text:   #999999;
          --sidebar-hover:  #F5F5F5;
          --sidebar-active: #F5F5F5;
          --sidebar-accent: #0A0A0A;
          --accent:         #0A0A0A;
          --accent-hover:   #333333;
          --accent-dim:     #F0F0F0;
          --success:        #16A34A;
          --success-dim:    #F0FDF4;
          --warning:        #B45309;
          --warning-dim:    #FFFBEB;
          --danger:         #DC2626;
          --danger-dim:     #FEF2F2;
          --info:           #6D28D9;
          --info-dim:       #F5F3FF;
          --shadow-card:    none;
          --shadow-modal:   none;
          --overlay:        rgba(0,0,0,0.25);
        }

        [data-theme="dark"] {
          --bg:             #0F0F0F;
          --surface:        #1A1A1A;
          --surface-2:      #141414;
          --surface-hover:  #222222;
          --border:         #2A2A2A;
          --border-strong:  #888888;
          --text-primary:   #F0F0F0;
          --text-secondary: #AAAAAA;
          --text-muted:     #666666;
          --sidebar-bg:     #111111;
          --sidebar-border: #1E1E1E;
          --sidebar-text:   #555555;
          --sidebar-hover:  rgba(255,255,255,0.04);
          --sidebar-active: #1E1E1E;
          --sidebar-accent: #F0F0F0;
          --accent:         #FFFFFF;
          --accent-hover:   #DDDDDD;
          --accent-dim:     #1E1E1E;
          --success:        #22C55E;
          --success-dim:    #0A2A14;
          --warning:        #F59E0B;
          --warning-dim:    #2A1A00;
          --danger:         #EF4444;
          --danger-dim:     #2A0A0A;
          --info:           #A78BFA;
          --info-dim:       #1A0A3A;
          --shadow-card:    none;
          --shadow-modal:   none;
          --overlay:        rgba(0,0,0,0.6);
        }

        body {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── SHELL ── */
        .app-shell {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 220px;
          min-width: 220px;
          background: var(--sidebar-bg);
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--sidebar-border);
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sidebar::-webkit-scrollbar { display: none; }

        .sidebar-header {
          padding: 22px 18px 18px;
          border-bottom: 1px solid var(--sidebar-border);
        }

        .sidebar-logo {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-logo-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          line-height: 1.3;
        }

        .sidebar-logo-sub {
          font-size: 10.5px;
          color: var(--text-muted);
          font-family: var(--mono);
          letter-spacing: 0.02em;
        }

        .sidebar-section {
          padding: 18px 12px 8px;
          flex: 1;
        }

        .sidebar-section-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0 8px;
          margin-bottom: 6px;
        }

        .sidebar-nav {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 4px;
          font-size: 12.5px;
          font-weight: 400;
          color: var(--sidebar-text);
          text-decoration: none;
          transition: background 0.1s, color 0.1s;
          position: relative;
          letter-spacing: 0.01em;
          line-height: 1.3;
        }

        .nav-link:hover {
          background: var(--sidebar-hover);
          color: var(--text-primary);
        }

        .nav-link.active {
          background: var(--sidebar-active);
          color: var(--text-primary);
          font-weight: 500;
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 16px;
          background: var(--sidebar-accent);
          border-radius: 0 2px 2px 0;
        }

        .nav-link-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          opacity: 0.4;
        }

        .nav-link:hover .nav-link-icon { opacity: 0.7; }
        .nav-link.active .nav-link-icon { opacity: 1; }

        /* ── SIDEBAR FOOTER ── */
        .sidebar-footer {
          padding: 10px 12px 14px;
          border-top: 1px solid var(--sidebar-border);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 4px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          font-family: var(--font);
          transition: background 0.1s;
        }

        .theme-toggle:hover { background: var(--sidebar-hover); }

        .theme-toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--sidebar-text);
          font-weight: 400;
        }

        .toggle-track {
          width: 26px;
          height: 14px;
          border-radius: 99px;
          background: transparent;
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
          border: 1px solid var(--border-strong);
        }

        .toggle-track.on {
          background: var(--sidebar-accent);
          border-color: var(--sidebar-accent);
        }

        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-muted);
          transition: transform 0.2s, background 0.2s;
        }

        .toggle-track.on .toggle-thumb {
          transform: translateX(12px);
          background: var(--sidebar-bg);
        }

        .sidebar-footer-user {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.1s;
        }

        .sidebar-footer-user:hover { background: var(--sidebar-hover); }

        .user-avatar {
          width: 26px;
          height: 26px;
          border-radius: 4px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 600;
          color: var(--text-secondary);
          flex-shrink: 0;
          letter-spacing: 0.05em;
          font-family: var(--mono);
        }

        .user-name { font-size: 11.5px; font-weight: 500; color: var(--text-secondary); line-height: 1; }
        .user-role { font-size: 9px; color: var(--danger); font-family: var(--mono); margin-top: 2px; letter-spacing: 0.02em; }

        /* ── MAIN ── */
        .main-content {
          flex: 1;
          overflow-y: auto;
          background: var(--bg);
          min-width: 0;
        }

        /* ── SCROLLBAR ── */
        .main-content::-webkit-scrollbar { width: 4px; }
        .main-content::-webkit-scrollbar-track { background: transparent; }
        .main-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
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
              {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
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
              <div className="user-avatar">{session?.user?.email?.substring(0, 2).toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div className="user-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {session?.user?.email}
                </div>
                <div className="user-role">Cerrar sesión</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-content">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/tickets"      element={<Tickets />} />
            <Route path="/activos"      element={<Activos />} />
            <Route path="/cambios"      element={<Cambios />} />
            <Route path="/conocimiento" element={<Conocimiento />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

/* ── Icons ── */
function GridIcon({ className }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>;
}
function TicketIcon({ className }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1.5 1.5 0 0 0 0 3v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1.5 1.5 0 0 0 0-3V5z"/></svg>;
}
function ServerIcon({ className }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="2" width="13" height="4.5" rx="1"/><rect x="1.5" y="9.5" width="13" height="4.5" rx="1"/><circle cx="4.5" cy="4.25" r="0.6" fill="currentColor" stroke="none"/><circle cx="4.5" cy="11.75" r="0.6" fill="currentColor" stroke="none"/></svg>;
}
function RefreshIcon({ className }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 8A6.5 6.5 0 1 0 3.3 3.3"/><polyline points="1.5,1 1.5,4.5 5,4.5"/></svg>;
}
function BookIcon({ className }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3"/><line x1="3" y1="2" x2="3" y2="14"/><line x1="7" y1="6" x2="11" y2="6"/><line x1="7" y1="9" x2="11" y2="9"/></svg>;
}
function MoonIcon({ style }) {
  return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z"/></svg>;
}
function SunIcon({ style }) {
  return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.8"/><line x1="8" y1="1.5" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="14.5" y2="8"/><line x1="3.4" y1="3.4" x2="4.4" y2="4.4"/><line x1="11.6" y1="11.6" x2="12.6" y2="12.6"/><line x1="12.6" y1="3.4" x2="11.6" y2="4.4"/><line x1="4.4" y1="11.6" x2="3.4" y2="12.6"/></svg>;
}

export default App;