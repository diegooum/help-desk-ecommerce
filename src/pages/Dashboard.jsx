import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Ticket, AlertCircle, Server, RefreshCw, BookOpen } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line 
} from 'recharts';

function Dashboard() {
  const [metricas, setMetricas] = useState({
    ticketsTotales: 0, ticketsAbiertos: 0, activosOperativos: 0, cambiosPendientes: 0, articulosWiki: 0
  });
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [datosTendencia, setDatosTendencia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { obtenerMetricas(); }, []);

  const obtenerMetricas = async () => {
    try {
      setLoading(true);
      
      // Obtener datos generales
      const [ resTickets, resActivos, resCambios, resConocimiento ] = await Promise.all([
        supabase.from('tickets').select('*'),
        supabase.from('activos').select('*', { count: 'exact', head: true }).eq('estado', 'Operativo'),
        supabase.from('control_cambios').select('*', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
        supabase.from('conocimiento').select('*', { count: 'exact', head: true })
      ]);

      const tickets = resTickets.data || [];
      const abiertos = tickets.filter(t => t.estado === 'Abierto' || t.estado === 'En espera de un tercero').length;

      setMetricas({
        ticketsTotales: tickets.length,
        ticketsAbiertos: abiertos,
        activosOperativos: resActivos.count || 0,
        cambiosPendientes: resCambios.count || 0,
        articulosWiki: resConocimiento.count || 0
      });

      // Procesar datos para el gráfico de barras (Estado de tickets)
      const conteoEstados = { 'Abierto': 0, 'Solucionado': 0, 'Cerrado': 0, 'En espera': 0 };
      tickets.forEach(t => {
        if (t.estado.includes('espera')) conteoEstados['En espera']++;
        else if (conteoEstados[t.estado] !== undefined) conteoEstados[t.estado]++;
      });

      setDatosGrafico([
        { name: 'Abiertos', cantidad: conteoEstados['Abierto'] },
        { name: 'En Espera', cantidad: conteoEstados['En espera'] },
        { name: 'Solucionados', cantidad: conteoEstados['Solucionado'] },
        { name: 'Cerrados', cantidad: conteoEstados['Cerrado'] }
      ]);

      // Procesar datos para el gráfico de líneas (Tendencia últimos 7 días)
      // (Para el demo, agrupamos por tipo: Incidente vs Requerimiento)
      const conteoTipo = { 'incidente': 0, 'requerimiento': 0 };
      tickets.forEach(t => {
        if(t.tipo) conteoTipo[t.tipo]++;
      });
      setDatosTendencia([
        { tipo: 'Incidentes', valor: conteoTipo['incidente'] },
        { tipo: 'Requerimientos', valor: conteoTipo['requerimiento'] }
      ]);

    } catch (error) {
      console.error("Error obteniendo métricas del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const CARDS = [
    { label: 'Volumen Total',     value: metricas.ticketsTotales,    icon: Ticket,      color: 'var(--text-primary)' },
    { label: 'Atención Requerida',value: metricas.ticketsAbiertos,   icon: AlertCircle, color: 'var(--danger)' },
    { label: 'Sistemas Activos',  value: metricas.activosOperativos, icon: Server,      color: 'var(--text-primary)' },
    { label: 'RFC Pendientes',    value: metricas.cambiosPendientes, icon: RefreshCw,   color: 'var(--warning)' },
    { label: 'Base de Datos Wiki',value: metricas.articulosWiki,     icon: BookOpen,    color: 'var(--text-primary)' },
  ];

  const dateStr = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ padding: '36px 40px', width: '100%' }}>
      <style>{`
        /* ── HEADER ── */
        .dash-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .dash-title { font-size: 20px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.025em; line-height: 1; margin-bottom: 6px; }
        .dash-subtitle { font-size: 12px; color: var(--text-muted); font-family: var(--mono); text-transform: capitalize; letter-spacing: 0.01em; }
        
        .dash-refresh-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: transparent; border: 1px solid var(--border); border-radius: 4px; font-size: 12px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: all 0.12s; font-family: var(--font); letter-spacing: 0.01em; }
        .dash-refresh-btn:hover { border-color: var(--text-primary); color: var(--text-primary); }
        .dash-refresh-btn svg { width: 13px; height: 13px; }
        
        .section-label { font-size: 10px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: var(--text-muted); font-family: var(--mono); margin-bottom: 16px; display: block; }
        
        /* ── METRICS GRID ── */
        .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px; }
        @media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(3, 1fr); } }
        
        .metric-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 20px; cursor: default; transition: border-color 0.15s; }
        .metric-card:hover { border-color: var(--border-strong); }
        
        .metric-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .metric-label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); line-height: 1.3; font-family: var(--mono); }
        .metric-value { font-size: 32px; font-weight: 600; letter-spacing: -0.04em; color: var(--text-primary); line-height: 1; font-family: var(--mono); }
        
        /* ── CHARTS SECTION ── */
        .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 32px; }
        @media (max-width: 1000px) { .charts-grid { grid-template-columns: 1fr; } }
        
        .chart-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 24px; }
        .panel-title { font-size: 13px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; margin-bottom: 24px; display: block; }
        
        /* ── CUSTOM TOOLTIP RECHARTS ── */
        .custom-tooltip { background: var(--surface); border: 1px solid var(--border-strong); padding: 12px; border-radius: 4px; font-family: var(--font); font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .tooltip-label { font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-family: var(--mono); text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        .tooltip-value { color: var(--text-secondary); }
      `}</style>

      <div className="dash-header">
        <div>
          <h2 className="dash-title">Panel de Control — Dirección de TI UTalca</h2>
          <p className="dash-subtitle">{dateStr}</p>
        </div>
        <button className="dash-refresh-btn" onClick={obtenerMetricas}>
          <RefreshCw /> Actualizar métricas
        </button>
      </div>

      <span className="section-label">Indicadores en tiempo real</span>
      
      <div className="metrics-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="metric-card" style={{ opacity: 0.5 }}>
                <div style={{ height: 10, width: '55%', background: 'var(--surface-2)', marginBottom: 24 }} />
                <div style={{ height: 32, width: '45%', background: 'var(--surface-2)' }} />
              </div>
            ))
          : CARDS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="metric-card">
                <div className="metric-top">
                  <span className="metric-label">{label}</span>
                  <Icon style={{ width: 16, height: 16, color: color, opacity: 0.8 }} />
                </div>
                <div className="metric-value" style={{ color: color }}>{value}</div>
              </div>
            ))
        }
      </div>

      {!loading && (
        <div className="charts-grid">
          
          {/* GRÁFICO DE BARRAS: ESTADO DE TICKETS */}
          <div className="chart-panel">
            <span className="panel-title">Distribución de Casos por Estado</span>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--mono)' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--mono)' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--surface-hover)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-tooltip">
                            <div className="tooltip-label">{payload[0].payload.name}</div>
                            <div className="tooltip-value">Total: {payload[0].value} tickets</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="cantidad" fill="var(--text-primary)" radius={[2, 2, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO DE LÍNEAS: INCIDENTES VS REQUERIMIENTOS */}
          <div className="chart-panel">
            <span className="panel-title">Volumen de Demanda</span>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={datosTendencia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="tipo" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--mono)' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--mono)' }} 
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-tooltip">
                            <div className="tooltip-label">{payload[0].payload.tipo}</div>
                            <div className="tooltip-value">Registrados: {payload[0].value}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="var(--accent)" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: 'var(--surface)', stroke: 'var(--accent)', strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default Dashboard;