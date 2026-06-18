import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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
   ÁRBOL DE DECISIÓN (WIZARD EN CASCADA)
───────────────────────────────────────────── */
const ARBOL_SERVICIOS = {
  "Accesos y Cuentas": {
    "Educandus": ["Restablecer contraseña", "No veo mis cursos", "Error de matriculación"],
    "Microsoft 365": ["Problemas con Teams", "Instalación de Office", "Correo bloqueado"],
    "SAP": ["Solicitar nuevo acceso", "Error de inicio de sesión", "Problemas de permisos"],
    "BUK RRHH": ["Dudas con liquidación", "No puedo ingresar"]
  },
  "Hardware e Infraestructura": {
    "Computadoras": ["Equipo no enciende", "Lentitud extrema", "Pantalla azul / Error de sistema"],
    "Impresoras": ["Falta de tóner", "Atasco de papel", "Mala calidad de impresión"],
    "Proyectores": ["Proyector no enciende", "Cable HDMI dañado", "Proyector parpadea"],
    "Biométricos": ["No registra huella", "Pantalla apagada"]
  },
  "Conectividad": {
    "Internet WiFi": ["No conecta a Eduroam", "Señal débil", "Falla masiva en sector"],
    "Internet Cableado": ["Sin internet en mi punto de red", "Cable de red dañado"]
  }
};

/* ─────────────────────────────────────────────
   COMPONENTES UI (Toast, Badges, Modal)
───────────────────────────────────────────── */
function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      {toasts.map((t) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `2px solid ${t.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 4, minWidth: 290, maxWidth: 370, pointerEvents: 'all', animation: 'toastIn 0.18s ease' }}>
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlayIn 0.12s ease' }}>
      <style>{`@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } } @keyframes modalIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, width: '100%', maxWidth, overflow: 'hidden', animation: 'modalIn 0.18s ease', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function PriorityBadge({ value }) {
  const s = { Baja: { c: 'var(--text-muted)' }, Media: { c: 'var(--accent)' }, Alta: { c: 'var(--warning)' }, Crítica: { c: 'var(--danger)' } }[value] || { c: 'var(--text-muted)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', border: `1px solid var(--border)`, borderRadius: 2, color: s.c, fontSize: 10, fontWeight: 500, fontFamily: 'var(--mono)' }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.c }} />{value}
    </span>
  );
}

function StatusBadge({ value }) {
  const s = { 'Abierto': 'var(--danger)', 'En espera del usuario': 'var(--warning)', 'En espera de un tercero': 'var(--warning)', 'Solucionado': 'var(--success)', 'Cerrado': 'var(--text-muted)' }[value] || 'var(--text-muted)';
  return (<span style={{ display: 'inline-block', padding: '2px 8px', border: `1px solid ${value === 'Cerrado' ? 'var(--border)' : s}`, borderRadius: 2, color: s, fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>{value}</span>);
}

function TypeBadge({ value }) {
  const isInc = value === 'incidente';
  return (<span style={{ display: 'inline-block', padding: '2px 7px', border: `1px solid ${isInc ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 2, color: isInc ? 'var(--danger)' : 'var(--accent)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.07em', fontFamily: 'var(--mono)' }}>{value?.toUpperCase()}</span>);
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
function Tickets() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // ESTADOS VISTA USUARIO
  const [nivel1, setNivel1] = useState(null);
  const [nivel2, setNivel2] = useState(null);
  const [nivel3, setNivel3] = useState(null);
  const [detallesExtra, setDetallesExtra] = useState('');
  const [creandoTicket, setCreandoTicket] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false); // Modal Historial

  // ESTADOS VISTA AGENTE
  const [vistaAgente, setVistaAgente] = useState('propios'); // 'propios' | 'global'

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

  // OBTENER TICKETS
  const obtenerTickets = async (emailUsuario) => {
    try {
      setLoading(true);
      let query = supabase.from('tickets').select('*').order('fecha_creacion', { ascending: false });
      
      if (!EMAILS_AGENTES.includes(emailUsuario)) {
        query = query.eq('usuario_creador', emailUsuario);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // CREAR TICKET
  const crearTicketAutoservicio = async (e) => {
    e.preventDefault();
    setCreandoTicket(true);
    try {
      const requerimientos = ["Restablecer contraseña", "Instalación de Office", "Solicitar nuevo acceso", "Dudas con liquidación", "Falta de tóner"];
      const esReq = requerimientos.includes(nivel3);
      const tipoTicket = esReq ? 'requerimiento' : 'incidente';
      const horasSLA = esReq ? 24 : 8;

      const { error } = await supabase.from('tickets').insert([{
        titulo: `${nivel2}: ${nivel3}`,
        descripcion: detallesExtra || 'Sin detalles adicionales.',
        tipo: tipoTicket,
        prioridad: 'Media',
        servicio: nivel2,
        sla_horas: horasSLA,
        estado: 'Abierto',
        usuario_creador: currentUser?.email,
        agente_asignado: null
      }]);
      
      if (error) throw error;
      
      setNivel1(null); setNivel2(null); setNivel3(null); setDetallesExtra('');
      obtenerTickets(currentUser?.email);
      addToast('Ticket enviado exitosamente', `Clasificado como ${tipoTicket.toUpperCase()} con SLA de ${horasSLA}h.`, 'success');
    } catch (error) {
      addToast('Error', error.message, 'error');
    } finally {
      setCreandoTicket(false);
    }
  };

  // FUNCIONES DE AGENTE
  const autoasignarseTicket = async (ticketId) => {
    try {
      const { error } = await supabase.from('tickets').update({ agente_asignado: currentUser?.email }).eq('id', ticketId);
      if (error) throw error;
      obtenerTickets(currentUser?.email);
      addToast('Ticket Asignado', 'Te has asignado este requerimiento.', 'success');
    } catch (error) { addToast('Error', error.message, 'error'); }
  };

  const actualizarEstadoTicket = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase.from('tickets').update({ estado: nuevoEstado }).eq('id', id);
      if (error) throw error;
      obtenerTickets(currentUser?.email);
      addToast('Estado actualizado', `Ticket marcado como: ${nuevoEstado}`, 'success');
    } catch (error) { addToast('Error', error.message, 'error'); }
  };

  const exportarExcel = () => {
    const cabeceras = ["ID", "Asunto", "Servicio", "Tipo", "Estado", "Agente", "Fecha"];
    const filas = ticketsFiltrados.map(t => [t.id, `"${t.titulo}"`, t.servicio, t.tipo, t.estado, t.agente_asignado || 'Sin asignar', new Date(t.fecha_creacion).toLocaleDateString()]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + cabeceras.join(";") + "\n" + filas.map(e => e.join(";")).join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `Tickets.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // FILTRADO DE TICKETS PARA AGENTES
  const ticketsFiltrados = esAgente && vistaAgente === 'propios' 
    ? tickets.filter(t => t.agente_asignado === currentUser?.email)
    : tickets;

  /* ─────────────────────────────────────────────
     VISTA 1: PORTAL DE AUTOSERVICIO
  ───────────────────────────────────────────── */
  if (!esAgente) {
    return (
      <div style={{ padding: '36px 40px', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        <style>{`
          .wizard-container { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; min-height: 280px; align-items: stretch; }
          .wizard-col { flex: 1; min-width: 240px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; animation: slideIn 0.2s ease; }
          .wizard-col-header { padding: 12px 16px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--surface-2); font-family: var(--mono); }
          .wizard-item { padding: 14px 16px; font-size: 13px; color: var(--text-secondary); cursor: pointer; border-bottom: 1px solid var(--border); transition: all 0.1s; display: flex; justify-content: space-between; align-items: center; }
          .wizard-item:last-child { border-bottom: none; }
          .wizard-item:hover { background: var(--surface-hover); color: var(--text-primary); }
          .wizard-item.active { background: var(--text-primary); color: var(--surface); font-weight: 500; }
          @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
          
          .user-table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--surface); }
          .user-table th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border); text-transform: uppercase; }
          .user-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
          .btn-submit { padding: 10px 20px; background: var(--text-primary); color: var(--surface); border: none; border-radius: 4px; font-weight: 500; cursor: pointer; transition: opacity 0.2s; width: 100%; margin-top: auto; }
          .btn-submit:hover:not(:disabled) { opacity: 0.8; }
          .btn-ghost { padding: 8px 16px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
          .btn-ghost:hover { border-color: var(--text-primary); color: var(--text-primary); }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>¿En qué te podemos ayudar?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Selecciona una opción a continuación para reportar tu problema paso a paso.</p>
          </div>
          <button className="btn-ghost" onClick={() => setMostrarHistorial(true)}>
            Historial de Solicitudes
          </button>
        </div>

        {/* CASCADA INTERACTIVA */}
        <div className="wizard-container">
          <div className="wizard-col">
            <div className="wizard-col-header">1. Tipo de Problema</div>
            <div style={{ overflowY: 'auto' }}>
              {Object.keys(ARBOL_SERVICIOS).map(cat => (
                <div key={cat} className={`wizard-item ${nivel1 === cat ? 'active' : ''}`} onClick={() => { setNivel1(cat); setNivel2(null); setNivel3(null); }}>
                  {cat} <span>›</span>
                </div>
              ))}
            </div>
          </div>

          {nivel1 && (
            <div className="wizard-col">
              <div className="wizard-col-header">2. Servicio Afectado</div>
              <div style={{ overflowY: 'auto' }}>
                {Object.keys(ARBOL_SERVICIOS[nivel1]).map(srv => (
                  <div key={srv} className={`wizard-item ${nivel2 === srv ? 'active' : ''}`} onClick={() => { setNivel2(srv); setNivel3(null); }}>
                    {srv} <span>›</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nivel2 && (
            <div className="wizard-col">
              <div className="wizard-col-header">3. ¿Qué está fallando?</div>
              <div style={{ overflowY: 'auto' }}>
                {ARBOL_SERVICIOS[nivel1][nivel2].map(inc => (
                  <div key={inc} className={`wizard-item ${nivel3 === inc ? 'active' : ''}`} onClick={() => setNivel3(inc)}>
                    {inc} <span>›</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nivel3 && (
            <div className="wizard-col" style={{ minWidth: 300, background: 'var(--surface-2)' }}>
              <div className="wizard-col-header">4. Confirmar y Enviar</div>
              <form onSubmit={crearTicketAutoservicio} style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 12 }}>
                  Ticket: {nivel2} - {nivel3}
                </div>
                <textarea 
                  placeholder="Añade detalles extra aquí (Opcional)..." 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80, marginBottom: 16, background: 'var(--surface)' }}
                  value={detallesExtra}
                  onChange={e => setDetallesExtra(e.target.value)}
                />
                <button type="submit" className="btn-submit" disabled={creandoTicket}>
                  {creandoTicket ? 'Enviando...' : 'Enviar Solicitud al Soporte TI'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* MODAL HISTORIAL DEL USUARIO */}
        <Modal open={mostrarHistorial} onClose={() => setMostrarHistorial(false)}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Mis Solicitudes Anteriores</h3>
            <button onClick={() => setMostrarHistorial(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Asunto</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Agente Asignado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center' }}>Cargando...</td></tr> : 
                 tickets.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: 30 }}>No tienes solicitudes registradas.</td></tr> :
                 tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'var(--mono)' }}>#{String(t.id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 500 }}>{t.titulo}</td>
                    <td><TypeBadge value={t.tipo} /></td>
                    <td><StatusBadge value={t.estado} /></td>
                    <td style={{ fontSize: 12 }}>{t.agente_asignado?.split('@')[0] || 'En espera...'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>

        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     VISTA 2: MESA DE AYUDA AVANZADA (Agentes)
  ───────────────────────────────────────────── */
  return (
    <div style={{ padding: '36px 40px', width: '100%' }}>
      <style>{`
        .tk-toolbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .btn-ghost:hover { border-color: var(--text-primary); color: var(--text-primary); }
        .btn-tab { padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 4px; cursor: pointer; transition: all 0.15s; border: 1px solid transparent; }
        .btn-tab.active { background: var(--surface); border-color: var(--border); color: var(--brand); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .btn-tab.inactive { background: transparent; color: var(--text-muted); }
        .btn-tab.inactive:hover { color: var(--text-primary); }
        .tk-table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .tk-table th { padding: 10px 18px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); font-family: var(--mono); }
        .tk-table td { padding: 14px 18px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: middle; }
        .tk-table tr:hover td { background: var(--surface-hover); }
        .btn-assign { padding: 3px 9px; background: transparent; color: var(--text-secondary); border: 1px solid var(--border); border-radius: 3px; font-size: 9.5px; font-weight: 500; cursor: pointer; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.08em; }
        .btn-assign:hover { border-color: var(--text-primary); color: var(--text-primary); }
        .select-estado { background: transparent; border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-size: 11px; color: var(--text-primary); outline: none; margin-top: 6px; }
      `}</style>

      <div className="tk-toolbar">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Bandeja Central de Soporte</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Vista Exclusiva de Agente TI</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={exportarExcel}>Exportar CSV</button>
          <button className="btn-ghost" onClick={() => obtenerTickets(currentUser?.email)}>Actualizar</button>
        </div>
      </div>

      {/* PESTAÑAS DE VISTA AGENTE */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: 'var(--surface-2)', padding: 4, borderRadius: 6, display: 'inline-flex' }}>
        <button 
          className={`btn-tab ${vistaAgente === 'propios' ? 'active' : 'inactive'}`} 
          onClick={() => setVistaAgente('propios')}
        >
          Mis Tickets Asignados
        </button>
        <button 
          className={`btn-tab ${vistaAgente === 'global' ? 'active' : 'inactive'}`} 
          onClick={() => setVistaAgente('global')}
        >
          Bandeja Global (Todos)
        </button>
      </div>

      <table className="tk-table">
        <thead>
          <tr>
            <th style={{ width: 72 }}>ID</th>
            <th>Asunto / Usuario</th>
            <th style={{ width: 148 }}>Clasificación</th>
            <th style={{ width: 110 }}>Prioridad</th>
            <th style={{ width: 190 }}>Gestión / Estado</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan="5" style={{ padding: 30, textAlign: 'center' }}>Cargando...</td></tr> : 
           ticketsFiltrados.length === 0 ? <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No hay tickets en esta vista.</td></tr> :
           ticketsFiltrados.map((t) => (
            <tr key={t.id}>
              <td><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>#{String(t.id).padStart(4, '0')}</span></td>
              <td>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{t.titulo}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--mono)' }}>{t.servicio} · {t.usuario_creador?.split('@')[0]}</p>
              </td>
              <td>
                <TypeBadge value={t.tipo} />
                <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>SLA: {t.sla_horas}h</div>
              </td>
              <td><PriorityBadge value={t.prioridad} /></td>
              <td>
                <div style={{ marginBottom: 6 }}><StatusBadge value={t.estado} /></div>
                
                {t.agente_asignado ? (
                  <>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Agente: {t.agente_asignado.split('@')[0]}</div>
                    {t.agente_asignado === currentUser?.email && t.estado !== 'Cerrado' && (
                      <select className="select-estado" value={t.estado} onChange={(e) => actualizarEstadoTicket(t.id, e.target.value)}>
                        <option value="Abierto">Abierto</option>
                        <option value="En espera del usuario">En espera</option>
                        <option value="Solucionado">Solucionado</option>
                        <option value="Cerrado">Cerrado</option>
                      </select>
                    )}
                  </>
                ) : (
                  <button className="btn-assign" onClick={() => autoasignarseTicket(t.id)}>+ Tomar Ticket</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Tickets;