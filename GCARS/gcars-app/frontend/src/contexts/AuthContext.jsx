import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // true once localStorage is checked
  const [loading, setLoading] = useState(false);
  const navigateRef = useRef(null);

  // Hydrate from localStorage on mount and refresh from server
  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = localStorage.getItem('gcars_user');
        const token  = localStorage.getItem('gcars_token');
        if (stored && token) {
          // Set local state immediately for fast UI response
          setUser(JSON.parse(stored));
          
          // Then verify/refresh from server
          const { data } = await api.get('/auth/me');
          if (data.success) {
            localStorage.setItem('gcars_user', JSON.stringify(data.user));
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Session refresh failed:', err);
        // Don't force logout unless the error is 401 (handled by interceptor)
      } finally {
        setReady(true);
      }
    };
    hydrate();
  }, []);

  // Expose a navigate setter so the interceptor can use React Router
  const setNavigate = (fn) => { navigateRef.current = fn; };

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: identifier,
        password,
      });
      if (data.success) {
        localStorage.setItem('gcars_token', data.token);
        localStorage.setItem('gcars_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = (redirect = true) => {
    localStorage.removeItem('gcars_token');
    localStorage.removeItem('gcars_user');
    setUser(null);
    if (redirect && navigateRef.current) {
      navigateRef.current('/login');
    }
  };

  const isSuperAdmin = () => user?.user_type === 'superadmin' || user?.roles?.includes('superadmin');
  const isAdmin      = () => ['admin', 'superadmin'].includes(user?.user_type) || user?.roles?.some(r => ['admin', 'superadmin'].includes(r));
  const isCFO        = () => isAdmin() || user?.roles?.includes('cfo');
  const isBudgetOwner = () => user?.user_type === 'budget_owner' || user?.roles?.includes('budget_owner') || isSuperAdmin();

  return (
    <AuthContext.Provider value={{ user, ready, loading, login, logout, setNavigate, isSuperAdmin, isAdmin, isCFO, isBudgetOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
