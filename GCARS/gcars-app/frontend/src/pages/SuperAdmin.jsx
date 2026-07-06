import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { TableSkeleton, StatSkeleton, Skeleton } from '../components/common/Skeleton';

const ROLE_OPTIONS = [
  { value: 'user',         label: 'Employee / User' },
  { value: 'supervisor',   label: 'Supervisor' },
  { value: 'it_admin',     label: 'IT Admin / PS' },
  { value: 'budget_owner', label: 'Budget Owner' },
  { value: 'accountant',   label: 'Accountant' },
  { value: 'cfo',          label: 'CFO' },
  { value: 'cmd',          label: 'CMD / MD' },
  { value: 'finance',      label: 'Finance / SAP' },
  { value: 'admin',        label: 'Admin' },
  { value: 'superadmin',   label: 'Super Admin' },
  { value: 'bulk_approver',label: 'Bulk Approver' },
];

const APPLIES_OPTIONS = ['BOTH', 'CAPEX', 'OPEX', 'BULK'];

const STEP_COLORS = {
  supervisor:   { badge: 'badge-teal',   dot: '#14B8A6' },
  it_admin:     { badge: 'badge-purple', dot: '#A855F7' },
  budget_owner: { badge: 'badge-amber',  dot: '#F59E0B' },
  accountant:   { badge: 'badge-info',   dot: '#818CF8' },
  cfo:          { badge: 'badge-warning', dot: '#FBBF24' },
  cmd:          { badge: 'badge-danger', dot: '#F87171' },
  finance:      { badge: 'badge-success', dot: '#4ADE80' },
  bulk_approver: { badge: 'badge-primary', dot: '#2563EB' },
};

const fmtAmt = v => {
  const n = Number(v);
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)} L`;
  if (n >= 9999999000) return '∞';
  return `₹${n.toLocaleString('en-IN')}`;
};

// ——— Workflow Step Card ———
function StepCard({ step, index, total, onEdit, onDelete, onToggle, onMove }) {
  const colors = STEP_COLORS[step.role_key] || { badge: 'badge-muted', dot: 'var(--text-faint)' };
  return (
    <div style={{
      display: 'flex', gap: '14px', alignItems: 'flex-start',
      padding: '16px', background: step.is_active ? 'var(--bg-card)' : 'var(--glass)',
      border: `1px solid ${step.is_active ? 'var(--border)' : 'var(--border-2)'}`,
      borderRadius: 'var(--r-lg)',
      opacity: step.is_active ? 1 : 0.55,
      transition: 'all 0.2s',
    }}>
      {/* Step number */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: step.is_active ? `${colors.dot}22` : 'var(--glass)',
        border: `2px solid ${step.is_active ? colors.dot : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: step.is_active ? colors.dot : 'var(--text-faint)',
      }}>
        {step.step_order}
      </div>

      {/* Connector line */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{step.step_name}</span>
          <span className={`badge ${colors.badge}`}>{step.label}</span>
          <span className={`badge ${step.is_active ? 'badge-success' : 'badge-muted'}`}>
            {step.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className="badge badge-muted">{step.applies_to}</span>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Role/Group: <code style={{ background: 'var(--glass-2)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{step.role_key}</code>
          </span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
          {step.amount_min === 0 && step.amount_max >= 999999999
            ? '⚡ Applies unconditionally to all amounts'
            : step.amount_max >= 999999999
              ? `⚡ Requires approval for amounts > ${fmtAmt(step.amount_min)}`
              : `⚡ Requires approval for amounts from ${fmtAmt(step.amount_min)} to ${fmtAmt(step.amount_max)}`}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMove(step, -1)} disabled={index === 0} title="Move up">↑</button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onMove(step, 1)} disabled={index === total - 1} title="Move down">↓</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onToggle(step)} title={step.is_active ? 'Deactivate' : 'Activate'}>
          {step.is_active ? '⏸' : '▶'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(step)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(step)}>✕</button>
      </div>
    </div>
  );
}

// ——— Step Editor Modal ———
function StepModal({ step, sbus = [], onClose, onSave }) {
  const isNew = !step.id;
  const [form, setForm] = useState({
    step_order:  step.step_order  ?? 99,
    step_name:   step.step_name   ?? '',
    department:  step.department  ?? 'All',
    role_key:    step.role_key    ?? 'supervisor',
    label:       step.label       ?? '',
    amount_min:  step.amount_min  ?? 0,
    amount_max:  step.amount_max  ?? 9999999999,
    applies_to:  step.applies_to  ?? 'BOTH',
    is_active:   step.is_active   !== undefined ? Boolean(step.is_active) : true,
    description: step.description ?? '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isNew ? '+ Add Workflow Step' : 'Edit Workflow Step'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Step Order</label>
              <input className="form-control" type="number" min={1} value={form.step_order} onChange={e => set('step_order', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role_key} onChange={e => set('role_key', e.target.value)}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department / SBU</label>
              <select className="form-control" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="All">Global (All Depts)</option>
                {sbus.map(s => <option key={s.sbu_name} value={s.sbu_name}>{s.sbu_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Step Name</label>
              <input className="form-control" value={form.step_name} onChange={e => set('step_name', e.target.value)} placeholder="e.g. CFO Approval" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Display Label</label>
              <input className="form-control" value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. CFO" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Amount (₹)</label>
              <input className="form-control" type="number" min={0} value={form.amount_min} onChange={e => set('amount_min', +e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Trigger step only when amount ≥ this value</div>
            </div>
            <div className="form-group">
              <label className="form-label">Max Amount (₹)</label>
              <input className="form-control" type="number" min={0} value={form.amount_max} onChange={e => set('amount_max', +e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Use 9999999999 for no upper limit</div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Applies To</label>
              <select className="form-control" value={form.applies_to} onChange={e => set('applies_to', e.target.value)}>
                {APPLIES_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.is_active ? '1' : '0'} onChange={e => set('is_active', e.target.value === '1')}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Auto-Generated Condition Engine</label>
            <div style={{ padding: '10px 14px', background: 'var(--glass-2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
               {form.amount_min === 0 && form.amount_max >= 999999999
                ? 'Applies conditionally to all amounts.'
                : form.amount_max >= 999999999
                  ? `Requires approval strictly for amounts greater than ₹${Number(form.amount_min).toLocaleString('en-IN')}.`
                  : `Requires approval strictly for amounts between ₹${Number(form.amount_min).toLocaleString('en-IN')} and ₹${Number(form.amount_max).toLocaleString('en-IN')}.`}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>
            {isNew ? '+ Add Step' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— Flow Strategy Modal ———
function FlowModal({ flow, onClose, onSave }) {
  const isNew = !flow?.id;
  const [form, setForm] = useState({
    name: flow?.name || '',
    description: flow?.description || '',
    request_type: flow?.request_type || 'BOTH',
    min_amount: flow?.min_amount || 0,
    max_amount: flow?.max_amount || 999999999,
    is_default: flow?.is_default || 0,
    is_active: flow?.is_active !== undefined ? !!flow.is_active : true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>{isNew ? '✨ Create New Flow Strategy' : '⚙ Edit Flow Strategy'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Flow Name</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. High Value CAPEX" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Explain when this flow applies..." rows={2} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control" value={form.request_type} onChange={e => set('request_type', e.target.value)}>
                <option value="BOTH">BOTH</option>
                <option value="CAPEX">CAPEX</option>
                <option value="OPEX">OPEX</option>
                <option value="BULK">BULK (Bulk Requests)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.is_active ? '1' : '0'} onChange={e => set('is_active', e.target.value === '1')}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Amount (₹)</label>
              <input className="form-control" type="number" value={form.min_amount} onChange={e => set('min_amount', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Amount (₹)</label>
              <input className="form-control" type="number" value={form.max_amount} onChange={e => set('max_amount', +e.target.value)} />
            </div>
          </div>
          <div className="form-group">
             <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.is_default} onChange={e => set('is_default', e.target.checked ? 1 : 0)} />
                Make this the Default Flow
             </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.name}>
             {isNew ? 'Create Flow' : 'Update Flow'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— User Management Row ———
function UserRow({ u, onEdit, onDeactivate }) {
  const typeColor = {
    superadmin: 'badge-amber', admin: 'badge-info', supervisor: 'badge-teal',
    budget_owner: 'badge-warning', accountant: 'badge-purple', cfo: 'badge-warning',
    cmd: 'badge-danger', finance: 'badge-success', it_admin: 'badge-purple', user: 'badge-muted',
  };
  
  const hasBulk = (u.permissions_list || '').includes('raise_bulk_request');

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.username}</div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{u.email}</div>
      </td>
      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.full_name || '—'}</td>
      <td>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span className={`badge ${typeColor[u.user_type] || 'badge-muted'}`}>{u.user_type}</span>
          {hasBulk && <span className="badge badge-primary" style={{ fontSize: '9px', textTransform: 'uppercase' }}>⚡ Bulk</span>}
        </div>
      </td>
      <td style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-faint)' }}>{u.emp_no || '—'}</td>
      <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{u.sbu || '—'}</td>
      <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{u.b_func || '—'}</td>
      <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{u.location || '—'}</td>
      <td><span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(u)}>Edit</button>
          {u.status === 'Active' && (
            <button className="btn btn-danger btn-sm" onClick={() => onDeactivate(u.id)}>Deactivate</button>
          )}
        </div>
      </td>
    </tr>
  );
}

// CSV template columns
const CSV_TEMPLATE_HEADERS = ['username','email','emp_no','password','user_type','full_name','sbu','location','status','rpt_code'];
const CSV_TEMPLATE_EXAMPLE = ['john_doe','john.doe@company.com','E099','Pass@1234','user','John Doe','CORP','Mumbai','Active','E001'];

// ——— Full User Modal (Add / Edit / Bulk Upload) ———
function UserModal({ mode, form, setForm, onClose, onSave, onBulkUpload, sbus = [], flows = [], dbRoles = [], functions = [] }) {
  const [activeTab, setActiveTab] = useState(mode === 'bulk' ? 'bulk' : 'manual');
  const [csvText, setCsvText]     = useState('');
  const [csvParsed, setCsvParsed] = useState([]);
  const [csvError, setCsvError]   = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [rptSearch, setRptSearch] = useState('');
  const [rptResults, setRptResults] = useState([]);
  const isEdit = mode === 'edit';
  const showTabs = !isEdit; // show tabs for both 'new' and 'bulk'

  useEffect(() => {
    if (form.rpt_code && mode === 'edit') {
      const fetchDetails = async () => {
        try {
           const { data } = await api.get(`/superadmin/employees-search?q=${form.rpt_code}`);
           if (data.success && data.data.length > 0) {
             const emp = data.data.find(e => e.emp_no === form.rpt_code) || data.data[0];
             setRptSearch(`${emp.name} (${emp.emp_no})`);
           } else {
             setRptSearch(form.rpt_code);
           }
        } catch { setRptSearch(form.rpt_code); }
      };
      fetchDetails();
    }
  }, [form.rpt_code, mode]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Parse CSV
  const parseCSV = (text) => {
    setCsvError('');
    setBulkResult(null);
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (!lines.length) { setCsvParsed([]); return; }
    // Skip header row if it matches template
    const firstRow = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g,''));
    const isHeader = firstRow[0].toLowerCase() === 'username';
    const dataLines = isHeader ? lines.slice(1) : lines;
    const parsed = dataLines.map(line => {
      const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g,''));
      return {
        username:  cols[0] || '',
        email:     cols[1] || '',
        emp_no:    cols[2] || '',
        password:  cols[3] || '',
        user_type: cols[4] || 'user',
        full_name: cols[5] || '',
        sbu:       cols[6] || '',
        location:  cols[7] || '',
        status:    cols[8] || 'Active',
        rpt_code:  cols[9] || '',
      };
    }).filter(r => r.username || r.email);
    setCsvParsed(parsed);
    if (!parsed.length) setCsvError('No valid rows found. Check your CSV format.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = [CSV_TEMPLATE_HEADERS.join(','), CSV_TEMPLATE_EXAMPLE.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'user_upload_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!csvParsed.length) return;
    setUploading(true);
    try {
      const result = await onBulkUpload(csvParsed);
      setBulkResult(result);
      if (result.created > 0) toast.success(`${result.created} user(s) created`);
      if (result.failed > 0) toast.error(`${result.failed} row(s) failed`);
    } catch (err) {
      toast.error('Bulk upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620, width: '95vw' }}>
        <div className="modal-header">
          <h3>{isEdit ? `Edit User: ${form.username}` : '+ New User'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Sub-tabs (only on Add new / Bulk mode) */}
        {showTabs && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            {[
              { key: 'manual', label: '✎ Manual' },
              { key: 'bulk',   label: '📤 Bulk Upload (CSV)' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '10px 18px', fontSize: 13, fontWeight: 600,
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>

          {/* ── Manual Tab ── */}
          {(isEdit || activeTab === 'manual') && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Username <span style={{ color: 'var(--coral)' }}>*</span></label>
                  <input className="form-control" value={form.username || ''} onChange={e => setF('username', e.target.value)} placeholder="e.g. john_doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span style={{ color: 'var(--coral)' }}>*</span></label>
                  <input className="form-control" type="email" value={form.email || ''} onChange={e => setF('email', e.target.value)} placeholder="john@company.com" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={form.full_name || ''} onChange={e => setF('full_name', e.target.value)} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee No</label>
                  <input className="form-control" value={form.emp_no || ''} onChange={e => setF('emp_no', e.target.value)} placeholder="E001" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SBU / Business Unit</label>
                  <select className="form-control" value={form.sbu || ''} onChange={e => setF('sbu', e.target.value)}>
                    <option value="">Select SBU</option>
                    {sbus.map(s => <option key={s.sbu_name} value={s.sbu_name}>{s.sbu_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-control" value={form.location || ''} onChange={e => setF('location', e.target.value)} placeholder="e.g. Mumbai, Delhi" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Broad Function</label>
                  <select 
                    className="form-control" 
                    value={form.b_func_id || ''} 
                    onChange={e => {
                      const id = e.target.value;
                      const name = functions.find(f => String(f.id) === String(id))?.name || '';
                      setForm(f => ({ ...f, b_func_id: id, b_func: name }));
                    }}
                  >
                    <option value="">Select Broad Function</option>
                    {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="form-group" />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Reporting Manager (Supervisor)</label>
                  <input
                    className="form-control"
                    placeholder="Search by name or emp no..."
                    value={rptSearch}
                    onChange={e => {
                      setRptSearch(e.target.value);
                      const q = e.target.value;
                      if (!q || q.length < 2) { setRptResults([]); }
                      else {
                        api.get(`/superadmin/employees-search?q=${q}`).then(res => {
                          if (res.data.success) setRptResults(res.data.data);
                        }).catch(() => {});
                      }
                      if (!q) setF('rpt_code', '');
                    }}
                  />
                  {rptResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', marginTop: 2,
                    }}>
                      {rptResults.map(emp => (
                        <div
                          key={emp.emp_no}
                          style={{
                            padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                            borderBottom: '1px solid var(--border-2)',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            setF('rpt_code', emp.emp_no);
                            setRptSearch(`${emp.name} (${emp.emp_no})`);
                            setRptResults([]);
                          }}
                        >
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                            {emp.emp_no} · {emp.desg} · {emp.sbu}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.rpt_code && (
                    <div style={{ fontSize: 11, color: 'var(--primary-l)', marginTop: 4 }}>
                      ✓ Selected: <strong>{form.rpt_code}</strong>
                    </div>
                  )}
                </div>
                <div className="form-group" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role / User Type <span style={{ color: 'var(--coral)' }}>*</span></label>
                  <select className="form-control" value={form.user_type || 'user'} onChange={e => setF('user_type', e.target.value)}>
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status || 'Active'} onChange={e => setF('status', e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Roles / Privileges */}
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border-2)', paddingTop: 16 }}>
                 <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>Platform Privileges (System Roles)</label>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {dbRoles.map(role => (
                      <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
                         <input 
                           type="checkbox" 
                           checked={(form.role_ids || []).includes(role.id)} 
                           onChange={e => {
                             const current = form.role_ids || [];
                             const next = e.target.checked ? [...current, role.id] : current.filter(id => id !== role.id);
                             setF('role_ids', next);
                           }}
                         />
                         <span style={{ fontSize: 13, fontWeight: 500 }}>{role.display_name}</span>
                      </label>
                    ))}
                 </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Default Workflow Strategy</label>
                  <select className="form-control" value={form.default_flow_id || ''} onChange={e => setF('default_flow_id', e.target.value)}>
                    <option value="">Attribute-based (Auto)</option>
                    {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Forced strategy regardless of amount/type</div>
                </div>
                <div className="form-group" />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isEdit ? 'New Password' : 'Password'}{' '}
                  {!isEdit && <span style={{ color: 'var(--coral)' }}>*</span>}
                  {isEdit && <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 400 }}> (leave blank to keep current)</span>}
                </label>
                <input
                  className="form-control"
                  type="password"
                  value={form.password || ''}
                  onChange={e => setF('password', e.target.value)}
                  placeholder={isEdit ? 'Leave blank to keep current password' : 'Min 8 chars'}
                />
              </div>
            </>
          )}

          {/* ── Bulk Upload Tab ── */}
          {!isEdit && activeTab === 'bulk' && (
            <div>
              {/* Template download */}
              <div style={{
                background: 'var(--info-bg)', border: '1px solid var(--info-border)',
                borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  📋 CSV Format
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'var(--mono)' }}>
                  {CSV_TEMPLATE_HEADERS.join(', ')}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>
                  ⬇ Download Template CSV
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Upload CSV File <span style={{ color: 'var(--coral)' }}>*</span></label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="form-control"
                  style={{ marginBottom: 10, padding: 6 }}
                />
                <div style={{ textAlign: 'center', marginBottom: 10, color: 'var(--text-muted)', fontSize: 12 }}>OR Paste CSV Data Below</div>
                <textarea
                  className="form-control"
                  rows={8}
                  style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
                  placeholder={`username,email,emp_no,password,user_type,full_name,sbu,location,status\njohn_doe,john@co.com,E099,Pass@1234,user,John Doe,CORP,Mumbai,Active`}
                  value={csvText}
                  onChange={e => { setCsvText(e.target.value); parseCSV(e.target.value); }}
                />
                {csvError && <div style={{ color: 'var(--coral)', fontSize: 12, marginTop: 4 }}>{csvError}</div>}
                {csvParsed.length > 0 && !csvError && (
                  <div style={{ fontSize: 12, color: 'var(--success-text)', marginTop: 4 }}>
                    ✓ {csvParsed.length} row{csvParsed.length !== 1 ? 's' : ''} parsed and ready to upload
                  </div>
                )}
              </div>

              {/* Preview table */}
              {csvParsed.length > 0 && !bulkResult && (
                <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                  <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-2)' }}>
                        {['Username','Email','Emp No','Role','SBU','Location','Status'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvParsed.slice(0, 10).map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-2)' }}>
                          <td style={{ padding: '5px 10px', color: 'var(--text-primary)' }}>{r.username}</td>
                          <td style={{ padding: '5px 10px', color: 'var(--text-muted)' }}>{r.email}</td>
                          <td style={{ padding: '5px 10px', color: 'var(--text-faint)' }}>{r.emp_no || '—'}</td>
                          <td style={{ padding: '5px 10px' }}><span className="badge badge-muted" style={{ fontSize: 10 }}>{r.user_type}</span></td>
                          <td style={{ padding: '5px 10px', color: 'var(--text-faint)' }}>{r.sbu || '—'}</td>
                          <td style={{ padding: '5px 10px', color: 'var(--text-faint)' }}>{r.location || '—'}</td>
                          <td style={{ padding: '5px 10px' }}><span className={`badge ${r.status === 'Active' ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: 10 }}>{r.status}</span></td>
                        </tr>
                      ))}
                      {csvParsed.length > 10 && (
                        <tr><td colSpan={7} style={{ padding: '6px 10px', color: 'var(--text-faint)', fontStyle: 'italic', fontSize: 11 }}>… and {csvParsed.length - 10} more rows</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bulk upload results */}
              {bulkResult && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <span style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      ✓ {bulkResult.created} created
                    </span>
                    {bulkResult.failed > 0 && (
                      <span style={{ background: 'var(--danger-bg)', color: 'var(--coral)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        ✕ {bulkResult.failed} failed
                      </span>
                    )}
                  </div>
                  {bulkResult.results.filter(r => !r.success).map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--coral)', padding: '4px 8px', background: 'var(--danger-bg)', borderRadius: 6, marginBottom: 4 }}>
                      ✕ {r.username} ({r.email}) — {r.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            {bulkResult ? 'Close' : 'Cancel'}
          </button>
          {(isEdit || activeTab === 'manual') && !bulkResult && (
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={!form.username || !form.email || (!isEdit && !form.password)}
            >
              {isEdit ? 'Save Changes' : '+ Create User'}
            </button>
          )}
          {!isEdit && activeTab === 'bulk' && !bulkResult && (
            <button
              className="btn btn-primary"
              onClick={handleBulkUpload}
              disabled={!csvParsed.length || uploading}
            >
              {uploading ? 'Uploading…' : `Upload ${csvParsed.length} User${csvParsed.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main SuperAdmin Page ───
export default function SuperAdmin() {
  const location = useLocation();
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'workflow';
  };

  const [tab, setTab]         = useState(getInitialTab());
  const [wfType, setWfType]   = useState('CAPEX'); // 'CAPEX' | 'OPEX'

  // Workflow state
  const [flows, setFlows]       = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null); // the current flow object
  const [workflow, setWorkflow] = useState([]);
  const [wLoading, setWLoading] = useState(true);
  const [modalStep, setModalStep] = useState(null); 
  const [flowModal, setFlowModal] = useState(null); // { name, ... }
  const [sbus, setSbus] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');

  // Budget Owners state
  const [owners, setOwners]         = useState([]);
  const [oLoading, setOLoading]     = useState(false);
  const [ownerModal, setOwnerModal] = useState(null);
  const [ownerForm, setOwnerForm]   = useState({});
  const [empSearch, setEmpSearch]   = useState('');
  const [empResults, setEmpResults] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState('');

  // User management state
  const [users, setUsers]     = useState([]);
  const [uLoading, setULoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [userModal, setUserModal] = useState(null);
  const [userForm, setUserForm]   = useState({});
  const [stats, setStats]     = useState({});
  const [dbRoles, setDbRoles] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // id of owner pending delete confirm

  // RBAC state
  const [rbacModal, setRbacModal] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // System Settings state
  const [sysSettings, setSysSettings] = useState({});
  const [settingLoading, setSettingLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    setSettingLoading(true);
    try {
      const { data } = await api.get('/superadmin/settings');
      if (data.success) setSysSettings(data.settings);
    } catch {}
    finally { setSettingLoading(false); }
  }, []);

  const saveSetting = async (key, value) => {
    try {
      await api.post('/superadmin/settings', { key, value });
      toast.success('Setting updated');
      loadSettings();
    } catch { toast.error('Failed to update setting'); }
  };

  // Load workflow
  const loadFlows = useCallback(async () => {
    try {
      const { data } = await api.get('/superadmin/workflows');
      if (data.success) {
        setFlows(data.data);
        if (!selectedFlow && data.data.length > 0) setSelectedFlow(data.data[0]);
      }
    } catch { toast.error('Failed to load workflow strategies'); }
  }, [selectedFlow]);

  const loadWorkflow = useCallback(async () => {
    if (!selectedFlow) return;
    setWLoading(true);
    try {
      const { data } = await api.get(`/superadmin/workflow?department=${encodeURIComponent(selectedDept)}&flow_id=${selectedFlow.id}`);
      if (data.success) setWorkflow(data.data);
    } catch { toast.error('Failed to load workflow steps'); }
    finally { setWLoading(false); }
  }, [selectedDept, selectedFlow]);

  const loadSbus = useCallback(async () => {
    try {
      const { data } = await api.get('/masters/sbu');
      if (data.success) setSbus(data.data);
    } catch {}
  }, []);

  // Load users
  const loadUsers = useCallback(async () => {
    setULoading(true);
    try {
      const { data } = await api.get(`/superadmin/users?limit=50&search=${search}`);
      if (data.success) setUsers(data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setULoading(false); }
  }, [search]);

  // Load budget owners
  const loadOwners = useCallback(async () => {
    setOLoading(true);
    try {
      const { data } = await api.get('/superadmin/broad-function-heads');
      if (data.success) setOwners(data.data);
    } catch { toast.error('Failed to load budget owners'); }
    finally { setOLoading(false); }
  }, []);

  // Employee search autocomplete
  const searchEmployees = async (q) => {
    if (!q || q.length < 2) { setEmpResults([]); return; }
    try {
      const { data } = await api.get(`/superadmin/employees-search?q=${q}`);
      if (data.success) setEmpResults(data.data);
    } catch {}
  };

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/superadmin/dashboard');
      if (data.success) setStats(data.stats);
    } catch { toast.error('Admin metrics failed to sync'); }
  }, []);

  const loadDbRoles = useCallback(async () => {
    try {
      const { data } = await api.get('/superadmin/roles');
      if (data.success) setDbRoles(data.data);
    } catch {}
  }, []);

  const loadFunctionsMaster = useCallback(async () => {
    try {
      const { data } = await api.get('/superadmin/broad-functions');
      if (data.success) setFunctions(data.data);
    } catch {}
  }, []);

  useEffect(() => { loadSbus(); loadFlows(); loadDbRoles(); loadFunctionsMaster(); }, [loadSbus, loadFlows, loadDbRoles, loadFunctionsMaster]);
  useEffect(() => { loadWorkflow(); loadStats(); }, [loadWorkflow, loadStats]);
  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, loadUsers]);
  useEffect(() => { if (tab === 'owners') loadOwners(); }, [tab, ownerFilter, loadOwners]);
  useEffect(() => { if (tab === 'settings') loadSettings(); }, [tab, loadSettings]);
  useEffect(() => {
    if (tab === 'rbac') {
      const loadPerms = async () => {
        const { data } = await api.get('/superadmin/permissions');
        if (data.success) setPermissions(data.data);
      };
      loadPerms();
      loadDbRoles();
    }
  }, [tab, loadDbRoles]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t && t !== tab) setTab(t);
  }, [location.search]);

  // ─── Workflow handlers ───
  const saveStep = async (form) => {
    try {
      if (modalStep?.id) {
        await api.put(`/superadmin/workflow/${modalStep.id}`, { ...form, flow_id: selectedFlow.id });
        toast.success('Step updated');
      } else {
        await api.post('/superadmin/workflow', { ...form, flow_id: selectedFlow.id });
        toast.success('Step added');
      }
      setModalStep(null);
      loadWorkflow();
    } catch { toast.error('Failed to save step'); }
  };

  const toggleStep = async (step) => {
    try {
      await api.put(`/superadmin/workflow/${step.id}/toggle`);
      toast.success(step.is_active ? 'Step deactivated' : 'Step activated');
      loadWorkflow();
    } catch { toast.error('Toggle failed'); }
  };

  const toggleFullFlow = async (targetState) => {
    if (!confirm(`Are you sure you want to ${targetState ? 'ACTIVATE' : 'DEACTIVATE'} the ENTIRE ${wfType} flow for "${selectedDept}"?`)) return;
    try {
      await api.put('/superadmin/workflow/bulk-toggle', { type: wfType, department: selectedDept, target_state: targetState });
      toast.success(`${wfType} flow ${targetState ? 'activated' : 'deactivated'}`);
      loadWorkflow();
    } catch { toast.error('Bulk toggle failed'); }
  };

  const deleteStep = async (step) => {
    if (!confirm(`Delete "${step.step_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/superadmin/workflow/${step.id}`);
      toast.success('Step removed');
      loadWorkflow();
    } catch { toast.error('Delete failed'); }
  };

  const moveStep = async (step, dir, scopedSteps) => {
    // Use scoped steps (CAPEX or OPEX list) for correct neighbour calculation
    const list = scopedSteps
      ? [...scopedSteps].sort((a, b) => a.step_order - b.step_order)
      : [...workflow].sort((a, b) => a.step_order - b.step_order);
    const idx = list.findIndex(s => s.id === step.id);
    const target = list[idx + dir];
    if (!target) return;
    // Swap step_order values between step and target
    const newOrder = workflow.map(s => ({
      id: s.id,
      step_order:
        s.id === step.id   ? target.step_order :
        s.id === target.id ? step.step_order   : s.step_order,
    }));
    try {
      await api.put('/superadmin/workflow-reorder', { order: newOrder });
      loadWorkflow();
    } catch { toast.error('Reorder failed'); }
  };

  // ─── Budget Owner handlers ───
  const openOwnerModal = (o) => {
    if (o) {
      setOwnerForm({
        ...o,
        designation: o.head || o.designation || '',
        employee_code: o.emp_no || o.employee_code || '',
      });
      setEmpSearch(o.emp_name ? `${o.emp_name} (${o.emp_no})` : o.emp_no || '');
      setEmpResults([]);
    } else {
      setOwnerForm({ designation: '', employee_code: '', budget_owner: 'Active' });
      setEmpSearch('');
      setEmpResults([]);
    }
    setOwnerModal(o ? 'edit' : 'new');
  };

  const saveOwner = async () => {
    try {
      const payload = {
        head: ownerForm.designation,
        emp_no: ownerForm.employee_code,
        sbu_id: ownerForm.sbu_id || 'All',
        bfun_id: ownerForm.bfun_id || 'All',
        budget_owner: ownerForm.status || 'Active'
      };

      if (ownerModal === 'edit' && ownerForm.id) {
        await api.put(`/superadmin/broad-function-heads/${ownerForm.id}`, payload);
        toast.success('Settings updated');
      } else {
        await api.post('/superadmin/broad-function-heads', payload);
        toast.success('Budget role assigned');
      }
      setOwnerModal(null);
      loadOwners();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const deactivateOwner = async (o) => {
    try {
      await api.put(`/superadmin/broad-function-heads/${o.id}`, { ...o, budget_owner: 'Inactive' });
      toast.success('Deactivated');
      loadOwners();
    } catch { toast.error('Failed'); }
  };

  const reactivateOwner = async (o) => {
    try {
      await api.put(`/superadmin/broad-function-heads/${o.id}`, { ...o, budget_owner: 'Active' });
      toast.success('Reactivated');
      loadOwners();
    } catch { toast.error('Failed'); }
  };

  const hardDeleteOwner = async (id) => {
    try {
      await api.delete(`/superadmin/budget-owners-legacy/${id}?hard=true`);
      toast.success('Budget owner permanently removed');
      setConfirmDeleteId(null);
      loadOwners();
    } catch { toast.error('Delete failed'); }
  };

  // ─── User handlers ───
  const openUserModal = (u) => {
    setUserForm(u
      ? { 
          ...u, 
          password: '', 
          sbu: u.sbu || '', 
          location: u.location || '', 
          full_name: u.full_name || '', 
          default_flow_id: u.default_flow_id || '',
          b_func: u.b_func || '',
          b_func_id: u.b_func_id || '',
          role_ids: u.role_ids ? u.role_ids.split(',').map(Number) : []
        }
      : { username: '', email: '', emp_no: '', password: '', user_type: 'user', full_name: '', sbu: '', location: '', status: 'Active', default_flow_id: '', b_func: '', b_func_id: '', role_ids: [] }
    );
    setUserModal(u ? 'edit' : 'new');
  };

  const saveUser = async () => {
    try {
      if (userModal === 'edit' && userForm.id) {
        await api.put(`/superadmin/users/${userForm.id}`, userForm);
        toast.success('User updated');
      } else {
        await api.post('/superadmin/users', userForm);
        toast.success('User created');
      }
      setUserModal(null);
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const bulkUploadUsers = async (rows) => {
    const { data } = await api.post('/superadmin/users/bulk-upload', { users: rows });
    loadUsers();
    return data;
  };

  const deactivateUser = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await api.delete(`/superadmin/users/${id}`); toast.success('User deactivated'); loadUsers(); }
    catch { toast.error('Failed'); }
  };

  const sorted = [...workflow].sort((a, b) => a.step_order - b.step_order);
  const fmtCr = n => `₹${(Number(n || 0) / 1e7).toFixed(2)} Cr`;
  const activeOwners   = owners.filter(o => o.status === 'Active').length;
  const inactiveOwners = owners.filter(o => o.status === 'Inactive').length;

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="kicker">Administration</div>
          <h1 className="page-title">Super Admin</h1>
          <p className="page-subtitle">Manage workflow, users, configuration & system settings</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {!stats.totalUsers && uLoading ? (
           Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          [
            { label: 'Active Users',    value: stats.totalUsers,       icon: '👥', color: 'blue' },
            { label: 'Total Requests',  value: stats.totalRequests,    icon: '📋', color: 'yellow' },
            { label: 'Pending',         value: stats.pendingRequests,  icon: '⏳', color: 'amber' },
            { label: 'Approved',        value: stats.approvedRequests, icon: '✓',  color: 'teal' },
            { label: 'Total Budget',    value: fmtCr(stats.totalBudget),   icon: '₹',  color: 'purple' },
            { label: 'Committed Budget', value: fmtCr(stats.committedBudget), icon: '📌', color: 'blue' },
            { label: 'Consumed Budget', value: fmtCr(stats.consumedBudget), icon: '📊', color: 'red' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value ?? 0}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'workflow', label: '⚙ Workflow Editor' },
          { key: 'users',    label: '👥 User Management' },
          { key: 'rbac',     label: '🛡 Roles & Permissions' },
          { key: 'owners',   label: '💰 Budget Owners' },
          { key: 'settings', label: '⚙ System Settings' },
          { key: 'creds',    label: '🔑 Test Credentials' },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ Workflow Tab ══ */}
      {tab === 'workflow' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 4, fontSize: 17 }}>Approval Workflow Matrix</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Configure steps independently for CAPEX/OPEX and by Department.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)' }}>Strategy:</span>
                  <select
                    className="form-control"
                    style={{ width: 180, height: 32, padding: '4px 8px', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}
                    value={selectedFlow?.id || ''}
                    onChange={e => setSelectedFlow(flows.find(f => f.id === +e.target.value))}
                  >
                    {flows.map(f => <option key={f.id} value={f.id}>{f.name} {f.is_default ? '(Default)' : ''}</option>)}
                  </select>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setFlowModal(selectedFlow)} title="Edit strategy settings">⚙</button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setFlowModal({})} title="Create new strategy">+</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)' }}>Dept:</span>
                  <select
                    className="form-control"
                    style={{ width: 180, height: 32, padding: '4px 8px', fontSize: 13 }}
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                  >
                    <option value="All">Global (All Depts)</option>
                    {sbus.map(s => <option key={s.sbu_name} value={s.sbu_name}>{s.sbu_name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                title="Resets both flows to the recommended default configuration"
                onClick={async () => {
                  if (!confirm(`This will DELETE all existing workflow steps for "${selectedDept}" and reseed defaults. Continue?`)) return;
                  try {
                    await api.post('/superadmin/workflow-seed-defaults', { department: selectedDept });
                    toast.success(`Default flows seeded for ${selectedDept}`);
                    loadWorkflow();
                  } catch { toast.error('Seed failed'); }
                }}
              >
                🔄 Seed Defaults
              </button>
              <button
                className="btn btn-ghost btn-sm"
                title={`Toggle entire ${wfType} flow shown below`}
                onClick={() => {
                  const allSteps = sorted.filter(s => s.applies_to === wfType || s.applies_to === 'BOTH');
                  const hasActive = allSteps.some(s => s.is_active);
                  toggleFullFlow(!hasActive);
                }}
              >
                {sorted.filter(s => s.applies_to === wfType || s.applies_to === 'BOTH').some(s => s.is_active) ? '⏸ Pause Entire Flow' : '▶ Activate Entire Flow'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setModalStep({ applies_to: wfType, department: selectedDept })}
              >
                + Add {wfType} Step
              </button>
            </div>
          </div>

          {/* CAPEX / OPEX sub-tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
            {[
              { key: 'CAPEX', label: '🏗 CAPEX Flow', color: '#F59E0B', desc: 'Capital Expenditure' },
              { key: 'OPEX',  label: '🔧 OPEX Flow',  color: '#14B8A6', desc: 'Operational Expenditure' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setWfType(t.key)}
                style={{
                  padding: '10px 22px', fontSize: 13, fontWeight: 700,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: wfType === t.key ? `3px solid ${t.color}` : '3px solid transparent',
                  color: wfType === t.key ? t.color : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  marginBottom: -2,
                }}
              >
                {t.label}
                <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 6, opacity: 0.7 }}>{t.desc}</span>
              </button>
            ))}
          </div>

          {/* Active flow pipeline */}
          {(() => {
            const flowColor = wfType === 'CAPEX' ? '#F59E0B' : '#14B8A6';
            const flowSteps = sorted.filter(s =>
              s.is_active && (s.applies_to === wfType || s.applies_to === 'BOTH')
            ).sort((a, b) => a.step_order - b.step_order);
            return (
              <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: flowColor }}>
                    {wfType} Active Flow
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {flowSteps.length} step{flowSteps.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
                  {flowSteps.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                      No active steps — click "+ Add {wfType} Step" to build this flow.
                    </span>
                  ) : [
                    <div key="requester" style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ background: 'rgba(100,116,139,0.14)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
                        <span style={{ fontSize: 10, opacity: 0.7, marginRight: 5 }}>L0</span>Requester
                      </div>
                      <div style={{ padding: '0 5px', color: flowColor, fontSize: 14, fontWeight: 700 }}>→</div>
                    </div>,
                    ...flowSteps.map((s, i) => {
                      const c = STEP_COLORS[s.role_key] || { dot: 'var(--text-faint)' };
                      const amtLabel = Number(s.amount_min) > 0 ? ` >₹${(s.amount_min/1e5).toFixed(0)}L` : '';
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ background: `${c.dot}16`, border: `1px solid ${c.dot}44`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: c.dot, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 10, opacity: 0.7, marginRight: 5 }}>L{i + 1}</span>
                            {s.label}
                            {amtLabel && <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 4 }}>{amtLabel}</span>}
                          </div>
                          {i < flowSteps.length - 1 && (
                            <div style={{ padding: '0 5px', color: flowColor, fontSize: 14, fontWeight: 700 }}>→</div>
                          )}
                        </div>
                      );
                    }),
                  ]}
                </div>
              </div>
            );
          })()}

          {/* Step list for active wfType */}
          {(() => {
            const typeSteps = sorted.filter(s =>
              s.applies_to === wfType || s.applies_to === 'BOTH'
            );
            if (wLoading) return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="card" style={{ padding: '16px', display: 'flex', gap: '14px' }}>
                    <Skeleton className="skeleton-circle" style={{ width: 32, height: 32 }} />
                    <div style={{ flex: 1 }}>
                      <Skeleton className="skeleton-title" style={{ width: '30%', height: 16 }} />
                      <Skeleton className="skeleton-text" style={{ width: '60%', height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            );
            if (typeSteps.length === 0) return (
              <div className="empty-state">
                <div style={{ fontSize: 36, marginBottom: 12 }}>{wfType === 'CAPEX' ? '🏗' : '🔧'}</div>
                <h3>No {wfType} Steps Configured</h3>
                <p>Click "+ Add {wfType} Step" above or "Seed Defaults" to get started.</p>
              </div>
            );
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {typeSteps.map((step, idx) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={idx}
                    total={typeSteps.length}
                    onEdit={s => setModalStep(s)}
                    onDelete={deleteStep}
                    onToggle={toggleStep}
                    onMove={(s, dir) => moveStep(s, dir, typeSteps)}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ══ Users Tab ══ */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 17 }}>User Management</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="search-input" placeholder="Search users…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
              <button className="btn btn-ghost" onClick={() => { setUserForm({}); setUserModal('bulk'); }} style={{ gap: 6 }}>
                📄 Bulk Upload
              </button>
              <button className="btn btn-primary" onClick={() => openUserModal(null)}>+ New User</button>
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              {uLoading ? (
                <TableSkeleton rows={10} cols={8} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Username / Email</th>
                      <th>Full Name</th>
                      <th>Role</th>
                      <th>Emp No</th>
                      <th>SBU</th>
                      <th>Function</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <UserRow key={u.id} u={u} onEdit={openUserModal} onDeactivate={deactivateUser} />
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* User Modal */}
          {userModal && (
            <UserModal
              mode={userModal}
              form={userForm}
              setForm={setUserForm}
              onClose={() => setUserModal(null)}
              onSave={saveUser}
              onBulkUpload={bulkUploadUsers}
              sbus={sbus}
              flows={flows}
              dbRoles={dbRoles}
              functions={functions}
            />
          )}
        </div>
      )}

      {/* ══ RBAC Tab ══ */}
      {tab === 'rbac' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 17 }}>Roles & Access Control</h2>
            <button className="btn btn-primary" onClick={() => setRbacModal('add-role')}>+ New Role</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 20 }}>
            {/* Roles List */}
            <div className="card" style={{ padding: 0, height: '60vh', overflowY: 'auto' }}>
              {dbRoles.map(r => {
                const isSelected = activeRole?.id === r.id;
                return (
                  <div key={r.id} onClick={async () => {
                    setActiveRole(r);
                    const { data } = await api.get(`/superadmin/roles/${r.id}/permissions`);
                    if (data.success) setRolePerms(data.data);
                  }} style={{ 
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-2)',
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{r.name}</div>
                  </div>
                );
              })}
            </div>
            {/* Permissions Matrix */}
            <div className="card">
              {activeRole ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, margin: 0 }}>Permissions for {activeRole.display_name}</h3>
                    <button className="btn btn-primary btn-sm" onClick={async () => {
                      await api.post(`/superadmin/roles/${activeRole.id}/permissions`, { permission_ids: rolePerms });
                      toast.success('Permissions updated');
                      loadDbRoles();
                    }}>Save Changes</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {permissions.map(p => (
                      <label key={p.id} style={{ 
                        display: 'flex', alignItems: 'center', gap: 10, padding: 12, 
                        border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer',
                        background: rolePerms.includes(p.id) ? 'var(--info-bg)' : 'transparent'
                      }}>
                        <input type="checkbox" checked={rolePerms.includes(p.id)} onChange={e => {
                          setRolePerms(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id));
                        }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.display_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{p.description || p.name}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>Select a role from the left to manage access rights</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Budget Owners Tab ══ */}
      {tab === 'owners' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 17, marginBottom: 4 }}>Budget Owners</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Manage who holds budget ownership for CAPEX/OPEX approval.
                <span style={{ marginLeft: 10, color: 'var(--success-text)' }}>● {activeOwners} Active</span>
                {inactiveOwners > 0 && <span style={{ marginLeft: 8, color: 'var(--text-faint)' }}>● {inactiveOwners} Inactive</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="form-control"
                value={ownerFilter}
                onChange={e => setOwnerFilter(e.target.value)}
                style={{ width: 130, height: 38 }}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button className="btn btn-primary" onClick={() => openOwnerModal(null)}>+ Assign Owner</button>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              {oLoading ? (
                <TableSkeleton rows={10} cols={7} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Emp Code</th>
                      <th>Designation</th>
                      <th>SBU</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owners.map(o => (
                      <tr key={o.id} style={{ opacity: o.budget_owner === 'Inactive' ? 0.6 : 1 }}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{o.emp_name || '—'}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--mono)' }}>{o.emp_no}</div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.emp_no}</td>
                        <td style={{ fontSize: 12, color: 'var(--primary-l)', fontWeight: 600 }}>{o.head || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                           <span className="badge badge-muted">{o.sbu_id || 'All'}</span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-faint)' }}>{o.location || o.emp_sbu || '—'}</td>
                        <td><span className={`badge ${o.budget_owner === 'Active' ? 'badge-success' : 'badge-muted'}`}>{o.budget_owner}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openOwnerModal(o)}>Edit</button>
                            {o.status === 'Active' ? (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => deactivateOwner(o.id)}
                                style={{ color: 'var(--warning-text)' }}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => reactivateOwner(o.id)}
                                style={{ color: 'var(--success-text)' }}
                              >
                                Activate
                              </button>
                            )}
                            {confirmDeleteId === o.id ? (
                              <>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => hardDeleteOwner(o.id)}
                                  style={{ fontSize: 11 }}
                                >
                                  Sure? Delete
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setConfirmDeleteId(null)}
                                  style={{ fontSize: 11 }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setConfirmDeleteId(o.id)}
                                title="Permanently delete"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {owners.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-faint)' }}>
                        No budget owners found. Click "+ Assign Owner" to add one.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Budget Owner modal */}
          {ownerModal && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setOwnerModal(null)}>
              <div className="modal">
                <div className="modal-header">
                  <h3>{ownerModal === 'new' ? '+ Assign Budget Owner' : 'Edit Budget Owner'}</h3>
                  <button className="btn btn-ghost btn-icon" onClick={() => setOwnerModal(null)}>✕</button>
                </div>
                <div className="modal-body">
                  {/* Employee search */}
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label">Employee <span style={{ color: 'var(--coral)' }}>*</span></label>
                    <input
                      className="form-control"
                      placeholder="Search by name or employee code…"
                      value={empSearch}
                      onChange={e => {
                        setEmpSearch(e.target.value);
                        searchEmployees(e.target.value);
                        if (!e.target.value) setOwnerForm(f => ({ ...f, employee_code: '' }));
                      }}
                    />
                    {empResults.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', marginTop: 2,
                      }}>
                        {empResults.map(emp => (
                          <div
                            key={emp.emp_no}
                            style={{
                              padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                              borderBottom: '1px solid var(--border-2)',
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            onClick={() => {
                              setOwnerForm(f => ({
                                ...f,
                                employee_code: emp.emp_no,
                                designation: f.designation || emp.desg || '',
                              }));
                              setEmpSearch(`${emp.name} (${emp.emp_no})`);
                              setEmpResults([]);
                            }}
                          >
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                              {emp.emp_no} · {emp.desg} · {emp.sbu}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {ownerForm.employee_code && (
                      <div style={{ fontSize: 11, color: 'var(--primary-l)', marginTop: 4 }}>
                        ✓ Selected: <strong>{ownerForm.employee_code}</strong>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation / Role Title <span style={{ color: 'var(--coral)' }}>*</span></label>
                    <input
                      className="form-control"
                      value={ownerForm.designation || ''}
                      onChange={e => setOwnerForm(f => ({ ...f, designation: e.target.value }))}
                      placeholder="e.g. Head of Finance, GM Operations"
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>This label appears in approval notifications</div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">SBU Scope</label>
                      <select className="form-control" value={ownerForm.sbu_id || 'All'} onChange={e => setOwnerForm(f => ({ ...f, sbu_id: e.target.value }))}>
                        <option value="All">Global (All SBUs)</option>
                        {sbus.map(s => <option key={s.sbu_name} value={s.sbu_name}>{s.sbu_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Function Scope</label>
                      <select className="form-control" value={ownerForm.bfun_id || 'All'} onChange={e => setOwnerForm(f => ({ ...f, bfun_id: e.target.value }))}>
                        <option value="All">All Functions</option>
                        {broadFunctions.map(bf => <option key={bf.id} value={bf.id}>{bf.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {ownerModal === 'edit' && (
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={ownerForm.budget_owner || 'Active'}
                        onChange={e => setOwnerForm(f => ({ ...f, budget_owner: e.target.value }))}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setOwnerModal(null)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={saveOwner}
                    disabled={!ownerForm.employee_code || !ownerForm.designation}
                  >
                    {ownerModal === 'new' ? 'Assign Owner' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ══ Test Credentials Tab ══ */}
      {tab === 'creds' && (

        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 17, marginBottom: 6 }}>Test Credentials</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Use these accounts to test the complete CAPEX/OPEX approval flow. Run <code style={{ background: 'var(--glass-2)', padding: '2px 7px', borderRadius: 4, fontSize: 12 }}>node seed_test_users.js</code> in the backend folder to create/reset these users.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
            {[
              { role: 'Employee / Requester',      user: 'emp_kumar',         pass: 'Kumar@1234',       type: 'user',         desc: 'Raises CAPEX/OPEX requests', icon: '🧑', color: 'var(--blue-xl)' },
              { role: 'Supervisor (L1)',            user: 'supervisor_singh',  pass: 'Supervisor@1234',  type: 'supervisor',   desc: 'First-level approval', icon: '👨‍💼', color: 'var(--teal-l)' },
              { role: 'IT Admin / PS Review',      user: 'it_sharma',         pass: 'ItAdmin@1234',     type: 'it_admin',     desc: 'Optional IT asset review', icon: '💻', color: 'var(--purple-l)' },
              { role: 'Budget Owner (L2)',          user: 'budgetowner_Joshi', pass: 'Budget@1234',      type: 'budget_owner', desc: 'Validates budget availability', icon: '💰', color: 'var(--primary-l)' },
              { role: 'Accountant (L3)',            user: 'accountant_verma',  pass: 'Acct@1234',        type: 'accountant',   desc: 'Finance desk verification', icon: '🧮', color: 'var(--blue-xl)' },
              { role: 'CFO (L4)',                  user: 'cfo_gupta',         pass: 'CFO@12345',        type: 'cfo',          desc: 'Required for amounts > ₹5L', icon: '🏦', color: 'var(--primary-l)' },
              { role: 'CMD / MD (L5)',              user: 'cmd_mehta',         pass: 'CMD@12345',        type: 'cmd',          desc: 'Required for amounts > ₹25L', icon: '👔', color: 'var(--coral-l)' },
              { role: 'Finance / SAP (L6 – Final)',user: 'finance_rao',        pass: 'Finance@1234',     type: 'finance',      desc: 'Generates SAP asset number', icon: '✅', color: 'var(--green-l)' },
              { role: 'Admin',                     user: 'admin_gcars',        pass: 'Admin@1234',       type: 'admin',        desc: 'Reports & config access', icon: '⚙', color: 'var(--text-secondary)' },
              { role: 'Super Admin',               user: 'superadmin',         pass: 'SuperAdmin@2026',  type: 'superadmin',   desc: 'Full system access', icon: '🔍', color: 'var(--primary)' },
            ].map(c => (
              <div key={c.user} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '18px 20px',
                borderLeft: `3px solid ${c.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{c.role}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{c.desc}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '6px 10px', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-faint)', alignSelf: 'center' }}>Username</span>
                  <code style={{ background: 'var(--glass-2)', padding: '3px 8px', borderRadius: 5, color: c.color, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>{c.user}</code>
                  <span style={{ color: 'var(--text-faint)', alignSelf: 'center' }}>Password</span>
                  <code style={{ background: 'var(--glass-2)', padding: '3px 8px', borderRadius: 5, color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: 12 }}>{c.pass}</code>
                  <span style={{ color: 'var(--text-faint)', alignSelf: 'center' }}>Type</span>
                  <span className="badge badge-amber" style={{ width: 'fit-content', fontSize: 10 }}>{c.type}</span>
                </div>
              </div>
            ))}
          </div>


          <div className="alert alert-warn" style={{ marginTop: 20 }}>
            Run <code style={{ fontFamily: "var(--mono)", fontSize: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 6px" }}>node seed_test_users.js</code> from the <strong>backend/</strong> folder to seed test users.
          </div>
        </div>
      )}

      {/* ══ System Settings Tab ══ */}
      {tab === 'settings' && (
        <div className="page-content fade-in">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 17, marginBottom: 6 }}>System Settings</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Global toggles and settings for the GCARS platform.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Budget Overflow Tolerance (%)</div>
                <div style={{ fontSize: '24px', opacity: 0.2 }}>📉</div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '16px' }}>
                Percentage of budget allowed to be exceeded before strict blocking (Legacy parity: 10%).
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="number" 
                  className="form-control" 
                  value={settings.budget_overflow || ''} 
                  onChange={e => updateSetting('budget_overflow', e.target.value)}
                  placeholder="e.g. 10"
                />
                <div style={{ alignSelf: 'center', fontWeight: 600 }}>%</div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Urgency Warning Threshold (Days)</div>
                <div style={{ fontSize: '24px', opacity: 0.2 }}>⚡</div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '16px' }}>
                Number of days for the 'Urgent' badge to appear on pending requests.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="number" 
                  className="form-control" 
                  value={settings.urgent_day_count || ''} 
                  onChange={e => updateSetting('urgent_day_count', e.target.value)}
                  placeholder="e.g. 5"
                />
                <div style={{ alignSelf: 'center', fontWeight: 600 }}>Days</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
             {settingLoading ? (
               <Skeleton style={{ height: 40, width: '100%' }} />
             ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>IT Review Workflow Control</div>
                    <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>
                       Control for IT Leadership forwarding is active. This can be toggled by the IT Budget Owner.
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, padding: '6px 12px', background: 'var(--glass)', borderRadius: '20px' }}>
                     Managed by IT Admin
                  </div>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Workflow step modal */}
      {modalStep !== null && (
        <StepModal
          step={modalStep}
          sbus={sbus}
          onClose={() => setModalStep(null)}
          onSave={saveStep}
        />
      )}

      {/* Flow Management Modal */}
      {flowModal && (
        <FlowModal
          flow={flowModal}
          onClose={() => setFlowModal(null)}
          onSave={async (form) => {
            try {
              if (flowModal.id) {
                await api.put(`/superadmin/workflows/${flowModal.id}`, form);
                toast.success('Strategy updated');
              } else {
                await api.post('/superadmin/workflows', form);
                toast.success('Strategy created');
              }
              setFlowModal(null);
              loadFlows();
            } catch { toast.error('Failed to save strategy'); }
          }}
        />
      )}

      {/* RBAC Modals */}
      {rbacModal === 'add-role' && (
        <RoleModal onClose={() => setRbacModal(null)} onSuccess={() => { setRbacModal(null); loadDbRoles(); }} />
      )}
      {rbacModal === 'edit-role' && (
        <RoleModal role={activeRole} onClose={() => setRbacModal(null)} onSuccess={() => { setRbacModal(null); loadDbRoles(); }} />
      )}
    </div>
  );
}

// ─── RBAC Helpers ───
const RoleModal = ({ role, onClose, onSuccess }) => {
  const [data, setData] = useState(role || { name: '', display_name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role?.id) { await api.put(`/superadmin/roles/${role.id}`, data); toast.success('Role updated'); }
      else { await api.post('/superadmin/roles', data); toast.success('Role created'); }
      onSuccess();
    } catch { toast.error('Failed to save role'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
      <div className="modal-header"><h3>{role ? 'Edit Role' : 'Create New Role'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button></div>
      <form onSubmit={handleSubmit}><div className="modal-body">
        <div className="form-group"><label>Role Identifier</label><input className="form-control" value={data.name} onChange={e => setData({...data, name: e.target.value})} disabled={!!role} required /></div>
        <div className="form-group"><label>Display Name</label><input className="form-control" value={data.display_name} onChange={e => setData({...data, display_name: e.target.value})} required /></div>
        <div className="form-group"><label>Description</label><textarea className="form-control" value={data.description} onChange={e => setData({...data, description: e.target.value})} /></div>
      </div><div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>Save</button></div></form>
    </div></div>
  );
};

