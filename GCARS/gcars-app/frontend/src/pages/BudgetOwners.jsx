import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/client';
import { toast } from 'react-hot-toast';
import { TableSkeleton } from '../components/common/Skeleton';
import { X } from 'lucide-react';

/* ───────── Classic DataTable Component ───────── */
const LegacyDataTable = ({ title, data, onEdit, entriesOptions = [10, 25, 50] }) => {
  const [entries, setEntries] = useState(entriesOptions[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(row =>
        (row.head || '').toLowerCase().includes(q) ||
        (row.emp_no || '').toLowerCase().includes(q) ||
        (row.employee_name || '').toLowerCase().includes(q)
      );
    }
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const va = (a[sortCol] || '').toString().toLowerCase();
        const vb = (b[sortCol] || '').toString().toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return list;
  }, [data, search, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / entries);
  const paginated = filtered.slice((page - 1) * entries, page * entries);

  useEffect(() => { setPage(1); }, [search, entries]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  return (
    <div className="legacy-card">
      <h3 className="legacy-card-title">{title}</h3>
      <div className="legacy-table-controls">
        <div className="legacy-entries">
          Show{' '}
          <select value={entries} onChange={e => { setEntries(+e.target.value); setPage(1); }}>
            {entriesOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>{' '}
          entries
        </div>
        <div className="legacy-search">
          Search: <input type="text" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <table className="legacy-table">
        <thead>
          <tr>
            <th onClick={() => toggleSort('_sl')} style={{ width: '70px' }}>SL NO <span className="sort-arrows">↕</span></th>
            <th style={{ width: '100px' }}>ACTION <span className="sort-arrows">↕</span></th>
            <th onClick={() => toggleSort('head')}>DESIGNATION <span className="sort-arrows">↕</span></th>
            <th onClick={() => toggleSort('emp_no')}>EMPLOYEE CODE <span className="sort-arrows">↕</span></th>
            <th onClick={() => toggleSort('employee_name')}>NAME <span className="sort-arrows">↕</span></th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((row, idx) => (
            <tr key={row.id || idx}>
              <td style={{ textAlign: 'center' }}>{(page - 1) * entries + idx + 1}</td>
              <td style={{ textAlign: 'center' }}>
                <button className="legacy-edit-btn" onClick={() => onEdit(row)}>EDIT</button>
              </td>
              <td>{row.head}</td>
              <td style={{ textAlign: 'center' }}>{row.emp_no}</td>
              <td style={{ textAlign: 'center' }}>{row.employee_name || '—'}</td>
            </tr>
          ))}
          {paginated.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#999' }}>No matching records found</td></tr>
          )}
        </tbody>
      </table>

      <div className="legacy-table-footer">
        <div className="legacy-showing">
          {filtered.length === 0
            ? 'Showing 0 entries'
            : `Showing ${(page - 1) * entries + 1} to ${Math.min(page * entries, filtered.length)} of ${filtered.length} entries`
          }
        </div>
        <div className="legacy-pagination">
          <button className="pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          {[...Array(Math.max(totalPages, 1))].map((_, i) => (
            <button key={i} className={`pg-num ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="pg-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

/* ───────── Main Page ───────── */
const BudgetOwners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({ head: '', emp_no: '' });

  const [empSearch, setEmpSearch] = useState('');
  const [empResults, setEmpResults] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: oRes } = await api.get('/superadmin/budget-owners', { params: { limit: 1000 } });
      if (oRes.success) setOwners(oRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Employee search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (empSearch.length < 2) { setEmpResults([]); return; }
      try {
        const { data } = await api.get(`/superadmin/employees/search?q=${empSearch}`);
        if (data.success) setEmpResults(data.data);
      } catch {}
    }, 300);
    return () => clearTimeout(delay);
  }, [empSearch]);

  // Split: Other Business Heads are the executive / non-budget-owner roles
  const OTHER_HEADS = ['CFO', 'CMD', 'CEO', 'JMD', 'Finance Head'];
  const budgetOwners = useMemo(() => owners.filter(o => !OTHER_HEADS.includes(o.head)), [owners]);
  const otherHeads = useMemo(() => owners.filter(o => OTHER_HEADS.includes(o.head)), [owners]);

  const openModal = (mode, data = { head: '', emp_no: '' }) => {
    setFormData({ head: data.head || '', emp_no: data.emp_no || '', sbu_id: data.sbu_id || '', bfun_id: data.bfun_id || '' });
    setModal({ mode, id: data.id });
    setEmpSearch('');
    setEmpResults([]);
    setSelectedEmp(data.employee_name ? { name: data.employee_name, emp_no: data.emp_no, desg: data.desg } : null);
  };

  const selectEmployee = (emp) => {
    setFormData(prev => ({ ...prev, emp_no: emp.emp_no }));
    setSelectedEmp(emp);
    setEmpResults([]);
    setEmpSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.emp_no) return toast.error('Please select an employee');
    if (!formData.head) return toast.error('Please enter a designation');
    try {
      const payload = { ...formData, sbu_id: formData.sbu_id || null, bfun_id: formData.bfun_id || null };
      if (modal.mode === 'add') {
        await api.post('/superadmin/budget-owners', payload);
        toast.success('Business Head added successfully');
      } else {
        await api.put(`/superadmin/budget-owners/${modal.id}`, payload);
        toast.success('Business Head updated');
      }
      setModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this Business Head entry?')) return;
    try {
      await api.delete(`/superadmin/budget-owners/${id}`);
      toast.success('Entry removed');
      fetchData();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="legacy-page-title" style={{ margin: 0 }}>Business Head List</h1>
        <button 
          onClick={() => openModal('add')} 
          style={{ 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '8px 16px', 
            fontSize: '13px', 
            fontWeight: 600, 
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          + Add Business Head
        </button>
      </div>

      {loading ? <TableSkeleton rows={8} cols={5} /> : (
        <>
          <LegacyDataTable
            title="Budget Owner List"
            data={budgetOwners}
            onEdit={(row) => openModal('edit', row)}
          />
          <LegacyDataTable
            title="Other Business Head List"
            data={otherHeads}
            onEdit={(row) => openModal('edit', row)}
          />
        </>
      )}

      {/* Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal fade-in-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{modal.mode === 'add' ? 'Add Business Head' : 'Edit Business Head'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Designation *</label>
                  <input
                    className="form-control"
                    required
                    value={formData.head}
                    onChange={e => setFormData(prev => ({ ...prev, head: e.target.value }))}
                    placeholder="e.g. IT Head, Marketing Head, CFO..."
                  />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Employee *</label>
                  {selectedEmp ? (
                    <div style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedEmp.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{selectedEmp.emp_no} · {selectedEmp.desg}</div>
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedEmp(null)}>Change</button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        value={empSearch}
                        onChange={e => setEmpSearch(e.target.value)}
                        placeholder="Search by name or emp code..."
                      />
                      {empResults.length > 0 && (
                        <div className="card shadow-lg" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, padding: '4px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                          {empResults.map(emp => (
                            <div
                              key={emp.emp_no}
                              style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '6px' }}
                              className="nav-link"
                              onClick={() => selectEmployee(emp)}
                            >
                              <div style={{ fontWeight: 600 }}>{emp.name} <small style={{ color: '#999' }}>({emp.emp_no})</small></div>
                              <div style={{ fontSize: '11px', color: '#999' }}>{emp.desg}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                {modal.mode === 'edit' ? (
                  <button type="button" className="btn btn-ghost" onClick={() => handleDelete(modal.id)} style={{ color: '#dc3545', fontWeight: 600 }}>Delete</button>
                ) : <div />}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{modal.mode === 'add' ? 'Add' : 'Save Changes'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .legacy-page-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0 0 20px 0;
          padding: 0;
        }
        .legacy-card {
          background: #fff;
          border: 1px solid #dee2e6;
          border-left: 4px solid #3b7ddd;
          border-radius: 4px;
          margin-bottom: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .legacy-card-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          padding: 16px 20px 0 20px;
          margin: 0;
        }
        .legacy-table-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .legacy-entries {
          font-size: 13px;
          color: #555;
        }
        .legacy-entries select {
          border: 1px solid #ccc;
          border-radius: 3px;
          padding: 3px 6px;
          font-size: 13px;
          margin: 0 4px;
          background: #fff;
        }
        .legacy-search {
          font-size: 13px;
          color: #555;
        }
        .legacy-search input {
          border: 1px solid #ccc;
          border-radius: 3px;
          padding: 5px 8px;
          font-size: 13px;
          margin-left: 6px;
          width: 180px;
          outline: none;
        }
        .legacy-search input:focus {
          border-color: #3b7ddd;
          box-shadow: 0 0 0 2px rgba(59,125,221,0.15);
        }
        .legacy-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .legacy-table thead th {
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          border-bottom: 2px solid #dee2e6;
          padding: 10px 14px;
          text-align: left;
          font-weight: 700;
          font-size: 12px;
          color: #333;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }
        .sort-arrows {
          color: #aaa;
          margin-left: 4px;
          font-size: 11px;
        }
        .legacy-table tbody td {
          padding: 10px 14px;
          border-bottom: 1px solid #eee;
          color: #444;
          vertical-align: middle;
        }
        .legacy-table tbody tr:hover {
          background: #f5f8ff;
        }
        .legacy-edit-btn {
          background: #fff;
          border: 2px solid #3b7ddd;
          color: #3b7ddd;
          padding: 4px 14px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .legacy-edit-btn:hover {
          background: #3b7ddd;
          color: #fff;
        }
        .legacy-table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-top: 1px solid #dee2e6;
          flex-wrap: wrap;
          gap: 10px;
        }
        .legacy-showing {
          font-size: 13px;
          color: #555;
        }
        .legacy-pagination {
          display: flex;
          gap: 2px;
          align-items: center;
        }
        .legacy-pagination .pg-btn {
          background: #fff;
          border: 1px solid #ddd;
          color: #333;
          padding: 5px 12px;
          font-size: 13px;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.15s;
        }
        .legacy-pagination .pg-btn:hover:not(:disabled) {
          background: #e9ecef;
        }
        .legacy-pagination .pg-btn:disabled {
          color: #bbb;
          cursor: default;
        }
        .legacy-pagination .pg-num {
          background: #fff;
          border: 1px solid #ddd;
          color: #333;
          padding: 5px 10px;
          font-size: 13px;
          cursor: pointer;
          min-width: 32px;
          text-align: center;
          border-radius: 2px;
          transition: all 0.15s;
        }
        .legacy-pagination .pg-num:hover {
          background: #e9ecef;
        }
        .legacy-pagination .pg-num.active {
          background: #3b7ddd;
          border-color: #3b7ddd;
          color: #fff;
        }
      `}} />
    </div>
  );
};

export default BudgetOwners;
