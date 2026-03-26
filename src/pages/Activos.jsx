import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* ─────────────────────────────────────────────
   TOAST, MODAL & SPINNER (Heredados del sistema base)
───────────────────────────────────────────── */
function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateX(10px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }`}</style>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: 'var(--surface)',
          border: `1px solid var(--border)`, borderLeft: `3px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          borderRadius: 7, boxShadow: 'var(--shadow-lg)', minWidth: 290, maxWidth: 370, pointerEvents: 'all', animation: 'toastIn 0.18s ease',
        }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: t.type === 'success' ? 'var(--success-dim)' : 'var(--danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t.type === 'success'
              ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline points="1,4.5 3.5,7 8,2" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><line x1="2" y1="2" x2="7" y2="7" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="2" x2="2" y2="7" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{t.title}</p>
            {t.message && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '1px 0 0 4px', lineHeight: 1, transition: 'color 0.1s' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlayIn 0.15s ease' }}>
      <style>{`@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } } @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-modal)', width: '100%', maxWidth: 520, overflow: 'hidden', animation: 'modalIn 0.18s ease' }}>
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spinIt 0.65s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spinIt { to { transform: rotate(360deg); } }`}</style>
      <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8"/>
      <path d="M6.5 1.5a5 5 0 0 1 5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   BADGE COMPONENTS (Adaptados para Activos)
───────────────────────────────────────────── */
function AssetStatusBadge({ value }) {
  const s = {
    'Operativo':        { bg: 'var(--success-dim)', color: 'var(--success)', dot: 'var(--success)' },
    'En Mantenimiento': { bg: 'var(--warning-dim)', color: 'var(--warning)', dot: 'var(--warning)' },
    'Dado de Baja':     { bg: 'var(--surface-2)',   color: 'var(--text-muted)', dot: 'var(--text-muted)' },
  }[value] || { bg: 'var(--surface-2)', color: 'var(--text-muted)', dot: 'var(--text-muted)' };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 4,
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 500, fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {value}
    </span>
  );
}

function CategoryBadge({ value }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 7px', borderRadius: 4,
      background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
    }}>{value?.toUpperCase()}</span>
  );
}

/* ─────────────────────────────────────────────
   FIELD HELPERS
───────────────────────────────────────────── */
const fieldBase = {
  width: '100%', padding: '8px 11px', borderRadius: 6, border: '1px solid var(--border)',
  fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface-2)', fontFamily: 'var(--font)',
  outline: 'none', transition: 'border-color 0.12s, box-shadow 0.12s, background 0.12s',
};
const onFocus = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = 'var(--surface)'; };
const onBlur = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--surface-2)'; };

/* ─────────────────────────────────────────────
   MAIN COMPONENT: ACTIVOS
───────────────────────────────────────────── */
function Activos() {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [nuevoActivo, setNuevoActivo] = useState({
    nombre: '', categoria: 'Servidor Cloud', estado: 'Operativo'
  });

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, title, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { obtenerActivos(); }, []);

  const obtenerActivos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('activos').select('*').order('id', { ascending: true });
      if (error) throw error;
      setActivos(data);
    } catch (error) {
      console.error("Error obteniendo activos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearActivoManual = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('activos').insert([{
        nombre: nuevoActivo.nombre,
        categoria: nuevoActivo.categoria,
        estado: nuevoActivo.estado
      }]);
      if (error) throw error;
      setNuevoActivo({ nombre: '', categoria: 'Servidor Cloud', estado: 'Operativo' });
      setMostrarFormulario(false);
      obtenerActivos();
      addToast('Activo registrado', `"${nuevoActivo.nombre}" agregado al inventario.`, 'success');
    } catch (error) {
      console.error("Error al registrar activo:", error.message);
      addToast('Error al guardar', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const operativosCount = activos.filter(a => a.estado === 'Operativo').length;
  const mantCount = activos.filter(a => a.estado === 'En Mantenimiento').length;
  const bajaCount = activos.filter(a => a.estado === 'Dado de Baja').length;

  return (
    <div style={{ padding: '28px 32px', width: '100%' }}>
      {/* (Comparte los mismos estilos globales inyectados en Tickets.jsx. Omitimos la etiqueta <style> completa para no duplicar si ya cargan globalmente, pero los inyectamos aquí por seguridad) */}
      <style>{`
        .tk-toolbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .tk-title { font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1; margin-bottom: 5px; }
        .tk-subtitle { font-size: 12px; color: var(--text-muted); letter-spacing: 0.01em; }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 7px 15px; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background 0.12s, box-shadow 0.12s; font-family: var(--font); letter-spacing: 0.02em; white-space: nowrap; }
        .btn-primary:hover { background: var(--accent-hover); box-shadow: 0 2px 10px rgba(37,99,235,0.35); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; background: var(--surface); color: var(--text-secondary); border: 1px solid var(--border); border-radius: 6px; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.12s; font-family: var(--font); letter-spacing: 0.01em; }
        .btn-ghost:hover { border-color: var(--border-strong); color: var(--text-primary); background: var(--surface-hover); }
        .btn-submit { display: inline-flex; align-items: center; gap: 7px; padding: 8px 18px; background: var(--accent); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font); }
        .btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .stats-bar { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 20px; background: var(--surface); }
        .stat-item { flex: 1; padding: 13px 18px; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 3px; }
        .stat-item:last-child { border-right: none; }
        .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-muted); }
        .stat-value { font-size: 20px; font-weight: 700; color: var(--text-primary); font-family: var(--mono); letter-spacing: -0.03em; line-height: 1.1; }
        .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; width: 100%; }
        .tk-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .tk-table thead { background: var(--surface-2); }
        .tk-table th { padding: 9px 16px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); white-space: nowrap; }
        .tk-table td { padding: 11px 16px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: middle; line-height: 1.4; }
        .tk-row-hover td { background: var(--surface-hover) !important; }
        .tk-id { font-family: var(--mono); font-size: 11px; color: var(--text-muted); }
        .tk-title-cell { font-weight: 500; color: var(--text-primary); font-size: 13px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; color: var(--text-muted); }
        .empty-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }
        .sk { background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%); background-size: 200% 100%; animation: sk 1.4s infinite; border-radius: 4px; }
        @keyframes sk { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 15px; border-bottom: 1px solid var(--border); }
        .modal-title { font-size: 15px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; }
        .modal-close { width: 28px; height: 28px; border-radius: 6px; background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: background 0.1s; }
        .modal-close:hover { background: var(--surface-hover); color: var(--text-primary); }
        .modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
        .modal-footer { display: flex; gap: 9px; justify-content: flex-end; padding: 14px 22px; border-top: 1px solid var(--border); background: var(--surface-2); }
        .form-label { display: block; margin-bottom: 5px; font-size: 11.5px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.02em; text-transform: uppercase; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      `}</style>

      <div className="tk-toolbar">
        <div>
          <h2 className="tk-title">Activos de TI (CMDB)</h2>
          <p className="tk-subtitle">Inventario e infraestructura técnica del E-commerce</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={obtenerActivos}>Actualizar</button>
          <button className="btn-primary" onClick={() => setMostrarFormulario(true)}>+ Registrar Activo</button>
        </div>
      </div>

      {!loading && (
        <div className="stats-bar">
          {[
            { label: 'Total Registrados',  value: activos.length  },
            { label: 'Operativos',         value: operativosCount },
            { label: 'En Mantenimiento',   value: mantCount       },
            { label: 'Dados de Baja',      value: bajaCount       },
          ].map(({ label, value }) => (
            <div className="stat-item" key={label}>
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <table className="tk-table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>ID</th>
              <th>Nombre del Activo</th>
              <th style={{ width: 180 }}>Categoría</th>
              <th style={{ width: 140 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="sk" style={{ height: 11, width: 50 }} /></td>
                    <td><div className="sk" style={{ height: 13, width: '50%' }} /></td>
                    <td><div className="sk" style={{ height: 20, width: 110 }} /></td>
                    <td><div className="sk" style={{ height: 20, width: 90 }} /></td>
                  </tr>
                ))
              : activos.length === 0
              ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34, marginBottom: 14, opacity: 0.35 }}>
                           <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                           <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                           <line x1="6" y1="6" x2="6.01" y2="6" />
                           <line x1="6" y1="18" x2="6.01" y2="18" />
                        </svg>
                        <p className="empty-title">Inventario vacío</p>
                        <p style={{ fontSize: 12.5 }}>No hay infraestructura registrada en la CMDB.</p>
                      </div>
                    </td>
                  </tr>
                )
              : activos.map((activo) => (
                  <tr key={activo.id} className={hoveredRow === activo.id ? 'tk-row-hover' : ''} onMouseEnter={() => setHoveredRow(activo.id)} onMouseLeave={() => setHoveredRow(null)}>
                    <td><span className="tk-id">#{String(activo.id).padStart(4, '0')}</span></td>
                    <td><p className="tk-title-cell">{activo.nombre}</p></td>
                    <td><CategoryBadge value={activo.categoria} /></td>
                    <td><AssetStatusBadge value={activo.estado} /></td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      <Modal open={mostrarFormulario} onClose={() => !submitting && setMostrarFormulario(false)}>
        <div className="modal-header">
          <h3 className="modal-title">Registrar Elemento de Configuración (CI)</h3>
          <button className="modal-close" onClick={() => setMostrarFormulario(false)} disabled={submitting}>X</button>
        </div>
        <form onSubmit={crearActivoManual}>
          <div className="modal-body">
            <div>
              <label className="form-label">Identificador / Nombre del Activo</label>
              <input type="text" required style={fieldBase} value={nuevoActivo.nombre} onChange={(e) => setNuevoActivo({ ...nuevoActivo, nombre: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="Ej: AWS EC2 Prod-01" />
            </div>
            <div className="form-row">
              <div>
                <label className="form-label">Categoría</label>
                <select style={fieldBase} value={nuevoActivo.categoria} onChange={(e) => setNuevoActivo({ ...nuevoActivo, categoria: e.target.value })} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Servidor Cloud">Servidor Cloud</option>
                  <option value="Licencia de Software">Licencia de Software</option>
                  <option value="Hardware / Terminal">Hardware / Terminal</option>
                  <option value="Infraestructura de Red">Infraestructura de Red</option>
                </select>
              </div>
              <div>
                <label className="form-label">Estado Operativo</label>
                <select style={fieldBase} value={nuevoActivo.estado} onChange={(e) => setNuevoActivo({ ...nuevoActivo, estado: e.target.value })} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Operativo">Operativo</option>
                  <option value="En Mantenimiento">En Mantenimiento</option>
                  <option value="Dado de Baja">Dado de Baja</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={() => setMostrarFormulario(false)} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? <><Spinner /> Guardando...</> : 'Confirmar Registro'}</button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Activos;