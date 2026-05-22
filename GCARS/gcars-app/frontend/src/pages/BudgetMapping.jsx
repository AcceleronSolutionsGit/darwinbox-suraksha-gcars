import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../components/common/Skeleton';
import { 
  Zap, 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  X, 
  CheckCircle2, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

export default function BudgetMapping() {
  const [activeTab, setActiveTab] = useState('mappings'); // 'mappings' | 'assets'
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'asset'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [mappings, setMappings] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [owners, setOwners] = useState([]);
  const [broadFunctions, setBroadFunctions] = useState([]);
  const [assetGroups, setAssetGroups] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [editingRow, setEditingRow] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [page, setPage] = useState(1);
  const [assetPage, setAssetPage] = useState(1);
  const perPage = 25;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, at, ag, sb, ow, bf] = await Promise.all([
        api.get('/superadmin/workflow-matrix'),
        api.get('/superadmin/asset-types'),
        api.get('/superadmin/asset-groups'),
        api.get('/masters/sbu'),
        api.get('/superadmin/broad-function-heads'),
        api.get('/superadmin/broad-functions')
      ]);
      setMappings(m.data.data || []);
      setAssetTypes(at.data.data || []);
      setAssetGroups(ag.data.data || []);
      setSbus(sb.data.data || []);
      setOwners(ow.data.data || []);
      setBroadFunctions(bf.data.data || []);
    } catch { toast.error('Connection failed. Please check your network.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredMappings = useMemo(() => {
    let list = [...mappings];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => 
        (m.asset_type_name || '').toLowerCase().includes(q) ||
        (m.owner_name || '').toLowerCase().includes(q) ||
        (m.emp_name || '').toLowerCase().includes(q) ||
        (m.sbu || '').toLowerCase().includes(q)
      );
    }
    if (filterGroup !== 'All') {
      list = list.filter(m => String(m.asset_group) === filterGroup);
    }
    return list;
  }, [mappings, search, filterGroup]);

  const filteredAssetTypesWithRules = useMemo(() => {
    const matchedTypes = Array.from(new Set(filteredMappings.map(m => m.asset_type_name || 'Uncategorized')));
    return matchedTypes.sort();
  }, [filteredMappings]);

  const totalPages = Math.ceil(filteredAssetTypesWithRules.length / perPage);

  const paginatedAssetTypes = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAssetTypesWithRules.slice(start, start + perPage);
  }, [filteredAssetTypesWithRules, page]);

  const groupedMappings = useMemo(() => {
    return paginatedAssetTypes.reduce((acc, typeName) => {
      acc[typeName] = filteredMappings.filter(m => (m.asset_type_name || 'Uncategorized') === typeName);
      return acc;
    }, {});
  }, [paginatedAssetTypes, filteredMappings]);

  const paginatedAssets = useMemo(() => {
    const start = (assetPage - 1) * perPage;
    const list = [...assetTypes].filter(at => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (at.name || '').toLowerCase().includes(q) || (at.group_name || '').toLowerCase().includes(q);
    });
    return list.slice(start, start + perPage);
  }, [assetTypes, search, assetPage]);

  const totalAssetPages = Math.ceil([...assetTypes].filter(at => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (at.name || '').toLowerCase().includes(q) || (at.group_name || '').toLowerCase().includes(q);
  }).length / perPage);

  const updateOwner = async (rule, newOwnerId) => {
    try {
      const payload = {
        id: rule.id,
        asset_group: rule.asset_group,
        asset_type: rule.asset_type,
        sbu: rule.sbu ? rule.sbu.split(',').map(s => s.trim()) : ['All'],
        b_fun: rule.b_fun ? rule.b_fun.split(',').map(f => f.trim()) : ['All'],
        owner_id: Number(newOwnerId)
      };
      await api.post('/superadmin/workflow-matrix', payload);
      toast.success('Owner updated');
      setEditingRow(null);
      loadData();
    } catch { toast.error('Update failed'); }
  };

  const deleteMapping = async (id) => {
    if (!window.confirm('Are you sure you want to remove this mapping rule? This will affect new requests.')) return;
    try {
      await api.delete(`/superadmin/workflow-matrix/${id}`);
      toast.success('Rule removed');
      loadData();
    } catch { toast.error('Action failed'); }
  };

  const saveAsset = async () => {
    if (!form.name || !form.group_id) return toast.error('Details required');
    setSaving(true);
    try {
      if (form.id) await api.put(`/superadmin/asset-types/${form.id}`, form);
      else await api.post('/superadmin/asset-types', form);
      toast.success('Asset master updated');
      setModal(null);
      loadData();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-content fade-in" style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="kicker">System Configuration</div>
          <h1 className="page-title">Budget Mapping Console</h1>
          <p className="page-subtitle">Manage approval routing for Capital and Operational Expenses</p>
        </div>
        <div className="page-actions">
           {activeTab === 'mappings' ? (
              <Link to="/budget-mapping/new" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> New Mapping Rule
              </Link>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => { setForm({ status: 'Active' }); setModal('asset'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> Register New Asset
              </button>
            )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <button className={`tab-btn ${activeTab === 'mappings' ? 'active' : ''}`} onClick={() => setActiveTab('mappings')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} /> Approval Rules
        </button>
        <button className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} /> Assets Master
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ maxWidth: '400px' }}>
          <input 
            type="text" 
            className="search-input" 
            placeholder={activeTab === 'mappings' ? "Search Asset, Owner or SBU..." : "Search Asset Name..."}
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); setAssetPage(1); }} 
          />
        </div>
        <select 
           className="form-control" 
           style={{ width: '200px' }}
           value={filterGroup} 
           onChange={e => { setFilterGroup(e.target.value); setPage(1); }}
        >
          <option value="All">All Categories</option>
          {assetGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div className="badge badge-muted">
           {activeTab === 'mappings' ? `${filteredMappings.length} rules active` : `${assetTypes.length} assets registered`}
        </div>
      </div>

      {loading ? <TableSkeleton rows={10} cols={5} /> : (
        <div className="mapping-content">
          {activeTab === 'mappings' ? (
            <div className="grouped-mapping-list">
              {Object.keys(groupedMappings).length === 0 ? (
                <div className="card" style={{ padding: '80px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', display: 'flex', justifyContent: 'center', opacity: 0.2 }}>
                    <Info size={64} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>No Mapping Rules Found</h3>
                  <p style={{ marginBottom: '20px' }}>Start by creating a new rule to define the approval workflow.</p>
                  <Link to="/budget-mapping/new" className="btn btn-primary">Create Your First Rule</Link>
                </div>
              ) : Object.entries(groupedMappings).map(([assetName, rules]) => (
                <div key={assetName} className="card" style={{ padding: 0, marginBottom: '24px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{assetName}</h3>
                      <span className="badge badge-muted" style={{ fontSize: '10px' }}>{rules.length} {rules.length === 1 ? 'Rule' : 'Rules'}</span>
                    </div>
                    <span className="badge badge-teal" style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 800 }}>{rules[0].asset_group_name}</span>
                  </div>
                  
                  <div className="table-wrap horizontal-scroll">
                    <table className="table-premium">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>Applicable Scope (SBU & Functions)</th>
                          <th style={{ width: '35%' }}>Assigned Budget Owner</th>
                          <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                          <th style={{ width: '10%', textAlign: 'right' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map(rule => (
                          <tr key={rule.id}>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                                {rule.sbu?.split(',').map((s, i) => <span key={i} className="badge badge-info" style={{ borderRadius: '4px', fontSize: '10px' }}>{s}</span>)}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {(rule.b_fun_names || rule.b_fun || 'All').split(',').map((f, i) => <span key={i} className="badge badge-purple" style={{ borderRadius: '4px', fontSize: '10px' }}>{f}</span>)}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
                                  {rule.owner_name?.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  {editingRow === rule.id ? (
                                    <select 
                                      className="form-control"
                                      style={{ height: '36px', padding: '0 8px', fontSize: '13px' }}
                                      autoFocus
                                      value={rule.owner_id || ''}
                                      onChange={(e) => updateOwner(rule, e.target.value)}
                                      onBlur={() => setEditingRow(null)}
                                    >
                                      {owners.map(o => (
                                        <option key={o.id} value={o.id}>{o.head} ({o.emp_name})</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{rule.owner_name}</div>
                                  )}
                                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>{rule.emp_name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${rule.status === 'Active' ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                                {rule.status || 'Active'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                {editingRow === rule.id ? (
                                  <button className="btn btn-ghost btn-icon" onClick={() => setEditingRow(null)}><X size={14} /></button>
                                ) : (
                                  <>
                                    <button className="btn btn-ghost btn-icon" onClick={() => setEditingRow(rule.id)} title="Quick Edit Owner"><Zap size={14} /></button>
                                    <Link to={`/budget-mapping/edit/${rule.id}`} className="btn btn-ghost btn-icon" title="Full Edit"><Edit size={14} /></Link>
                                  </>
                                )}
                                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--coral)' }} onClick={() => deleteMapping(rule.id)} title="Delete"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <div className="pagination-info">Showing page {page} of {totalPages} ({filteredAssetTypesWithRules.length} group types)</div>
                  <div className="pagination-btns">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="page-btn"><ChevronLeft size={16} /></button>
                    {[...Array(totalPages)].map((_, i) => (
                       <button key={i} className={`page-btn ${page === i+1 ? 'active' : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                    ))}
                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="page-btn"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Asset Type Name</th>
                      <th>Category Group</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ width: '120px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.map(at => (
                      <tr key={at.id}>
                        <td style={{ fontWeight: 700 }}>{at.name}</td>
                        <td><span className="badge badge-muted">{at.group_name}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${at.status === 'Active' ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                            {at.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setForm(at); setModal('asset'); }}>Edit Info</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Asset Pagination */}
              {totalAssetPages > 1 && (
                <div className="pagination" style={{ padding: '16px' }}>
                  <div className="pagination-info">Page {assetPage} of {totalAssetPages}</div>
                  <div className="pagination-btns">
                    <button disabled={assetPage === 1} onClick={() => setAssetPage(assetPage - 1)} className="page-btn"><ChevronLeft size={16} /></button>
                    <button disabled={assetPage === totalAssetPages} onClick={() => setAssetPage(assetPage + 1)} className="page-btn"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {modal === 'asset' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal fade-in-up" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{form.id ? 'Modify Asset Type' : 'Register Asset Type'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input className="form-control" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter unique asset name..." />
              </div>
              <div className="form-group">
                <label className="form-label">Category Group</label>
                <select className="form-control" value={form.group_id || ''} onChange={e => setForm({ ...form, group_id: +e.target.value })}>
                  <option value="">Choose Asset Group...</option>
                  {assetGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Retired / Internal</option>
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ background: 'var(--bg-2)' }}>
               <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Discard</button>
               <button type="button" className="btn btn-primary" onClick={saveAsset} disabled={saving}>
                 {saving ? 'Processing...' : 'Save Asset Master'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
