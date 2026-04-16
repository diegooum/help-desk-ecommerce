import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/* ─────────────────────────────────────────────
   CATÁLOGO DE SERVICIOS UTALCA
───────────────────────────────────────────── */
const CATALOGO_SERVICIOS = [
  "SAP", "Educandus", "Sistema de Biblioteca", "BUK RRHH",
  "Microsoft 365", "Computadoras", "Impresoras", "Proyectores",
  "Televisores", "Access Point (WiFi)", "Biométricos", "Internet"
];

// LISTA OFICIAL DE AGENTES TI UTALCA
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
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '1px 0 0 4px', lineHeight: 1, transition: 'color 0.1s', fontSize: 12 }}>×</button>
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

/* ─────────────────────────────────────────────
   BADGES Y COMPONENTES VISUALES
   → Estilo editorial: borde fino + texto a color, sin fondo
───────────────────────────────────────────── */
function PriorityBadge({ value }) {
  const s = {
    Baja:    { color: 'var(--text-muted)',   border: 'var(--border)'       },
    Media:   { color: 'var(--accent)',       border: 'var(--border)'       },
    Alta:    { color: 'var(--warning)',      border: 'var(--warning)'      },
    Crítica: { color: 'var(--danger)',       border: 'var(--danger)'       },
  }[value] || { color: 'var(--text-muted)', border: 'var(--border)' };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', border: `1px solid ${s.border}`, borderRadius: 2, color: s.color, fontSize: 10, fontWeight: 500, fontFamily: 'var(--mono)', whiteSpace: 'nowrap', background: 'transparent' }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {value}
    </span>
  );
}

function StatusBadge({ value }) {
  const s = {
    'Abierto':                 { color: 'var(--danger)',      border: 'var(--danger)'   },
    'En espera del usuario':   { color: 'var(--warning)',     border: 'var(--warning)'  },
    'En espera de un tercero': { color: 'var(--warning)',     border: 'var(--warning)'  },
    'Solucionado':             { color: 'var(--success)',     border: 'var(--success)'  },
    'Cerrado':                 { color: 'var(--text-muted)', border: 'var(--border)'   },
  }[value] || { color: 'var(--text-muted)', border: 'var(--border)' };

  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', border: `1px solid ${s.border}`, borderRadius: 2, color: s.color, fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--mono)', whiteSpace: 'nowrap', textTransform: 'uppercase', background: 'transparent', letterSpacing: '0.06em' }}>
      {value}
    </span>
  );
}

function TypeBadge({ value }) {
  const s = {
    incidente:     { color: 'var(--danger)',  border: 'var(--danger)',  label: 'INCIDENTE'      },
    requerimiento: { color: 'var(--accent)',  border: 'var(--border)',  label: 'REQUERIMIENTO'  },
  }[value] || { color: 'var(--text-muted)', border: 'var(--border)', label: value?.toUpperCase() };

  return (
    <span style={{ display: 'inline-block', padding: '2px 7px', border: `1px solid ${s.border}`, borderRadius: 2, color: s.color, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.07em', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', background: 'transparent' }}>
      {s.label}
    </span>
  );
}

function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 13 13" fill="none" style={{ animation: 'spinIt 0.65s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spinIt { to { transform: rotate(360deg); } }`}</style>
      <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8"/>
      <path d="M6.5 1.5a5 5 0 0 1 5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const fieldBase = { width: '100%', padding: '9px 12px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface)', fontFamily: 'var(--font)', outline: 'none', transition: 'border-color 0.12s' };
const onFocus = (e) => { e.target.style.borderColor = 'var(--border-strong)'; };
const onBlur = (e) => { e.target.style.borderColor = 'var(--border)'; };

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
function Tickets() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [nuevoTicket, setNuevoTicket] = useState({
    titulo: '', descripcion: '', tipo: 'incidente', prioridad: 'Media', servicio: CATALOGO_SERVICIOS[0]
  });

  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now(); setToasts((p) => [...p, { id, title, message, type }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  useEffect(() => { 
    // Identificar quién está logueado
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
    obtenerTickets(); 
  }, []);

  const obtenerTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tickets').select('*').order('fecha_creacion', { ascending: false });
      if (error) throw error;
      setTickets(data);
    } catch (error) {
      console.error("Error obteniendo tickets:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearTicketManual = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const slaAsignado = nuevoTicket.tipo === 'incidente' ? 8 : 24;

      const { error } = await supabase.from('tickets').insert([{
        titulo:          nuevoTicket.titulo,
        descripcion:     nuevoTicket.descripcion,
        tipo:            nuevoTicket.tipo,
        prioridad:       nuevoTicket.prioridad,
        servicio:        nuevoTicket.servicio,
        sla_horas:       slaAsignado,
        estado:          'Abierto',
        usuario_creador: currentUser?.email || 'usuario@utalca.cl',
        agente_asignado: null // Nace sin agente
      }]);
      
      if (error) throw error;
      
      setNuevoTicket({ titulo: '', descripcion: '', tipo: 'incidente', prioridad: 'Media', servicio: CATALOGO_SERVICIOS[0] });
      setMostrarFormulario(false);
      obtenerTickets();
      addToast('Ticket reportado', `SLA asignado: ${slaAsignado} horas.`, 'success');
    } catch (error) {
      addToast('Error al guardar', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const autoasignarseTicket = async (ticketId) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ agente_asignado: currentUser?.email })
        .eq('id', ticketId);
        
      if (error) throw error;
      
      obtenerTickets();
      addToast('Ticket Asignado', 'Te has asignado este requerimiento.', 'success');
    } catch (error) {
      addToast('Error de asignación', error.message, 'error');
    }
  };

  const openCount    = tickets.filter(t => t.estado === 'Abierto').length;
  const resolvedCount = tickets.filter(t => t.estado === 'Solucionado' || t.estado === 'Cerrado').length;
  const incidentCount = tickets.filter(t => t.tipo === 'incidente').length;
  const reqCount      = tickets.filter(t => t.tipo === 'requerimiento').length;

  const esAgente = EMAILS_AGENTES.includes(currentUser?.email);

  return (
    <div style={{ padding: '36px 40px', width: '100%' }}>
      <style>{`
        /* ── TOOLBAR ── */
        .tk-toolbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .tk-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.025em;
          line-height: 1;
          margin-bottom: 6px;
        }
        .tk-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.01em;
          font-family: var(--mono);
        }

        /* ── BUTTONS ── */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          background: var(--text-primary);
          color: var(--surface);
          border: 1px solid var(--text-primary);
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.12s;
          font-family: var(--font);
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.75; }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.12s, color 0.12s;
          font-family: var(--font);
          letter-spacing: 0.01em;
        }
        .btn-ghost:hover {
          border-color: var(--text-primary);
          color: var(--text-primary);
        }

        .btn-submit {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 20px;
          background: var(--text-primary);
          color: var(--surface);
          border: 1px solid var(--text-primary);
          border-radius: 4px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.12s;
          font-family: var(--font);
        }
        .btn-submit:hover:not(:disabled) { opacity: 0.75; }
        .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-assign {
          padding: 3px 9px;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 3px;
          font-size: 9.5px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.1s, color 0.1s;
          font-family: var(--mono);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .btn-assign:hover {
          border-color: var(--text-primary);
          color: var(--text-primary);
        }

        /* ── STATS BAR ── */
        .stats-bar {
          display: flex;
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 24px;
          background: var(--surface);
        }
        .stat-item {
          flex: 1;
          padding: 16px 20px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-item:last-child { border-right: none; }
        .stat-label {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          color: var(--text-muted);
          font-family: var(--mono);
        }
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--mono);
          letter-spacing: -0.04em;
          line-height: 1;
        }

        /* ── TABLE ── */
        .table-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          width: 100%;
        }
        .tk-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .tk-table thead {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        .tk-table th {
          padding: 10px 18px;
          text-align: left;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--text-muted);
          white-space: nowrap;
          font-family: var(--mono);
        }
        .tk-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
          vertical-align: middle;
          line-height: 1.4;
        }
        .tk-table tbody tr:last-child td { border-bottom: none; }
        .tk-table tbody tr { transition: background 0.08s; cursor: default; }
        .tk-row-hover td { background: var(--surface-hover) !important; }

        .tk-id {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        .tk-title-cell {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }
        .tk-desc-cell {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
          margin-top: 3px;
          font-family: var(--mono);
        }

        /* ── EMPTY STATE ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 72px 20px;
          color: var(--text-muted);
          gap: 6px;
        }
        .empty-title {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .empty-state p { font-size: 12px; }

        /* ── SKELETON ── */
        .sk {
          background: var(--surface-2);
          border-radius: 2px;
          animation: sk 1.6s ease-in-out infinite;
        }
        @keyframes sk {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1;   }
        }

        /* ── MODAL ── */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 18px;
          border-bottom: 1px solid var(--border);
        }
        .modal-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.015em;
        }
        .modal-close {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: none;
          border: 1px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-size: 16px;
          transition: border-color 0.1s, color 0.1s;
          line-height: 1;
        }
        .modal-close:hover {
          border-color: var(--border);
          color: var(--text-primary);
        }
        .modal-body {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .modal-footer {
          display: flex;
          gap: 9px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
        }

        /* ── FORM FIELDS ── */
        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: var(--mono);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
      `}</style>

      {/* Toolbar */}
      <div className="tk-toolbar">
        <div>
          <h2 className="tk-title">Mesa de Ayuda UTalca</h2>
          <p className="tk-subtitle">Gestión centralizada de incidentes y requerimientos</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={obtenerTickets}>Actualizar</button>
          <button className="btn-primary" onClick={() => setMostrarFormulario(true)}>Nuevo Ticket</button>
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && (
        <div className="stats-bar">
          {[
            { label: 'Total',          value: tickets.length  },
            { label: 'Abiertos',       value: openCount       },
            { label: 'Solucionados',   value: resolvedCount   },
            { label: 'Incidentes',     value: incidentCount   },
            { label: 'Requerimientos', value: reqCount        },
          ].map(({ label, value }) => (
            <div className="stat-item" key={label}>
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table className="tk-table">
          <thead>
            <tr>
              <th style={{ width: 72 }}>ID</th>
              <th>Asunto / Servicio</th>
              <th style={{ width: 148 }}>Clasificación / SLA</th>
              <th style={{ width: 110 }}>Prioridad</th>
              <th style={{ width: 170 }}>Asignación</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="sk" style={{ height: 11, width: 50 }} /></td>
                    <td><div className="sk" style={{ height: 12, width: '65%', marginBottom: 5 }} /><div className="sk" style={{ height: 10, width: '45%' }} /></td>
                    <td><div className="sk" style={{ height: 20, width: 95 }} /></td>
                    <td><div className="sk" style={{ height: 20, width: 72 }} /></td>
                    <td><div className="sk" style={{ height: 20, width: 100 }} /></td>
                  </tr>
                ))
              : tickets.length === 0
              ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <p className="empty-title">Sin tickets registrados</p>
                        <p style={{ fontSize: 12.5 }}>Haz clic en "Nuevo Ticket" para reportar una falla o solicitud.</p>
                      </div>
                    </td>
                  </tr>
                )
              : tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={hoveredRow === ticket.id ? 'tk-row-hover' : ''}
                    onMouseEnter={() => setHoveredRow(ticket.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td><span className="tk-id">#{String(ticket.id).padStart(4, '0')}</span></td>
                    <td>
                      <p className="tk-title-cell">{ticket.titulo}</p>
                      <p className="tk-desc-cell">
                        {ticket.servicio || 'General'} <span style={{ color: 'var(--border-strong)', opacity: 0.3 }}>·</span> {ticket.usuario_creador?.split('@')[0]}
                      </p>
                    </td>
                    <td>
                      <TypeBadge value={ticket.tipo} />
                      <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        SLA: {ticket.sla_horas ? `${ticket.sla_horas}h` : (ticket.tipo === 'incidente' ? '8h' : '24h')}
                      </div>
                    </td>
                    <td><PriorityBadge value={ticket.prioridad} /></td>
                    <td>
                      <div style={{ marginBottom: '6px' }}>
                        <StatusBadge value={ticket.estado} />
                      </div>
                      
                      {/* LÓGICA DE AUTOASIGNACIÓN (SOLO AGENTES) */}
                      {ticket.agente_asignado ? (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                          Agente: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ticket.agente_asignado.split('@')[0]}</span>
                        </div>
                      ) : (
                        esAgente ? (
                          <button className="btn-assign" onClick={() => autoasignarseTicket(ticket.id)}>
                            + Tomar Ticket
                          </button>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Sin asignar</span>
                        )
                      )}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={mostrarFormulario} onClose={() => !submitting && setMostrarFormulario(false)}>
        <div className="modal-header">
          <h3 className="modal-title">Registrar Ticket</h3>
          <button className="modal-close" onClick={() => setMostrarFormulario(false)} disabled={submitting}>×</button>
        </div>
        <form onSubmit={crearTicketManual}>
          <div className="modal-body">
            
            <div>
              <label className="form-label">Servicio Afectado (Catálogo)</label>
              <select style={fieldBase} value={nuevoTicket.servicio} onChange={(e) => setNuevoTicket({ ...nuevoTicket, servicio: e.target.value })} onFocus={onFocus} onBlur={onBlur}>
                {CATALOGO_SERVICIOS.map(servicio => (
                  <option key={servicio} value={servicio}>{servicio}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Asunto principal</label>
              <input type="text" required style={fieldBase} value={nuevoTicket.titulo} onChange={(e) => setNuevoTicket({ ...nuevoTicket, titulo: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="Ej: No puedo acceder a Educandus" />
            </div>

            <div>
              <label className="form-label">Descripción detallada</label>
              <textarea required rows={2} style={{ ...fieldBase, resize: 'vertical' }} value={nuevoTicket.descripcion} onChange={(e) => setNuevoTicket({ ...nuevoTicket, descripcion: e.target.value })} onFocus={onFocus} onBlur={onBlur} placeholder="Contexto y detalles..." />
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">Tipo de Solicitud</label>
                <select style={fieldBase} value={nuevoTicket.tipo} onChange={(e) => setNuevoTicket({ ...nuevoTicket, tipo: e.target.value })} onFocus={onFocus} onBlur={onBlur}>
                  <option value="incidente">Incidente (Falla de servicio)</option>
                  <option value="requerimiento">Requerimiento (Solicitar acceso/mejora)</option>
                </select>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
                  SLA aplicable: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{nuevoTicket.tipo === 'incidente' ? '8 HORAS' : '24 HORAS'}</span>
                </p>
              </div>
              <div>
                <label className="form-label">Prioridad</label>
                <select style={fieldBase} value={nuevoTicket.prioridad} onChange={(e) => setNuevoTicket({ ...nuevoTicket, prioridad: e.target.value })} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={() => setMostrarFormulario(false)} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? <><Spinner /> Creando...</> : 'Confirmar Ticket'}</button>
          </div>
        </form>
      </Modal>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default Tickets;