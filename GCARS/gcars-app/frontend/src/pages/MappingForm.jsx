import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/common/Skeleton';
import { X, Plus, Trash2 } from 'lucide-react';

export default function MappingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    asset_group: '',
    asset_type: '',
    rows: [{ sbu: ['All'], b_fun: ['All'], owner_id: '' }]
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Master Data
  const [assetTypes, setAssetTypes] = useState([]);
  const [assetGroups, setAssetGroups] = useState([]);
  const [broadFunctions, setBroadFunctions] = useState([]);
  const [owners, setOwners] = useState([]);
  const [sbus, setSbus] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [at, ag, bf, ow, sb] = await Promise.all([
        api.get('/superadmin/asset-types'),
        api.get('/superadmin/asset-groups'),
        api.get('/superadmin/broad-functions', { params: { all: true } }),
        api.get('/superadmin/broad-function-heads'),
        api.get('/masters/sbu')
      ]);
      setAssetTypes(at.data.data || []);
      setAssetGroups(ag.data.data || []);
      setBroadFunctions(bf.data.data || []);
      setOwners(ow.data.data || []);
      setSbus(sb.data.data || []);

      if (isEdit) {
        const { data: mData } = await api.get(`/superadmin/workflow-matrix/${id}`);
        if (mData.success && mData.data) {
          setForm({
            asset_group: mData.data.asset_group || '',
            asset_type: mData.data.asset_type || '',
            rows: mData.data.rows && mData.data.rows.length > 0 ? mData.data.rows : [{ sbu: ['All'], b_fun: ['All'], owner_id: '' }]
          });
        }
      }
    } catch (err) {
      toast.error('Data acquisition failed');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_group || !form.asset_type) {
      return toast.error('Please select Asset Group and Asset Type');
    }
    
    // Validate rows
    const validRows = form.rows.filter(r => r.sbu.length > 0 && r.b_fun.length > 0 && r.owner_id);
    if (validRows.length === 0) {
      return toast.error('Please configure at least one complete routing rule');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        rows: validRows
      };
      await api.post('/superadmin/workflow-matrix', payload);
      toast.success(isEdit ? 'Budget Matrix updated' : 'Budget Matrix created');
      navigate('/budget-mapping');
    } catch { toast.error('Failed to save Budget Matrix'); }
    finally { setSaving(false); }
  };

  const handleAssetTypeChange = (typeId) => {
    const at = assetTypes.find(x => x.id === +typeId);
    setForm(prev => ({
      ...prev,
      asset_type: typeId,
      asset_group: at ? at.group_id : prev.asset_group
    }));
  };

  const addRow = () => {
    setForm(prev => ({
      ...prev,
      rows: [...prev.rows, { sbu: ['All'], b_fun: ['All'], owner_id: '' }]
    }));
  };

  const removeRow = (index) => {
    setForm(prev => {
      const newRows = [...prev.rows];
      newRows.splice(index, 1);
      if (newRows.length === 0) newRows.push({ sbu: ['All'], b_fun: ['All'], owner_id: '' });
      return { ...prev, rows: newRows };
    });
  };

  const updateRow = (index, field, value) => {
    setForm(prev => {
      const newRows = [...prev.rows];
      newRows[index] = { ...newRows[index], [field]: value };
      return { ...prev, rows: newRows };
    });
  };

  const addItemToRow = (index, field, value) => {
    const valStr = String(value);
    setForm(prev => {
      const newRows = [...prev.rows];
      let current = [...(newRows[index][field] || [])];
      if (valStr === 'All') {
        current = ['All'];
      } else {
        current = current.filter(x => x !== 'All');
        if (!current.includes(valStr)) current.push(valStr);
      }
      newRows[index][field] = current;
      return { ...prev, rows: newRows };
    });
  };

  const removeItemFromRow = (index, field, value) => {
    setForm(prev => {
      const newRows = [...prev.rows];
      const filtered = (newRows[index][field] || []).filter(x => x !== String(value));
      newRows[index][field] = filtered.length ? filtered : ['All'];
      return { ...prev, rows: newRows };
    });
  };

  if (loading) return <div className="card"><Skeleton rows={15} /></div>;

  return (
    <div className="page-content fade-in">
      <div className="legacy-breadcrumb" style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        <Link to="/budget-mapping" style={{ color: '#3b7ddd', textDecoration: 'none' }}>Budget Matrix List</Link> / Budget Determination Matrix
      </div>

      <div className="legacy-card" style={{ background: '#fff', border: '1px solid #dee2e6', borderTop: '3px solid #3b7ddd', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dee2e6' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: 600 }}>Budget Determination Matrix</h3>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>Asset Group<span style={{ color: 'red' }}>*</span></label>
              <select 
                className="form-control" 
                style={{ background: '#f8f9fa' }}
                value={form.asset_group || ''}
                onChange={(e) => setForm({ ...form, asset_group: e.target.value })}
                disabled={form.asset_type !== ''} // Disabled if asset type auto-selects it
              >
                <option value="">Select Group...</option>
                {assetGroups.map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>Asset Type<span style={{ color: 'red' }}>*</span></label>
              <select 
                className="form-control"
                value={form.asset_type || ''}
                onChange={(e) => handleAssetTypeChange(e.target.value)}
              >
                <option value="">Select Type...</option>
                {assetTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
              </select>
            </div>
          </div>

          <div className="matrix-rows" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {form.rows.map((row, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'flex-start' }}>
                {/* SBU Box */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>SBU<span style={{ color: 'red' }}>*</span></label>
                  <div className="multi-select-box" style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '6px', minHeight: '40px', display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#fff' }}>
                    {row.sbu.map(s => (
                      <div key={s} className="tag-item" style={{ display: 'flex', alignItems: 'center', background: '#f1f3f5', border: '1px solid #e9ecef', borderRadius: '3px', padding: '2px 8px', fontSize: '13px' }}>
                        <span style={{ cursor: 'pointer', marginRight: '6px', color: '#888', fontWeight: 'bold' }} onClick={() => removeItemFromRow(index, 'sbu', s)}>×</span>
                        {s === 'All' ? 'All' : s}
                      </div>
                    ))}
                    <select 
                      style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: '80px', fontSize: '13px' }}
                      value=""
                      onChange={e => e.target.value && addItemToRow(index, 'sbu', e.target.value)}
                    >
                      <option value=""></option>
                      {row.sbu.length === 0 && <option value="All">All</option>}
                      {sbus.filter(s => !row.sbu.includes(s.sbu_name)).map(s => <option key={s.id} value={s.sbu_name}>{s.sbu_name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Broad Function Box */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>Broad Function<span style={{ color: 'red' }}>*</span></label>
                  <div className="multi-select-box" style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '6px', minHeight: '40px', display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#fff' }}>
                    {row.b_fun.map(f => (
                      <div key={f} className="tag-item" style={{ display: 'flex', alignItems: 'center', background: '#f1f3f5', border: '1px solid #e9ecef', borderRadius: '3px', padding: '2px 8px', fontSize: '13px' }}>
                        <span style={{ cursor: 'pointer', marginRight: '6px', color: '#888', fontWeight: 'bold' }} onClick={() => removeItemFromRow(index, 'b_fun', f)}>×</span>
                        {f === 'All' ? 'All' : (broadFunctions.find(x => String(x.id) === String(f))?.name || f)}
                      </div>
                    ))}
                    <select 
                      style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: '80px', fontSize: '13px' }}
                      value=""
                      onChange={e => e.target.value && addItemToRow(index, 'b_fun', e.target.value)}
                    >
                      <option value=""></option>
                      {row.b_fun.length === 0 && <option value="All">All</option>}
                      {broadFunctions.filter(bf => !row.b_fun.includes(String(bf.id))).map(bf => <option key={bf.id} value={bf.id}>{bf.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Budget Owner Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>Budget Owner<span style={{ color: 'red' }}>*</span></label>
                  <select 
                    className="form-control"
                    value={row.owner_id || ''}
                    onChange={(e) => updateRow(index, 'owner_id', e.target.value)}
                    style={{ height: '40px' }}
                  >
                    <option value="">Select Owner...</option>
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.head}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '28px' }}>
                  <button type="button" onClick={addRow} style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>add</button>
                  {form.rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(index)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => navigate('/budget-mapping')} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={saving} style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 24px', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Submitting...' : 'Submit'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
