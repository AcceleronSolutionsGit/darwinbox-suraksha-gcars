import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  History as HistoryIcon, 
  BarChart3, 
  Settings, 
  Map, 
  Users, 
  Key, 
  Wallet, 
  Boxes,
  Menu,
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Database
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',   icon: <LayoutDashboard size={18} />, end: false },
  { to: '/requests',     label: 'Requests',    icon: <FileText size={18} />, end: true  },
  { to: '/approvals',    label: 'Approvals',   icon: <CheckCircle2 size={18} />, end: false },
  { to: '/requests/new', label: 'New Request', icon: <PlusCircle size={18} />, end: false },
  { to: '/history',      label: 'History',     icon: <HistoryIcon size={18} />, end: false },
  { to: '/reports',      label: 'Reports',     icon: <BarChart3 size={18} />, end: false },
];
const ADMIN_ITEMS = [
  { to: '/superadmin', label: 'Workflows', icon: <Settings size={18} />, end: false },
  { to: '/budget-mapping', label: 'Budget Mapping', icon: <Map size={18} />, end: false },
  { to: '/budget-owners', label: 'Budget Owners', icon: <Users size={18} />, end: false },
  { to: '/roles-permissions', label: 'Roles & Permissions', icon: <Key size={18} />, end: false },
  { to: '/budget-allocation', label: 'Budget Allocation', icon: <Wallet size={18} />, end: false },
  { to: '/quarterly-budgets', label: 'Quarterly Budgets', icon: <Wallet size={18} />, end: false },
  { to: '/masters/it-users', label: 'Manage It User', icon: <Users size={18} />, end: false },
  { to: '/masters/location-users', label: 'Manage Location User', icon: <Users size={18} />, end: false },
  { to: '/masters/ps-users', label: 'Manage PS User', icon: <Users size={18} />, end: false },
  { to: '/masters/it-reviewers', label: 'Manage IT Reviewer', icon: <Users size={18} />, end: false },
  { to: '/masters/business-heads', label: 'Manage Business Head', icon: <Users size={18} />, end: false },
  { to: '/masters/admin-users', label: 'Manage Admin User', icon: <Users size={18} />, end: false },
];
const MASTER_SUB_ITEMS = [
  { to: '/masters/asset-groups', label: 'Asset Group List' },
  { to: '/masters/asset-types', label: 'Manage Asset Type' },
  { to: '/masters/broad-functions', label: 'Manage Broad Function' },
  { to: '/masters/employees', label: 'Employee List' },
  { to: '/masters/locations', label: 'Manage Location' },
  { to: '/masters/sbus', label: 'SBU List' },
  { to: '/masters/accountants', label: 'Accountant List' },
];
const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/requests':     'My Requests',
  '/approvals':    'Action Required Approvals',
  '/requests/new': 'New Request',
  '/requests/bulk-new': 'New Bulk Request',
  '/reports':      'Reports',
  '/history':      'Request History',
  '/superadmin':   'System Administration',
  '/budget-mapping': 'Budget & Asset Mappings',
  '/budget-owners': 'Budget Owners',
  '/roles-permissions': 'Roles & Permissions',
  '/budget-allocation': 'Budget Allocation',
};

// Sidebar widths kept in sync with CSS vars
const SW  = 256; // --sidebar-w
const SWC = 64;  // --sidebar-w-collapsed

export default function Layout({ children }) {
  const { user, logout, isSuperAdmin, isCFO, isBudgetOwner } = useAuth();
  const { toggle: toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed,   setCollapsed]   = useState(() => localStorage.getItem('gcars_sidebar') === 'collapsed');
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth <= 900);

  // Notification state
  const [unread,     setUnread]     = useState(0);
  const [notifs,     setNotifs]     = useState([]);
  const [showNotif,  setShowNotif]  = useState(false);
  const [mastersOpen, setMastersOpen] = useState(() => localStorage.getItem('gcars_masters_open') === 'true');

  useEffect(() => {
    localStorage.setItem('gcars_masters_open', mastersOpen);
  }, [mastersOpen]);

  // Persist sidebar
  useEffect(() => {
    localStorage.setItem('gcars_sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close mobile sidebar on navigate
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);


  // Fetch notifications & History
  useEffect(() => {
    if (!user) return;
    api.get('/reports/notifications').then(r => {
      if (r.data.success) { setUnread(r.data.unread || 0); setNotifs(r.data.data || []); }
    }).catch(() => {});
  }, [location.pathname, user]);

  const handleLogout = () => {
    logout(false);
    navigate('/login', { replace: true });
    toast.success('Signed out');
  };
  const markRead = async () => {
    try { await api.put('/reports/notifications/read-all'); } catch { }
    setUnread(0);
  };

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();
  const pageTitle = PAGE_TITLES[location.pathname] || 'G-CARS 2';
  const sideW = isMobile ? (mobileOpen ? SW : 0) : (collapsed ? SWC : SW);

  const STATUS_COLORS = {
    Approved: 'var(--teal)',
    Rejected: 'var(--coral)',
    Pending: 'var(--primary)',
    Initiated: 'var(--blue)',
  };


  return (
    <div className="app-layout">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 199, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ══════════ SIDEBAR ══════════ */}
      <nav
        className={['sidebar', collapsed ? 'collapsed' : '', mobileOpen ? 'open' : ''].filter(Boolean).join(' ')}
        style={{ width: collapsed ? SWC : SW }}
      >
        {/* Logo */}
        <div className="sidebar-logo" style={{ padding: collapsed ? '16px 8px' : '16px 20px', minHeight: '68px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <img 
            src="/logo.png" 
            alt="Gainwell" 
            style={{ 
              height: collapsed ? '28px' : '26px', 
              width: collapsed ? '36px' : 'auto', 
              maxWidth: collapsed ? '36px' : '160px',
              objectFit: collapsed ? 'cover' : 'contain', 
              objectPosition: 'left',
              transition: 'all 0.2s',
              filter: 'brightness(1.5) contrast(1.2)' // Because it's a dark sidebar, making the logo pop slightly
            }} 
          />
        </div>

        {/* Nav */}
        <div className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-group-label">Menu</div>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to} to={item.to} end={item.end}
                data-label={item.label}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-link-label" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              </NavLink>
            ))}
            {user?.permissions?.includes('raise_bulk_request') && (
              <NavLink to="/requests/bulk-new" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                 <span className="nav-icon"><Boxes size={18} /></span>
                 <span className="nav-link-label">Bulk Request</span>
              </NavLink>
            )}
          </div>

          {(isSuperAdmin() || isCFO() || isBudgetOwner()) && (
            <div className="nav-group" style={{ marginTop: '6px' }}>
              <div className="nav-group-label">Financial & Admin</div>
              {ADMIN_ITEMS.filter(item => {
                if (isSuperAdmin()) return true;
                return item.to === '/budget-allocation' || item.to === '/quarterly-budgets';
              }).map(item => (
                <NavLink
                  key={item.to} to={item.to} end={item.end}
                  data-label={item.label}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-link-label" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </NavLink>
              ))}

              {isSuperAdmin() && (
                <div className={`nav-dropdown ${mastersOpen ? 'open' : ''}`}>
                  <button 
                    className="nav-link dropdown-toggle" 
                    onClick={() => setMastersOpen(!mastersOpen)}
                    style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span className="nav-icon"><Database size={18} /></span>
                    <span className="nav-link-label">Masters</span>
                    <span className="dropdown-arrow">
                      {mastersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>
                  {mastersOpen && !collapsed && (
                    <div className="dropdown-menu">
                      {MASTER_SUB_ITEMS.map(sub => (
                        <NavLink 
                          key={sub.to} to={sub.to} 
                          className={({ isActive }) => `dropdown-item${isActive ? ' active' : ''}`}
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div
            className="user-pill"
            onClick={handleLogout}
            title={`${user?.username} · Click to sign out`}
          >
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.user_type}</div>
            </div>
            <span className="user-sign-out" style={{ fontSize: '11px', color: 'rgba(200,215,255,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LogOut size={12} /> Sign out
            </span>
          </div>
        </div>
      </nav>

      {/* ══════════ COLLAPSE TAB ══════════
          Rendered OUTSIDE the sidebar so overflow:hidden doesn't clip it.
          Positioned fixed, aligned to the right edge of the sidebar.       */}
      {!isMobile && (
        <div
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="collapse-toggle"
          style={{
            position: 'fixed',
            left: (collapsed ? SWC : SW) - 14,
            top: '84px',
            zIndex: 300,
            width: '28px',
            height: '28px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
            <ChevronRight size={16} style={{ 
              transform: `rotate(${collapsed ? 0 : 180}deg)`,
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
        </div>
      )}

      {/* ══════════ MAIN ══════════ */}
      <div
        className="main-content"
        style={{ marginLeft: isMobile ? 0 : (collapsed ? SWC : SW) }}
      >
        {/* Header */}
        <header className="header">
          {/* Mobile hamburger */}
          {isMobile && (
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMobileOpen(o => !o)}
              title="Toggle sidebar"
              style={{ flexShrink: 0 }}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Page title */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{
              fontSize: '14px', fontWeight: 700,
              color: 'var(--text-primary)', letterSpacing: '0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {pageTitle}
            </span>
          </div>

          {/* Theme toggle — icon only */}
          <button
            className="btn-theme"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ padding: '7px 10px', minWidth: 38, flexShrink: 0 }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowNotif(s => !s)}
              title="Notifications"
              style={{ position: 'relative' }}
            >
              <Bell size={20} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: '5px', right: '4px',
                  width: '14px', height: '14px',
                  background: 'var(--coral)', borderRadius: '50%',
                  fontSize: '8px', fontWeight: 700, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Math.min(unread, 9)}
                </span>
              )}
            </button>

            {showNotif && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowNotif(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: '300px', background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      Notifications
                      {unread > 0 && <span className="badge badge-danger" style={{ marginLeft: '8px', fontSize: '10px' }}>{unread}</span>}
                    </span>
                    {unread > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={markRead} style={{ fontSize: '11px' }}>
                        Mark read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>
                        No notifications
                      </div>
                    ) : notifs.slice(0, 12).map((n, i) => (
                      <div key={i} style={{
                        padding: '10px 15px',
                        borderBottom: '1px solid var(--border-2)',
                        background: n.status === 'new' ? 'var(--info-bg)' : 'transparent',
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: n.status === 'new' ? 500 : 400, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {n.heading}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{n.message}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '3px' }}>
                          {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User avatar only */}
          <div
            title={`${user?.username} · ${user?.user_type}`}
            style={{ flexShrink: 0 }}
          >
            <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '12px', borderRadius: '9px', cursor: 'default' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page */}
        {children}
      </div>
    </div>
  );
}
