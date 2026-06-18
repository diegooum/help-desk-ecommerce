import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* ─────────────────────────────────────────────
   CATÁLOGO DE SERVICIOS (Igual que en Tickets)
───────────────────────────────────────────── */
const CATALOGO_SERVICIOS = [
  "SAP", "Educandus", "Sistema de Biblioteca", "BUK RRHH",
  "Microsoft 365", "Computadoras", "Impresoras", "Proyectores",
  "Televisores", "Access Point (WiFi)", "Biométricos", "Internet"
];

/* ─────────────────────────────────────────────
   LISTA OFICIAL DE AGENTES (RBAC)
───────────────────────────────────────────── */
const EMAILS_AGENTES = [
  'soporte.ti@utalca.cl',
  'csoledad@utalca.cl',
  'mvelis@utalca.cl',
  'mcastro@utalca.cl',
  'lbarra@utalca.cl'
];

/* ─────────────────────────────────────────────
   TOAST Y MODAL
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

function Modal({ open, onClose, children, maxWidth = 560 }) {
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

const fieldBase = { width: '100%', padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface)', fontFamily: 'var(--font)', outline: 'none' };

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
function Conocimiento() {
  const [currentUser, setCurrentUser] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [articuloLectura, setArticuloLectura] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const [nuevoArticulo, setNuevoArticulo] = useState({
    titulo_articulo: '', conten_articulo: '', servicio_relacionado: CATALOGO_SERVICIOS[0]
  });

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now(); setToasts((p) => [...p, { id, title, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { 
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
    obtenerArticulos(); 
  }, []);

  // VERIFICADOR DE ROL
  const esAgente = EMAILS_AGENTES.includes(currentUser?.email);

  const obtenerArticulos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('articulos').select('*').order('fecha_articulo', { ascending: false });
      if (error) throw error;
      setArticulos(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearArticulo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('articulos').insert([{ 
        ...nuevoArticulo, 
        autor_articulo: currentUser?.email || 'usuario@utalca.cl',
        estado_publicacion: 'Publicado'
      }]);
      
      if (error) throw error;
      
      setNuevoArticulo({ titulo_articulo: '', conten_articulo: '', servicio_relacionado: CATALOGO_SERVICIOS[0] });
      setMostrarFormulario(false);
      obtenerArticulos();
      addToast('Artículo publicado', 'El documento ya está disponible en la base de conocimientos.', 'success');
    } catch (error) {
      addToast('Error al publicar', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstadoPublicacion = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Publicado' ? 'Desactivado' : 'Publicado';
    try {
      const { error } = await supabase.from('articulos').update({ estado_publicacion: nuevoEstado }).eq('id_articulo', id);
      if (error) throw error;
      
      if (articuloLectura && articuloLectura.id_articulo === id) {
        setArticuloLectura({ ...articuloLectura, estado_publicacion: nuevoEstado });
      }
      
      obtenerArticulos();
      addToast('Estado actualizado', `El artículo ahora está ${nuevoEstado}.`);
    } catch (error) {
      addToast('Error', error.message, 'error');
    }
  };

  // Filtrado de artículos (Oculta los desactivados si no eres agente)
  const articulosFiltrados = articulos.filter(a => {
    const coincideBusqueda = a.titulo_articulo?.toLowerCase().includes(busqueda.toLowerCase()) || a.servicio_relacionado?.toLowerCase().includes(busqueda.toLowerCase());
    const permisoVisible = esAgente || a.estado_publicacion === 'Publicado'; // Si no es agente, solo ve los publicados
    return coincideBusqueda && permisoVisible;
  });

  return (
    <div style={{ padding: '36px 40px', width: '100%' }}>
      <style>{`
        .tk-toolbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .btn-primary { padding: 8px 18px; background: var(--text-primary); color: var(--surface); border: none; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; transition: opacity 0.1s; }
        .btn-primary:hover { opacity: 0.8; }
        .btn-ghost { padding: 8px 16px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 4px; font-size: 12px; cursor: pointer; }
        
        .articulos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .articulo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 20px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; }
        .articulo-card:hover { border-color: var(--border-strong); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .articulo-card.disabled { opacity: 0.6; background: var(--surface-2); }
        
        .art-tag { display: inline-block; padding: 2px 8px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 2px; font-size: 9px; font-weight: 600; font-family: var(--mono); text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; }
        .art-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px 0; line-height: 1.3; }
        .art-excerpt { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin: 0 0 16px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .art-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--border); padding-top: 12px; }
        
        .form-label { display: block; margin-bottom: 6px; font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; font-family: var(--mono); }
      `}</style>

      {/* Toolbar */}
      <div className="tk-toolbar">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Base de Conocimientos</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Guías de resolución y documentación de servicios</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={obtenerArticulos}>Actualizar</button>
          {/* AQUÍ ESTÁ LA MAGIA: Solo Agentes ven el botón */}
          {esAgente && (
            <button className="btn-primary" onClick={() => setMostrarFormulario(true)}>Nuevo Artículo</button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input 
          type="text" 
          placeholder="Buscar soluciones por título o servicio..." 
          style={{ ...fieldBase, maxWidth: 400 }} 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
        />
      </div>

      {/* Grid de Artículos */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Cargando base de conocimientos...</div>
      ) : articulosFiltrados.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 4 }}>
          No se encontraron artículos publicados.
        </div>
      ) : (
        <div className="articulos-grid">
          {articulosFiltrados.map(art => (
            <div key={art.id_articulo} className={`articulo-card ${art.estado_publicacion === 'Desactivado' ? 'disabled' : ''}`} onClick={() => setArticuloLectura(art)}>
              <div>
                <span className="art-tag">{art.servicio_relacionado}</span>
                {art.estado_publicacion === 'Desactivado' && (
                  <span className="art-tag" style={{ marginLeft: 6, color: 'var(--danger)', borderColor: 'var(--danger)' }}>DESACTIVADO</span>
                )}
              </div>
              <h3 className="art-title">{art.titulo_articulo}</h3>
              <p className="art-excerpt">{art.conten_articulo}</p>
              
              <div className="art-footer">
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>{art.autor_articulo?.split('@')[0]}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{art.fecha_articulo}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Leer más →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Lectura de Artículo */}
      <Modal open={!!articuloLectura} onClose={() => setArticuloLectura(null)} maxWidth={700}>
        {articuloLectura && (
          <>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="art-tag">{articuloLectura.servicio_relacionado}</span>
                <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', margin: '8px 0', lineHeight: 1.2 }}>{articuloLectura.titulo_articulo}</h2>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                  Publicado por {articuloLectura.autor_articulo} el {articuloLectura.fecha_articulo}
                </div>
              </div>
              <button onClick={() => setArticuloLectura(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--text-muted)' }}>×</button>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto', flex: 1, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {articuloLectura.conten_articulo}
            </div>

            <div style={{ padding: '16px 32px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* MAGIA 2: Botón de activar/desactivar solo para Agentes */}
              {esAgente ? (
                <button 
                  className="btn-ghost" 
                  style={{ color: articuloLectura.estado_publicacion === 'Publicado' ? 'var(--danger)' : 'var(--success)', borderColor: 'transparent' }}
                  onClick={() => cambiarEstadoPublicacion(articuloLectura.id_articulo, articuloLectura.estado_publicacion)}
                >
                  {articuloLectura.estado_publicacion === 'Publicado' ? 'Desactivar Artículo' : 'Volver a Publicar'}
                </button>
              ) : (
                <div /> /* Espaciador para mantener el botón Cerrar a la derecha */
              )}
              
              <button className="btn-primary" onClick={() => setArticuloLectura(null)}>Cerrar</button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal Nuevo Artículo (Solo se abrirá si es Agente, porque el botón está protegido) */}
      <Modal open={mostrarFormulario} onClose={() => !submitting && setMostrarFormulario(false)} maxWidth={600}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Redactar Nuevo Artículo</h3>
          <button onClick={() => setMostrarFormulario(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
        <form onSubmit={crearArticulo}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div>
              <label className="form-label">Servicio Relacionado</label>
              <select required style={fieldBase} value={nuevoArticulo.servicio_relacionado} onChange={e => setNuevoArticulo({...nuevoArticulo, servicio_relacionado: e.target.value})}>
                {CATALOGO_SERVICIOS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Título del Problema / Guía</label>
              <input type="text" required style={fieldBase} value={nuevoArticulo.titulo_articulo} onChange={e => setNuevoArticulo({...nuevoArticulo, titulo_articulo: e.target.value})} placeholder="Ej: Cómo restablecer la contraseña de Educandus" />
            </div>

            <div>
              <label className="form-label">Contenido de la Solución</label>
              <textarea required rows={8} style={{...fieldBase, resize: 'vertical', lineHeight: 1.5}} value={nuevoArticulo.conten_articulo} onChange={e => setNuevoArticulo({...nuevoArticulo, conten_articulo: e.target.value})} placeholder="Paso 1: ...&#10;Paso 2: ...&#10;(Puedes incluir links a recursos externos aquí)" />
            </div>

          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-ghost" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Publicando...' : 'Publicar Artículo'}</button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Conocimiento;