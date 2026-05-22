import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import NewRequest from './pages/NewRequest';
import NewBulkRequest from './pages/NewBulkRequest';
import Reports from './pages/Reports';
import History from './pages/History';
import SuperAdmin from './pages/SuperAdmin';
import BudgetOwners from './pages/BudgetOwners';
import RolesPermissions from './pages/RolesPermissions';
import BudgetMapping from './pages/BudgetMapping';
import MappingForm from './pages/MappingForm';
import BudgetAllocation from './pages/BudgetAllocation';
import QuarterlyBudgets from './pages/QuarterlyBudgets';
import Masters from './pages/Masters';
import MasterForm from './pages/MasterForm';
import './index.css';

function NavigateRegistrar() {
  const navigate = useNavigate();
  const { setNavigate } = useAuth();
  useEffect(() => { setNavigate(navigate); }, [navigate, setNavigate]);
  return null;
}

function PrivateRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function SuperAdminRoute({ children }) {
  const { user, ready, isSuperAdmin } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

function CFORoute({ children }) {
  const { user, ready, isCFO, isBudgetOwner } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCFO() && !isBudgetOwner()) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard"    element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/requests"     element={<PrivateRoute><Layout><Requests defaultView="my_requests" /></Layout></PrivateRoute>} />
      <Route path="/approvals"    element={<PrivateRoute><Layout><Requests defaultView="to_approve" /></Layout></PrivateRoute>} />
      <Route path="/requests/new" element={<PrivateRoute><Layout><NewRequest /></Layout></PrivateRoute>} />
      <Route path="/requests/bulk-new" element={<PrivateRoute><Layout><NewBulkRequest /></Layout></PrivateRoute>} />
      <Route path="/requests/:id" element={<PrivateRoute><Layout><RequestDetail /></Layout></PrivateRoute>} />
      <Route path="/history"      element={<PrivateRoute><Layout><History /></Layout></PrivateRoute>} />
      <Route path="/reports"      element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
      <Route path="/superadmin"   element={<SuperAdminRoute><Layout><SuperAdmin /></Layout></SuperAdminRoute>} />
      <Route path="/budget-owners" element={<SuperAdminRoute><Layout><BudgetOwners /></Layout></SuperAdminRoute>} />
      <Route path="/roles-permissions" element={<SuperAdminRoute><Layout><RolesPermissions /></Layout></SuperAdminRoute>} />
      <Route path="/budget-mapping"   element={<SuperAdminRoute><Layout><BudgetMapping /></Layout></SuperAdminRoute>} />
      <Route path="/budget-mapping/new"   element={<SuperAdminRoute><Layout><MappingForm /></Layout></SuperAdminRoute>} />
      <Route path="/budget-mapping/edit/:id" element={<SuperAdminRoute><Layout><MappingForm /></Layout></SuperAdminRoute>} />
      <Route path="/budget-allocation" element={<CFORoute><Layout><BudgetAllocation /></Layout></CFORoute>} />
      <Route path="/quarterly-budgets" element={<CFORoute><Layout><QuarterlyBudgets /></Layout></CFORoute>} />
      <Route path="/masters/:type" element={<SuperAdminRoute><Layout><Masters /></Layout></SuperAdminRoute>} />
      <Route path="/masters/:type/new" element={<SuperAdminRoute><Layout><MasterForm /></Layout></SuperAdminRoute>} />
      <Route path="/masters/:type/edit/:id" element={<SuperAdminRoute><Layout><MasterForm /></Layout></SuperAdminRoute>} />
      <Route path="/"  element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*"  element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <NavigateRegistrar />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontFamily: "'Roboto', sans-serif",
                fontSize: '13.5px',
                boxShadow: 'var(--shadow-md)',
              },
              success: { iconTheme: { primary: '#26A69A', secondary: 'white' } },
              error:   { iconTheme: { primary: '#EF5350', secondary: 'white' } },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
