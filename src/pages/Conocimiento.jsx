import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* (Nuevamente, omito las funciones repetidas por brevedad. Asegúrate de copiarlas del primer bloque) */
// ... COPIA Y PEGA AQUÍ LAS FUNCIONES Toast, Modal, Spinner, fieldBase, onFocus, onBlur DEL ARCHIVO ANTERIOR ...
function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateX(10px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }`}</style>
      {toasts.map((t) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `3px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 7, boxShadow: 'var(--shadow-lg)', minWidth: 290, maxWidth: 370, pointerEvents: 'all', animation: 'toastIn 0.18s ease' }}>
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
  return (<div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlayIn 0.15s ease' }}><style>{`@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } } @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style><div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-modal)', width: '100%', maxWidth: 720, overflow: 'hidden', animation: 'modalIn 0.18s ease' }}>{children}</div></div>);
}
function Spinner() { return (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spinIt 0.65s linear infinite', flexShrink: 0 }}><style>{`@keyframes spinIt { to { transform: rotate(360deg); } }`}</style><circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.8"/><path d="M6.5 1.5a5 5 0 0 1 5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>); }
const fieldBase = { width: '100%', padding: '8px 11px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface-2)', fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.12s, box-shadow 0.12s, background 0.12s' };
const onFocus = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; e.target.style.background = 'var(--surface)'; };
const onBlur = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'var(--surface-2)'; };


/* ─────────────────────────────────────────────
   BADGES (Conocimiento)
───────────────────────────────────────────── */
function DocCategoryBadge({ value }) {
  return (<span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, background: '#ede9fe', color: '#6d28d9', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>{value}</span>);
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT: CONOCIMIENTO
───────────────────────────────────────────── */
function Conocimiento() {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [nuevoArticulo, setNuevoArticulo] = useState({ titulo: '', categoria: 'Soporte Técnico', contenido: '' });

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now(); setToasts((p) => [...p, { id, title, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { obtenerArticulos(); }, []);

  const obtenerArticulos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('conocimiento').select('*').order('id', { ascending: false });
      if (error) throw error; setArticulos(data);
    } catch (error) { console.error("Error obteniendo base de conocimiento:", error.message); } finally { setLoading(false); }
  };

  const crearArticuloManual = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('conocimiento').insert([{ titulo: nuevoArticulo.titulo, categoria: nuevoArticulo.categoria, contenido: nuevoArticulo.contenido }]);
      if (error) throw error;
      setNuevoArticulo({ titulo: '', categoria: 'Soporte Técnico', contenido: '' });
      setMostrarFormulario(false); obtenerArticulos();
      addToast('Artículo publicado', 'La documentación fue guardada en la Wiki.', 'success');
    } catch (error) { addToast('Error', error.message, 'error'); } finally { setSubmitting(false); }
  };

  return (
    <div style={{ padding: '28px 32px', width: '100%' }}>
      {/* CSS heredado */}
      <style>{`.tk-toolbar{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)}.tk-title{font-size:18px;font-weight:700;color:var(--text-primary);letter-spacing:-.02em;line-height:1;margin-bottom:5px}.tk-subtitle{font-size:12px;color:var(--text-muted);letter-spacing:.01em}.btn-primary{display:inline-flex;align-items:center;gap:6px;padding:7px 15px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .12s,box-shadow .12s;font-family:var(--font);letter-spacing:.02em;white-space:nowrap}.btn-primary:hover{background:var(--accent-hover);box-shadow:0 2px 10px rgba(37,99,235,.35)}.btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;background:var(--surface);color:var(--text-secondary);border:1px solid var(--border);border-radius:6px;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .12s;font-family:var(--font);letter-spacing:.01em}.btn-ghost:hover{border-color:var(--border-strong);color:var(--text-primary);background:var(--surface-hover)}.btn-submit{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font)}.btn-submit:disabled{opacity:.55;cursor:not-allowed}.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;width:100%}.tk-table{width:100%;border-collapse:collapse;font-size:13px}.tk-table thead{background:var(--surface-2)}.tk-table th{padding:9px 16px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--border);white-space:nowrap}.tk-table td{padding:11px 16px;border-bottom:1px solid var(--border);color:var(--text-secondary);vertical-align:middle;line-height:1.4}.tk-row-hover td{background:var(--surface-hover)!important}.tk-id{font-family:var(--mono);font-size:11px;color:var(--text-muted)}.tk-title-cell{font-weight:500;color:var(--text-primary);font-size:13px}.tk-desc-cell{font-size:11.5px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:500px;margin-top:2px}.empty-state{display:flex;flex-direction:column;align-items:center;padding:60px 20px;color:var(--text-muted)}.empty-title{font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:5px}.sk{background:linear-gradient(90deg,var(--surface-2) 25%,var(--border) 50%,var(--surface-2) 75%);background-size:200% 100%;animation:sk 1.4s infinite;border-radius:4px}@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}.modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 15px;border-bottom:1px solid var(--border)}.modal-title{font-size:15px;font-weight:700;color:var(--text-primary);letter-spacing:-.01em}.modal-close{width:28px;height:28px;border-radius:6px;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-muted);transition:background .1s}.modal-close:hover{background:var(--surface-hover);color:var(--text-primary)}.modal-body{padding:20px 22px;display:flex;flex-direction:column;gap:16px}.modal-footer{display:flex;gap:9px;justify-content:flex-end;padding:14px 22px;border-top:1px solid var(--border);background:var(--surface-2)}.form-label{display:block;margin-bottom:5px;font-size:11.5px;font-weight:600;color:var(--text-secondary);letter-spacing:.02em;text-transform:uppercase}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}`}</style>

      <div className="tk-toolbar">
        <div>
          <h2 className="tk-title">Base de Conocimiento (Wiki)</h2>
          <p className="tk-subtitle">Documentación técnica, manuales y resolución de problemas</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={obtenerArticulos}>Actualizar</button>
          <button className="btn-primary" onClick={() => setMostrarFormulario(true)}>Redactar Artículo</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="tk-table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>DOC ID</th>
              <th>Artículo</th>
              <th style={{ width: 180 }}>Clasificación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td><div className="sk" style={{ height: 11, width: 50 }} /></td>
                <td><div className="sk" style={{ height: 12, width: '65%', marginBottom: 5 }} /><div className="sk" style={{ height: 10, width: '45%' }} /></td>
                <td><div className="sk" style={{ height: 20, width: 120 }} /></td>
              </tr>
            )) : articulos.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state">
                    <p className="empty-title">Wiki vacía</p>
                  </div>
                </td>
              </tr>
            ) : articulos.map((articulo) => (
              <tr key={articulo.id} className={hoveredRow === articulo.id ? 'tk-row-hover' : ''} onMouseEnter={() => setHoveredRow(articulo.id)} onMouseLeave={() => setHoveredRow(null)}>
                <td><span className="tk-id">KB-{String(articulo.id).padStart(4, '0')}</span></td>
                <td>
                  <p className="tk-title-cell">{articulo.titulo}</p>
                  <p className="tk-desc-cell">{articulo.contenido.substring(0, 90)}...</p>
                </td>
                <td><DocCategoryBadge value={articulo.categoria} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={mostrarFormulario} onClose={() => !submitting && setMostrarFormulario(false)}>
        <div className="modal-header">
          <h3 className="modal-title">Redactar nuevo artículo</h3>
          <button className="modal-close" onClick={() => setMostrarFormulario(false)} disabled={submitting}>X</button>
        </div>
        <form onSubmit={crearArticuloManual}>
          <div className="modal-body">
            <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div>
                <label className="form-label">Título del Artículo</label>
                <input type="text" required style={fieldBase} value={nuevoArticulo.titulo} onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, titulo: e.target.value })} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label className="form-label">Categoría</label>
                <select style={fieldBase} value={nuevoArticulo.categoria} onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, categoria: e.target.value })} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Soporte Técnico">Soporte Técnico</option><option value="Políticas de E-commerce">Políticas</option><option value="Guías de Usuario">Guías</option><option value="Procedimientos de Emergencia">Emergencia</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Contenido (Procedimiento)</label>
              <textarea required rows={8} style={{ ...fieldBase, resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 12 }} value={nuevoArticulo.contenido} onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, contenido: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="1. Paso uno..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={() => setMostrarFormulario(false)} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? <><Spinner /> Publicando...</> : 'Publicar Artículo'}</button>
          </div>
        </form>
      </Modal>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Conocimiento;