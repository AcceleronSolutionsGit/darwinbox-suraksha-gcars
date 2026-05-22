import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/common/Skeleton';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  History as HistoryIcon, 
  ScrollText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter 
} from 'lucide-react';

const STATUS_CLASS = { Approved: 'badge-success', Rejected: 'badge-danger', Pending: 'badge-warning', Initiated: 'badge-info' };

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType]     = useState('');
  const [page, setPage]     = useState(1);
  const limit = 100;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit, search, status, type }).toString();
      const { data } = await api.get(`/requests?${p}`);
      if (data.success) { setRows(data.data || []); setTotal(data.total || 0); }
    } catch { toast.error('Failed to load history'); }
    finally { 
        // Small delay for skeleton effect visibility if it's too fast
        setTimeout(() => setLoading(false), 400); 
    }
  }, [page, search, status, type]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-content fade-in" style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <div className="kicker" style={{ color: 'var(--primary)', fontWeight: 800 }}>Archive Log</div>
          <h1 className="page-title" style={{ fontSize: '32px', letterSpacing: '-0.02em', margin: 0 }}>Acquisition History</h1>
          <p className="page-subtitle" style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '20px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
              {total} Historical Records
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 700 }}>
               ₹{Number(rows.reduce((s,r) => s + Number(r.amount_ext_gst||0), 0)).toLocaleString('en-IN')} Value
            </span>
          </p>
        </div>
      </div>

      {/* Modern Filter Hub */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><Search size={18} /></span>
            <input
              style={{ height: '48px', paddingLeft: '44px', borderRadius: '12px', fontSize: '14px', background: 'var(--bg-main)', border: '1px solid var(--border-2)' }}
              className="form-control"
              placeholder="Search history by ID, Asset, or Requester..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ width: '200px' }}>
            <select style={{ height: '48px', borderRadius: '12px', border: '1px solid var(--border-2)', background: 'var(--bg-main)' }} className="form-control" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Resolution: All</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">In Progress</option>
            </select>
          </div>
          <button className="btn btn-ghost" style={{ height: '48px', borderRadius: '12px', padding: '0 20px' }} onClick={() => { setSearch(''); setStatus(''); setType(''); setPage(1); }}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <TableSkeleton rows={15} cols={8} />
      ) : rows.length === 0 ? (
        <div className="card empty-state" style={{ minHeight: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.15, display: 'flex', justifyContent: 'center' }}><ScrollText size={64} /></div>
          <h2 style={{ fontSize: '24px', opacity: 0.6 }}>No Records Found</h2>
          <p style={{ color: 'var(--text-faint)', maxWidth: '400px' }}>Your search did not yield any historical acquisition records.</p>
        </div>
      ) : (
        <div className="card card-table" style={{ border: '1px solid var(--border)' }}>
          <div className="table-wrap horizontal-scroll">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Involved Asset</th>
                  <th style={{ textAlign: 'right' }}>Investment</th>
                  <th style={{ textAlign: 'center' }}>Final Status</th>
                  <th style={{ textAlign: 'center' }}>Workflow Flow</th>
                  <th>Current/Final Step</th>
                  <th>Date</th>
                  <th style={{ width: '100px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} onClick={() => navigate(`/requests/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="mono" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>{r.capex_no}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.asset_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Req: {r.requester_name}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      ₹{Number(r.amount_ext_gst || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${STATUS_CLASS[r.status] || 'badge-muted'}`} style={{ padding: '4px 12px', fontSize: '10px' }}>{r.status}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '3px', width: '100px', margin: '0 auto' }}>
                         {['supervisor','owner','accountant','cfo','cmd'].map((role) => {
                           const isApp = r[`${role}_approve`] === 'Approved' || (role==='owner' && r.owner_approve==='Approved');
                           let className = 'workflow-pill';
                           if (isApp) className += ' approved';
                           else if (r.active_approver === role) className += ' active';
                           
                           return <div key={role} className={className} />;
                         })}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {r.active_approver_name || r.active_approver_friendly || r.active_approver || (r.status === 'Approved' ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--teal)' }}><CheckCircle2 size={12} /> Completed</div> : '—')}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', border: '1px solid var(--border)' }}>Timeline</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>Tracked records {((page-1)*limit)+1} to {Math.min(page*limit, total)} of {total}</span>
          <div className="pagination">
            <button className="page-btn" onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1,p-1)) }} disabled={page === 1}><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
               const p = i + 1;
               return (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setPage(p) }}>{p}</button>
               )
            })}
            <button className="page-btn" onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages,p+1)) }} disabled={page >= totalPages}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
