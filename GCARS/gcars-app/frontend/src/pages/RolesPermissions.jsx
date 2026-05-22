import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-hot-toast';

const RolesPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null); // Role being edited
  const [rolePerms, setRolePerms] = useState([]); // Selected perm IDs for activeRole
  const [modal, setModal] = useState(null); // 'add-role', 'edit-role'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        api.get('/superadmin/roles'),
        api.get('/superadmin/permissions')
      ]);
      if (rRes.data.success) setRoles(rRes.data.data);
      if (pRes.data.success) setPermissions(pRes.data.data);
    } catch (err) {
      toast.error('Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleSelect = async (role) => {
    setActiveRole(role);
    try {
      const { data } = await api.get(`/superadmin/roles/${role.id}/permissions`);
      if (data.success) setRolePerms(data.data);
    } catch {
      toast.error('Failed to load role permissions');
    }
  };

  const togglePermission = (id) => {
    setRolePerms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const savePermissions = async () => {
    if (!activeRole) return;
    try {
      await api.post(`/superadmin/roles/${activeRole.id}/permissions`, { permission_ids: rolePerms });
      toast.success('Permissions updated');
      fetchData(); // Refresh counts
    } catch {
      toast.error('Failed to save permissions');
    }
  };

  const deleteRole = async (id) => {
    if (!window.confirm('Delete this role? This will unassign it from all users.')) return;
    try {
      await api.delete(`/superadmin/roles/${id}`);
      toast.success('Role deleted');
      if (activeRole?.id === id) setActiveRole(null);
      fetchData();
    } catch {
      toast.error('Failed to delete role');
    }
  };

  if (loading && roles.length === 0) return <div className="page-content loading-center"><div className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-content fade-in budget-mapping-container">
        <div className="premium-header">
          <div className="header-content">
            <div className="header-icon">🔑</div>
            <div>
              <h1 className="header-title">Roles & Access Manager</h1>
              <p className="header-subtitle">Define user roles and map specific access permissions to each role.</p>
            </div>
          </div>
          <div className="header-toolbar">
            <button className="action-btn primary" onClick={() => setModal('add-role')}>
              <span className="btn-icon">+</span> New Role
            </button>
          </div>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Roles List */}
        <div className="asset-group-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)' }}>
          <div className="asset-group-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <h3 className="asset-name">System Roles</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginTop: '4px' }}>Select a role to configure</p>
          </div>
          <div className="asset-group-body" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {roles.map(r => {
              const isSelected = activeRole?.id === r.id;
              // Generate initials for avatar
              const initials = r.display_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
              return (
              <div 
                key={r.id}
                onClick={() => handleRoleSelect(r)}
                style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-faint)' : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary-light)' : 'transparent',
                  marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={e => { if (!isSelected) Object.assign(e.currentTarget.style, { background: 'var(--bg-faint)' }); }}
                onMouseOut={e => { if (!isSelected) Object.assign(e.currentTarget.style, { background: 'transparent' }); }}
              >
                {/* Active Indicator Bar */}
                {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)' }} />}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingLeft: isSelected ? '8px' : '0', transition: '0.2s' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-overlay)',
                    color: isSelected ? '#fff' : 'var(--text-primary)',
                    fontWeight: 'bold', fontSize: '14px',
                    boxShadow: isSelected ? '0 4px 10px rgba(241,180,52,0.3)' : 'none',
                    transition: '0.2s'
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-primary)', transition: '0.2s' }}>{r.display_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>
                       {r.permission_count > 0 ? (
                         <span style={{ color: 'var(--success)' }}>● {r.permission_count} permissions</span>
                       ) : (
                         <span>○ No permissions</span>
                       )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="action-btn" title="Edit" style={{ padding: '6px 10px' }} onClick={(e) => { e.stopPropagation(); setModal('edit-role'); }}>✎</button>
                    <button className="action-btn" title="Delete" style={{ padding: '6px 10px', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); deleteRole(r.id); }}>✕</button>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* Permissions Mapping */}
        <div className="asset-group-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)' }}>
          {activeRole ? (
            <>
              <div className="asset-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 className="asset-name">Permissions for {activeRole.display_name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: '4px 0 0' }}>Toggle the capabilities this role should have.</p>
                </div>
                <button className="action-btn primary" onClick={savePermissions} style={{ padding: '8px 16px', fontSize: '13px' }}>Save Changes</button>
              </div>

              <div className="asset-group-body" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '16px' }}>
                  {permissions.map(p => {
                    const getIcon = (n) => {
                      if (n.includes('user')) return '👤';
                      if (n.includes('role')) return '🛡️';
                      if (n.includes('workflow')) return '🛤️';
                      if (n.includes('budget')) return '💳';
                      if (n.includes('report')) return '📊';
                      if (n.includes('history')) return '📜';
                      return '⚡';
                    };
                    const isSelected = rolePerms.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => togglePermission(p.id)}
                        onMouseOver={e => { if (!isSelected) Object.assign(e.currentTarget.style, { borderColor: 'var(--primary-light)', transform: 'translateY(-2px)' }); }}
                        onMouseOut={e => { if (!isSelected) Object.assign(e.currentTarget.style, { borderColor: 'var(--border)', transform: 'none' }); }}
                        style={{ 
                          padding: '16px', 
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          background: isSelected ? 'linear-gradient(135deg, rgba(241,180,52,0.1), rgba(241,180,52,0.02))' : 'var(--bg-main)',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isSelected ? '0 4px 15px rgba(241,180,52,0.15)' : 'var(--shadow-sm)',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        <div style={{ 
                          width: '40px', height: '40px', 
                          borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px',
                          background: isSelected ? 'var(--primary)' : 'var(--bg-overlay)',
                          color: isSelected ? '#fff' : 'inherit',
                          transition: '0.3s ease',
                          boxShadow: isSelected ? '0 4px 10px rgba(241,180,52,0.3)' : 'none'
                        }}>
                          {isSelected ? '✓' : getIcon(p.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-primary)', transition: '0.2s' }}>{p.display_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px', lineHeight: 1.3 }}>{p.description || p.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
               <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.8 }}>🔑</div>
               <h3 style={{ margin: '0 0 8px 0' }}>Select a role to manage</h3>
               <p style={{ maxWidth: '300px', textAlign: 'center', margin: 0 }}>Choose a role from the left sidebar to view and edit its assigned access levels.</p>
            </div>
          )}
        </div>
      </div>

      {modal === 'add-role' && (
        <RoleModal onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchData(); }} />
      )}
      {modal === 'edit-role' && (
        <RoleModal role={activeRole} onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchData(); }} />
      )}
      </div>
    </>
  );
};

const RoleModal = ({ role, onClose, onSuccess }) => {
  const [data, setData] = useState(role || { name: '', display_name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role?.id) {
        await api.put(`/superadmin/roles/${role.id}`, data);
        toast.success('Role updated');
      } else {
        await api.post('/superadmin/roles', data);
        toast.success('Role created');
      }
      onSuccess();
    } catch {
      toast.error(role?.id ? 'Failed to update role' : 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>{role ? 'Edit Role' : 'Create New Role'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Role Identifier (Internal)</label>
              <input type="text" required placeholder="e.g. regional_admin" value={data.name} onChange={e => setData({...data, name: e.target.value})} disabled={!!role} style={{ opacity: role ? 0.6 : 1 }} />
              {role && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Identifier cannot be changed after creation.</div>}
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" required placeholder="e.g. Regional Admin" value={data.display_name} onChange={e => setData({...data, display_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea placeholder="Briefly describe what this role is for" value={data.description} onChange={e => setData({...data, description: e.target.value})} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{role ? 'Save Changes' : 'Create Role'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolesPermissions;
