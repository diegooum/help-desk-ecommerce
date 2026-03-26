import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* (Omito la re-declaración de Toast, Modal y Spinner para mantener este bloque corto, asume que están idénticos al código superior) */
// ... COPIA Y PEGA AQUÍ LAS FUNCIONES Toast, Modal, Spinner, fieldBase, onFocus, onBlur DEL ARCHIVO ANTERIOR ...

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
            {t.type === 'success' ? <span style={{color:'var(--success)', fontWeight:'bold'}}>✓</span> : <span style={{color:'var(--danger)', fontWeight:'bold'}}>!</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{t.title}</p>
            {t.message && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '1px 0 0 4px', lineHeight: 1, transition: 'color 0.1s' }}>X</button>
        </div>
      ))}
    </div>
  );
}
function Modal({ open, onClose, children }) {
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose(); }; if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; } return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; }; }, [open, onClose]);
  if (!open) return null;
  return (<div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlayIn 0.15s ease' }}><style>{`@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } } @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style><div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-modal)', width: '100%', maxWidth: 520, overflow: 'hidden', animation: 'modalIn 0.18s ease' }}>{children}</div></div>);
}
function Spinner() { return (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spinIt 0.65s linear infinite', flexShrink: 0 }}><style>{`@keyframes spinIt { to { transform: rotate(360deg); } }`}</style><circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8"/><path d="M6.5 1.5a5 5 0 0 1 5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>); }
const fieldBase = { width: '100%', padding: '8px 11px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface-2)', fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.12s, box-shadow 0.12s, background 0.12s' };
const onFocus = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = 'var(--surface)'; };
const onBlur = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--surface-2)'; };


/* ─────────────────────────────────────────────
   BADGES (Control de Cambios)
───────────────────────────────────────────── */
function RiskBadge({ value }) {
  const s = {
    'Bajo':    { bg: 'var(--surface-2)', color: 'var(--text-muted)' },
    'Medio':   { bg: 'var(--accent-dim)', color: 'var(--accent)' },
    'Alto':    { bg: 'var(--warning-dim)', color: 'var(--warning)' },
    'Crítico': { bg: 'var(--danger-dim)', color: 'var(--danger)' },
  }[value] || { bg: 'var(--surface-2)', color: 'var(--text-muted)' };

  return (<span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, fontSize: 11, fontWeight: 500, fontFamily: 'var(--mono)' }}>{value}</span>);
}

function ChangeStatusBadge({ value }) {
  const s = {
    'Pendiente': { bg: 'var(--warning-dim)', color: 'var(--warning)' },
    'Aprobado':  { bg: 'var(--success-dim)', color: 'var(--success)' },
    'Rechazado': { bg: 'var(--danger-dim)',  color: 'var(--danger)' },
  }[value] || { bg: 'var(--surface-2)', color: 'var(--text-muted)' };

  return (<span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.color}33`, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>{value}</span>);
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT: CAMBIOS
───────────────────────────────────────────── */
function Cambios() {
  const [cambios, setCambios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [nuevoCambio, setNuevoCambio] = useState({ titulo: '', descripcion_impacto: '', nivel_riesgo: 'Bajo', fecha_ejecucion: '' });

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now(); setToasts((p) => [...p, { id, title, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { obtenerCambios(); }, []);

  const obtenerCambios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('control_cambios').select('*').order('id', { ascending: false });
      if (error) throw error; setCambios(data);
    } catch (error) { console.error("Error obteniendo cambios:", error.message); } finally { setLoading(false); }
  };

  const crearCambioManual = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('control_cambios').insert([{
        titulo: nuevoCambio.titulo, descripcion_impacto: nuevoCambio.descripcion_impacto,
        nivel_riesgo: nuevoCambio.nivel_riesgo, estado: 'Pendiente', fecha_ejecucion: nuevoCambio.fecha_ejecucion || null
      }]);
      if (error) throw error;
      setNuevoCambio({ titulo: '', descripcion_impacto: '', nivel_riesgo: 'Bajo', fecha_ejecucion: '' });
      setMostrarFormulario(false); obtenerCambios();
      addToast('RFC Creado', 'La Solicitud de Cambio ha sido enviada al CAB.', 'success');
    } catch (error) { addToast('Error de registro', error.message, 'error'); } finally { setSubmitting(false); }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'No definida';
    const f = new Date(fechaISO);
    return f.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div style={{ padding: '28px 32px', width: '100%' }}>
      {/* CSS heredado */}
      <style>{`.tk-toolbar{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)}.tk-title{font-size:18px;font-weight:700;color:var(--text-primary);letter-spacing:-.02em;line-height:1;margin-bottom:5px}.tk-subtitle{font-size:12px;color:var(--text-muted);letter-spacing:.01em}.btn-primary{display:inline-flex;align-items:center;gap:6px;padding:7px 15px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .12s,box-shadow .12s;font-family:var(--font);letter-spacing:.02em;white-space:nowrap}.btn-primary:hover{background:var(--accent-hover);box-shadow:0 2px 10px rgba(37,99,235,.35)}.btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;background:var(--surface);color:var(--text-secondary);border:1px solid var(--border);border-radius:6px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .12s;font-family:var(--font);letter-spacing:.01em}.btn-ghost:hover{border-color:var(--border-strong);color:var(--text-primary);background:var(--surface-hover)}.btn-submit{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font)}.btn-submit:disabled{opacity:.55;cursor:not-allowed}.stats-bar{display:flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:20px;background:var(--surface)}.stat-item{flex:1;padding:13px 18px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:3px}.stat-item:last-child{border-right:none}.stat-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--text-muted)}.stat-value{font-size:20px;font-weight:700;color:var(--text-primary);font-family:var(--mono);letter-spacing:-.03em;line-height:1.1}.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;width:100%}.tk-table{width:100%;border-collapse:collapse;font-size:13px}.tk-table thead{background:var(--surface-2)}.tk-table th{padding:9px 16px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--border);white-space:nowrap}.tk-table td{padding:11px 16px;border-bottom:1px solid var(--border);color:var(--text-secondary);vertical-align:middle;line-height:1.4}.tk-row-hover td{background:var(--surface-hover)!important}.tk-id{font-family:var(--mono);font-size:11px;color:var(--text-muted)}.tk-title-cell{font-weight:500;color:var(--text-primary);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px}.tk-desc-cell{font-size:11.5px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;margin-top:2px}.empty-state{display:flex;flex-direction:column;align-items:center;padding:60px 20px;color:var(--text-muted)}.empty-title{font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:5px}.sk{background:linear-gradient(90deg,var(--surface-2) 25%,var(--border) 50%,var(--surface-2) 75%);background-size:200% 100%;animation:sk 1.4s infinite;border-radius:4px}@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}.modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 15px;border-bottom:1px solid var(--border)}.modal-title{font-size:15px;font-weight:700;color:var(--text-primary);letter-spacing:-.01em}.modal-close{width:28px;height:28px;border-radius:6px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:background .1s}.modal-close:hover{background:var(--surface-hover);color:var(--text-primary)}.modal-body{padding:20px 22px;display:flex;flex-direction:column;gap:16px}.modal-footer{display:flex;gap:9px;justify-content:flex-end;padding:14px 22px;border-top:1px solid var(--border);background:var(--surface-2)}.form-label{display:block;margin-bottom:5px;font-size:11.5px;font-weight:600;color:var(--text-secondary);letter-spacing:.02em;text-transform:uppercase}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}`}</style>

      <div className="tk-toolbar">
        <div>
          <h2 className="tk-title">Control de Cambios (RFC)</h2>
          <p className="tk-subtitle">Gestión de despliegues y alteraciones en la infraestructura</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={obtenerCambios}>Actualizar</button>
          <button className="btn-primary" onClick={() => setMostrarFormulario(true)}>Nueva Solicitud (RFC)</button>
        </div>
      </div>

      {!loading && (
        <div className="stats-bar">
          {[
            { label: 'Total RFCs',   value: cambios.length  },
            { label: 'Pendientes CAB', value: cambios.filter(c => c.estado === 'Pendiente').length },
            { label: 'Aprobados',      value: cambios.filter(c => c.estado === 'Aprobado').length  },
            { label: 'Rechazados',     value: cambios.filter(c => c.estado === 'Rechazado').length },
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
              <th style={{ width: 72 }}>RFC ID</th>
              <th>Descripción del Cambio</th>
              <th style={{ width: 110 }}>Riesgo</th>
              <th style={{ width: 140 }}>Ejecución</th>
              <th style={{ width: 120 }}>Aprobación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td><div className="sk" style={{ height: 11, width: 50 }} /></td>
                <td><div className="sk" style={{ height: 12, width: '65%', marginBottom: 5 }} /><div className="sk" style={{ height: 10, width: '45%' }} /></td>
                <td><div className="sk" style={{ height: 20, width: 60 }} /></td>
                <td><div className="sk" style={{ height: 12, width: 90 }} /></td>
                <td><div className="sk" style={{ height: 20, width: 85 }} /></td>
              </tr>
            )) : cambios.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <p className="empty-title">Sin solicitudes pendientes</p>
                  </div>
                </td>
              </tr>
            ) : cambios.map((cambio) => (
              <tr key={cambio.id} className={hoveredRow === cambio.id ? 'tk-row-hover' : ''} onMouseEnter={() => setHoveredRow(cambio.id)} onMouseLeave={() => setHoveredRow(null)}>
                <td><span className="tk-id">RFC-{String(cambio.id).padStart(4, '0')}</span></td>
                <td>
                  <p className="tk-title-cell">{cambio.titulo}</p>
                  <p className="tk-desc-cell">{cambio.descripcion_impacto}</p>
                </td>
                <td><RiskBadge value={cambio.nivel_riesgo} /></td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11.5 }}>{formatearFecha(cambio.fecha_ejecucion)}</td>
                <td><ChangeStatusBadge value={cambio.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={mostrarFormulario} onClose={() => !submitting && setMostrarFormulario(false)}>
        <div className="modal-header">
          <h3 className="modal-title">Registrar Solicitud de Cambio (RFC)</h3>
          <button className="modal-close" onClick={() => setMostrarFormulario(false)} disabled={submitting}>X</button>
        </div>
        <form onSubmit={crearCambioManual}>
          <div className="modal-body">
            <div>
              <label className="form-label">Título del Cambio</label>
              <input type="text" required style={fieldBase} value={nuevoCambio.titulo} onChange={(e) => setNuevoCambio({ ...nuevoCambio, titulo: e.target.value })} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label className="form-label">Análisis de Impacto</label>
              <textarea required rows={2} style={{ ...fieldBase, resize: 'vertical' }} value={nuevoCambio.descripcion_impacto} onChange={(e) => setNuevoCambio({ ...nuevoCambio, descripcion_impacto: e.target.value })} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div className="form-row">
              <div>
                <label className="form-label">Nivel de Riesgo</label>
                <select style={fieldBase} value={nuevoCambio.nivel_riesgo} onChange={(e) => setNuevoCambio({ ...nuevoCambio, nivel_riesgo: e.target.value })} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Bajo">Bajo</option><option value="Medio">Medio</option><option value="Alto">Alto</option><option value="Crítico">Crítico</option>
                </select>
              </div>
              <div>
                <label className="form-label">Ventana de Ejecución</label>
                <input type="datetime-local" required style={fieldBase} value={nuevoCambio.fecha_ejecucion} onChange={(e) => setNuevoCambio({ ...nuevoCambio, fecha_ejecucion: e.target.value })} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={() => setMostrarFormulario(false)} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? <><Spinner /> Enviando...</> : 'Enviar a CAB'}</button>
          </div>
        </form>
      </Modal>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Cambios;