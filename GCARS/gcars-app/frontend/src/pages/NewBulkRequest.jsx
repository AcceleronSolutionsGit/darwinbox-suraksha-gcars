import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  Target, 
  IndianRupee, 
  Calendar, 
  Package, 
  Store, 
  Paperclip, 
  FileText, 
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Boxes
} from 'lucide-react';

const EMPTY_ITEM = { asset_group: '', asset_type: '', asset_name: '', asset_description: '', asset_quantity: 1, amount_ext_gst: '', manufacturer: '', procurement: 'new' };

export default function NewBulkRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assetGroups, setAssetGroups] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [budgetTypes, setBudgetTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [multiAsset, setMultiAsset] = useState(false);

  // Real-time budget status
  const [budgetStatus, setBudgetStatus] = useState({ checked: false, isOver: false, available: 0, message: '' });
  const [attachments, setAttachments] = useState([]);

  const [form, setForm] = useState({
    request_type: 'BULK',
    sbu: '',
    location: '',
    asset_group: '',
    asset_type: '',
    budget_allocation_id: '',
    expected_date: '',
    procurement: 'new',
    asset_name: '',
    asset_description: '',
    asset_justification: '',
    asset_quantity: 1,
    amount_ext_gst: '',
    budget_type: '',
    costcentre: '',
    vender_name1: '', sap_vender_code1: '', // Proposed
    vender_name2: '', sap_vender_code2: '', // Alt 1
    vender_name3: '', sap_vender_code3: '', // Alt 2
    vender_name4: '', sap_vender_code4: '', // Alt 3
    manufacturer: '',
  });

  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [agRes, btRes, sbuRes, locRes] = await Promise.all([
          api.get('/masters/asset-groups'),
          api.get('/masters/budget-types'),
          api.get('/masters/sbu'),
          api.get('/masters/locations'),
        ]);
        setAssetGroups(agRes.data.data || []);
        const bts = btRes.data.data || [];
        setBudgetTypes(bts);
        setSbus(sbuRes.data.data || []);
        setLocations(locRes.data.data || []);

        // Find and set BULK budget category as default
        const bulkBt = bts.find(b => b.budget_type === 'BULK');
        if (bulkBt) setForm(f => ({ ...f, budget_type: bulkBt.id }));
      } catch { toast.error('Failed to load master data'); }
    };
    loadMasters();
    if (user?.emp_no) {
      api.get(`/masters/employees/${user.emp_no}`).then(res => {
        if (res.data.success) {
          setForm(f => ({ ...f, costcentre: res.data.data.costcentre || '' }));
        }
      }).catch(() => { });
    }
  }, [user]);

  // Handle Asset Group change - Reset Asset Type when Group changes
  const handleAssetGroupChange = (e) => {
    const groupId = e.target.value;
    setForm(f => ({ ...f, asset_group: groupId, asset_type: '' }));
  };

  useEffect(() => {
    // Load all asset types once or filter by group if selected
    api.get('/masters/asset-types').then(res => {
      setAssetTypes(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (form.budget_type) {
      const qs = new URLSearchParams({
        year: new Date().getFullYear(),
        budget_type: form.budget_type,
      });
      if (form.sbu) qs.append('target_sbu', form.sbu);
      if (form.location) qs.append('target_location', form.location);

      api.get(`/masters/allocations?${qs.toString()}`).then(res => {
        const list = res.data.data || [];
        setAllocations(list);
        // Automatically allocate based on selected SBU, Function, and Location
        if (list.length > 0) {
          setForm(f => ({ ...f, budget_allocation_id: list[0].id }));
        } else {
          setForm(f => ({ ...f, budget_allocation_id: '' }));
        }
      });
    }
  }, [form.budget_type, form.sbu, form.location]);

  // Real-time Budget Check
  const checkBudget = useCallback(async () => {
    const amount = multiAsset ? items.reduce((sum, i) => sum + Number(i.amount_ext_gst || 0), 0) : form.amount_ext_gst;
    if (!form.budget_allocation_id || !amount) {
      setBudgetStatus({ checked: false, isOver: false, available: 0, message: '' });
      return;
    }

    try {
      const { data } = await api.get(`/masters/check-budget?allocation_id=${form.budget_allocation_id}&amount=${amount}`);
      if (data.success) {
        setBudgetStatus({ checked: true, isOver: data.isOver, available: data.available, message: data.message });
      }
    } catch {
      setBudgetStatus({ checked: false, isOver: false, available: 0, message: '' });
    }
  }, [form.budget_allocation_id, form.amount_ext_gst, items, multiAsset]);

  useEffect(() => {
    const timer = setTimeout(checkBudget, 600);
    return () => clearTimeout(timer);
  }, [checkBudget]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (budgetStatus.isOver) {
      if (!window.confirm("The amount exceeds the available budget. This will mark the request as 'Non-Budgeted'. Proceed?")) return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });

      if (multiAsset) {
        formData.append('items', JSON.stringify(items));
      }

      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const { data } = await api.post('/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success(`Request ${data.capex_no} created successfully!`);
        navigate('/requests');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally { setLoading(false); }
  };

  const fmt = (n) => Number(n).toLocaleString('en-IN');

  return (
    <div className="page-content fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '12px' }}>← Back</button>
          <div className="kicker">Generate Bulk Request</div>
          <h1 className="page-title">Generate Bulk Request</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Request Details</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-2)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-2)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>Multi-Asset Request</span>
              <input type="checkbox" checked={multiAsset} onChange={e => setMultiAsset(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            <div className="form-group">
              <label className="form-label">Target SBU<span style={{color:'var(--coral)'}}>*</span></label>
              <select className="form-control" value={form.sbu} onChange={set('sbu')} required>
                <option value="">--- Select SBU ---</option>
                {sbus.map(s => <option key={s.id} value={s.sbu_name}>{s.sbu_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Location<span style={{color:'var(--coral)'}}>*</span></label>
              <select className="form-control" value={form.location} onChange={set('location')} required>
                <option value="">--- Select Location ---</option>
                {locations.map(l => <option key={l.id} value={l.location}>{l.location}</option>)}
              </select>
            </div>
            
            {/* Row 1 */}
            <div className="form-group">
              <label className="form-label">Required By Date<span style={{color:'var(--coral)'}}>*</span></label>
              <input className="form-control" type="date" value={form.expected_date} onChange={set('expected_date')} required />
            </div>

            {!multiAsset ? (
              <div className="form-group">
                <label className="form-label">Asset Group<span style={{color:'var(--coral)'}}>*</span></label>
                <select className="form-control" value={form.asset_group} onChange={handleAssetGroupChange} required>
                  <option value="">--- Select Asset Group ---</option>
                  {assetGroups.map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Budget Type<span style={{color:'var(--coral)'}}>*</span></label>
                <select className="form-control" value={form.budget_type} onChange={set('budget_type')} required>
                  <option value="">--- Select Request Type ---</option>
                  {budgetTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.budget_type}</option>)}
                </select>
              </div>
            )}

            {/* Row 2 */}
            {!multiAsset && (
              <>
                <div className="form-group">
                  <label className="form-label">Asset Type<span style={{color:'var(--coral)'}}>*</span></label>
                  <select className="form-control" value={form.asset_type} onChange={set('asset_type')} required disabled={!form.asset_group}>
                    <option value="">--- Select Asset Type ---</option>
                    {assetTypes.filter(t => String(t.asset_group) === String(form.asset_group)).map(at => <option key={at.id} value={at.id}>{at.asset_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Type<span style={{color:'var(--coral)'}}>*</span></label>
                  <select className="form-control" value={form.budget_type} onChange={set('budget_type')} required>
                    <option value="">--- Select Request Type ---</option>
                    {budgetTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.budget_type}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Allocation - automatically done, only show warning if missing */}
            {form.budget_type && allocations.length === 0 && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '12px', color: 'var(--coral)', marginTop: '8px', fontWeight: 600 }}>
                  ⚠ No budget allocations found for the selected department/category.
                </div>
              </div>
            )}

            {/* Row 3 - Single Asset specifics */}
            {!multiAsset && (
              <>
                <div className="form-group">
                  <label className="form-label">Manufacturer<span style={{color:'var(--coral)'}}>*</span></label>
                  <input className="form-control" value={form.manufacturer} onChange={set('manufacturer')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Name<span style={{color:'var(--coral)'}}>*</span></label>
                  <input className="form-control" value={form.asset_name} onChange={set('asset_name')} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description/Specification<span style={{color:'var(--coral)'}}>*</span></label>
                  <textarea className="form-control" style={{ minHeight: '80px' }} value={form.asset_description} onChange={set('asset_description')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Justification<span style={{color:'var(--coral)'}}>*</span></label>
                  <textarea className="form-control" style={{ minHeight: '80px' }} value={form.asset_justification} onChange={set('asset_justification')} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity<span style={{color:'var(--coral)'}}>*</span></label>
                  <input className="form-control" type="number" min={1} value={form.asset_quantity} onChange={set('asset_quantity')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Cost of Procurement<span style={{color:'var(--coral)'}}>*</span></label>
                  <input className="form-control" type="number" step="0.01" value={form.amount_ext_gst} onChange={set('amount_ext_gst')} required />
                </div>
              </>
            )}

            {/* Justification when Multi-Asset */}
            {multiAsset && (
              <div className="form-group">
                <label className="form-label">Justification<span style={{color:'var(--coral)'}}>*</span></label>
                <textarea className="form-control" style={{ minHeight: '42px' }} value={form.asset_justification} onChange={set('asset_justification')} required />
              </div>
            )}
          </div>

          {/* Budget Checker inline alert */}
          {budgetStatus.checked && (
            <div style={{
              marginTop: '16px', padding: '12px 16px', borderRadius: '8px',
              border: `1px solid ${budgetStatus.isOver ? 'var(--danger-border)' : 'var(--success-border)'}`,
              background: budgetStatus.isOver ? 'var(--danger-bg)' : 'var(--success-bg)',
            }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: budgetStatus.isOver ? 'var(--danger-text)' : 'var(--success-text)' }}>
                {budgetStatus.isOver ? '⚠ ' : '✓ '}{budgetStatus.message} (Available: ₹{fmt(budgetStatus.available)})
              </div>
            </div>
          )}

          {/* Multi-Asset Details Section */}
          {multiAsset && (
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Asset Items</h3>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setItems(it => [...it, { ...EMPTY_ITEM }])}>
                  <Plus size={16} /> Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ padding: '24px', background: 'var(--bg-2)', borderRadius: '12px', border: '1px solid var(--border-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Item {idx + 1}</span>
                      {items.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--coral)' }} onClick={() => setItems(it => it.filter((_, j) => j !== idx))}>
                          <Trash2 size={14} style={{ marginRight: '6px' }} /> Remove
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Asset Group<span style={{color:'var(--coral)'}}>*</span></label>
                        <select className="form-control" value={item.asset_group || ''} onChange={e => setItems(it => it.map((x, j) => j === idx ? { ...x, asset_group: e.target.value, asset_type: '' } : x))} required>
                          <option value="">--- Select Asset Group ---</option>
                          {assetGroups.map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Asset Type<span style={{color:'var(--coral)'}}>*</span></label>
                        <select className="form-control" value={item.asset_type} onChange={e => setItems(it => it.map((x, j) => j === idx ? { ...x, asset_type: e.target.value } : x))} required disabled={!item.asset_group}>
                          <option value="">--- Select Asset Type ---</option>
                          {assetTypes.filter(t => String(t.asset_group) === String(item.asset_group)).map(at => <option key={at.id} value={at.id}>{at.asset_name}</option>)}
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Manufacturer<span style={{color:'var(--coral)'}}>*</span></label>
                        <input className="form-control" value={item.manufacturer || ''} onChange={e => setItems(it => it.map((x, j) => j === idx ? { ...x, manufacturer: e.target.value } : x))} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Asset Name<span style={{color:'var(--coral)'}}>*</span></label>
                        <input className="form-control" value={item.asset_name} onChange={e => setItems(it => it.map((x, j) => j === idx ? { ...x, asset_name: e.target.value } : x))} required />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Description/Specification<span style={{color:'var(--coral)'}}>*</span></label>
                        <textarea className="form-control" style={{ minHeight: '42px' }} value={item.asset_description} onChange={e => setItems(it => it.map((x, j) => j === idx ? { ...x, asset_description: e.target.value } : x))} required />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Quantity<span style={{color:'var(--coral)'}}>*</span></label>
                          <input className="form-control" type="number" min={1} value={item.asset_quantity} onChange={e => setItems(it => it.map((x, j) => j === idx ? { ...x, asset_quantity: e.target.value } : x))} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Total Cost<span style={{color:'var(--coral)'}}>*</span></label>
                          <input className="form-control" type="number" step="0.01" value={item.amount_ext_gst} onChange={e => setItems(it => it.map((x, j) => j === idx ? { ...x, amount_ext_gst: e.target.value } : x))} required />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendors Section */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border-2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <label className="form-label">Proposed Vendor Name</label>
                <input className="form-control" value={form.vender_name1} onChange={set('vender_name1')} />
              </div>
              <div className="form-group">
                <label className="form-label">SAP Vendor Code</label>
                <input className="form-control" value={form.sap_vender_code1} onChange={set('sap_vender_code1')} />
              </div>

              <div className="form-group">
                <label className="form-label">Alternate Vendor Name 1</label>
                <input className="form-control" value={form.vender_name2} onChange={set('vender_name2')} />
              </div>
              <div className="form-group">
                <label className="form-label">SAP Vendor Code 1</label>
                <input className="form-control" value={form.sap_vender_code2} onChange={set('sap_vender_code2')} />
              </div>

              <div className="form-group">
                <label className="form-label">Alternate Vendor Name 2</label>
                <input className="form-control" value={form.vender_name3} onChange={set('vender_name3')} />
              </div>
              <div className="form-group">
                <label className="form-label">SAP Vendor Code 2</label>
                <input className="form-control" value={form.sap_vender_code3} onChange={set('sap_vender_code3')} />
              </div>

              <div className="form-group">
                <label className="form-label">Alternate Vendor Name 3</label>
                <input className="form-control" value={form.vender_name4} onChange={set('vender_name4')} />
              </div>
              <div className="form-group">
                <label className="form-label">SAP Vendor Code 3</label>
                <input className="form-control" value={form.sap_vender_code4} onChange={set('sap_vender_code4')} />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border-2)' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'block', marginBottom: '12px' }}>Asset Quotation <span style={{color:'var(--coral)'}}>*</span> (.doc, .docx, .xls, .xlsx, .jpg, .jpeg, .pdf)</label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', color: 'var(--text-primary)' }}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  Choose Files
                </button>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {attachments.length === 0 ? 'No file chosen' : `${attachments.length} file(s) selected`}
                </span>
                <input type="file" id="fileInput" multiple hidden onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files)])} />
              </div>

              {attachments.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                  {attachments.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: '6px', border: '1px solid var(--border-2)' }}>
                      <FileText size={14} color="var(--primary)" />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button type="button" onClick={() => setAttachments(a => a.filter((_, j) => j !== i))} style={{ color: 'var(--coral)', border: 'none', background: 'none', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
            <button type="button" className="btn btn-ghost" style={{ background: '#EF4444', color: 'white', border: 'none', padding: '0 24px' }} onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#10B981', color: 'white', border: 'none', padding: '0 24px' }} disabled={loading}>
              {loading ? 'Processing...' : 'Submit'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
