import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const IconTicket = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>;
const IconAlert = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconServer = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>;
const IconActivity = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconBook = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconStar = () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

const COLORES_ESTADO = { 'Abierto': '#DC2626', 'En espera del usuario': '#F59E0B', 'En espera de un tercero': '#F59E0B', 'Solucionado': '#16A34A', 'Cerrado': '#9CA3AF' };

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ ticketsTotal: 0, ticketsAbiertos: 0, activosOperativos: 0, cambiosSolicitados: 0, articulosPublicados: 0, csatPromedio: 0 });
  const [datosTorta, setDatosTorta] = useState([]);
  const [datosBarras, setDatosBarras] = useState([]);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resTickets, resActivos, resCambios, resArticulos, resCsat] = await Promise.all([
        supabase.from('tickets').select('estado, servicio, tipo'),
        supabase.from('activos').select('estado_activo'),
        supabase.from('cambios').select('estado_cambio'),
        supabase.from('articulos').select('estado_publicacion'),
        supabase.from('encuestas_csat').select('calificacion')
      ]);

      const tickets = resTickets.data || [];
      const activos = resActivos.data || [];
      const cambios = resCambios.data || [];
      const articulos = resArticulos.data || [];
      const encuestas = resCsat.data || [];

      const tAbiertos = tickets.filter(t => t.estado === 'Abierto' || t.estado.includes('espera')).length;
      const csatAvg = encuestas.length ? (encuestas.reduce((acc, curr) => acc + curr.calificacion, 0) / encuestas.length).toFixed(1) : 'N/A';
      
      setKpis({
        ticketsTotal: tickets.length, ticketsAbiertos: tAbiertos, activosOperativos: activos.filter(a => a.estado_activo === 'Operativo').length,
        cambiosSolicitados: cambios.filter(c => c.estado_cambio === 'Solicitado').length, articulosPublicados: articulos.filter(a => a.estado_publicacion === 'Publicado').length,
        csatPromedio: csatAvg
      });

      const conteoEstados = tickets.reduce((acc, t) => { acc[t.estado] = (acc[t.estado] || 0) + 1; return acc; }, {});
      setDatosTorta(Object.keys(conteoEstados).map(key => ({ name: key, value: conteoEstados[key] })));

      const conteoServicios = tickets.reduce((acc, t) => { acc[t.servicio] = (acc[t.servicio] || 0) + 1; return acc; }, {});
      setDatosBarras(Object.keys(conteoServicios).map(key => ({ name: key, Tickets: conteoServicios[key] })).sort((a, b) => b.Tickets - a.Tickets).slice(0, 5));
    } catch (error) { console.error("Error al cargar dashboard:", error); } finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando métricas corporativas...</div>;

  return (
    <div style={{ padding: '36px 40px', width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
        .kpi-header { display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); }
        .kpi-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--mono); }
        .kpi-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 6px; }
        .kpi-value { font-size: 32px; font-weight: 600; color: var(--text-primary); line-height: 1; }
        .charts-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; }
        .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 24px; }
        .chart-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 24px; }
        @media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Panel de Control ITSM</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Visión general de incidentes, infraestructura y mesa de ayuda.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Tickets Históricos</span><div className="kpi-icon" style={{ background: 'var(--info-dim)', color: 'var(--info)' }}><IconTicket /></div></div>
          <div className="kpi-value">{kpis.ticketsTotal}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Casos Abiertos</span><div className="kpi-icon" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}><IconAlert /></div></div>
          <div className="kpi-value">{kpis.ticketsAbiertos}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Satisfacción (CSAT)</span><div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}><IconStar /></div></div>
          <div className="kpi-value">{kpis.csatPromedio} {kpis.csatPromedio !== 'N/A' && <span style={{fontSize: 14, color:'var(--text-muted)'}}>/ 5.0</span>}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Hardware Operativo</span><div className="kpi-icon" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}><IconServer /></div></div>
          <div className="kpi-value">{kpis.activosOperativos}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">RFC Pendientes</span><div className="kpi-icon" style={{ background: 'var(--warning-dim)', color: 'var(--warning)' }}><IconActivity /></div></div>
          <div className="kpi-value">{kpis.cambiosSolicitados}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Base de Datos</span><div className="kpi-icon" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}><IconBook /></div></div>
          <div className="kpi-value">{kpis.articulosPublicados}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Distribución por Estado</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart><Pie data={datosTorta} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value">{datosTorta.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_ESTADO[entry.name] || 'var(--brand)'} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px' }} itemStyle={{ color: 'var(--text-primary)' }} /></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            {datosTorta.map((entry, index) => <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORES_ESTADO[entry.name] || 'var(--brand)' }}></span>{entry.name} ({entry.value})</div>)}
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Top 5 Servicios más Demandados</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={datosBarras} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}><XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'var(--surface-hover)' }} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px' }} /><Bar dataKey="Tickets" fill="var(--brand)" radius={[4, 4, 0, 0]} barSize={40} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;