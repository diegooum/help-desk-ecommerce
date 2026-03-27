/**
 * Login.jsx — Mission Control · Redesign v2
 * Aesthetic: Tactical Enterprise (dark, precise, technical) + Video HD Background
 * Typography: IBM Plex Mono (labels/data) + IBM Plex Sans (body)
 */

import React, { useState, useEffect, useRef } from 'react';
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
   Animated grid background (Canvas)
───────────────────────────────────────────── */
function GridCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const COLS = 28;
    const ROWS = 18;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cw = w / COLS;
      const ch = h / ROWS;

      for (let col = 0; col <= COLS; col++) {
        for (let row = 0; row <= ROWS; row++) {
          const x = col * cw;
          const y = row * ch;

          const wave = Math.sin(t * 0.018 + col * 0.4 + row * 0.3);
          const alpha = 0.04 + 0.06 * ((wave + 1) / 2);

          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
          ctx.fill();
        }
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
      ctx.lineWidth = 0.5;
      for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * cw, 0);
        ctx.lineTo(col * cw, h);
        ctx.stroke();
      }
      for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * ch);
        ctx.lineTo(w, row * ch);
        ctx.stroke();
      }

      t++;
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="mc-canvas" aria-hidden="true" />;
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
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

        :root {
          --mc-bg:          #060b14;
          --mc-surface:     rgba(10, 17, 31, 0.72);
          --mc-border:      rgba(148, 163, 184, 0.12);
          --mc-border-focus:rgba(56, 139, 253, 0.75);
          --mc-text-primary:#e2e8f0;
          --mc-text-muted:  #64748b;
          --mc-text-dim:    #334155;
          --mc-accent:      #2563eb;
          --mc-accent-hover:#1d4ed8;
          --mc-accent-glow: rgba(37, 99, 235, 0.25);
          --mc-error:       #ef4444;
          --mc-error-bg:    rgba(239, 68, 68, 0.06);
          --mc-error-border:rgba(239, 68, 68, 0.3);
          --mc-success:     #22c55e;
          --mc-mono:        'IBM Plex Mono', 'Courier New', monospace;
          --mc-sans:        'IBM Plex Sans', system-ui, sans-serif;
          --mc-radius:      10px;
          --mc-radius-sm:   6px;
          --mc-transition:  0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mc-root {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--mc-bg);
          font-family: var(--mc-sans);
        }

        /* ── VIDEO HD BACKGROUND ── */
        .mc-video {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          transform: translate(-50%, -50%);
          z-index: 0;
          opacity: 0.35; /* Oscurecido para no opacar el panel */
        }

        .mc-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1; /* Encima del video */
        }

        .mc-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37,99,235,0.07) 0%, transparent 70%);
          z-index: 2; /* Encima del canvas */
          pointer-events: none;
        }

        .mc-panel {
          position: relative;
          z-index: 3; /* Encima de todo */
          width: 100%;
          max-width: 400px;
          margin: 0 1rem;
          background: var(--mc-surface);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--mc-border);
          border-radius: 14px;
          padding: 40px 36px 32px;
          animation: mc-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        @keyframes mc-rise {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }

        .mc-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 32px;
          gap: 10px;
        }

        .mc-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .mc-logo-icon {
          width: 34px;
          height: 34px;
          border: 1.5px solid rgba(37, 99, 235, 0.55);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          flex-shrink: 0;
        }

        .mc-product {
          font-family: var(--mc-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #3b82f6;
        }

        .mc-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--mc-text-primary);
          line-height: 1.2;
        }

        .mc-subtitle {
          font-size: 12.5px;
          color: var(--mc-text-muted);
          font-weight: 400;
          line-height: 1.5;
        }

        .mc-ssl {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--mc-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #22c55e;
          opacity: 0.75;
          margin-top: 2px;
        }

        .mc-ssl-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          animation: mc-pulse 2.4s ease-in-out infinite;
        }

        @keyframes mc-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        .mc-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .mc-field {
          position: relative;
          padding-top: 18px;
        }

        .mc-label {
          position: absolute;
          top: 18px;
          left: 0;
          font-family: var(--mc-mono);
          font-size: 12.5px;
          color: var(--mc-text-muted);
          letter-spacing: 0.04em;
          pointer-events: none;
          transition: top var(--mc-transition), font-size var(--mc-transition), color var(--mc-transition), letter-spacing var(--mc-transition);
          transform-origin: left top;
        }

        .mc-field--lifted .mc-label {
          top: 0;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--mc-text-dim);
        }

        .mc-field--focused .mc-label {
          color: #3b82f6;
        }

        .mc-input {
          width: 100%;
          background: transparent;
          border: none;
          border-radius: 0;
          outline: none;
          color: var(--mc-text-primary);
          font-family: var(--mc-mono);
          font-size: 13.5px;
          font-weight: 400;
          letter-spacing: 0.03em;
          padding: 6px 0 8px;
          caret-color: #3b82f6;
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
        }

        .mc-error {
          background: var(--mc-error-bg);
          border: 1px solid var(--mc-error-border);
          border-radius: var(--mc-radius-sm);
          padding: 12px 14px;
          animation: mc-shake 0.35s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes mc-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
        }

        .mc-error__header {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 5px;
        }

        .mc-err-icon {
          width: 14px;
          height: 14px;
          color: var(--mc-error);
          flex-shrink: 0;
        }

        .mc-error__code {
          font-family: var(--mc-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          color: var(--mc-error);
          opacity: 0.7;
          flex-shrink: 0;
        }

        .mc-error__title {
          font-size: 12.5px;
          font-weight: 500;
          color: #fca5a5;
        }

        .mc-error__detail {
          font-size: 11.5px;
          color: rgba(252, 165, 165, 0.65);
          line-height: 1.5;
          padding-left: 21px;
        }

        .mc-btn {
          position: relative;
          width: 100%;
          padding: 12px 20px;
          margin-top: 6px;
          background: var(--mc-accent);
          color: #fff;
          border: none;
          border-radius: var(--mc-radius-sm);
          font-family: var(--mc-mono);
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background var(--mc-transition), transform var(--mc-transition), box-shadow var(--mc-transition), opacity var(--mc-transition);
          overflow: hidden;
          isolation: isolate;
        }

        .mc-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.15s;
          border-radius: inherit;
        }

        .mc-btn:hover:not(:disabled)::after { background: rgba(255,255,255,0.06); }
        .mc-btn:hover:not(:disabled) { box-shadow: 0 0 0 3px var(--mc-accent-glow); }
        .mc-btn:active:not(:disabled) { transform: scale(0.985); }
        .mc-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .mc-btn--success {
          background: #15803d !important;
          pointer-events: none;
        }

        .mc-spinner {
          display: inline-block;
          width: 11px;
          height: 11px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: mc-spin 0.65s linear infinite;
          vertical-align: -2px;
          margin-right: 8px;
        }

        @keyframes mc-spin {
          to { transform: rotate(360deg); }
        }

        .mc-footer {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid var(--mc-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .mc-footer-text {
          font-family: var(--mc-mono);
          font-size: 9.5px;
          letter-spacing: 0.1em;
          color: var(--mc-text-dim);
          text-transform: uppercase;
          line-height: 1.6;
        }

        .mc-footer-link {
          font-family: var(--mc-mono);
          font-size: 10px;
          color: #334155;
          text-decoration: none;
          letter-spacing: 0.05em;
          transition: color var(--mc-transition);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .mc-footer-link:hover { color: #60a5fa; }

        .mc-btn:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .mc-input:focus-visible {
          outline: none;
        }

        @media (max-width: 480px) {
          .mc-panel {
            margin: 0;
            border-radius: 0;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 40px 24px 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="mc-root">
        {/* VIDEO DE FONDO */}
        <video autoPlay loop muted playsInline className="mc-video">
          <source src="/fondo.mp4" type="video/mp4" />
        </video>

        {/* CUADRÍCULA ANIMADA */}
        <GridCanvas />
        <div className="mc-glow" aria-hidden="true" />

        <main className="mc-panel" role="main">
          {/* ── Header ── */}
          <header className="mc-header">
            <div className="mc-logo">
              <div className="mc-logo-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path
                    d="M8.5 1.5L14 3.5V8c0 3.2-2.2 5.8-5.5 7C3.2 13.8 1 11.2 1 8V3.5l7.5-2Z"
                    stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"
                  />
                  <path d="M5.5 8.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="mc-product">Mission Control</span>
            </div>

            <h1 className="mc-title">Acceso al sistema</h1>
            <p className="mc-subtitle">Gestión de Servicios TI — Operaciones E-commerce</p>

            <div className="mc-ssl" aria-label="Conexión segura TLS 1.3">
              <span className="mc-ssl-dot" />
              TLS 1.3 · SESIÓN CIFRADA
            </div>
          </header>

          {/* ── Form ── */}
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
              {success ? '✓ ENLACE ESTABLECIDO' : loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          {/* ── Footer ── */}
          <footer className="mc-footer">
            <p className="mc-footer-text">
              Acceso restringido.<br />
              Solo personal autorizado.
            </p>
            <a href="mailto:soporte@empresa.com" className="mc-footer-link">
              Contactar soporte →
            </a>
          </footer>
        </main>
      </div>
    </>
  );
}

export default Login;