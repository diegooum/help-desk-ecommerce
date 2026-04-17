/**
 * Login.jsx — Service Desk · Redesign Editorial
 * Aesthetic: Ultra-minimalist, split-screen typographic layout
 */

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

/* ─────────────────────────────────────────────
   Error types — each has its own UX copy
───────────────────────────────────────────── */
const ERROR_TYPES = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_401',
    title: 'Credenciales incorrectas',
    detail: 'El ID de operador o el código de acceso no son válidos.',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="mc-err-icon">
        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
        <path d="M8 7V9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
      </svg>
    ),
  },
  NETWORK_ERROR: {
    code: 'NET_503',
    title: 'Sin conexión al servidor',
    detail: 'No se pudo alcanzar el servicio de autenticación. Verifique su red.',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="mc-err-icon">
        <path d="M2 4L14 12M14 4L2 12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  ACCOUNT_LOCKED: {
    code: 'AUTH_423',
    title: 'Cuenta bloqueada',
    detail: 'Demasiados intentos fallidos. Contacte a soporte para desbloquear.',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="mc-err-icon">
        <rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5 7V5.5a3 3 0 016 0V7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="8" cy="10.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
};

/* ─────────────────────────────────────────────
   Classify Supabase/network errors
───────────────────────────────────────────── */
function classifyError(error) {
  if (!error) return null;
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('too many') || msg.includes('locked')) return ERROR_TYPES.ACCOUNT_LOCKED;
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('unable')) return ERROR_TYPES.NETWORK_ERROR;
  return ERROR_TYPES.INVALID_CREDENTIALS;
}

/* ─────────────────────────────────────────────
   FloatingInput
───────────────────────────────────────────── */
function FloatingInput({ id, label, type = 'text', value, onChange, autoComplete, required }) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className={`mc-field ${focused ? 'mc-field--focused' : ''} ${lifted ? 'mc-field--lifted' : ''}`}>
      <label htmlFor={id} className="mc-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        className="mc-input"
        aria-label={label}
      />
      <div className="mc-input-line" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   ErrorBanner
───────────────────────────────────────────── */
function ErrorBanner({ errorType }) {
  if (!errorType) return null;
  return (
    <div className="mc-error" role="alert" aria-live="assertive">
      <div className="mc-error__header">
        {errorType.icon}
        <span className="mc-error__code">{errorType.code}</span>
        <span className="mc-error__title">{errorType.title}</span>
      </div>
      <p className="mc-error__detail">{errorType.detail}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Login Component
───────────────────────────────────────────── */
function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorType(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        setSuccess(true);
        setTimeout(() => onLoginSuccess(data.session), 700);
      }
    } catch (error) {
      setErrorType(classifyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --mc-bg:           #FFFFFF;
          --mc-panel-bg:     #FAFAFA;
          --mc-left-bg:      #0A0A0A;
          --mc-border:       #E8E8E8;
          --mc-border-focus: #0A0A0A;
          --mc-text-primary: #0A0A0A;
          --mc-text-muted:   #999999;
          --mc-text-dim:     #CCCCCC;
          --mc-accent:       #0A0A0A;
          --mc-accent-hover: #333333;
          --mc-error:        #DC2626;
          --mc-error-bg:     #FEF2F2;
          --mc-error-border: #FECACA;
          --mc-success:      #16A34A;
          --mc-mono:         'DM Mono', 'Courier New', monospace;
          --mc-sans:         'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          --mc-transition:   0.18s ease;
        }

        body, html, #root {
          height: 100%;
          width: 100%;
        }

        .mc-root {
          display: flex;
          width: 100vw;
          height: 100vh;
          font-family: var(--mc-sans);
          background: var(--mc-bg);
          -webkit-font-smoothing: antialiased;
        }

        /* ── LEFT PANEL (Editorial Statement) ── */
        .mc-left {
          flex: 1;
          background: var(--mc-left-bg);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          overflow: hidden;
          position: relative;
        }

        .mc-left-top {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mc-left-tag {
          font-family: var(--mc-mono);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }

        .mc-left-brand {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          letter-spacing: -0.01em;
        }

        .mc-left-center {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mc-left-headline {
          font-size: clamp(44px, 5.5vw, 72px);
          font-weight: 300;
          line-height: 1.05;
          letter-spacing: -0.035em;
          color: #FFFFFF;
        }

        .mc-left-headline em {
          font-style: italic;
          font-weight: 300;
          color: rgba(255,255,255,0.5);
        }

        .mc-left-desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
          color: rgba(255,255,255,0.4);
          max-width: 320px;
        }

        .mc-left-bottom {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mc-left-divider {
          width: 32px;
          height: 1px;
          background: rgba(255,255,255,0.15);
          margin-bottom: 8px;
        }

        .mc-left-footer-label {
          font-family: var(--mc-mono);
          font-size: 9.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
        }

        /* ── RIGHT PANEL (Form) ── */
        .mc-right {
          width: 440px;
          min-width: 440px;
          background: var(--mc-bg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 52px;
          border-left: 1px solid var(--mc-border);
        }

        .mc-header {
          margin-bottom: 40px;
        }

        .mc-eyebrow {
          font-family: var(--mc-mono);
          font-size: 9.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--mc-text-muted);
          margin-bottom: 12px;
        }

        .mc-title {
          font-size: 26px;
          font-weight: 500;
          letter-spacing: -0.025em;
          color: var(--mc-text-primary);
          line-height: 1.2;
          margin-bottom: 8px;
        }

        .mc-subtitle {
          font-size: 13px;
          color: var(--mc-text-muted);
          font-weight: 400;
          line-height: 1.5;
        }

        /* ── FORM ── */
        .mc-form {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .mc-field {
          position: relative;
          padding-top: 20px;
        }

        .mc-label {
          position: absolute;
          top: 20px;
          left: 0;
          font-family: var(--mc-mono);
          font-size: 13px;
          color: var(--mc-text-muted);
          letter-spacing: 0.02em;
          pointer-events: none;
          transition: top var(--mc-transition), font-size var(--mc-transition), color var(--mc-transition), letter-spacing var(--mc-transition);
          transform-origin: left top;
        }

        .mc-field--lifted .mc-label {
          top: 0;
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--mc-text-dim);
        }

        .mc-field--focused .mc-label {
          color: var(--mc-text-primary);
        }

        .mc-input {
          width: 100%;
          background: transparent;
          border: none;
          border-radius: 0;
          outline: none;
          color: var(--mc-text-primary);
          font-family: var(--mc-sans);
          font-size: 15px;
          font-weight: 400;
          letter-spacing: -0.01em;
          padding: 6px 0 10px;
          caret-color: var(--mc-text-primary);
        }

        .mc-input::placeholder { color: transparent; }

        .mc-input:-webkit-autofill,
        .mc-input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--mc-text-primary);
          -webkit-box-shadow: 0 0 0 1000px transparent inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .mc-input-line {
          height: 1px;
          background: var(--mc-border);
          transition: background var(--mc-transition), height var(--mc-transition);
        }

        .mc-field--focused .mc-input-line {
          background: var(--mc-border-focus);
          height: 1.5px;
        }

        /* ── ERROR ── */
        .mc-error {
          background: var(--mc-error-bg);
          border: 1px solid var(--mc-error-border);
          border-radius: 4px;
          padding: 12px 14px;
          animation: mc-shake 0.35s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes mc-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-4px); }
          40%       { transform: translateX(4px); }
          60%       { transform: translateX(-2px); }
          80%       { transform: translateX(2px); }
        }

        .mc-error__header {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 4px;
        }

        .mc-err-icon {
          width: 13px;
          height: 13px;
          color: var(--mc-error);
          flex-shrink: 0;
        }

        .mc-error__code {
          font-family: var(--mc-mono);
          font-size: 9.5px;
          letter-spacing: 0.1em;
          color: var(--mc-error);
          opacity: 0.65;
          flex-shrink: 0;
        }

        .mc-error__title {
          font-size: 12.5px;
          font-weight: 500;
          color: var(--mc-error);
        }

        .mc-error__detail {
          font-size: 11.5px;
          color: var(--mc-error);
          opacity: 0.7;
          line-height: 1.5;
          padding-left: 20px;
        }

        /* ── BUTTON ── */
        .mc-btn {
          position: relative;
          width: 100%;
          padding: 14px 20px;
          margin-top: 4px;
          background: var(--mc-accent);
          color: #FFFFFF;
          border: 1px solid var(--mc-accent);
          border-radius: 4px;
          font-family: var(--mc-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background var(--mc-transition), opacity var(--mc-transition);
          overflow: hidden;
        }

        .mc-btn:hover:not(:disabled) {
          background: var(--mc-accent-hover);
          border-color: var(--mc-accent-hover);
        }

        .mc-btn:active:not(:disabled) { opacity: 0.8; }
        .mc-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .mc-btn:focus-visible {
          outline: 2px solid var(--mc-accent);
          outline-offset: 3px;
        }

        .mc-btn--success {
          background: var(--mc-success) !important;
          border-color: var(--mc-success) !important;
          pointer-events: none;
        }

        .mc-spinner {
          display: inline-block;
          width: 10px;
          height: 10px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: mc-spin 0.7s linear infinite;
          vertical-align: -1px;
          margin-right: 8px;
        }

        @keyframes mc-spin { to { transform: rotate(360deg); } }

        /* ── FOOTER ── */
        .mc-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid var(--mc-border);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .mc-footer-text {
          font-family: var(--mc-mono);
          font-size: 9.5px;
          letter-spacing: 0.08em;
          color: var(--mc-text-muted);
          text-transform: uppercase;
          line-height: 1.7;
        }

        .mc-footer-link {
          font-family: var(--mc-mono);
          font-size: 9.5px;
          color: var(--mc-text-muted);
          text-decoration: none;
          letter-spacing: 0.06em;
          transition: color var(--mc-transition);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .mc-footer-link:hover { color: var(--mc-text-primary); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .mc-left { display: none; }
          .mc-right {
            width: 100%;
            min-width: unset;
            padding: 48px 28px;
            border-left: none;
          }
        }

        @media (max-width: 480px) {
          .mc-right { padding: 40px 24px; }
          .mc-title { font-size: 22px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="mc-root">

        {/* ── LEFT: Editorial Statement ── */}
        <div className="mc-left" aria-hidden="true">
          <div className="mc-left-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <img
              src="/corporativo_web1.png"
              alt="Logo Corporativo Universidad de Talca"
              style={{ maxWidth: '350px', width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
    

          <div className="mc-left-center">
            <h1 className="mc-left-headline">
              Mesa de Servicios<br />
              <em>Utalca</em>
            </h1>
            <p className="mc-left-desc">
              Plataforma centralizada para la gestión de incidentes, requerimientos y activos tecnológicos institucionales.
            </p>
          </div>

          <div className="mc-left-bottom">
            <div className="mc-left-divider" />
            <span className="mc-left-footer-label">Acceso restringido · Solo personal autorizado</span>
            <span className="mc-left-footer-label">TLS 1.3 · Sesión cifrada</span>
          </div>
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <main className="mc-right" role="main">
          <header className="mc-header">
            <p className="mc-eyebrow">Autenticación de acceso</p>
            <h2 className="mc-title">Iniciar sesión</h2>
            <p className="mc-subtitle">Ingrese sus credenciales institucionales</p>
          </header>

          <form
            className="mc-form"
            onSubmit={handleLogin}
            noValidate
            aria-label="Formulario de autenticación"
          >
            <ErrorBanner errorType={errorType} />

            <FloatingInput
              id="mc-email"
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />

            <FloatingInput
              id="mc-password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              className={`mc-btn${success ? ' mc-btn--success' : ''}`}
              disabled={loading || success || !email || !password}
              aria-busy={loading}
              aria-label={loading ? 'Autenticando, por favor espere' : 'Iniciar sesión'}
            >
              {loading && <span className="mc-spinner" aria-hidden="true" />}
              {success ? '✓ SESIÓN INICIADA' : loading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          <footer className="mc-footer">
            <p className="mc-footer-text">
              Acceso restringido.<br />
              Personal Administrativo y Académico.
            </p>
            <a href="mailto:soporte@utalca.cl" className="mc-footer-link">
              Contactar soporte →
            </a>
          </footer>
        </main>
      </div>
    </>
  );
}

export default Login;