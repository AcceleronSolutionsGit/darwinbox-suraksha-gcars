import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import { TableSkeleton, Skeleton } from '../components/common/Skeleton';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { SearchableSelect } from '../components/common/SearchableSelect';

const MASTER_CONFIG = {
  'asset-groups': {
    title: 'Asset Group List',
    endpoint: '/superadmin/asset-groups',
    columns: [
      { key: 'id', label: 'ID', width: '80px' },
      { key: 'name', label: 'Asset Group Name' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    fields: [
      { key: 'name', label: 'Asset Group Name', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'asset-types': {
    title: 'Manage Asset Type',
    endpoint: '/superadmin/asset-types',
    columns: [
      { key: 'id', label: 'ID', width: '80px' },
      { key: 'group_name', label: 'Group' },
      { key: 'name', label: 'Asset Type Name' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    fields: [
      { key: 'group_id', label: 'Asset Group', type: 'api-select', endpoint: '/superadmin/asset-groups', required: true },
      { key: 'name', label: 'Asset Type Name', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'broad-functions': {
    title: 'Manage Broad Function',
    endpoint: '/superadmin/broad-functions',
    columns: [
      { key: 'id', label: 'ID', width: '80px' },
      { key: 'name', label: 'Broad Function Name' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    fields: [
      { key: 'name', label: 'Broad Function Name', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'budget-owners': {
    title: 'Budget Owners',
    endpoint: '/superadmin/budget-owners',
    columns: [
      { key: 'head', label: 'Role/Head' },
      { key: 'employee_name', label: 'Employee' },
      { key: 'emp_no', label: 'Emp Code' },
      { key: 'budget_owner', label: 'Status', type: 'badge' }
    ],
    fields: [
      { key: 'head', label: 'Role Description', type: 'text', required: true },
      { key: 'sbu_id', label: 'SBU (Optional)', type: 'api-select', endpoint: '/superadmin/sbus' },
      { key: 'bfun_id', label: 'Function (Optional)', type: 'api-select', endpoint: '/superadmin/broad-functions' },
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'business-heads': {
    title: 'Manage Business Head',
    endpoint: '/superadmin/broad-function-heads',
    params: { filter: 'BH' },
    columns: [
      { key: 'head', label: 'Head/Role' },
      { key: 'emp_name', label: 'Employee Name' },
      { key: 'emp_no', label: 'Emp No' },
      { key: 'sbu_name', label: 'SBU Name' },
      { key: 'b_func', label: 'Function' },
      { key: 'budget_owner', label: 'Status', type: 'badge' },
      { key: 'updated_at', label: 'Last Updated' }
    ],
    fields: [
      { key: 'head', label: 'Head Name/Role', type: 'text', required: true },
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'sbu_id', label: 'SBU (IDs)', type: 'text' },
      { key: 'bfun_id', label: 'Broad Function (IDs)', type: 'text' },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'employees': {
    title: 'Employee List',
    endpoint: '/superadmin/employees',
    columns: [
      { key: 'emp_no', label: 'Emp No', width: '100px' },
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'sbu', label: 'SBU' },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    fields: [
      { key: 'emp_no', label: 'Employee Number', type: 'text', required: true, disabledOnEdit: true },
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email Address', type: 'email', required: true },
      { key: 'grade', label: 'Grade', type: 'text' },
      { key: 'desg', label: 'Designation', type: 'text' },
      { key: 'compcode', label: 'Company Code', type: 'text' },
      { key: 'sbu', label: 'SBU', type: 'api-select', endpoint: '/superadmin/sbus', valueKey: 'sbu_name', required: true },
      { key: 'b_func', label: 'Broad Function', type: 'api-select', endpoint: '/superadmin/broad-functions', valueKey: 'b_func', required: true },
      { key: 'location', label: 'Location', type: 'api-select', endpoint: '/superadmin/locations', valueKey: 'location', required: true },
      { key: 'plant', label: 'Plant', type: 'text' },
      { key: 'territory', label: 'Territory', type: 'text' },
      { key: 'costcentre', label: 'Cost Centre', type: 'text' },
      { key: 'rpt_code', label: 'Reporting To (Emp No)', type: 'text' },
      { key: 'rpt_to', label: 'Reporting To (Name)', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    idKey: 'emp_no',
    paginated: true
  },
  'locations': {
    title: 'Manage Location',
    endpoint: '/superadmin/locations',
    columns: [
      { key: 'loc_code', label: 'Loc Code', width: '100px' },
      { key: 'location', label: 'Location' },
      { key: 'plant', label: 'Plant' },
      { key: 'plant_name', label: 'Plant Name' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    fields: [
      { key: 'loc_code', label: 'Location Code', type: 'text', required: true },
      { key: 'location', label: 'Location Name', type: 'text', required: true },
      { key: 'plant', label: 'Plant Code', type: 'text' },
      { key: 'plant_name', label: 'Plant Name', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'sbus': {
    title: 'SBU List',
    endpoint: '/superadmin/sbus',
    columns: [
      { key: 'id', label: 'ID', width: '80px' },
      { key: 'name', label: 'SBU Name' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    fields: [
      { key: 'name', label: 'SBU Name', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'accountants': {
    title: 'Accountant List',
    endpoint: '/superadmin/accountants',
    columns: [
      { key: 'id', label: 'ID', width: '60px' },
      { key: 'employee_name', label: 'Employee Name' },
      { key: 'employee_no', label: 'Employee Code' },
      { key: 'sbu_display', label: 'SBU' },
      { key: 'location_display', label: 'Location' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'updated_at', label: 'Last Updated' }
    ],
    fields: [
      { key: 'head', label: 'Accountant Name/Role', type: 'text', required: true },
      { key: 'sbu_id', label: 'SBU (Optional)', type: 'api-select', endpoint: '/superadmin/sbus' },
      { key: 'loc_id', label: 'Location (Optional)', type: 'api-select', endpoint: '/superadmin/locations' },
      { key: 'bfun_id', label: 'Function (Optional)', type: 'api-select', endpoint: '/superadmin/broad-functions' },
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'budget_owner', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
    ],
    paginated: true
  },
  'it-users': {
    title: 'Manage It User',
    endpoint: '/superadmin/manage-users',
    params: { type: 'IT_USER' },
    columns: [
      { key: 'emp_no', label: 'Employee Code' },
      { key: 'emp_name', label: 'Name' }
    ],
    fields: [
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'type', label: 'Type', type: 'hidden', defaultValue: 'IT_USER' }
    ]
  },
  'location-users': {
    title: 'Manage Location User',
    endpoint: '/superadmin/manage-users',
    params: { type: 'LOC_USER' },
    columns: [
      { key: 'emp_no', label: 'Employee Code' },
      { key: 'emp_name', label: 'Name' }
    ],
    fields: [
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'type', label: 'Type', type: 'hidden', defaultValue: 'LOC_USER' }
    ]
  },
  'ps-users': {
    title: 'Manage PS User',
    endpoint: '/superadmin/manage-users',
    params: { type: 'PS_USER' },
    columns: [
      { key: 'emp_no', label: 'Employee Code' },
      { key: 'emp_name', label: 'Name' }
    ],
    fields: [
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'type', label: 'Type', type: 'hidden', defaultValue: 'PS_USER' }
    ]
  },
  'it-reviewers': {
    title: 'Manage IT Reviewer',
    endpoint: '/superadmin/manage-users',
    params: { type: 'IT_REVIEWER' },
    columns: [
      { key: 'emp_no', label: 'Employee Code' },
      { key: 'emp_name', label: 'Name' }
    ],
    fields: [
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'type', label: 'Type', type: 'hidden', defaultValue: 'IT_REVIEWER' }
    ]
  },
  'business-head-users': {
    title: 'Manage Business Head',
    endpoint: '/superadmin/manage-users',
    params: { type: 'BUSINESS_HEAD' },
    columns: [
      { key: 'emp_no', label: 'Employee Code' },
      { key: 'emp_name', label: 'Name' }
    ],
    fields: [
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'type', label: 'Type', type: 'hidden', defaultValue: 'BUSINESS_HEAD' }
    ]
  },
  'admin-users': {
    title: 'Manage Admin User',
    endpoint: '/superadmin/manage-users',
    params: { type: 'ADMIN_USER' },
    columns: [
      { key: 'emp_no', label: 'Employee Code' },
      { key: 'emp_name', label: 'Name' }
    ],
    fields: [
      { key: 'emp_no', label: 'Employee Code', type: 'emp-search', required: true },
      { key: 'type', label: 'Type', type: 'hidden', defaultValue: 'ADMIN_USER' }
    ]
  }
};

export default function Masters() {
  const { type } = useParams();
  const navigate = useNavigate();
  const config = MASTER_CONFIG[type];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'new' | 'edit'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // New states for employee filters
  const [filterSbu, setFilterSbu] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterBfunc, setFilterBfunc] = useState('');

  // For selects that fetch data
  const [options, setOptions] = useState({});

  const loadData = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const params = {
        ...(config.paginated ? { page, limit: 50, search } : { search }),
        ...(type === 'employees' ? { sbu: filterSbu, location: filterLocation, b_func: filterBfunc } : {}),
        ...(config.params || {})
      };
      const { data: res } = await api.get(config.endpoint, { params });
      if (res.success) {
        setData(res.data);
        if (config.paginated) setTotal(res.total);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [config, page, search, filterSbu, filterLocation, filterBfunc, type]);

  const loadOptions = useCallback(async () => {
    if (!config) return;
    const newOptions = {};
    for (const field of config.fields) {
      if (field.type === 'api-select') {
        try {
          const { data: res } = await api.get(field.endpoint);
          if (res.success) newOptions[field.key] = res.data;
        } catch {}
      }
    }
    setOptions(newOptions);
  }, [config]);

  useEffect(() => {
    loadData();
    loadOptions();
  }, [loadData, loadOptions, type, page]); // Added page to dependencies

  if (!config) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <h3>Invalid Master Type</h3>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go Home</button>
        </div>
      </div>
    );
  }

  const handleDelete = async (row) => {
    const id = config.idKey ? row[config.idKey] : (row.id || row.emp_no);
    if (!window.confirm(`Are you sure you want to delete this ${config.title}?`)) return;
    try {
      const deleteUrl = config.params?.type 
        ? `${config.endpoint}/${id}?type=${config.params.type}`
        : `${config.endpoint}/${id}`;
        
      await api.delete(deleteUrl);
      toast.success('Deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const totalPages = Math.ceil(total / (config.paginated ? 50 : data.length || 1));

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div className="kicker">Master Management</div>
          <h1 className="page-title">{config.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadData()}
            />
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/masters/${type}/new`)}>
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      {type === 'employees' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 200 }}>
            <SearchableSelect 
              value={filterSbu} 
              onChange={val => { setFilterSbu(val); setPage(1); }} 
              placeholder="All SBUs"
              options={(options['sbu'] || []).map(opt => ({ value: opt.name, label: opt.name }))} 
            />
          </div>
          <div style={{ width: 200 }}>
            <SearchableSelect 
              value={filterLocation} 
              onChange={val => { setFilterLocation(val); setPage(1); }} 
              placeholder="All Locations"
              options={(options['location'] || []).map(opt => ({ value: opt.location, label: opt.location }))} 
            />
          </div>
          <div style={{ width: 200 }}>
            <SearchableSelect 
              value={filterBfunc} 
              onChange={val => { setFilterBfunc(val); setPage(1); }} 
              placeholder="All Functions"
              options={(options['b_func'] || []).map(opt => ({ value: opt.name, label: opt.name }))} 
            />
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          {loading ? (
            <TableSkeleton rows={10} cols={config.columns.length + 1} />
          ) : (
            <table>
              <thead>
                <tr>
                  {config.columns.map(col => (
                    <th key={col.key} style={{ width: col.width }}>{col.label}</th>
                  ))}
                  <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 1} style={{ textAlign: 'center', padding: '40px' }}>
                      No data found
                    </td>
                  </tr>
                ) : data.map((row, i) => (
                  <tr key={config.idKey ? row[config.idKey] : (row.id || row.emp_no || i)}>
                    {config.columns.map(col => (
                      <td key={col.key}>
                        {col.type === 'badge' ? (
                          <span className={`badge ${row[col.key] === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            {row[col.key]}
                          </span>
                        ) : (
                          row[col.key] || '—'
                        )}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => navigate(`/masters/${type}/edit/${config.idKey ? row[config.idKey] : (row.id || row.emp_no)}`)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(row)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {config.paginated && total > 0 && (
          <div className="pagination-footer">
            <div className="pagination-info">
              Showing {data.length} of {total} {config.title.toLowerCase()}
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i-1] !== p - 1 && <span className="pagination-ellipsis">...</span>}
                    <button 
                      className={`page-btn ${page === p ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button 
                className="page-btn" 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal removed as we use pages now */}
    </div>
  );
}
