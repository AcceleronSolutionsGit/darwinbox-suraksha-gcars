import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/common/Skeleton';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Building2, 
  Archive, 
  X,
  PackageCheck,
  TrendingDown,
  Clock,
  Briefcase
} from 'lucide-react';

const STATUS_CLASS = { 
  Approved: 'badge-success', 
  Rejected: 'badge-danger', 
  Pending: 'badge-warning', 
  Initiated: 'badge-info',
  'PO Uploaded': 'badge-primary',
  'GRN Created': 'badge-primary',
  'Invoice Uploaded': 'badge-primary',
  'Capitalized': 'badge-teal',
  'SAP PR Created': 'badge-purple',
  'SAP PR Released': 'badge-purple',
  'SAP PO Created': 'badge-purple',
  'SAP PO Released': 'badge-purple'
};

export default function Requests({ defaultView = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType]     = useState('');
  const [view, setView]     = useState(defaultView);
  const [page, setPage]     = useState(1);
  const limit = 100;

  // Sync with prop changes
  useEffect(() => {
    setView(defaultView);
    setPage(1);
  }, [defaultView]);

  const [selected, setSelected]     = useState([]);
  const [bulkModal, setBulkModal]   = useState(false);
  const [bulkComment, setBulkComment] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit, search, status, type, view }).toString();
      const { data } = await api.get(`/requests?${p}`);
      if (data.success) { setRows(data.data || []); setTotal(data.total || 0); }
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, [page, search, status, type, view]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleSel = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === rows.length ? [] : rows.map(r => r.id));

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    try {
      const { data } = await api.post('/requests/bulk-approve', { ids: selected, comment: bulkComment });
      if (data.success) { toast.success(data.message); setSelected([]); setBulkModal(false); fetch(); }
    } catch { toast.error('Bulk approve failed'); }
    finally { setBulkLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  const canBulkApprove = selected.length > 0 && selected.every(id => {
    const r = rows.find(x => x.id === id);
    return r && (String(r.active_approver_emp_no) === String(user?.emp_no) || r.active_approver === user?.user_type) && ['Pending','Initiated'].includes(r.status);
  });

  return (
    <div className="page-content fade-in" style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <div className="kicker" style={{ color: 'var(--primary)', fontWeight: 800 }}>Acquisitions Hub</div>
          <h1 className="page-title" style={{ fontSize: '32px', letterSpacing: '-0.02em', margin: 0 }}>Capital Expenditure Tracking</h1>
          <p className="page-subtitle" style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '20px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
              {total} Requests Total
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 700 }}>
               ₹{Number(rows.reduce((s,r) => s + Number(r.amount_ext_gst||0), 0)).toLocaleString('en-IN')} Value
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)' }} />
              {rows.filter(r => ['Pending','Initiated'].includes(r.status)).length} Pending
            </span>
          </p>
        </div>
        <div className="page-actions" style={{ gap: '12px' }}>
          {canBulkApprove && (
            <button className="btn btn-teal" style={{ padding: '12px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-glow)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setBulkModal(true)}>
              <CheckCircle2 size={18} /> Bulk Approve ({selected.length})
            </button>
          )}
          <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/requests/new')}>
            <Plus size={18} /> Raise New Request
          </button>
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
              placeholder="Search by ID, Asset, Requester or Entity..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ width: '180px' }}>
            <select style={{ height: '48px', borderRadius: '12px', border: '1px solid var(--border-2)', background: 'var(--bg-main)', fontWeight: 600, color: view ? 'var(--primary)' : 'inherit' }} className="form-control" value={view} onChange={e => { setView(e.target.value); setPage(1); }}>
              <option value="">View: All Relevant</option>
              <option value="to_approve">Action Required</option>
              <option value="my_requests">My Raised Requests</option>
              <option value="history">Approval History</option>
            </select>
          </div>
          <div style={{ width: '180px' }}>
            <select style={{ height: '48px', borderRadius: '12px', border: '1px solid var(--border-2)', background: 'var(--bg-main)' }} className="form-control" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Status: All Levels</option>
              <optgroup label="Workflow Status">
                <option value="Initiated">Initiated</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </optgroup>
              <optgroup label="Post-Approval (SAP & PO)">
                <option value="SAP PR Created">SAP PR Created</option>
                <option value="SAP PR Released">SAP PR Released</option>
                <option value="SAP PO Created">SAP PO Created</option>
                <option value="SAP PO Released">SAP PO Released</option>
                <option value="PO Uploaded">PO Uploaded</option>
                <option value="GRN Created">GRN Created</option>
                <option value="Invoice Uploaded">Invoice Uploaded</option>
                <option value="Capitalized">Capitalized</option>
              </optgroup>
            </select>
          </div>
          <div style={{ width: '150px' }}>
            <select style={{ height: '48px', borderRadius: '12px', border: '1px solid var(--border-2)', background: 'var(--bg-main)' }} className="form-control" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
              <option value="">Policy: All</option>
              <option value="CAPEX">CAPEX</option>
              <option value="OPEX">OPEX</option>
              <option value="BULK">BULK</option>
            </select>
          </div>
          <button className="btn btn-ghost" style={{ height: '48px', borderRadius: '12px', padding: '0 20px' }} onClick={() => { setSearch(''); setStatus(''); setType(''); setView(''); setPage(1); }}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <TableSkeleton rows={15} cols={9} />
      ) : rows.length === 0 ? (
        <div className="card empty-state" style={{ minHeight: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.15, display: 'flex', justifyContent: 'center' }}><Archive size={64} /></div>
          <h2 style={{ fontSize: '24px', opacity: 0.6 }}>No Matching Records</h2>
          <p style={{ color: 'var(--text-faint)', maxWidth: '400px' }}>We couldn't find any acquisition requests matching your current filter criteria.</p>
          <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => { setSearch(''); setStatus(''); }}>Clear All Filters</button>
        </div>
      ) : (
        <div className="card card-table" style={{ border: '1px solid var(--border)' }}>
          <div className="table-wrap horizontal-scroll">
            <table className="table-premium">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>
                    <input type="checkbox" style={{ transform: 'scale(1.2)' }} checked={selected.length === rows.length} onChange={toggleAll} />
                  </th>
                  <th>Request Identification</th>
                  <th>Requester & Business Unit</th>
                  <th>Classification</th>
                  <th style={{ textAlign: 'right' }}>Investment</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Current Ownership</th>
                  <th>Submission</th>
                  <th style={{ width: '100px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.id}-${idx}`} onClick={() => navigate(`/requests/${r.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" style={{ transform: 'scale(1.1)' }} checked={selected.includes(r.id)} onChange={() => toggleSel(r.id)} />
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>{r.capex_no}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {r.asset_name}
                        {r.request_type === 'BULK' && <span style={{ fontSize: '9px', background: 'var(--primary)', color: '#fff', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>Bulk</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{r.requester_name || r.emp_no || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={12} /> {r.request_type === 'BULK' ? `${r.sbu} ➔ ${r.target_sbu || '?'}` : r.sbu}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${r.request_type === 'CAPEX' ? 'badge-info' : r.request_type === 'BULK' ? 'badge-primary' : 'badge-teal'}`} style={{ fontSize: '10px' }}>{r.request_type}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>₹{Number(r.amount_ext_gst || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${STATUS_CLASS[r.status] || 'badge-muted'}`} style={{ padding: '4px 12px', fontSize: '10px' }}>{r.status}</span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      <div style={{ fontWeight: 500 }}>{r.active_approver_name || r.active_approver_friendly || r.active_approver || '—'}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>View Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>Displaying records {((page-1)*limit)+1} to {Math.min(page*limit, total)} of {total} available</span>
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

      {/* Bulk Approve Modal */}
      {bulkModal && (
        <div className="modal-overlay" onClick={() => setBulkModal(false)}>
          <div className="modal" style={{ maxWidth: '480px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px', background: 'rgba(34,197,94,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={24} color="var(--teal)" /> Bulk Approval Request</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setBulkModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-2)', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <PackageCheck size={28} color="var(--teal)" />
                <div>
                   <div style={{ fontSize: '14px', fontWeight: 700 }}>{selected.length} Records Selected</div>
                   <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Total value: ₹{Number(rows.filter(r => selected.includes(r.id)).reduce((s,r) => s + Number(r.amount_ext_gst||0), 0)).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Group Decision Note</label>
                <textarea className="form-control" style={{ borderRadius: '14px', padding: '16px' }} value={bulkComment} onChange={e => setBulkComment(e.target.value)} placeholder="Add a comment for this batch approval..." rows={3} />
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '24px', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1, borderRadius: '12px' }} onClick={() => setBulkModal(false)}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: '48px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleBulkApprove} disabled={bulkLoading}>
                {bulkLoading ? 'Processing Batch...' : <><CheckCircle2 size={18} /> Confirm & Authorize {selected.length} Requests</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
