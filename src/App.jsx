import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Activos from './pages/Activos';
import Cambios from './pages/Cambios';
import Conocimiento from './pages/Conocimiento';

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

  return (
    <Router>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root { height: 100%; width: 100%; }

        :root {
          --font: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          --mono: 'Courier New', Courier, monospace;
        }

        [data-theme="light"] {
          --bg:             #eef1f6;
          --surface:        #ffffff;
          --surface-2:      #f8fafc;
          --surface-hover:  #f1f5f9;
          --border:         #dde3ec;
          --border-strong:  #c4cfd e;
          --text-primary:   #0c1a2e;
          --text-secondary: #3d5473;
          --text-muted:     #8499b4;
          --sidebar-bg:     #0b1422;
          --sidebar-border: #141f30;
          --sidebar-text:   #4a617a;
          --sidebar-hover:  rgba(255,255,255,0.04);
          --sidebar-active: #0e2040;
          --sidebar-accent: #3b82f6;
          --accent:         #2563eb;
          --accent-hover:   #1d4ed8;
          --accent-dim:     #eff6ff;
          --success:        #059669;
          --success-dim:    #ecfdf5;
          --warning:        #d97706;
          --warning-dim:    #fffbeb;
          --danger:         #dc2626;
          --danger-dim:     #fef2f2;
          --info:           #6d28d9;
          --info-dim:       #f5f3ff;
          --shadow-card:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-modal:   0 20px 60px rgba(0,0,0,0.15);
          --overlay:        rgba(15,23,42,0.5);
        }

        [data-theme="dark"] {
          --bg:             #07101c;
          --surface:        #0e1d2e;
          --surface-2:      #0a1524;
          --surface-hover:  #132031;
          --border:         #1a2d42;
          --border-strong:  #243d57;
          --text-primary:   #dce8f5;
          --text-secondary: #7a9bbf;
          --text-muted:     #3d5473;
          --sidebar-bg:     #050e18;
          --sidebar-border: #0e1d2e;
          --sidebar-text:   #3d5473;
          --sidebar-hover:  rgba(255,255,255,0.03);
          --sidebar-active: #0a1f38;
          --sidebar-accent: #3b82f6;
          --accent:         #3b82f6;
          --accent-hover:   #2563eb;
          --accent-dim:     #0a1f38;
          --success:        #10b981;
          --success-dim:    #041f12;
          --warning:        #f59e0b;
          --warning-dim:    #1f1303;
          --danger:         #f87171;
          --danger-dim:     #200606;
          --info:           #a78bfa;
          --info-dim:       #12083a;
          --shadow-card:    0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
          --shadow-modal:   0 20px 60px rgba(0,0,0,0.6);
          --overlay:        rgba(3,8,16,0.75);
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
          width: 218px;
          min-width: 218px;
          background: var(--sidebar-bg);
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--sidebar-border);
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sidebar::-webkit-scrollbar { display: none; }

        .sidebar-header {
          padding: 18px 14px 15px;
          border-bottom: 1px solid var(--sidebar-border);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-logo-mark {
          width: 30px;
          height: 30px;
          background: var(--accent);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-logo-mark svg {
          width: 15px;
          height: 15px;
          stroke: white;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .sidebar-logo-title {
          font-size: 11px;
          font-weight: 700;
          color: #c8d8eb;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          line-height: 1.3;
        }

        .sidebar-logo-sub {
          font-size: 9.5px;
          color: #1e3a5f;
          font-family: var(--mono);
          letter-spacing: 0.03em;
          margin-top: 1px;
        }

        .sidebar-section {
          padding: 16px 8px 8px;
          flex: 1;
        }

        .sidebar-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #1a2d42;
          padding: 0 8px;
          margin-bottom: 5px;
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
          gap: 9px;
          padding: 7px 10px;
          border-radius: 5px;
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
          color: #6b8aaa;
        }

        .nav-link.active {
          background: var(--sidebar-active);
          color: #c8d8eb;
          font-weight: 500;
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2.5px;
          height: 14px;
          background: var(--sidebar-accent);
          border-radius: 0 2px 2px 0;
        }

        .nav-link-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          opacity: 0.5;
        }

        .nav-link:hover .nav-link-icon { opacity: 0.7; }
        .nav-link.active .nav-link-icon { opacity: 1; }

        /* ── SIDEBAR FOOTER ── */
        .sidebar-footer {
          padding: 10px 8px 12px;
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
          border-radius: 5px;
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
          color: #2d4460;
          font-weight: 400;
        }

        .toggle-track {
          width: 28px;
          height: 16px;
          border-radius: 99px;
          background: #141f30;
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
          border: 1px solid #1a2d42;
        }

        .toggle-track.on { background: var(--accent); border-color: var(--accent); }

        .toggle-thumb {
          position: absolute;
          top: 1.5px;
          left: 1.5px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #2a3f57;
          transition: transform 0.2s, background 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .toggle-track.on .toggle-thumb { transform: translateX(12px); background: white; }

        .sidebar-footer-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.1s;
        }

        .sidebar-footer-user:hover { background: var(--sidebar-hover); }

        .user-avatar {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #0e2040;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9.5px;
          font-weight: 700;
          color: #4a90d9;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }

        .user-name { font-size: 11.5px; font-weight: 500; color: #3d5473; line-height: 1; }
        .user-role { font-size: 9px; color: #1e3a5f; font-family: var(--mono); margin-top: 2px; }

        /* ── MAIN ── */
        .main-content {
          flex: 1;
          overflow-y: auto;
          background: var(--bg);
          min-width: 0;
        }

        /* ── SCROLLBAR ── */
        .main-content::-webkit-scrollbar { width: 6px; }
        .main-content::-webkit-scrollbar-track { background: transparent; }
        .main-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .main-content::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
      `}</style>

      <div className="app-shell" data-theme={dark ? 'dark' : 'light'}>
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-mark">
                <svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
              </div>
              <div>
                <div className="sidebar-logo-title">Mesa de Ayuda</div>
                <div className="sidebar-logo-sub">E-commerce Ops</div>
              </div>
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
                <span style={{ color: '#2d4460', fontSize: 12 }}>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
              </span>
              <div className={`toggle-track${dark ? ' on' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </button>

            <div className="sidebar-footer-user">
              <div className="user-avatar">OP</div>
              <div>
                <div className="user-name">Operador TI</div>
                <div className="user-role">admin</div>
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
  return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="#2d4460" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z"/></svg>;
}
function SunIcon({ style }) {
  return <svg style={style} viewBox="0 0 16 16" fill="none" stroke="#2d4460" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.8"/><line x1="8" y1="1.5" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="14.5" y2="8"/><line x1="3.4" y1="3.4" x2="4.4" y2="4.4"/><line x1="11.6" y1="11.6" x2="12.6" y2="12.6"/><line x1="12.6" y1="3.4" x2="11.6" y2="4.4"/><line x1="4.4" y1="11.6" x2="3.4" y2="12.6"/></svg>;
}

export default App;