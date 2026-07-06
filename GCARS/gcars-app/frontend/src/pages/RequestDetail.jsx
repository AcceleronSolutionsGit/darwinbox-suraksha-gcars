import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { CardSkeleton, Skeleton } from '../components/common/Skeleton';
import { 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  User, 
  Building2, 
  MapPin, 
  FolderTree, 
  Star, 
  Target, 
  Package, 
  IndianRupee, 
  Zap, 
  Clock, 
  MessageSquare, 
  X, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const STATUS_BADGE = {
  Approved: 'badge-success',
  Rejected: 'badge-danger',
  Pending: 'badge-warning',
  Initiated: 'badge-info',
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data } = await api.get(`/requests/${id}`);
        if (data.success) setRequest(data.data);
        else setError(data.message || 'Failed to load request');
      } catch (err) { 
        setError(err.response?.data?.message || 'Failed to connect to server');
        toast.error('Failed to load request'); 
      }
      finally { setLoading(false); }
    };
    fetchRequest();
  }, [id]);

  const [actionModal, setActionModal] = useState(null); // 'approve' | 'reject'
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [forwardToLeadership, setForwardToLeadership] = useState(false);
  const [sysSettings, setSysSettings] = useState({});
  const [budgetTypes, setBudgetTypes] = useState([]);
  const [newAllocation, setNewAllocation] = useState('');
  const [assetNo, setAssetNo] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/superadmin/settings');
        if (data.success) setSysSettings(data.settings);
      } catch (err) {}
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (actionModal === 'approve' && request?.active_approver === 'finance') {
       api.get('/masters/budget-types').then(res => {
          if (res.data.success) {
            setBudgetTypes(res.data.data);
            setNewAllocation(request.budget_type_id?.toString() || '');
          }
       }).catch(()=>{});
    }
  }, [actionModal, request]);

  const handleAction = async (action) => {
    if (action === 'reject' && !comment) { toast.error('Please provide a rejection reason'); return; }
    setActionLoading(true);
    try {
      const payload = { 
         comment, 
         forwardToLeadership: action === 'approve' ? forwardToLeadership : false,
         asset_no: (action === 'approve' && request?.active_approver === 'finance') ? assetNo : undefined
      };
      if (action === 'approve' && request?.active_approver === 'finance' && newAllocation) {
         payload.budget_type_id = parseInt(newAllocation, 10);
      }
      const { data } = await api.post(`/requests/${id}/${action}`, payload);
      if (data.success) {
        toast.success(data.message);
        setActionModal(null);
        const res = await api.get(`/requests/${id}`);
        if (res.data.success) setRequest(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `${action} failed`);
    } finally { setActionLoading(false); }
  };

  const InfoRow = ({ label, value, accent }) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)', minWidth: '160px', paddingTop: '2px' }}>{label}</div>
      <div style={{ fontSize: '13.5px', fontWeight: accent ? 600 : 400, color: accent ? 'var(--white)' : 'var(--white)', flex: 1 }}>{value || '—'}</div>
    </div>
  );

  if (loading) return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div style={{ width: '300px' }}>
          <Skeleton className="skeleton-title" style={{ width: '150px' }} />
          <Skeleton className="skeleton-text" style={{ width: '220px' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
  if (error) return (
    <div className="page-content">
      <div className="card empty-state">
        <h2 style={{ color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={24} /> Error</h2>
        <p style={{ margin: '16px 0', fontSize: '15px' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/requests')}>Back to Requests</button>
      </div>
    </div>
  );
  if (!request) return <div className="page-content"><div className="card empty-state"><h3>Request not found</h3></div></div>;
  
  const track = request.track || [];
  const canApprove = (String(request.active_approver_emp_no) === String(user?.emp_no) || request.active_approver === user?.user_type) && ['Pending','Initiated'].includes(request.status);
  
  const isITAsset = request?.asset_group_name?.toUpperCase().includes('IT') || request?.asset_type_display?.toUpperCase().includes('IT');
  const isBudgetOwnerIT = request?.active_approver === 'budget_owner' && isITAsset;

  return (
    <div className="page-content fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '16px', borderRadius: '20px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <ChevronLeft size={16} /> Back
          </button>
          <div className="kicker" style={{ color: 'var(--primary)', fontWeight: 800 }}>Request Review</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '32px', letterSpacing: '-0.02em', margin: 0 }}>{request.capex_no}</h1>
             <span className={`badge ${STATUS_BADGE[request.status] || 'badge-muted'}`} style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '30px' }}>
               {request.status.toUpperCase()}
             </span>
          </div>
          <p style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-muted)' }}>
            {request.request_type} Acquisition · Raised on {request.created_at ? new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
        {canApprove && (
          <div className="page-actions" style={{ gap: '12px' }}>
            <button className="btn btn-ghost" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setActionModal('reject')}><X size={18} /> Reject</button>
            <button className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} onClick={() => setActionModal('approve')}><CheckCircle2 size={18} /> Approve Request</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Left - Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Requester Profile Section */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-2) 100%)', 
            borderColor: 'var(--border)', 
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '120px', opacity: 0.03, pointerEvents: 'none' }}><User size={120} /></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '16px', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-d) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', color: '#000', fontWeight: 800,
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  {request.requester_name?.slice(0, 1) || 'U'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>{request.requester_name}</h3>
                  <div style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 600 }}>{request.desg} · {request.emp_no}</div>
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'SBU / Unit', value: request.sbu, icon: <Building2 size={16} /> },
                  { label: 'Location', value: request.location, icon: <MapPin size={16} /> },
                  { label: 'Business Function', value: request.b_func, icon: <FolderTree size={16} /> },
                  { label: 'Employee Grade', value: request.grade, icon: <Star size={16} /> }
                ].map((x, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ opacity: 0.7 }}>{x.icon}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>{x.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{x.value || '—'}</div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Target Scope for Bulk */}
          {request.request_type === 'BULK' && (
            <div className="card" style={{ padding: '24px', background: 'var(--info-bg)', borderColor: 'var(--primary-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Target size={18} /></div>
                 <h3 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>Target Deployment Scope</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <InfoRow label="Target Business Unit" value={request.target_sbu} accent />
                <InfoRow label="Target Location" value={request.target_location} accent />
              </div>
            </div>
          )}

          {/* Asset & Technical Details */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}><Package size={18} /></div>
               <h3 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acquisition Scope</h3>
            </div>

            {!request.is_multi_asset ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <InfoRow label="Primary Asset" value={request.asset_name} accent />
                </div>
                <InfoRow label="Asset Group" value={request.asset_group_name} />
                <InfoRow label="Asset Type" value={request.asset_type_display} />
                <div style={{ gridColumn: 'span 2' }}>
                  <InfoRow label="Full Description" value={request.asset_description} />
                  <div style={{ height: '1px', background: 'var(--border-2)', margin: '12px 0' }} />
                  <InfoRow label="Business Justification" value={request.asset_justification} />
                </div>
                <InfoRow label="Quantity Required" value={`${request.asset_quantity} Units`} />
                <InfoRow label="Procurement Basis" value={request.procurement?.toUpperCase()} />
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px' }}>MULTI-ITEM SCHEDULE</div>
                <div className="table-wrap" style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <table style={{ fontSize: '13px' }}>
                    <thead style={{ background: 'var(--bg-2)' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Item Details</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px' }}>Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(request.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.asset_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{it.asset_description || 'No specs provided'}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>{it.asset_quantity}</td>
                          <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>₹{Number(it.amount_ext_gst || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {request.quotation && (
              <div style={{ marginTop: '24px', paddingBottom: '8px', borderBottom: '1px solid var(--border-2)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Supporting Documents & Quotations</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {request.quotation.split(';').filter(Boolean).map((file, idx) => (
                    <a key={idx} href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}/uploads/${file}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      View Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ 
              marginTop: '16px', padding: '20px', 
              background: 'var(--bg-2)', borderRadius: '16px', 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>Delivery Commitment</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{request.expected_date ? new Date(request.expected_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>Budget Mapping</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{request.budget_type_name}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>Financial Category</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{request.request_type}</span>
              </div>
            </div>
          </div>

          {/* Sourcing & Financials */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(243,115,33,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><IndianRupee size={18} /></div>
               <h3 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial & Sourcing</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'rgba(34,197,94,0.05)', borderRadius: '16px', border: '1px solid rgba(34,197,94,0.15)' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green-l)', textTransform: 'uppercase' }}>Total Request Value</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  ₹{Number(request.amount_ext_gst||0).toLocaleString('en-IN')}
                  <small style={{ fontSize: '12px', opacity: 0.5, marginLeft: '6px' }}>Excl. GST</small>
                </div>
              </div>
              
              {request.budgeted_amount !== null && request.budgeted_amount !== undefined && (
                <div style={{ padding: '16px', background: 'rgba(59,130,246,0.05)', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Remaining Budget Allocation</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    ₹{Number(request.budgeted_amount - (request.budget_amount_consumed || 0) - (request.committed_amount || 0)).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Total: ₹{Number(request.budgeted_amount).toLocaleString('en-IN')} | Pending/Consumed: ₹{Number((request.budget_amount_consumed || 0) + (request.committed_amount || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              {request.approve_amount > 0 && (
                <div style={{ padding: '16px', background: 'var(--primary-bg)', borderRadius: '16px', border: '1px solid var(--primary-border)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Approved Sanction</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                    ₹{Number(request.approve_amount).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
               <InfoRow label="Cost Centre Reference" value={request.costcentre} />
               <InfoRow label="Internal Sanction #" value={request.sanction_no} />
            </div>

            <div style={{ height: '1px', background: 'var(--border-2)', margin: '24px 0' }} />
            
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--purple-l)', marginBottom: '16px', textTransform: 'uppercase' }}>Proposed Vendor Panel</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { name: request.vender_name1, code: request.sap_vender_code1, pref: true },
                { name: request.vender_name2, code: request.sap_vender_code2 },
                { name: request.vender_name3, code: request.sap_vender_code3 }
              ].filter(v => v.name).map((v, i) => (
                <div key={i} style={{ 
                  padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', 
                  background: v.pref ? 'var(--bg-hover)' : 'transparent',
                  position: 'relative'
                }}>
                  {v.pref && <div style={{ position: 'absolute', top: '-8px', right: '12px', background: 'var(--primary)', color: '#000', fontSize: '8px', fontWeight: 900, padding: '1px 6px', borderRadius: '4px' }}>PREF</div>}
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px' }}>SAP: {v.code || 'Pending Match'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Workflow & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Workflow Chain */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} className="text-primary" /> Workflow Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(request.workflow_chain || []).map((step, i) => {
                const status = step.actual_status;
                const isApproved = status === 'Approved';
                const isRejected = status === 'Rejected';
                const isCurrent  = status === 'Current';
                
                return (
                  <div key={i} style={{ 
                    display: 'flex', gap: '14px', padding: '14px', 
                    background: isCurrent ? 'var(--primary-bg)' : 'transparent', 
                    borderRadius: '12px', 
                    border: isCurrent ? '1px solid var(--primary-border)' : '1px solid transparent',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ 
                        width: '24px', height: '24px', borderRadius: '50%', 
                        background: isApproved ? 'var(--success-bg)' : isRejected ? 'var(--danger-bg)' : isCurrent ? 'var(--primary)' : 'var(--bg-3)',
                        border: `1px solid ${isApproved ? 'var(--success-border)' : isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: isApproved ? 'var(--success-text)' : isCurrent ? '#000' : 'var(--text-faint)', zIndex: 2
                      }}>
                        {isApproved ? <CheckCircle2 size={14} /> : isRejected ? <XCircle size={14} /> : i + 1}
                      </div>
                      {i < (request.workflow_chain.length - 1) && (
                         <div style={{ width: '2px', flex: 1, background: 'var(--border)', minHeight: '20px' }}></div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{step.friendly_label || step.label}</div>
                        {status !== 'Pending' && (
                          <span className={`badge ${isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-amber'}`} style={{ fontSize: '8px', padding: '2px 8px' }}>
                            {status}
                          </span>
                        )}
                      </div>
                      {step.actor_name && (
                        <div style={{ fontSize: '11px', color: isCurrent ? 'var(--primary)' : 'var(--text-faint)', marginTop: '2px' }}>
                          {step.actor_name}
                        </div>
                      )}
                      {step.comment && (
                        <div style={{ 
                          fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', 
                          padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '8px', 
                          border: '1px solid var(--border)', fontStyle: 'italic'
                        }}>
                          "{step.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {(request.status === 'Pending' || request.status === 'Initiated') && (
              <div style={{ 
                marginTop: '16px', padding: '16px', background: 'var(--primary-bg)', 
                borderRadius: '16px', border: '1px solid var(--primary-border)',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div className="spinner spinner-sm" />
                <div>
                   <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Waiting for response</div>
                   <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {request.currentApproverDetails?.name || request.active_approver_name || request.active_approver}
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Interaction Log</h3>
            {track.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '12px' }}>No logs available</p>
            ) : (
              <div className="timeline">
                {track.map((t, i) => (
                  <div key={i} className="timeline-item">
                    <div className={`timeline-dot ${t.status === 'Approved' ? 'approve' : t.status === 'Rejected' ? 'reject' : 'init'}`}></div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{t.status} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>by {t.actor_name}</span></span>
                        <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{t.comment}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve / Reject Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" style={{ maxWidth: '480px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px', background: actionModal === 'approve' ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>{actionModal === 'approve' ? <><CheckCircle2 size={24} color="var(--teal)" /> Confirm Approval</> : <><XCircle size={24} color="var(--coral)" /> Reject Request</>}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setActionModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <p style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {actionModal === 'approve' ? 'Are you sure you want to approve this request? This action will move it to the next workflow stage.' : 'Please provide a justification for declining this request.'}
              </p>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Decision Commentary</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: '120px', padding: '16px', borderRadius: '14px', marginBottom: '16px' }}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={actionModal === 'reject' ? 'Describe the reason for rejection...' : 'Add a note for the next approver (optional)...'}
                  required={actionModal === 'reject'}
                />
              </div>
              
              {actionModal === 'approve' && isBudgetOwnerIT && sysSettings?.it_review_enabled && (
                <div style={{ marginBottom: '10px', padding: '16px', background: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                   <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                      <input 
                         type="checkbox" 
                         checked={forwardToLeadership}
                         onChange={(e) => setForwardToLeadership(e.target.checked)}
                         style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Forward for Leadership Review
                      </span>
                   </label>
                   <p style={{ margin: '6px 0 0 28px', fontSize: '12px', color: 'var(--text-faint)' }}>
                      Sends the request to the CMD or Business Head for review before proceeding to Finance.
                   </p>
                </div>
              )}

              {actionModal === 'approve' && request?.active_approver === 'finance' && (
                <div className="form-group" style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  {budgetTypes.length > 0 && (
                    <>
                      <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Adjust Budget Allocation</label>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-faint)' }}>
                          As the final step, Finance may change the budget bucket if the initial allocation was incorrect.
                      </p>
                      <select 
                        className="form-control" 
                        value={newAllocation} 
                        onChange={(e) => setNewAllocation(e.target.value)}
                        style={{ marginBottom: '16px' }}
                      >
                        <option value="">Keep current allocation</option>
                        {budgetTypes.map(bt => (
                          <option key={bt.id} value={bt.id}>{bt.name} ({bt.year})</option>
                        ))}
                      </select>
                    </>
                  )}

                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>SAP Asset Number</label>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-faint)' }}>
                      Enter the generated SAP Asset Code to finalize this request.
                  </p>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="e.g. 1000000123"
                    value={assetNo}
                    onChange={(e) => setAssetNo(e.target.value)}
                    style={{ fontWeight: 700, color: 'var(--primary)' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ padding: '24px', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1, borderRadius: '12px' }} onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn ${actionModal === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                style={{ flex: 2, height: '48px', borderRadius: '12px', fontWeight: 700 }}
                onClick={() => handleAction(actionModal)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (actionModal === 'approve' ? <><CheckCircle2 size={18} /> Authorize Approval</> : <><XCircle size={18} /> Rejection Confirmed</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
