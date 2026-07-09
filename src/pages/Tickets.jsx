import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const EMAILS_AGENTES = ['soporte.ti@utalca.cl', 'csoledad@utalca.cl', 'mvelis@utalca.cl', 'mcastro@utalca.cl', 'lbarra@utalca.cl'];

const ARBOL_SERVICIOS = {
  "Accesos y Cuentas": { "Educandus": ["Restablecer contraseña", "No veo mis cursos", "Error de matriculación"], "Microsoft 365": ["Problemas con Teams", "Instalación de Office", "Correo bloqueado"], "SAP": ["Solicitar nuevo acceso", "Error de inicio de sesión", "Problemas de permisos"], "BUK RRHH": ["Dudas con liquidación", "No puedo ingresar"] },
  "Hardware e Infraestructura": { "Computadoras": ["Equipo no enciende", "Lentitud extrema", "Pantalla azul / Error de sistema"], "Impresoras": ["Falta de tóner", "Atasco de papel", "Mala calidad de impresión"], "Proyectores": ["Proyector no enciende", "Cable HDMI dañado", "Proyector parpadea"], "Biométricos": ["No registra huella", "Pantalla apagada"] },
  "Conectividad": { "Internet WiFi": ["No conecta a Eduroam", "Señal débil", "Falla masiva en sector"], "Internet Cableado": ["Sin internet en mi punto de red", "Cable de red dañado"] }
};

/* ── PLANTILLAS DE RESPUESTAS RÁPIDAS PARA AGENTES ── */
const PLANTILLAS_AGENTE = [
  "Estimado, estamos revisando su caso. Le informaremos a la brevedad.",
  "Por favor, intente reiniciar su equipo y confírmenos si el problema persiste.",
  "El requerimiento ha sido solucionado. Procederemos a cerrar el ticket."
];

/* ─────────────────────────────────────────────
   ÍCONOS VECTORIALES PARA EL CHAT
───────────────────────────────────────────── */
const PaperclipIcon = ({ style }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const DownloadIcon = ({ style }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const SendIcon = ({ style }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const ClockIcon = ({ style }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      {toasts.map((t) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `2px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 4, minWidth: 290, maxWidth: 370, pointerEvents: 'all', animation: 'toastIn 0.18s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{t.title}</p>
            {t.message && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
      ))}
    </div>
  );
}

function Modal({ open, onClose, children, maxWidth = 800 }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlayIn 0.15s ease', backdropFilter: 'blur(2px)' }}>
      <style>{`@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } } @keyframes modalIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth, overflow: 'hidden', animation: 'modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const s = { 'Abierto': 'var(--danger)', 'En espera del usuario': 'var(--warning)', 'En espera de un tercero': 'var(--warning)', 'Solucionado': 'var(--success)', 'Cerrado': 'var(--text-muted)' }[value] || 'var(--text-muted)';
  return (<span style={{ display: 'inline-block', padding: '3px 10px', border: `1px solid ${value === 'Cerrado' ? 'var(--border)' : s}`, borderRadius: 12, color: s, fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{value}</span>);
}

function TypeBadge({ value }) {
  const isInc = value === 'incidente';
  return (<span style={{ display: 'inline-block', padding: '2px 8px', border: `1px solid ${isInc ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 4, color: isInc ? 'var(--danger)' : 'var(--accent)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.07em', fontFamily: 'var(--mono)' }}>{value?.toUpperCase()}</span>);
}

/* ── CÁLCULO DE SEMÁFORO DE SLA ── */
const evaluarSLA = (fecha_creacion, sla_horas, estado) => {
  if (estado === 'Solucionado' || estado === 'Cerrado') return { texto: 'SLA Cumplido', color: 'var(--success)' };
  
  const creacion = new Date(fecha_creacion + (!fecha_creacion.endsWith('Z') ? 'Z' : '')).getTime();
  const limite = creacion + (sla_horas * 60 * 60 * 1000);
  const ahora = new Date().getTime();
  const restante = limite - ahora;

  if (restante < 0) return { texto: 'SLA Vencido', color: 'var(--danger)' };
  if (restante < (4 * 60 * 60 * 1000)) return { texto: 'Por vencer', color: 'var(--warning)' }; // Menos de 4 horas
  return { texto: 'En tiempo', color: 'var(--info)' };
};

const enviarNotificacion = async (usuario_destino, ticket_id, titulo, mensaje) => {
  if (!usuario_destino) return;
  await supabase.from('notificaciones').insert([{ usuario_destino, ticket_id, titulo, mensaje }]);
};

function Tickets() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  const [nivel1, setNivel1] = useState(null);
  const [nivel2, setNivel2] = useState(null);
  const [nivel3, setNivel3] = useState(null);
  const [detallesExtra, setDetallesExtra] = useState('');
  const [creandoTicket, setCreandoTicket] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [vistaAgente, setVistaAgente] = useState('propios');

  const [ticketChatActivo, setTicketChatActivo] = useState(null);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const chatScrollRef = useRef(null);

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now(); setToasts((p) => [...p, { id, title, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { 
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) obtenerTickets(user.email);
    });
  }, []);

  const esAgente = EMAILS_AGENTES.includes(currentUser?.email);

  const obtenerTickets = async (emailUsuario) => {
    try {
      setLoading(true);
      let query = supabase.from('tickets').select('*').order('fecha_creacion', { ascending: false });
      if (!EMAILS_AGENTES.includes(emailUsuario)) query = query.eq('usuario_creador', emailUsuario);
      const { data, error } = await query;
      if (error) throw error;
      setTickets(data);
    } catch (error) { console.error(error.message); } finally { setLoading(false); }
  };

  const crearTicketAutoservicio = async (e) => {
    e.preventDefault();
    setCreandoTicket(true);
    try {
      const requerimientos = ["Restablecer contraseña", "Instalación de Office", "Solicitar nuevo acceso", "Dudas con liquidación", "Falta de tóner"];
      const esReq = requerimientos.includes(nivel3);
      const tipo = esReq ? 'requerimiento' : 'incidente';
      const sla_horas = esReq ? 24 : 8;

      const { data, error } = await supabase.from('tickets').insert([{
        titulo: `${nivel2}: ${nivel3}`, descripcion: detallesExtra || 'Reporte automático sin detalles adicionales.', tipo, prioridad: 'Media', servicio: nivel2, sla_horas, estado: 'Abierto', usuario_creador: currentUser?.email
      }]).select();
      
      if (error) throw error;
      enviarNotificacion('soporte.ti@utalca.cl', data[0].id, 'Nuevo Ticket Creado', `El usuario ${currentUser?.email} ha reportado: ${data[0].titulo}`);
      setNivel1(null); setNivel2(null); setNivel3(null); setDetallesExtra('');
      obtenerTickets(currentUser?.email);
      addToast('Ticket enviado', `Clasificado como ${tipo.toUpperCase()}.`, 'success');
    } catch (error) { addToast('Error', error.message, 'error'); } finally { setCreandoTicket(false); }
  };

  const autoasignarseTicket = async (ticket) => {
    try {
      const { error } = await supabase.from('tickets').update({ agente_asignado: currentUser?.email }).eq('id', ticket.id);
      if (error) throw error;
      enviarNotificacion(ticket.usuario_creador, ticket.id, 'Agente Asignado', `El agente ${currentUser?.email} está revisando tu caso.`);
      obtenerTickets(currentUser?.email);
      addToast('Asignado', 'Te has asignado este requerimiento.', 'success');
    } catch (error) { addToast('Error', error.message, 'error'); }
  };

  const actualizarEstadoTicket = async (ticket, nuevoEstado) => {
    try {
      const { error } = await supabase.from('tickets').update({ estado: nuevoEstado }).eq('id', ticket.id);
      if (error) throw error;
      enviarNotificacion(ticket.usuario_creador, ticket.id, 'Cambio de Estado', `Tu ticket ahora está: ${nuevoEstado}`);
      obtenerTickets(currentUser?.email);
      
      if(ticketChatActivo && ticketChatActivo.id === ticket.id) {
        setTicketChatActivo({...ticketChatActivo, estado: nuevoEstado});
      }
      addToast('Actualizado', `Ticket marcado como: ${nuevoEstado}`, 'success');
    } catch (error) { addToast('Error', error.message, 'error'); }
  };

  useEffect(() => {
    if (!ticketChatActivo) return;
    
    const cargarMensajes = async () => {
      const { data } = await supabase.from('mensajes_ticket').select('*').eq('ticket_id', ticketChatActivo.id).order('fecha_creacion', { ascending: true });
      if (data) setMensajesChat(data);
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    };
    cargarMensajes();

    const channel = supabase.channel(`chat_ticket_${ticketChatActivo.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_ticket', filter: `ticket_id=eq.${ticketChatActivo.id}` }, (payload) => {
        setMensajesChat(prev => [...prev, payload.new]);
        setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, 100);
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [ticketChatActivo]);

  const enviarMensajeChat = async (e) => {
    if (e) e.preventDefault();
    if ((!nuevoMensaje.trim() && !archivoAdjunto) || ticketChatActivo.estado === 'Cerrado') return;
    
    setSubiendoArchivo(true);
    try {
      let urlPublicaAdjunto = null;
      if (archivoAdjunto) {
        const nombreLimpio = `${Date.now()}_${archivoAdjunto.name.replace(/\s+/g, '_')}`;
        const rutaAlmacenamiento = `ticket_${ticketChatActivo.id}/${nombreLimpio}`;
        const { error: uploadError } = await supabase.storage.from('adjuntos').upload(rutaAlmacenamiento, archivoAdjunto);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('adjuntos').getPublicUrl(rutaAlmacenamiento);
        urlPublicaAdjunto = publicUrl;
      }

      const msgText = nuevoMensaje;
      setNuevoMensaje('');
      setArchivoAdjunto(null);

      await supabase.from('mensajes_ticket').insert([{ 
        ticket_id: ticketChatActivo.id, 
        remitente: currentUser?.email, 
        mensaje: msgText || `Archivo adjunto: ${archivoAdjunto?.name}`,
        adjunto_url: urlPublicaAdjunto
      }]);
      
      const destino = esAgente ? ticketChatActivo.usuario_creador : (ticketChatActivo.agente_asignado || 'soporte.ti@utalca.cl');
      enviarNotificacion(destino, ticketChatActivo.id, 'Nuevo mensaje', `Tienes una respuesta en el ticket #${ticketChatActivo.id}`);
    } catch (error) { addToast('Error al enviar', error.message, 'error'); } finally { setSubiendoArchivo(false); }
  };

  const esImagen = (url) => url ? url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null : false;
  const extraerNombreArchivo = (url) => {
    if (!url) return 'Archivo';
    const partes = url.split('/');
    const nombre = partes[partes.length - 1];
    return nombre.substring(nombre.indexOf('_') + 1);
  };

  const ticketsFiltrados = esAgente && vistaAgente === 'propios' ? tickets.filter(t => t.agente_asignado === currentUser?.email) : tickets;

  const RenderFilaTicket = ({ t }) => {
    const sla = evaluarSLA(t.fecha_creacion, t.sla_horas, t.estado);
    return (
      <tr key={t.id} style={{cursor: 'pointer'}} onClick={(e) => { if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') setTicketChatActivo(t); }}>
        <td><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>#{String(t.id).padStart(4, '0')}</span></td>
        <td>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>{t.titulo}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{t.servicio} • {t.usuario_creador?.split('@')[0]}</p>
        </td>
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
            <TypeBadge value={t.tipo} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: sla.color, fontWeight: 600, fontFamily: 'var(--mono)' }}>
              <ClockIcon style={{width: 10, height: 10}} /> {sla.texto}
            </div>
          </div>
        </td>
        <td><StatusBadge value={t.estado} /></td>
        <td>
          {esAgente ? (
            t.agente_asignado ? (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 6 }}>{t.agente_asignado.split('@')[0]}</div>
                {t.agente_asignado === currentUser?.email && t.estado !== 'Cerrado' && (
                  <select className="select-estado" value={t.estado} onChange={(e) => actualizarEstadoTicket(t, e.target.value)}>
                    <option value="Abierto">Abierto</option><option value="En espera del usuario">En espera</option><option value="Solucionado">Solucionado</option><option value="Cerrado">Cerrado</option>
                  </select>
                )}
              </>
            ) : <button className="btn-assign" onClick={() => autoasignarseTicket(t)}>+ Tomar Ticket</button>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.agente_asignado?.split('@')[0] || 'En espera...'}</div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div style={{ padding: '36px 40px', width: '100%', maxWidth: esAgente ? '100%' : 1200, margin: '0 auto' }}>
      <style>{`
        .wizard-container { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; min-height: 280px; align-items: stretch; margin-bottom: 32px; }
        .wizard-col { flex: 1; min-width: 240px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; animation: slideIn 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .wizard-col-header { padding: 14px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--surface-2); font-family: var(--mono); }
        .wizard-item { padding: 14px 16px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; border-bottom: 1px solid var(--border); transition: all 0.15s; display: flex; justify-content: space-between; align-items: center; }
        .wizard-item:hover { background: var(--surface-hover); color: var(--brand); padding-left: 20px; }
        .wizard-item.active { background: var(--brand); color: #fff; border-color: var(--brand); }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        
        .tk-table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.02); }
        .tk-table th { padding: 12px 20px; text-align: left; font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); font-family: var(--mono); background: var(--surface-2); }
        .tk-table td { padding: 16px 20px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: middle; transition: background 0.15s; }
        .tk-table tr:hover td { background: var(--surface-hover); }
        
        .btn-submit, .btn-primary { padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: 100%; margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 6px rgba(154, 0, 21, 0.2); }
        .btn-ghost { padding: 8px 16px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; justify-content: center; }
        .btn-ghost:hover { border-color: var(--text-primary); color: var(--text-primary); }
        .btn-assign { padding: 4px 10px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 4px; font-size: 9.5px; font-weight: 600; cursor: pointer; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.15s; }
        .btn-assign:hover { border-color: var(--brand); color: var(--brand); background: var(--sidebar-hover); }
        .select-estado { background: transparent; border: 1px solid var(--border-strong); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; color: var(--text-primary); outline: none; transition: border 0.2s; }
        .select-estado:focus { border-color: var(--brand); }

        .chat-container { display: flex; flex-direction: column; height: 500px; background: var(--surface-2); }
        .chat-messages { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; scrollbar-width: thin; }
        .chat-bubble { max-width: 80%; padding: 14px 18px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .chat-bubble.mine { align-self: flex-end; background: var(--brand); color: #fff; border-bottom-right-radius: 4px; }
        .chat-bubble.other { align-self: flex-start; background: var(--surface); border: 1px solid var(--border); color: var(--text-primary); border-bottom-left-radius: 4px; }
        .chat-meta { font-size: 9.5px; margin-top: 6px; opacity: 0.75; font-family: var(--mono); text-align: right; }
        .chat-bubble.other .chat-meta { text-align: left; }
        
        .chat-input-area { padding: 16px 24px; background: var(--surface); border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
        
        .chat-pill { display: flex; align-items: center; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 30px; padding: 4px 6px; width: 100%; transition: all 0.2s; }
        .chat-pill:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px var(--accent-dim); }
        .chat-pill.disabled { opacity: 0.6; pointer-events: none; background: var(--surface-2); }
        .chat-input { flex: 1; border: none; background: transparent; outline: none; padding: 10px 14px; font-size: 13.5px; font-family: var(--font); color: var(--text-primary); }
        .btn-clip { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .btn-clip:hover { color: var(--text-primary); background: var(--surface-2); }
        .btn-send { background: var(--brand); color: #fff; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s, background 0.15s; margin-left: 4px; }
        .btn-send:hover:not(:disabled) { transform: scale(1.05); background: var(--brand-hover); }
        .btn-send:disabled { background: var(--border-strong); cursor: not-allowed; }
        
        .adjunto-preview { display: inline-flex; alignItems: center; gap: 8px; padding: 6px 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; font-weight: 500; align-self: flex-start; }
        
        /* BOTONES DE RESPUESTA RÁPIDA */
        .quick-replies-container { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .quick-replies-container::-webkit-scrollbar { display: none; }
        .btn-quick-reply { background: var(--surface); border: 1px solid var(--border-strong); color: var(--text-secondary); font-size: 11px; padding: 6px 12px; border-radius: 16px; cursor: pointer; white-space: nowrap; transition: all 0.15s; font-weight: 500; }
        .btn-quick-reply:hover { border-color: var(--brand); color: var(--brand); background: var(--sidebar-hover); }
      `}</style>

      {!esAgente ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>¿En qué te podemos ayudar?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Selecciona una opción a continuación para reportar tu problema paso a paso.</p>
            </div>
            <button className="btn-ghost" onClick={() => setMostrarHistorial(true)}>Ver mis Tickets</button>
          </div>

          <div className="wizard-container">
            <div className="wizard-col">
              <div className="wizard-col-header">1. Tipo de Problema</div>
              <div style={{ overflowY: 'auto' }}>
                {Object.keys(ARBOL_SERVICIOS).map(cat => (<div key={cat} className={`wizard-item ${nivel1 === cat ? 'active' : ''}`} onClick={() => { setNivel1(cat); setNivel2(null); setNivel3(null); }}>{cat} <span>›</span></div>))}
              </div>
            </div>
            {nivel1 && (
              <div className="wizard-col">
                <div className="wizard-col-header">2. Servicio Afectado</div>
                <div style={{ overflowY: 'auto' }}>
                  {Object.keys(ARBOL_SERVICIOS[nivel1]).map(srv => (<div key={srv} className={`wizard-item ${nivel2 === srv ? 'active' : ''}`} onClick={() => { setNivel2(srv); setNivel3(null); }}>{srv} <span>›</span></div>))}
                </div>
              </div>
            )}
            {nivel2 && (
              <div className="wizard-col">
                <div className="wizard-col-header">3. ¿Qué está fallando?</div>
                <div style={{ overflowY: 'auto' }}>
                  {ARBOL_SERVICIOS[nivel1][nivel2].map(inc => (<div key={inc} className={`wizard-item ${nivel3 === inc ? 'active' : ''}`} onClick={() => setNivel3(inc)}>{inc} <span>›</span></div>))}
                </div>
              </div>
            )}
            {nivel3 && (
              <div className="wizard-col" style={{ minWidth: 300, background: 'var(--surface-2)' }}>
                <div className="wizard-col-header">4. Confirmar y Enviar</div>
                <form onSubmit={crearTicketAutoservicio} style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 12 }}>{nivel2} - {nivel3}</div>
                  <textarea placeholder="Describe brevemente la situación..." style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80, marginBottom: 16, background: 'var(--surface)', fontFamily: 'var(--font)' }} value={detallesExtra} onChange={e => setDetallesExtra(e.target.value)} />
                  <button type="submit" className="btn-submit" disabled={creandoTicket}>{creandoTicket ? 'Enviando...' : 'Enviar Solicitud'}</button>
                </form>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Bandeja Central de Soporte</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Vista Exclusiva de Agente TI</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--surface-2)', padding: 6, borderRadius: 8, display: 'inline-flex' }}>
            <button className={`btn-ghost ${vistaAgente === 'propios' ? 'active' : ''}`} style={vistaAgente === 'propios' ? {background:'var(--surface)', borderColor:'var(--border)', color:'var(--brand)', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'} : {border:'1px solid transparent'}} onClick={() => setVistaAgente('propios')}>Mis Tickets</button>
            <button className={`btn-ghost ${vistaAgente === 'global' ? 'active' : ''}`} style={vistaAgente === 'global' ? {background:'var(--surface)', borderColor:'var(--border)', color:'var(--brand)', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'} : {border:'1px solid transparent'}} onClick={() => setVistaAgente('global')}>Bandeja Global</button>
          </div>
          
          <div style={{ overflowY: 'auto', paddingBottom: 20 }}>
            <table className="tk-table">
              <thead><tr><th style={{ width: 72 }}>ID</th><th>Asunto / Usuario</th><th style={{ width: 100 }}>Clasificación</th><th style={{ width: 120 }}>Estado</th><th style={{ width: 140 }}>Gestión</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>Cargando...</td></tr> : 
                 ticketsFiltrados.length === 0 ? <tr><td colSpan="5" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Bandeja limpia. No hay tickets.</td></tr> :
                 ticketsFiltrados.map((t) => <RenderFilaTicket key={t.id} t={t} />)}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!esAgente && mostrarHistorial && (
        <Modal open={mostrarHistorial} onClose={() => setMostrarHistorial(false)} maxWidth={900}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Mis Solicitudes (Haz clic para abrir el chat)</h3>
            <button onClick={() => setMostrarHistorial(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '60vh', padding: 24, background: 'var(--bg)' }}>
            <table className="tk-table">
              <thead><tr><th style={{ width: 72 }}>ID</th><th>Asunto / Usuario</th><th style={{ width: 100 }}>Clasificación</th><th style={{ width: 120 }}>Estado</th><th style={{ width: 140 }}>Gestión</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="5" style={{ padding: 30, textAlign: 'center' }}>Cargando...</td></tr> : 
                 ticketsFiltrados.length === 0 ? <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No tienes tickets creados.</td></tr> :
                 ticketsFiltrados.map((t) => <RenderFilaTicket key={t.id} t={t} />)}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      <Modal open={!!ticketChatActivo} onClose={() => setTicketChatActivo(null)} maxWidth={700}>
        {ticketChatActivo && (
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge value={ticketChatActivo.estado} />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    #{String(ticketChatActivo.id).padStart(4, '0')} - {ticketChatActivo.titulo}
                  </h2>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                  Solicitante: <span style={{color: 'var(--text-secondary)', fontWeight: 600}}>{ticketChatActivo.usuario_creador}</span> • 
                  Técnico: <span style={{color: 'var(--text-secondary)', fontWeight: 600}}>{ticketChatActivo.agente_asignado || 'Sin asignar'}</span>
                </div>
              </div>
              <button onClick={() => setTicketChatActivo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="chat-container">
              <div className="chat-messages" ref={chatScrollRef}>
                
                <div className={`chat-bubble ${ticketChatActivo.usuario_creador === currentUser?.email ? 'mine' : 'other'}`} style={{ border: '1px solid var(--brand)', background: ticketChatActivo.usuario_creador === currentUser?.email ? 'var(--brand)' : 'var(--surface)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: ticketChatActivo.usuario_creador === currentUser?.email ? '#fff' : 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {ticketChatActivo.usuario_creador.split('@')[0]} (Reporte Inicial)
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{ticketChatActivo.descripcion}</div>
                  <div className="chat-meta" style={{ opacity: 0.9 }}>
                    {new Date(ticketChatActivo.fecha_creacion + (!ticketChatActivo.fecha_creacion.endsWith('Z') ? 'Z' : '')).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                  </div>
                </div>

                {mensajesChat.map(msg => {
                  const isMine = msg.remitente === currentUser?.email;
                  return (
                    <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'other'}`}>
                      {!isMine && <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: 'var(--brand)' }}>{msg.remitente.split('@')[0]}</div>}
                      <div>{msg.mensaje}</div>
                      
                      {msg.adjunto_url && (
                        <div style={{ marginTop: 8, maxWidth: '100%' }}>
                          {esImagen(msg.adjunto_url) ? (
                            <a href={msg.adjunto_url} target="_blank" rel="noreferrer">
                              <img src={msg.adjunto_url} alt="adjunto" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 6, border: '1px solid var(--border)', display: 'block', background: '#fff' }} />
                            </a>
                          ) : (
                            <a href={msg.adjunto_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: isMine ? 'rgba(255,255,255,0.15)' : 'var(--surface-2)', borderRadius: 6, color: isMine ? '#fff' : 'var(--text-primary)', textDecoration: 'none', fontSize: 11, fontWeight: 600, border: isMine ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}>
                              <DownloadIcon style={{ width: 14, height: 14 }} /> Descargar archivo
                            </a>
                          )}
                        </div>
                      )}
                      
                      <div className="chat-meta">
                        {new Date(msg.fecha_creacion + (!msg.fecha_creacion.endsWith('Z') ? 'Z' : '')).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <form onSubmit={enviarMensajeChat} className="chat-input-area">
                
                {/* ── BOTONES DE RESPUESTAS RÁPIDAS (SOLO AGENTES Y SI NO ESTÁ CERRADO) ── */}
                {esAgente && ticketChatActivo.estado !== 'Cerrado' && (
                  <div className="quick-replies-container">
                    {PLANTILLAS_AGENTE.map((plantilla, idx) => (
                      <button 
                        key={idx} 
                        type="button" 
                        className="btn-quick-reply"
                        onClick={() => setNuevoMensaje(plantilla)}
                      >
                        {plantilla.substring(0, 30)}...
                      </button>
                    ))}
                  </div>
                )}

                {archivoAdjunto && (
                  <div className="adjunto-preview">
                    <PaperclipIcon style={{ width: 14, height: 14 }} /> {archivoAdjunto.name}
                    <button type="button" onClick={() => setArchivoAdjunto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 'bold', marginLeft: 4 }}>×</button>
                  </div>
                )}
                
                <div className={`chat-pill ${ticketChatActivo.estado === 'Cerrado' ? 'disabled' : ''}`}>
                  <input type="file" id="chat-file-input" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) setArchivoAdjunto(e.target.files[0]); }} disabled={ticketChatActivo.estado === 'Cerrado' || subiendoArchivo} />
                  
                  <button type="button" className="btn-clip" onClick={() => document.getElementById('chat-file-input').click()} disabled={ticketChatActivo.estado === 'Cerrado' || subiendoArchivo}>
                    <PaperclipIcon style={{ width: 18, height: 18 }} />
                  </button>
                  
                  <input type="text" className="chat-input" placeholder={ticketChatActivo.estado === 'Cerrado' ? "El ticket está cerrado. No se pueden enviar más mensajes." : "Escribe tu respuesta aquí..."} value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} disabled={ticketChatActivo.estado === 'Cerrado' || subiendoArchivo} />
                  
                  <button type="submit" className="btn-send" disabled={ticketChatActivo.estado === 'Cerrado' || subiendoArchivo || (!nuevoMensaje.trim() && !archivoAdjunto)}>
                    {subiendoArchivo ? <span style={{fontSize: 10}}>...</span> : <SendIcon style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </Modal>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Tickets;