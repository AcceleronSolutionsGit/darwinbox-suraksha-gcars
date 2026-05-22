import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StatSkeleton, Skeleton } from '../components/common/Skeleton';
import { 
  ClipboardList, 
  CheckCircle2, 
  Timer, 
  XCircle, 
  IndianRupee, 
  Building2, 
  HardHat, 
  Wrench 
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [data, setData]       = useState(null);
  const [year, setYear]       = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/dashboard-summary?year=${year}`)
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  const fmt   = n => Number(n || 0).toLocaleString('en-IN');
  const fmtCr = n => `₹${(Number(n || 0) / 1e7).toFixed(2)} Cr`;

  // Theme-aware colors — readable in both modes
  const axisColor    = isDark ? 'rgba(200,200,230,0.5)'  : '#666666';
  const gridColor    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const legendColor  = isDark ? 'rgba(200,200,230,0.65)' : '#444444';
  const tooltipStyle = {
    contentStyle: {
      background: isDark ? 'rgba(14,14,22,0.97)' : '#FFFFFF',
      border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: '8px',
      color: isDark ? '#F1F0FB' : '#111111',
      fontFamily: "'Roboto', sans-serif",
      fontSize: '13px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    },
    labelStyle: { color: isDark ? '#F1F0FB' : '#111111', fontWeight: 700 },
    cursor: { stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
  };

  const CHART_COLORS = ['#F59E0B', '#6366F1', '#0D9488', '#EF4444', '#A855F7', '#16A34A'];
  const pieColors    = ['#14B8A6', '#F59E0B', '#EF4444'];

  if (loading) return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div style={{ width: '300px' }}>
          <Skeleton className="skeleton-title" style={{ width: '200px' }} />
          <Skeleton className="skeleton-text" style={{ width: '260px' }} />
        </div>
      </div>
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        {Array.from({ length: 8 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '18px' }}>
        <div className="card" style={{ height: '280px' }}>
            <Skeleton className="skeleton-title" style={{ width: '40%' }} />
            <Skeleton style={{ height: '180px', width: '100%' }} />
        </div>
        <div className="card" style={{ height: '280px' }}>
            <Skeleton className="skeleton-title" style={{ width: '40%' }} />
            <Skeleton style={{ height: '180px', width: '100%' }} />
        </div>
      </div>
    </div>
  );

  const stats   = data?.stats    || {};
  const monthly = data?.monthly  || [];
  const bySbu   = data?.bySbu    || [];
  const budUtil = data?.budgetUtil || [];
  const isAdminView = data?.isAdmin || false;

  const pieData = [
    { name: 'Approved', value: Number(stats.approved  || 0) },
    { name: 'Pending',  value: Number(stats.pending   || 0) },
    { name: 'Rejected', value: Number(stats.rejected  || 0) },
  ];

  return (
    <div className="page-content fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="kicker">{isAdminView ? 'G-CARS 2 · Organization Overview' : 'G-CARS 2 · My Dashboard'}</div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user?.username}</strong> — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <select className="form-control" value={year} onChange={e => setYear(e.target.value)} style={{ width: '110px' }}>
          {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard label={isAdminView ? 'Total Requests' : 'My Requests'}   value={fmt(stats.total)}             icon={ClipboardList} color="blue"   sub={`FY ${year}`} />
        <StatCard label="Approved"        value={fmt(stats.approved)}          icon={CheckCircle2}  color="teal"   sub={stats.total ? `${Math.round((stats.approved/stats.total)*100)}% rate` : '—'} />
        <StatCard label="Pending"         value={fmt(stats.pending)}           icon={Timer} color="amber"  sub="Awaiting action" />
        <StatCard label="Rejected"        value={fmt(stats.rejected)}          icon={XCircle}  color="red"    sub="Need attention" />
        <StatCard label={isAdminView ? 'Total Value' : 'My Total Value'}     value={fmtCr(stats.total_amount)}   icon={IndianRupee}  color="blue"   sub={isAdminView ? 'All requests' : 'My requests'} />
        <StatCard label="Approved Value"  value={fmtCr(stats.approved_amount)} icon={Building2} color="teal"  sub="Sanctioned" />
        <StatCard label="CAPEX"           value={fmt(stats.capex_count)}       icon={HardHat}  color="purple" sub="Capital expenditure" />
        <StatCard label="OPEX"            value={fmt(stats.opex_count)}        icon={Wrench} color="amber"  sub="Operational expenditure" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '18px', marginBottom: '18px' }}>
        {/* Monthly trend */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700 }}>Monthly Request Trend</h3>
            <span className="badge badge-amber">FY {year}</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month_name" tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={v => v?.slice(0, 3)} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Requests" stroke="#F59E0B" fill="url(#areaFill)" strokeWidth={2.5} dot={{ fill: '#F59E0B', strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((d, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: pieColors[i], flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', flex: 1, color: legendColor }}>{d.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget utilization */}
      {budUtil.length > 0 && (
        <div className="card" style={{ marginBottom: '18px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Budget Utilization by Entity</h3>
          <ResponsiveContainer width="100%" height={Math.min(budUtil.length * 32 + 20, 240)}>
            <BarChart data={budUtil.slice(0, 8)} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <YAxis type="category" dataKey="entity_name" tick={{ fill: axisColor, fontSize: 11 }} width={130} />
              <Tooltip {...tooltipStyle} formatter={v => [`${v}%`, 'Utilization']} />
              <Bar dataKey="utilization_pct" name="Utilization %" radius={[0, 4, 4, 0]}>
                {budUtil.map((e, i) => (
                  <Cell key={i} fill={e.utilization_pct > 90 ? '#EF4444' : e.utilization_pct > 70 ? '#F59E0B' : '#6366F1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By SBU */}
      {bySbu.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '18px' }}>Requests by Business Unit</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '10px' }}>
            {bySbu.slice(0, 9).map((s, i) => (
              <div key={i} className="card-sm">
                <div style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  fontWeight: 600,
                }}>
                  {s.sbu || 'Unknown'}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length] }}>
                  {s.count}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '3px',
                }}>
                  ₹{(Number(s.amount) / 100000).toFixed(1)}L
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
