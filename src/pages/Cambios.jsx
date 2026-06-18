import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* ─────────────────────────────────────────────
   COMPONENTES UI (Toast, Modal, Badges)
───────────────────────────────────────────── */
function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      {toasts.map((t) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `2px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 4, minWidth: 290, maxWidth: 370, pointerEvents: 'all', animation: 'toastIn 0.18s ease' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: `1px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t.type === 'success' ? <span style={{color:'var(--success)', fontWeight:'bold', fontSize: 9}}>✓</span> : <span style={{color:'var(--danger)', fontWeight:'bold', fontSize: 9}}>!</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{t.title}</p>
            {t.message && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '1px 0 0 4px', lineHeight: 1, fontSize: 12 }}>×</button>
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, children, maxWidth = 600 }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlayIn 0.12s ease' }}>
      <style>{`@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } } @keyframes modalIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, width: '100%', maxWidth, overflow: 'hidden', animation: 'modalIn 0.18s ease', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function LevelBadge({ value, type }) {
  const isHigh = value === 'Alto';
  const isLow = value === 'Bajo';
  let color = 'var(--accent)';
  if (isHigh) color = 'var(--danger)';
  if (isLow) color = 'var(--success)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--mono)' }}>
      <span style={{ color: 'var(--text-muted)', width: 55 }}>{type}:</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function StatusBadge({ value }) {
  const s = { 
    'Solicitado': { c: 'var(--warning)', b: 'var(--warning)' }, 
    'Aprobado': { c: 'var(--info)', b: 'var(--info)' }, 
    'Rechazado': { c: 'var(--danger)', b: 'var(--danger)' }, 
    'Implementado': { c: 'var(--success)', b: 'var(--success)' } 
  }[value] || { c: 'var(--text-muted)', b: 'var(--border)' };

  return (
    <span style={{ display: 'inline-block', padding: '3px 8px', border: `1px solid ${s.b}`, borderRadius: 3, color: s.c, fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {value}
    </span>
  );
}

const fieldBase = { width: '100%', padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface)', fontFamily: 'var(--font)', outline: 'none' };

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
function Cambios() {
  const [currentUser, setCurrentUser] = useState(null);
  const [cambios, setCambios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const [nuevoCambio, setNuevoCambio] = useState({
    titulo_cambio: '', desc_cambio: '', riesgo: 'Medio', impacto: 'Medio',
    fecha_programada: '', ticket_relacionado: '', agente_responsable: ''
  });

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now(); setToasts((p) => [...p, { id, title, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { 
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
    obtenerCambios(); 
  }, []);

  const obtenerCambios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('cambios').select('*').order('id_cambio', { ascending: false });
      if (error) throw error;
      setCambios(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearCambio = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('cambios').insert([{ 
        ...nuevoCambio, 
        solicitante: currentUser?.email,
        estado_cambio: 'Solicitado'
      }]);
      
      if (error) throw error;
      
      setNuevoCambio({ titulo_cambio: '', desc_cambio: '', riesgo: 'Medio', impacto: 'Medio', fecha_programada: '', ticket_relacionado: '', agente_responsable: '' });
      setMostrarFormulario(false);
      obtenerCambios();
      addToast('RFC Creado', 'La solicitud de cambio ha sido registrada exitosamente.', 'success');
    } catch (error) {
      addToast('Error', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const actualizarEstadoCambio = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase.from('cambios').update({ estado_cambio: nuevoEstado }).eq('id_cambio', id);
      if (error) throw error;
      obtenerCambios();
      addToast('Flujo actualizado', `El cambio ahora está: ${nuevoEstado}`);
    } catch (error) {
      addToast('Error', error.message, 'error');
    }
  };

  const cambiosFiltrados = cambios.filter(c => 
    c.titulo_cambio?.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.ticket_relacionado?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.agente_responsable?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ padding: '36px 40px', width: '100%' }}>
      <style>{`
        .tk-toolbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .btn-primary { padding: 8px 18px; background: var(--text-primary); color: var(--surface); border: none; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; transition: opacity 0.1s; }
        .btn-primary:hover { opacity: 0.8; }
        .btn-ghost { padding: 8px 16px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 4px; font-size: 12px; cursor: pointer; }
        
        .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .tk-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .tk-table th { padding: 12px 18px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); font-family: var(--mono); border-bottom: 1px solid var(--border); letter-spacing: 0.1em; }
        .tk-table td { padding: 16px 18px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: top; }
        
        .form-label { display: block; margin-bottom: 6px; font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; font-family: var(--mono); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .select-estado { background: var(--surface-2); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-size: 11px; color: var(--text-primary); outline: none; margin-top: 8px; cursor: pointer; }
      `}</style>

      {/* Toolbar */}
      <div className="tk-toolbar">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Control de Cambios (RFC)</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Evaluación, aprobación e implementación en infraestructura</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={obtenerCambios}>Actualizar</button>
          <button className="btn-primary" onClick={() => setMostrarFormulario(true)}>Solicitar Cambio</button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input 
          type="text" 
          placeholder="Buscar por título, responsable o ID de ticket asociado..." 
          style={{ ...fieldBase, maxWidth: 400 }} 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
        />
      </div>

      {/* Tabla de Cambios */}
      <div className="table-wrap">
        <table className="tk-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>RFC ID</th>
              <th>Descripción del Cambio</th>
              <th style={{ width: 140 }}>Evaluación</th>
              <th style={{ width: 160 }}>Programación</th>
              <th style={{ width: 160 }}>Flujo de Trabajo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>Cargando matriz de cambios...</td></tr> : 
             cambiosFiltrados.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>No hay controles de cambios registrados.</td></tr> :
             cambiosFiltrados.map((c) => (
              <tr key={c.id_cambio}>
                <td>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>RFC-{String(c.id_cambio).padStart(4, '0')}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>{c.titulo_cambio}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 8 }}>{c.desc_cambio}</div>
                  {c.ticket_relacionado && (
                    <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 6px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 2, fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>
                      Origen: Ticket #{c.ticket_relacionado}
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                    <LevelBadge type="Riesgo" value={c.riesgo} />
                    <LevelBadge type="Impacto" value={c.impacto} />
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Solicitado: {c.fecha_solicitud}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                    Ejecución: <span style={{ color: c.fecha_programada ? 'var(--info)' : 'var(--text-muted)' }}>{c.fecha_programada || 'Pendiente'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Responsable:<br/><span style={{ color: 'var(--text-primary)' }}>{c.agente_responsable?.split('@')[0] || 'N/A'}</span></div>
                </td>
                <td>
                  <StatusBadge value={c.estado_cambio} />
                  <br />
                  <select 
                    className="select-estado" 
                    value={c.estado_cambio} 
                    onChange={(e) => actualizarEstadoCambio(c.id_cambio, e.target.value)}
                  >
                    <option value="Solicitado">Solicitado</option>
                    <option value="Aprobado">Aprobar Cambio</option>
                    <option value="Implementado">Marcar Implementado</option>
                    <option value="Rechazado">Rechazar</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo RFC */}
      <Modal open={mostrarFormulario} onClose={() => !submitting && setMostrarFormulario(false)}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Nueva Solicitud de Cambio (RFC)</h3>
          <button onClick={() => setMostrarFormulario(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
        <form onSubmit={crearCambio}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            
            <div>
              <label className="form-label">Título del Cambio</label>
              <input type="text" required style={fieldBase} value={nuevoCambio.titulo_cambio} onChange={e => setNuevoCambio({...nuevoCambio, titulo_cambio: e.target.value})} placeholder="Ej: Actualización RAM Servidor SAP" />
            </div>

            <div>
              <label className="form-label">Justificación y Plan de Acción</label>
              <textarea required rows={3} style={{...fieldBase, resize: 'vertical'}} value={nuevoCambio.desc_cambio} onChange={e => setNuevoCambio({...nuevoCambio, desc_cambio: e.target.value})} placeholder="Motivo del cambio, pasos a seguir, plan de rollback si falla..." />
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">Nivel de Riesgo</label>
                <select required style={fieldBase} value={nuevoCambio.riesgo} onChange={e => setNuevoCambio({...nuevoCambio, riesgo: e.target.value})}>
                  <option value="Bajo">Bajo (Cambio estándar)</option>
                  <option value="Medio">Medio (Requiere ventana de mtto)</option>
                  <option value="Alto">Alto (Crítico para el negocio)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Nivel de Impacto</label>
                <select required style={fieldBase} value={nuevoCambio.impacto} onChange={e => setNuevoCambio({...nuevoCambio, impacto: e.target.value})}>
                  <option value="Bajo">Bajo (1 a 5 usuarios)</option>
                  <option value="Medio">Medio (Un departamento)</option>
                  <option value="Alto">Alto (Toda la universidad)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">Fecha Programada (Ventana)</label>
                <input type="date" required style={fieldBase} value={nuevoCambio.fecha_programada} onChange={e => setNuevoCambio({...nuevoCambio, fecha_programada: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Ticket Origen (Opcional)</label>
                <input type="text" style={fieldBase} value={nuevoCambio.ticket_relacionado} onChange={e => setNuevoCambio({...nuevoCambio, ticket_relacionado: e.target.value})} placeholder="Ej: 0045" />
              </div>
            </div>

            <div>
              <label className="form-label">Agente Responsable de Ejecución</label>
              <input type="email" required style={fieldBase} value={nuevoCambio.agente_responsable} onChange={e => setNuevoCambio({...nuevoCambio, agente_responsable: e.target.value})} placeholder="correo@utalca.cl" />
            </div>

          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-ghost" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Registrando...' : 'Registrar RFC'}</button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Cambios;