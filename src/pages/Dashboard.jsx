import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Ticket, AlertCircle, Server, RefreshCw, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';

function Dashboard() {
  const [metricas, setMetricas] = useState({
    ticketsTotales: 0,
    ticketsAbiertos: 0,
    activosOperativos: 0,
    cambiosPendientes: 0,
    articulosWiki: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerMetricas();
  }, []);

  const obtenerMetricas = async () => {
    try {
      setLoading(true);
      const [
        resTickets,
        resTicketsAbiertos,
        resActivos,
        resCambios,
        resConocimiento
      ] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('estado', 'Abierto'),
        supabase.from('activos').select('*', { count: 'exact', head: true }).eq('estado', 'Operativo'),
        supabase.from('control_cambios').select('*', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
        supabase.from('conocimiento').select('*', { count: 'exact', head: true })
      ]);

      setMetricas({
        ticketsTotales: resTickets.count || 0,
        ticketsAbiertos: resTicketsAbiertos.count || 0,
        activosOperativos: resActivos.count || 0,
        cambiosPendientes: resCambios.count || 0,
        articulosWiki: resConocimiento.count || 0
      });
    } catch (error) {
      console.error("Error obteniendo métricas del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const CARDS = [
    { label: 'Tickets Históricos',   value: metricas.ticketsTotales,    icon: Ticket,      variant: 'neutral', detail: 'Total registrado'       },
    { label: 'Incidentes Abiertos',  value: metricas.ticketsAbiertos,   icon: AlertCircle, variant: 'danger',  detail: 'Requieren atención'     },
    { label: 'Activos Operativos',   value: metricas.activosOperativos, icon: Server,      variant: 'success', detail: 'En producción'          },
    { label: 'Cambios Pendientes',   value: metricas.cambiosPendientes, icon: RefreshCw,   variant: 'warning', detail: 'Esperan aprobación'     },
    { label: 'Artículos en Wiki',    value: metricas.articulosWiki,     icon: BookOpen,    variant: 'info',    detail: 'Base de conocimiento'   },
  ];

  const dateStr = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={{ padding: '28px 32px', width: '100%' }}>
      <style>{`
        .dash-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .dash-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 5px;
        }
        .dash-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--mono);
          text-transform: capitalize;
          letter-spacing: 0.01em;
        }

        .dash-refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.12s;
          font-family: var(--font);
          letter-spacing: 0.01em;
        }
        .dash-refresh-btn:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
          background: var(--surface-hover);
        }
        .dash-refresh-btn svg { width: 13px; height: 13px; }

        /* ── Metrics ── */
        .section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        @media (max-width: 1200px) {
          .metrics-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .metric-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 18px 20px 16px;
          cursor: default;
          transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
          position: relative;
          overflow: hidden;
        }
        .metric-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }
        .metric-card-alert { border-bottom: 2px solid; }

        .metric-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .metric-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--text-muted);
          line-height: 1.3;
          padding-right: 8px;
        }
        .metric-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .metric-icon-wrap svg { width: 14px; height: 14px; }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 5px;
          font-family: var(--mono);
        }
        .metric-detail {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.01em;
        }

        /* ── Two Column Layout ── */
        .dash-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 1000px) {
          .dash-bottom { grid-template-columns: 1fr; }
        }

        .dash-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
        }
        .panel-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 0.01em;
        }
        .panel-badge {
          font-size: 10px;
          font-family: var(--mono);
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 500;
        }

        .status-list { padding: 6px 0; }

        .status-row {
          display: flex;
          align-items: center;
          padding: 10px 18px;
          gap: 12px;
          transition: background 0.1s;
          cursor: default;
        }
        .status-row:hover { background: var(--surface-hover); }

        .status-dot-wrap {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-row-label {
          flex: 1;
          font-size: 13px;
          color: var(--text-secondary);
          letter-spacing: 0.005em;
        }

        .status-row-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: var(--mono);
          min-width: 28px;
          text-align: right;
        }

        .status-pill {
          font-size: 10.5px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: var(--mono);
          min-width: 72px;
          text-align: center;
        }

        /* ── Skeleton ── */
        .sk {
          background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
          background-size: 200% 100%;
          animation: sk 1.4s infinite;
          border-radius: 4px;
        }
        @keyframes sk { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* Header */}
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Panel de Control — Operaciones TI</h2>
          <p className="dash-subtitle">{dateStr}</p>
        </div>
        <button className="dash-refresh-btn" onClick={obtenerMetricas}>
          <RefreshCw />
          Actualizar métricas
        </button>
      </div>

      {/* Metrics */}
      <p className="section-label">Indicadores en tiempo real</p>
      <div className="metrics-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="metric-card">
                <div className="sk" style={{ height: 10, width: '55%', marginBottom: 18 }} />
                <div className="sk" style={{ height: 32, width: '45%', marginBottom: 8 }} />
                <div className="sk" style={{ height: 10, width: '40%' }} />
              </div>
            ))
          : CARDS.map(({ label, value, icon: Icon, variant, detail }) => {
              const v = {
                neutral: { accent: 'var(--accent)',   dim: 'var(--accent-dim)',   text: 'var(--accent)'   },
                danger:  { accent: 'var(--danger)',   dim: 'var(--danger-dim)',   text: 'var(--danger)'   },
                success: { accent: 'var(--success)',  dim: 'var(--success-dim)',  text: 'var(--success)'  },
                warning: { accent: 'var(--warning)',  dim: 'var(--warning-dim)',  text: 'var(--warning)'  },
                info:    { accent: 'var(--info)',     dim: 'var(--info-dim)',     text: 'var(--info)'     },
              }[variant];
              const isAlert = variant === 'danger' || variant === 'warning';
              return (
                <div
                  key={label}
                  className={`metric-card${isAlert ? ' metric-card-alert' : ''}`}
                  style={isAlert ? { borderBottomColor: v.accent } : {}}
                >
                  <div className="metric-top">
                    <span className="metric-label">{label}</span>
                    <div className="metric-icon-wrap" style={{ background: v.dim, color: v.text }}>
                      <Icon />
                    </div>
                  </div>
                  <div className="metric-value">{value}</div>
                  <div className="metric-detail">{detail}</div>
                </div>
              );
            })
        }
      </div>

      {/* Bottom Panels */}
      {!loading && (
        <div className="dash-bottom">

          {/* Panel: Estado del sistema */}
          <div className="dash-panel">
            <div className="panel-header">
              <span className="panel-title">Estado del sistema</span>
              <span className="panel-badge" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                Operativo
              </span>
            </div>
            <div className="status-list">
              {[
                { label: 'Cola de incidentes activos',         value: metricas.ticketsAbiertos,   status: metricas.ticketsAbiertos === 0 ? 'ok' : metricas.ticketsAbiertos > 5 ? 'critical' : 'warn' },
                { label: 'Activos en producción',              value: metricas.activosOperativos, status: 'ok'     },
                { label: 'Cambios en espera de aprobación',    value: metricas.cambiosPendientes, status: metricas.cambiosPendientes > 3 ? 'warn' : 'ok' },
                { label: 'Documentos en base de conocimiento', value: metricas.articulosWiki,     status: 'neutral'},
              ].map(({ label, value, status }) => {
                const cfg = {
                  ok:       { dot: 'var(--success)', pill: { bg: 'var(--success-dim)', color: 'var(--success)'   }, label: 'Normal'       },
                  warn:     { dot: 'var(--warning)', pill: { bg: 'var(--warning-dim)', color: 'var(--warning)'   }, label: 'Revisar'      },
                  critical: { dot: 'var(--danger)',  pill: { bg: 'var(--danger-dim)',  color: 'var(--danger)'    }, label: 'Alto volumen' },
                  neutral:  { dot: 'var(--text-muted)', pill: { bg: 'var(--surface-2)', color: 'var(--text-muted)' }, label: 'Informativo' },
                }[status];
                return (
                  <div key={label} className="status-row">
                    <div className="status-dot-wrap" style={{ background: cfg.dot }} />
                    <span className="status-row-label">{label}</span>
                    <span className="status-row-value">{value}</span>
                    <span className="status-pill" style={{ background: cfg.pill.bg, color: cfg.pill.color }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel: Distribución de tickets */}
          <div className="dash-panel">
            <div className="panel-header">
              <span className="panel-title">Distribución de tickets</span>
              <span className="panel-badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                {metricas.ticketsTotales} total
              </span>
            </div>
            <div className="status-list">
              {[
                { label: 'Tickets abiertos',    value: metricas.ticketsAbiertos, total: metricas.ticketsTotales, color: 'var(--danger)'  },
                { label: 'Tickets cerrados',    value: Math.max(0, metricas.ticketsTotales - metricas.ticketsAbiertos), total: metricas.ticketsTotales, color: 'var(--success)' },
                { label: 'Activos monitoreados', value: metricas.activosOperativos, total: null, color: 'var(--info)'    },
                { label: 'Cambios pendientes',  value: metricas.cambiosPendientes, total: null, color: 'var(--warning)' },
              ].map(({ label, value, total, color }) => {
                const pct = total ? Math.round((value / (total || 1)) * 100) : null;
                return (
                  <div key={label} className="status-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {pct !== null && (
                          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{pct}%</span>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{value}</span>
                      </div>
                    </div>
                    {total !== null && (
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: color,
                          borderRadius: 2,
                          transition: 'width 0.6s ease',
                          opacity: 0.8,
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default Dashboard;