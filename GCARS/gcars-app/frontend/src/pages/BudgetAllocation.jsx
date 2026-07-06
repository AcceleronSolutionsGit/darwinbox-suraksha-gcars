import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/common/Skeleton';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { 
  Wallet, 
  Building2, 
  Activity, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  IndianRupee, 
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function BudgetAllocation() {
  const { isBudgetOwner } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', data: {} }
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Reset page and debounce search
  useEffect(() => { setPage(1); }, [yearFilter, searchTerm, groupFilter, typeFilter]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);
  
  // IT Review Setting (Budget Owner Control)
  const [sysSettings, setSysSettings] = useState({});
  const [settingLoading, setSettingLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!isBudgetOwner()) return;
    setSettingLoading(true);
    try {
      const { data } = await api.get('/superadmin/settings');
      if (data.success) setSysSettings(data.settings);
    } catch { } finally { setSettingLoading(false); }
  }, [isBudgetOwner]);

  const saveSetting = async (key, val) => {
    try {
      const { data } = await api.post('/superadmin/settings', { key, value: val });
      if (data.success) {
        setSysSettings(s => ({ ...s, [key]: val }));
        toast.success(`IT Review ${val ? 'Enabled' : 'Disabled'}`);
      }
    } catch { toast.error('Failed to update setting'); }
  };

  // Master Data
  const [entities, setEntities] = useState([]);
  const [assetGroups, setAssetGroups] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [budgetTypes, setBudgetTypes] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    budget_entity: '',
    sbu_id: '',
    bfun_id: '',
    loc_id: '',
    asset_group: '',
    asset_type: '',
    budget_type: '',
    budgeted_amount: '',
    description: '',
    year: new Date().getFullYear(),
    status: 'Active'
  });

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ 
        year: yearFilter, 
        page, 
        limit, 
        search: debouncedSearch.trim(),
        asset_group: groupFilter,
        budget_type: typeFilter
      }).toString();
      const { data } = await api.get(`/superadmin/allocations?${p}`);
      if (data.success) {
        setAllocations(data.data);
        setTotal(data.total || 0);
      }
    } catch { 
      toast.error('Failed to sync allocations'); 
    } finally { 
      setLoading(false); 
    }
  }, [yearFilter, page, debouncedSearch, groupFilter, typeFilter]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [entRes, groupRes, btRes, atRes, sbuRes, funRes, locRes] = await Promise.all([
          api.get('/superadmin/budget-entities'),
          api.get('/masters/asset-groups'),
          api.get('/masters/budget-types'),
          api.get('/masters/asset-types'),
          api.get('/masters/sbu'),
          api.get('/masters/broad-functions'),
          api.get('/masters/locations')
        ]);

        if (entRes.data.success) setEntities(entRes.data.data);
        if (groupRes.data.success) setAssetGroups(groupRes.data.data || []);
        if (btRes.data.data) setBudgetTypes(btRes.data.data);
        if (atRes.data.data) setAssetTypes(atRes.data.data);
        if (sbuRes.data.success) setSbus(sbuRes.data.data);
        if (funRes.data.success) setFunctions(funRes.data.data);
        if (locRes.data.success) setLocations(locRes.data.data);
      } catch { 
        toast.error('Master data failed to load'); 
      }
    };
    loadMasters();
    fetchAllocations();
    loadSettings();
  }, [fetchAllocations, loadSettings]);

  // We now use allocations directly from state (filtered by backend)
  const stats = useMemo(() => {
    const total = allocations.reduce((s, a) => s + Number(a.budgeted_amount || 0), 0);
    const consumed = allocations.reduce((s, a) => s + Number(a.budget_amount_consumed || 0), 0);
    const committed = allocations.reduce((s, a) => s + Number(a.committed_amount || 0), 0);
    const remaining = total - consumed - committed;
    const utilization = total > 0 ? ((consumed + committed) / total) * 100 : 0;
    return { total, consumed, committed, remaining, utilization };
  }, [allocations]);

  const openModal = (mode, data = null) => {
    if (mode === 'edit') {
      setForm({ ...data });
    } else {
      setForm({
        budget_entity: '',
        sbu_id: '',
        bfun_id: '',
        loc_id: '',
        asset_group: '',
        asset_type: '',
        budget_type: '',
        budgeted_amount: '',
        description: '',
        year: yearFilter,
        status: 'Active'
      });
    }
    setModal({ mode, id: data?.id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.asset_type) payload.asset_type = null;

      if (modal.mode === 'add') {
        await api.post('/superadmin/allocations', payload);
        toast.success('Budget allocated successfully');
      } else {
        await api.put(`/superadmin/allocations/${modal.id}`, payload);
        toast.success('Allocation updated');
      }
      setModal(null);
      fetchAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Mark this allocation as deleted?')) return;
    try {
      await api.delete(`/superadmin/allocations/${id}`);
      toast.success('Deleted');
      fetchAllocations();
    } catch { toast.error('Delete failed'); }
  };

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1, current + 2];
  }, []);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="kicker">Financial Planning & Control</div>
          <h1 className="page-title">Budget Allocation</h1>
          <p className="page-subtitle">
             CFO Dashboard for distributing annual capital across departments and asset categories
          </p>
        </div>
        <div className="page-actions">
           <button className="btn btn-primary btn-lg" onClick={() => openModal('add')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> New Allocation
           </button>
        </div>
      </div>

      {/* IT Review Toggle — Exclusive for Budget Owners */}
      {isBudgetOwner() && (
        <div className="card" style={{ marginBottom: '24px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--glass)', border: '1px solid var(--primary-l)', boxShadow: 'var(--shadow-glow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>IT Review Workflow Control</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                When enabled, IT asset requests will be routed to IT Leadership for technical validation before final approval.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {settingLoading ? (
               <div style={{ width: '40px', height: '20px', background: 'var(--bg-3)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
            ) : (
              <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: sysSettings.it_review_enabled ? 'var(--primary)' : 'var(--text-faint)' }}>
                  {sysSettings.it_review_enabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <div 
                  style={{ width: '44px', height: '22px', background: sysSettings.it_review_enabled ? 'var(--primary)' : 'var(--bg-3)', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                  onClick={() => saveSetting('it_review_enabled', !sysSettings.it_review_enabled)}
                >
                  <div style={{ 
                    position: 'absolute', width: '16px', height: '16px', background: 'white', borderRadius: '50%', top: '3px', 
                    left: sysSettings.it_review_enabled ? '25px' : '3px', transition: '0.3s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Wallet size={22} /></div>
          <div className="stat-value">₹{stats.total.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Allocated ({yearFilter})</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><Activity size={22} /></div>
          <div className="stat-value">₹{stats.consumed.toLocaleString('en-IN')}</div>
          <div className="stat-label">Currently Consumed</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--glass)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="stat-icon" style={{ background: 'var(--bg-3)', color: 'var(--text-secondary)' }}><Activity size={22} /></div>
          <div className="stat-value" style={{ color: 'var(--text-secondary)' }}>₹{stats.committed.toLocaleString('en-IN')}</div>
          <div className="stat-label">Pending / Committed</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon teal"><ShieldCheck size={22} /></div>
          <div className="stat-value">₹{stats.remaining.toLocaleString('en-IN')}</div>
          <div className="stat-label">Remaining Reserves</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><BarChart3 size={22} /></div>
          <div className="stat-value">{stats.utilization.toFixed(1)}%</div>
          <div className="stat-label">Budget Utilization</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fiscal Year</div>
          <select 
            style={{ width: '120px', fontWeight: 600 }} 
            className="form-control"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
          <select 
            style={{ width: '130px', fontWeight: 600 }} 
            className="form-control"
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="1">IT</option>
            <option value="2">Non IT</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</div>
          <select 
            style={{ width: '130px', fontWeight: 600 }} 
            className="form-control"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {budgetTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.budget_type}</option>)}
          </select>
        </div>

        <div className="search-wrap" style={{ maxWidth: '200px' }}>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search entity, asset or remark..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ flex: 1 }} />
        
        <button className="btn btn-ghost btn-sm" onClick={() => { setSearchTerm(''); setGroupFilter(''); setTypeFilter(''); setPage(1); }}>
          Reset
        </button>

        <div className="badge badge-muted">
           {total} Total Records
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap horizontal-scroll">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Budget Entity</th>
                  <th>Asset Scope</th>
                  <th>Budget Type</th>
                  <th style={{ textAlign: 'right' }}>Allocated</th>
                  <th style={{ textAlign: 'right' }}>Committed</th>
                  <th style={{ textAlign: 'right' }}>Consumed</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ width: '100px' }}></th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>{a.entity_name || 'Global'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>ID: ALLOC-{a.id.toString().padStart(4, '0')}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{a.asset_group_name || 'All Groups'}</div>
                      {a.asset_type_name && (
                        <div style={{ fontSize: '11px', color: 'var(--primary-l)', marginTop: '1px' }}>↳ {a.asset_type_name}</div>
                      )}
                    </td>
                    <td>
                        <span className={`badge ${a.budget_type_name === 'CAPEX' ? 'badge-amber' : 'badge-teal'}`}>
                          {a.budget_type_name}
                        </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>
                      ₹{Number(a.budgeted_amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '12px', fontWeight: 600, color: Number(a.committed_amount) > 0 ? 'var(--text-secondary)' : 'var(--text-faint)' }}>
                         ₹{Number(a.committed_amount || 0).toLocaleString('en-IN')}
                       </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '12px', fontWeight: 600, color: Number(a.budget_amount_consumed) > Number(a.budgeted_amount) ? 'var(--coral)' : 'inherit' }}>
                         ₹{Number(a.budget_amount_consumed).toLocaleString('en-IN')}
                       </div>
                       <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px' }}>
                         {(((Number(a.budget_amount_consumed) + Number(a.committed_amount || 0)) / a.budgeted_amount) * 100).toFixed(1)}% utilized
                       </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${a.status === 'Active' ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => openModal('edit', a)} title="Edit"><Edit size={14} /></button>
                        <button className="btn btn-ghost btn-icon" style={{ color: 'var(--coral)' }} onClick={() => handleDelete(a.id)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '80px', color: 'var(--text-faint)' }}>
                       <div style={{ fontSize: '40px', marginBottom: '16px', display: 'flex', justifyContent: 'center', opacity: 0.2 }}>
                         <Search size={48} />
                       </div>
                       <div style={{ fontSize: '15px', fontWeight: 600 }}>No allocations found</div>
                       <div style={{ fontSize: '13px' }}>Try adjusting your filters or year choice</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
            Showing {((page-1)*limit)+1} to {Math.min(page*limit, total)} of {total}
          </span>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={16} /></button>
            {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal fade-in-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{modal.mode === 'add' ? 'New Budget Allocation' : 'Modify Allocation'}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>Fiscal Year: {yearFilter}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {modal.mode === 'add' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">SBU</label>
                      <SearchableSelect 
                         value={form.sbu_id}
                         onChange={val => setForm({...form, sbu_id: val})}
                         required
                         placeholder="Select SBU..."
                         options={sbus.map(s => ({ value: s.id, label: s.sbu_name }))}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Broad Function</label>
                        <SearchableSelect 
                           value={form.bfun_id}
                           onChange={val => setForm({...form, bfun_id: val})}
                           required
                           placeholder="Select Function..."
                           options={functions.map(f => ({ value: f.id, label: f.b_func }))}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Location</label>
                        <SearchableSelect 
                           value={form.loc_id}
                           onChange={val => setForm({...form, loc_id: val})}
                           required
                           placeholder="Select Location..."
                           options={locations.map(l => ({ value: l.id, label: l.location }))}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Budget Entity</label>
                    <input className="form-control" value={form.entity_name} disabled />
                  </div>
                )}

                <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Asset Group</label>
                      <select 
                          className="form-control"
                          value={form.asset_group}
                          onChange={e => setForm({...form, asset_group: e.target.value, asset_type: ''})}
                          disabled={modal.mode === 'edit'}
                          required
                      >
                          <option value="">Select Group...</option>
                          {assetGroups.map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Budget Type</label>
                      <select 
                          className="form-control"
                          value={form.budget_type}
                          onChange={e => setForm({...form, budget_type: e.target.value})}
                          disabled={modal.mode === 'edit'}
                          required
                      >
                          <option value="">Select Type...</option>
                          {budgetTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.budget_type}</option>)}
                      </select>
                    </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Specific Asset Type <small>(Optional)</small></label>
                  <select 
                     className="form-control"
                     value={form.asset_type}
                     onChange={e => setForm({...form, asset_type: e.target.value})}
                     disabled={modal.mode === 'edit'}
                  >
                    <option value="">All Types (Broad Allocation)</option>
                    {assetTypes.filter(t => !form.asset_group || String(t.asset_group) === String(form.asset_group)).map(at => <option key={at.id} value={at.id}>{at.asset_name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ padding: '16px', background: 'var(--bg-2)', borderRadius: '12px' }}>
                  <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 700 }}>Allocation Amount (₹)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    style={{ fontSize: '22px', fontWeight: 800, height: '56px', background: 'var(--bg-card)', border: '2px solid var(--border)' }}
                    placeholder="0.00"
                    value={form.budgeted_amount}
                    onChange={e => setForm({...form, budgeted_amount: e.target.value})}
                    required
                    min="0"
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '8px' }}>
                    This amount will be reserved for this entity and category.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Remarks</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Provide context for this allocation..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>

                {modal.mode === 'edit' && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ background: 'var(--bg-hover)', borderTopColor: 'var(--border)' }}>
                <button type="button" className="btn btn-ghost" style={{ padding: '0 20px' }} onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0 28px', height: '44px' }}>
                  {modal.mode === 'add' ? 'Confirm Allocation' : 'Update Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

