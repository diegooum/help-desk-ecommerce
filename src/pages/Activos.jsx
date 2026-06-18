import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* ─────────────────────────────────────────────
   CATEGORÍAS DE HARDWARE (Según Rúbrica)
───────────────────────────────────────────── */
const CATEGORIAS_HARDWARE = [
  "PC", "Notebook", "Impresora", "Tablet", 
  "Switch", "Router", "Access Point", "Firewall", "Servidor"
];

/* ─────────────────────────────────────────────
   TOAST Y MODAL (Mismo diseño UI)
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

function Modal({ open, onClose, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlayIn 0.12s ease' }}>
      <style>{`@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } } @keyframes modalIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, width: '100%', maxWidth: 560, overflow: 'hidden', animation: 'modalIn 0.18s ease' }}>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const isOperativo = value === 'Operativo';
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', border: `1px solid ${isOperativo ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 2, color: isOperativo ? 'var(--success)' : 'var(--danger)', fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--mono)', textTransform: 'uppercase', background: 'transparent', letterSpacing: '0.06em' }}>
      {value}
    </span>
  );
}

const fieldBase = { width: '100%', padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface)', fontFamily: 'var(--font)', outline: 'none' };

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
function Activos() {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const [nuevoActivo, setNuevoActivo] = useState({
    serial_activo: '', marca_activo: '', modelo_activo: '', cate_activo: CATEGORIAS_HARDWARE[0],
    fec_compra: '', fec_obsolescencia: '', usuario_responsable: '', desc_activo: ''
  });

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now(); setToasts((p) => [...p, { id, title, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { obtenerActivos(); }, []);

  const obtenerActivos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('activos').select('*').order('id_activo', { ascending: false });
      if (error) throw error;
      setActivos(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearActivo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('activos').insert([{ ...nuevoActivo, estado_activo: 'Operativo' }]);
      if (error) throw error;
      
      setNuevoActivo({ serial_activo: '', marca_activo: '', modelo_activo: '', cate_activo: CATEGORIAS_HARDWARE[0], fec_compra: '', fec_obsolescencia: '', usuario_responsable: '', desc_activo: '' });
      setMostrarFormulario(false);
      obtenerActivos();
      addToast('Activo registrado', 'El hardware ha sido añadido al inventario.', 'success');
    } catch (error) {
      addToast('Error', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Operativo' ? 'Obsoleto' : 'Operativo';
    try {
      const { error } = await supabase.from('activos').update({ estado_activo: nuevoEstado }).eq('id_activo', id);
      if (error) throw error;
      obtenerActivos();
      addToast('Estado actualizado', `El equipo ahora está ${nuevoEstado}.`);
    } catch (error) {
      addToast('Error', error.message, 'error');
    }
  };

  const activosFiltrados = activos.filter(a => 
    a.serial_activo?.toLowerCase().includes(busqueda.toLowerCase()) || 
    a.usuario_responsable?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.cate_activo?.toLowerCase().includes(busqueda.toLowerCase())
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
        .tk-table th { padding: 10px 18px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); font-family: var(--mono); border-bottom: 1px solid var(--border); }
        .tk-table td { padding: 14px 18px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: middle; }
        .form-label { display: block; margin-bottom: 6px; font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; font-family: var(--mono); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .btn-link { background: none; border: none; color: var(--text-muted); text-decoration: underline; font-size: 10px; cursor: pointer; padding: 0; font-family: var(--mono); margin-top: 6px; }
        .btn-link:hover { color: var(--text-primary); }
      `}</style>

      {/* Toolbar */}
      <div className="tk-toolbar">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Gestión de Activos de TI</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Control de inventario y ciclo de vida de Hardware</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={obtenerActivos}>Actualizar</button>
          <button className="btn-primary" onClick={() => setMostrarFormulario(true)}>Registrar Hardware</button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input 
          type="text" 
          placeholder="Buscar por serial, tipo o responsable..." 
          style={{ ...fieldBase, maxWidth: 350 }} 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
        />
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="tk-table">
          <thead>
            <tr>
              <th>Equipo / Serial</th>
              <th>Especificaciones</th>
              <th>Fechas (Vida Útil)</th>
              <th>Responsable</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>Cargando inventario...</td></tr> : 
             activosFiltrados.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>No hay hardware registrado.</td></tr> :
             activosFiltrados.map((activo) => (
              <tr key={activo.id_activo}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activo.cate_activo}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginTop: 4 }}>SN: {activo.serial_activo || 'N/A'}</div>
                </td>
                <td>
                  <div style={{ color: 'var(--text-primary)' }}>{activo.marca_activo} {activo.modelo_activo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activo.desc_activo}</div>
                </td>
                <td>
                  <div style={{ fontSize: 11 }}>Adquisición: <span style={{ color: 'var(--text-primary)' }}>{activo.fec_compra}</span></div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Obsolescencia: <span style={{ color: 'var(--danger)' }}>{activo.fec_obsolescencia}</span></div>
                </td>
                <td style={{ fontWeight: 500 }}>{activo.usuario_responsable || 'Sin asignar'}</td>
                <td>
                  <StatusBadge value={activo.estado_activo} />
                  <br />
                  <button className="btn-link" onClick={() => cambiarEstado(activo.id_activo, activo.estado_activo)}>
                    Marcar como {activo.estado_activo === 'Operativo' ? 'Obsoleto' : 'Operativo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Registro */}
      <Modal open={mostrarFormulario} onClose={() => !submitting && setMostrarFormulario(false)}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Registrar Hardware</h3>
          <button onClick={() => setMostrarFormulario(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
        <form onSubmit={crearActivo}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div className="form-row">
              <div>
                <label className="form-label">Categoría</label>
                <select required style={fieldBase} value={nuevoActivo.cate_activo} onChange={e => setNuevoActivo({...nuevoActivo, cate_activo: e.target.value})}>
                  {CATEGORIAS_HARDWARE.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Número de Serie (SN)</label>
                <input type="text" style={fieldBase} value={nuevoActivo.serial_activo} onChange={e => setNuevoActivo({...nuevoActivo, serial_activo: e.target.value})} placeholder="Ej: SN-987654" />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">Marca</label>
                <input type="text" required style={fieldBase} value={nuevoActivo.marca_activo} onChange={e => setNuevoActivo({...nuevoActivo, marca_activo: e.target.value})} placeholder="Ej: Dell" />
              </div>
              <div>
                <label className="form-label">Modelo</label>
                <input type="text" required style={fieldBase} value={nuevoActivo.modelo_activo} onChange={e => setNuevoActivo({...nuevoActivo, modelo_activo: e.target.value})} placeholder="Ej: Latitude 5420" />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">Fecha de Compra</label>
                <input type="date" required style={fieldBase} value={nuevoActivo.fec_compra} onChange={e => setNuevoActivo({...nuevoActivo, fec_compra: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Fecha de Obsolescencia</label>
                <input type="date" required style={fieldBase} value={nuevoActivo.fec_obsolescencia} onChange={e => setNuevoActivo({...nuevoActivo, fec_obsolescencia: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="form-label">Usuario Responsable</label>
              <input type="email" required style={fieldBase} value={nuevoActivo.usuario_responsable} onChange={e => setNuevoActivo({...nuevoActivo, usuario_responsable: e.target.value})} placeholder="correo@utalca.cl" />
            </div>

            <div>
              <label className="form-label">Descripción / Detalles Técnicos</label>
              <textarea rows={2} style={fieldBase} value={nuevoActivo.desc_activo} onChange={e => setNuevoActivo({...nuevoActivo, desc_activo: e.target.value})} placeholder="RAM, Procesador, Ubicación física..." />
            </div>

          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-ghost" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar Activo'}</button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Activos;