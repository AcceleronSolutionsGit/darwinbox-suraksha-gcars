import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ChevronLeft, Save, X } from 'lucide-react';

const MASTER_CONFIG = {
  'asset-groups': {
    title: 'Asset Groups',
    endpoint: '/superadmin/asset-groups',
    fields: [
      { key: 'name', label: 'Group Name', type: 'text', required: true }
    ]
  },
  'asset-types': {
    title: 'Asset Types',
    endpoint: '/superadmin/asset-types',
    fields: [
      { key: 'asset_group', label: 'Asset Group', type: 'api-select', endpoint: '/superadmin/asset-groups', required: true },
      { key: 'asset_name', label: 'Asset Type Name', type: 'text', required: true }
    ]
  },
  'broad-functions': {
    title: 'Broad Functions',
    endpoint: '/superadmin/broad-functions',
    fields: [
      { key: 'name', label: 'Function Name', type: 'text', required: true }
    ]
  },
  'budget-owners': {
    title: 'Budget Owners',
    endpoint: '/superadmin/budget-owners',
    fields: [
      { key: 'head', label: 'Role Description', type: 'text', required: true },
      { key: 'sbu_id', label: 'SBU (Optional)', type: 'api-select', endpoint: '/superadmin/sbus' },
      { key: 'bfun_id', label: 'Function (Optional)', type: 'api-select', endpoint: '/superadmin/broad-functions' },
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  'business-heads': {
    title: 'Business Heads',
    endpoint: '/superadmin/budget-owners',
    fields: [
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'sbu_id', label: 'SBU', type: 'api-select', endpoint: '/superadmin/sbus', required: true },
      { key: 'bfun_id', label: 'Broad Function', type: 'api-select', endpoint: '/superadmin/broad-functions', required: true },
      { key: 'head', label: 'Role Key', type: 'text', required: true, defaultValue: 'budget_owner' },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  'employees': {
    title: 'Employees',
    endpoint: '/superadmin/employees',
    fields: [
      { key: 'emp_no', label: 'Employee Number', type: 'text', required: true, disabledOnEdit: true },
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email Address', type: 'email', required: true },
      { key: 'grade', label: 'Grade', type: 'text' },
      { key: 'desg', label: 'Designation', type: 'text' },
      { key: 'compcode', label: 'Company Code', type: 'text' },
      { key: 'sbu', label: 'SBU', type: 'api-select', endpoint: '/superadmin/sbus', valueKey: 'name', labelKey: 'name', required: true },
      { key: 'b_func', label: 'Broad Function', type: 'api-select', endpoint: '/superadmin/broad-functions', valueKey: 'name', labelKey: 'name', required: true },
      { key: 'location', label: 'Location', type: 'api-select', endpoint: '/superadmin/locations', valueKey: 'location', labelKey: 'location', required: true },
      { key: 'plant', label: 'Plant', type: 'api-select', endpoint: '/superadmin/locations', valueKey: 'plant_name', labelKey: 'plant_name' },
      { key: 'territory', label: 'Territory', type: 'text' },
      { key: 'costcentre', label: 'Cost Centre', type: 'text' },
      { key: 'rpt_code', label: 'Reporting To (Emp No)', type: 'text' },
      { key: 'rpt_to', label: 'Reporting To (Name)', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  'locations': {
    title: 'Locations',
    endpoint: '/superadmin/locations',
    fields: [
      { key: 'location', label: 'Location Name', type: 'text', required: true }
    ]
  },
  'sbus': {
    title: 'SBUs',
    endpoint: '/superadmin/sbus',
    fields: [
      { key: 'name', label: 'SBU Name', type: 'text', required: true }
    ]
  },
  'accountants': {
    title: 'Accountants',
    endpoint: '/superadmin/accountants',
    fields: [
      { key: 'head', label: 'Accountant Name/Role', type: 'text', required: true },
      { key: 'sbu_id', label: 'SBU (Optional)', type: 'api-select', endpoint: '/superadmin/sbus' },
      { key: 'loc_id', label: 'Location (Optional)', type: 'api-select', endpoint: '/superadmin/locations' },
      { key: 'bfun_id', label: 'Function (Optional)', type: 'api-select', endpoint: '/superadmin/broad-functions' },
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  'it-admins': {
    title: 'IT Admins',
    endpoint: '/superadmin/broad-function-heads',
    fields: [
      { key: 'head', label: 'Role Description', type: 'text', required: true, defaultValue: 'IT Admin' },
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  },
  'business-heads': {
    title: 'Business Heads',
    endpoint: '/superadmin/broad-function-heads',
    fields: [
      { key: 'head', label: 'Role/Title', type: 'text', required: true },
      { key: 'sbu_id', label: 'SBU Mapping', type: 'api-select', endpoint: '/superadmin/sbus' },
      { key: 'bfun_id', label: 'Function Mapping', type: 'api-select', endpoint: '/superadmin/broad-functions' },
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ]
  }
};

export default function MasterForm() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const config = MASTER_CONFIG[type];
  
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({});
  
  const [empSearch, setEmpSearch] = useState('');
  const [empResults, setEmpResults] = useState([]);
  const [searchingEmp, setSearchingEmp] = useState(false);
  const [selectedEmps, setSelectedEmps] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownSearch, setDropdownSearch] = useState('');

  const loadOptions = useCallback(async () => {
    if (!config) return;
    for (const field of config.fields) {
      if (field.type === 'api-select') {
        try {
          const { data: res } = await api.get(field.endpoint);
          if (res.success || res.data) {
            setOptions(prev => ({ ...prev, [field.key]: res.data || [] }));
          }
        } catch (err) {
          console.error(`Failed to load options for ${field.key}`);
        }
      }
    }
  }, [config]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!empSearch || empSearch.length < 2) {
        setEmpResults([]);
        return;
      }
      setSearchingEmp(true);
      try {
        const { data: res } = await api.get(`/superadmin/employees/search?q=${empSearch}`);
        if (res.success) setEmpResults(res.data);
      } catch (err) {
        console.error('Emp search failed');
      } finally {
        setSearchingEmp(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [empSearch]);

  useEffect(() => {
    loadOptions();
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const { data: res } = await api.get(`${config.endpoint}/${id}`);
          if (res.success) {
            setForm(res.data);
            if (res.data.emp_no) {
                const { data: eRes } = await api.get(`/superadmin/employees/search?q=${res.data.emp_no}`);
                if (eRes.success && eRes.data.length > 0) {
                    const emp = eRes.data.find(e => e.emp_no === res.data.emp_no) || eRes.data[0];
                    setSelectedEmps(prev => ({ ...prev, emp_no: { name: emp.name, desg: emp.desg } }));
                }
            }
          }
        } catch (err) {
          toast.error('Failed to load record');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else if (config) {
        const defaults = config.fields.reduce((acc, f) => ({ 
            ...acc, 
            [f.key]: f.defaultValue !== undefined ? f.defaultValue : (f.type === 'select' ? f.options[0] : '') 
        }), {});
        setForm(defaults);
    }
  }, [id, config, loadOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (id) {
        await api.put(`${config.endpoint}/${id}`, form);
        toast.success(`${config.title.slice(0,-1)} updated`);
      } else {
        await api.post(config.endpoint, form);
        toast.success(`${config.title.slice(0,-1)} created`);
      }
      navigate(`/masters/${type}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <div className="page-content">Invalid configuration</div>;
  if (loading) return <div className="page-content">Loading...</div>;

  return (
    <div className="page-content fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/masters/${type}`)}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="kicker">Master Data Management</div>
            <h1 className="page-title">{id ? 'Edit' : 'Create New'} {config.title.slice(0, -1)}</h1>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {config.fields.map(field => (
              <div key={field.key} className="form-group" style={{ gridColumn: field.fullWidth ? 'span 2' : 'auto' }}>
                <label className="form-label">{field.label}{field.required && <span className="text-danger">*</span>}</label>
                
                {field.type === 'select' ? (
                  <select 
                    className="form-control"
                    value={form[field.key] || ''}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    required={field.required}
                  >
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'api-select' ? (
                  <div style={{ position: 'relative' }}>
                    <div className="search-wrap">
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder={`Search ${field.label}...`}
                        value={activeDropdown === field.key ? dropdownSearch : 
                              (form[field.key] ? 
                              (options[field.key]?.find(o => (field.valueKey ? o[field.valueKey] : o.id) === form[field.key])?.[field.labelKey || 'name'] || 
                               options[field.key]?.find(o => (field.valueKey ? o[field.valueKey] : o.id) === form[field.key])?.name || 
                               options[field.key]?.find(o => (field.valueKey ? o[field.valueKey] : o.id) === form[field.key])?.location || 
                               options[field.key]?.find(o => (field.valueKey ? o[field.valueKey] : o.id) === form[field.key])?.sbu_name || 
                               options[field.key]?.find(o => (field.valueKey ? o[field.valueKey] : o.id) === form[field.key])?.b_func || 
                               options[field.key]?.find(o => (field.valueKey ? o[field.valueKey] : o.id) === form[field.key])?.plant_name || 
                               form[field.key]) : '')}
                        onChange={e => {
                          setDropdownSearch(e.target.value);
                          if (!e.target.value) setForm({ ...form, [field.key]: '' });
                        }}
                        onFocus={() => {
                          const item = options[field.key]?.find(o => (field.valueKey ? o[field.valueKey] : o.id) === form[field.key]);
                          const currentLabel = item ? (item[field.labelKey || 'name'] || item.name || item.location || item.sbu_name || item.b_func || item.plant_name || form[field.key]) : '';
                          setDropdownSearch(currentLabel);
                          setActiveDropdown(field.key);
                        }}
                        onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                      />
                      {activeDropdown === field.key && (
                        <div className="search-results-dropdown shadow-lg" style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          zIndex: 1000, 
                          background: 'var(--bg-card)', 
                          maxHeight: '250px', 
                          overflowY: 'auto',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          marginTop: '4px'
                        }}>
                           {options[field.key]?.filter(o => {
                              const label = (o[field.labelKey || 'name'] || o.name || o.location || o.sbu_name || o.b_func || o.plant_name || '').toLowerCase();
                              return label.includes(dropdownSearch.toLowerCase());
                           }).length > 0 ? (
                             options[field.key]?.filter(o => {
                                const label = (o[field.labelKey || 'name'] || o.name || o.location || o.sbu_name || o.b_func || o.plant_name || '').toLowerCase();
                                return label.includes(dropdownSearch.toLowerCase());
                             }).map(opt => {
                                const val = field.valueKey ? opt[field.valueKey] : opt.id;
                                const label = opt[field.labelKey || 'name'] || opt.name || opt.location || opt.sbu_name || opt.b_func || opt.plant_name || val;
                                return (
                                  <div 
                                    key={opt.id || val} 
                                    className="search-result-item" 
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent blur from firing before click
                                      e.stopPropagation();
                                      const selectedLabel = opt[field.labelKey || 'name'] || opt.name || opt.location || opt.sbu_name || opt.b_func || opt.plant_name || val;
                                      setForm(prev => ({ ...prev, [field.key]: val }));
                                      setDropdownSearch(selectedLabel);
                                      setActiveDropdown(null);
                                    }}
                                    style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                                  >
                                    {label}
                                  </div>
                                );
                             })
                           ) : (
                             <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>No options found</div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : field.type === 'emp-search' ? (
                    <div style={{ position: 'relative' }}>
                      {form[field.key] && !empSearch ? (
                        <div className="selected-item-card">
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px' }}>
                               {selectedEmps[field.key]?.name || 'Loading...'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                               Code: {form[field.key]} {selectedEmps[field.key]?.desg ? `· ${selectedEmps[field.key].desg}` : ''}
                            </div>
                          </div>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                              setForm({ ...form, [field.key]: '' });
                              setEmpSearch('');
                          }}>Change</button>
                        </div>
                      ) : (
                        <>
                          <div className="search-wrap">
                            <input 
                              type="text" 
                              className="form-control" 
                              value={empSearch}
                              onChange={e => setEmpSearch(e.target.value)}
                              placeholder="Search by Name or Code..."
                              required={field.required && !form[field.key]}
                            />
                            {searchingEmp && <div className="spinner-sm" style={{ position: 'absolute', right: '12px', top: '12px' }} />}
                          </div>
                          {empResults.length > 0 && (
                            <div className="search-results-dropdown shadow-lg">
                              {empResults.map(emp => (
                                <div 
                                  key={emp.emp_no} 
                                  className="search-result-item"
                                  onClick={() => {
                                    setForm({ ...form, [field.key]: emp.emp_no });
                                    setSelectedEmps(prev => ({ ...prev, [field.key]: { name: emp.name, desg: emp.desg } }));
                                    setEmpResults([]);
                                    setEmpSearch('');
                                  }}
                                >
                                  <div style={{ fontWeight: 700 }}>{emp.name} <span style={{ fontWeight: 400, color: 'var(--text-faint)' }}>({emp.emp_no})</span></div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{emp.desg} · {emp.sbu}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                ) : (
                  <input 
                    type={field.type} 
                    className="form-control" 
                    value={form[field.key] || ''}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    required={field.required}
                    disabled={id && field.disabledOnEdit}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
             <button type="button" className="btn btn-ghost" onClick={() => navigate(`/masters/${type}`)}>
                Cancel
             </button>
             <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
               {saving ? 'Saving...' : <><Save size={20} /> {id ? 'Save Changes' : 'Create Record'}</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
