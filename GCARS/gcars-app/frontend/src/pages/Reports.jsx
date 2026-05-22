import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TableSkeleton } from '../components/common/Skeleton';
import { 
  BarChart3, 
  FileText, 
  Building2, 
  Settings, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Search, 
  ChevronRight,
  Info
} from 'lucide-react';

export default function Reports() {
  const [tab, setTab] = useState('summary');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', year: new Date().getFullYear(), request_type: '', search: '' });

  useEffect(() => {
    if (tab === 'list') fetchReports();
  }, [tab, filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/reports/all-requests?${params}`);
      if (data.success) setRequests(data.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const f = (k) => (e) => setFilters(prev => ({ ...prev, [k]: e.target.value }));

  const exportCSV = () => {
    if (!requests.length) { toast.error('No data to export'); return; }
    const headers = Object.keys(requests[0]);
    const csv = [headers.join(','), ...requests.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `gcars_report_${filters.year}.csv`; a.click();
    toast.success('Report exported!');
  };

  const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="kicker">Analytics & Reporting</div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">CAPEX / OPEX request analytics and export</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} /> Summary
        </button>
        <button className={`tab-btn ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} /> All Requests
        </button>
      </div>

      {tab === 'summary' && (
        <div>
          <div className="alert alert-info" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} />
            Detailed charts are available on the main Dashboard. This tab shows full request listing with export.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { title: 'CAPEX Report', desc: 'Capital expenditure requests, approvals, and budget utilization', icon: <Building2 size={24} />, action: () => { setFilters(f => ({...f, request_type: 'CAPEX'})); setTab('list'); } },
              { title: 'OPEX Report', desc: 'Operational expenditure requests including bulk pre-approvals', icon: <Settings size={24} />, action: () => { setFilters(f => ({...f, request_type: 'OPEX'})); setTab('list'); } },
              { title: 'Pending Requests', desc: 'All requests currently awaiting approval at any level', icon: <Clock size={24} />, action: () => { setFilters(f => ({...f, status: 'Pending', request_type: ''})); setTab('list'); } },
              { title: 'Approved Requests', desc: 'Successfully approved and sanctioned requests', icon: <CheckCircle2 size={24} />, action: () => { setFilters(f => ({...f, status: 'Approved', request_type: ''})); setTab('list'); } },
              { title: 'Rejected Requests', desc: 'Rejected requests with reasons', icon: <XCircle size={24} />, action: () => { setFilters(f => ({...f, status: 'Rejected', request_type: ''})); setTab('list'); } },
              { title: 'Full Export', desc: 'Export all requests as CSV for this year', icon: <Download size={24} />, action: () => { setFilters(f => ({...f, status: '', request_type: ''})); setTab('list'); setTimeout(exportCSV, 800); } },
            ].map((r, i) => (
              <div key={i} className="card report-card" style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }} onClick={r.action} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: '12px', width: 'max-content', marginBottom: '16px', color: 'var(--primary)' }}>{r.icon}</div>
                <h3 style={{ marginBottom: '6px', fontSize: '16px' }}>{r.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>{r.desc}</p>
                <div style={{ position: 'absolute', right: '16px', bottom: '16px', opacity: 0.2 }}><ChevronRight size={18} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'list' && (
        <>
          <div className="filter-bar">
            <input className="search-input" placeholder="Search requests…" value={filters.search} onChange={f('search')} />
            <select className="form-control" value={filters.status} onChange={f('status')} style={{ width: '140px' }}>
              <option value="">All Status</option>
              <option value="Initiated">Initiated</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select className="form-control" value={filters.request_type} onChange={f('request_type')} style={{ width: '120px' }}>
              <option value="">All Types</option>
              <option value="CAPEX">CAPEX</option>
              <option value="OPEX">OPEX</option>
            </select>
            <select className="form-control" value={filters.year} onChange={f('year')} style={{ width: '110px' }}>
              {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Search size={16} /> Search</button>
            <button className="btn btn-ghost" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Export CSV</button>
          </div>

          {loading ? (
            <TableSkeleton rows={10} cols={8} />
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrapper horizontal-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>CAPEX No.</th>
                      <th>Requester</th>
                      <th>SBU</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Aging</th>
                      <th>SAP Packet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-display)', fontSize: '12.5px', color: 'var(--blue-xl)', fontWeight: 600 }}>{r.capex_no}</td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.requester_name || '—'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.grade}</div>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{r.sbu || '—'}</td>
                        <td style={{ maxWidth: '160px' }}>
                          <div style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.asset_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{r.asset_type} · {r.asset_group}</div>
                        </td>
                        <td><span className={`badge ${r.request_type === 'CAPEX' ? 'badge-info' : 'badge-teal'}`}>{r.request_type}</span></td>
                        <td style={{ fontWeight: 600, fontSize: '13px' }}>{fmt(r.amount_ext_gst)}</td>
                        <td>
                          <span className={`badge ${r.status === 'Approved' ? 'badge-success' : r.status === 'Rejected' ? 'badge-danger' : r.status === 'Pending' ? 'badge-warning' : 'badge-info'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                           <span style={{ color: r.aging_days > 7 ? 'var(--coral)' : 'inherit' }}>{r.aging_days || 0}d</span>
                        </td>
                        <td>
                          {r.sap_status ? (
                             <span className="badge badge-teal" style={{ fontSize: '10px' }}>{r.sap_status.toUpperCase()}</span>
                          ) : (
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-2)', margin: 'auto' }} title="No packet" />
                          )}
                        </td>
                      </tr>
                    ))}
                    {!loading && requests.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>No requests found. Click Search to load data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {requests.length > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' }}>
                  <span>{requests.length} records</span>
                  <span>Total: {fmt(requests.reduce((s, r) => s + Number(r.amount_ext_gst || 0), 0))}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
