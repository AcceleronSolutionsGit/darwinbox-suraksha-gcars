/**
 * ============================================================
 *  G-CARS 2 — AuthContext
 * ============================================================
 *  React context that owns the authentication state for the
 *  entire application. Wraps the app in <AuthProvider> and
 *  exposes auth utilities via the useAuth() hook.
 *
 *  State:
 *    user   – The authenticated user object (or null)
 *    ready  – True once the initial localStorage hydration
 *             + server verification have completed; prevents
 *             a flash of unauthenticated UI on page load
 *    loading – True while a login request is in-flight
 *
 *  Exposed context values:
 *    user, ready, loading
 *    login(identifier, password) → { success, message? }
 *    logout(redirect?)
 *    setNavigate(fn)   – Lets the Axios interceptor redirect on 401
 *    isSuperAdmin()    – Boolean helper
 *    isAdmin()         – Boolean helper
 *    isCFO()           – Boolean helper (includes admins)
 *    isBudgetOwner()   – Boolean helper (includes super-admins)
 * ============================================================
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/client';

// Create the context with null as default (will be populated by AuthProvider)
const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────
//  AuthProvider — Context Provider Component
// ─────────────────────────────────────────────────────────────
/**
 * Wraps child components with authentication state.
 * On mount, hydrates from localStorage immediately (fast UI),
 * then verifies the token with the server and refreshes the
 * user object to pick up any role/profile changes.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  // ── State ────────────────────────────────────────────────
  const [user,    setUser]    = useState(null);
  const [ready,   setReady]   = useState(false);  // true once hydration is complete
  const [loading, setLoading] = useState(false);  // true during login API call

  // Ref used so the Axios interceptor can call React Router's navigate
  // without needing to be inside a React component tree
  const navigateRef = useRef(null);

  // ── On mount: Hydrate session ────────────────────────────
  /**
   * Restores the session from localStorage on app start.
   * Sets user state immediately from cache, then re-validates
   * with the server to ensure the token is still valid and
   * the user's profile/roles are up to date.
   */
  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = localStorage.getItem('gcars_user');
        const token  = localStorage.getItem('gcars_token');

        if (stored && token) {
          // 1. Restore from cache immediately for a fast initial render
          setUser(JSON.parse(stored));

          // 2. Verify with the server and refresh the profile
          const { data } = await api.get('/auth/me');
          if (data.success) {
            localStorage.setItem('gcars_user', JSON.stringify(data.user));
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Session refresh failed:', err);
        // Do NOT force logout here — a 401 is handled by the Axios interceptor
      } finally {
        // Signal that the app may now render protected or public routes
        setReady(true);
      }
    };
    hydrate();
  }, []);

  // ── Expose a navigate setter for the Axios interceptor ──
  /**
   * Registers a navigate function from React Router so that
   * the Axios response interceptor can redirect to /login on 401
   * without needing to be inside a component tree.
   *
   * @param {Function} fn – navigate function from useNavigate()
   */
  const setNavigate = (fn) => { navigateRef.current = fn; };

  // ─────────────────────────────────────────────────────────
  //  login
  // ─────────────────────────────────────────────────────────
  /**
   * Authenticates a user by calling POST /api/auth/login.
   * On success, persists the token and user profile to
   * localStorage and updates React state.
   *
   * @param {string} identifier – Email address or username
   * @param {string} password
   * @returns {{ success: boolean, message?: string }}
   */
  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: identifier,
        password,
      });

      if (data.success) {
        localStorage.setItem('gcars_token', data.token);
        localStorage.setItem('gcars_user',  JSON.stringify(data.user));
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

  // ─────────────────────────────────────────────────────────
  //  logout
  // ─────────────────────────────────────────────────────────
  /**
   * Clears local session data and optionally redirects to /login.
   * Called by the Axios interceptor on 401 responses and by the
   * user clicking "Sign out" in the sidebar.
   *
   * @param {boolean} [redirect=true] – Whether to navigate to /login
   */
  const logout = (redirect = true) => {
    localStorage.removeItem('gcars_token');
    localStorage.removeItem('gcars_user');
    setUser(null);
    if (redirect && navigateRef.current) {
      navigateRef.current('/login');
    }
  };

  // ── Role helper functions ─────────────────────────────────
  // These are thin wrappers that read from the user object,
  // centralising role-check logic for use throughout the UI.

  /** @returns {boolean} True if the user is a superadmin */
  const isSuperAdmin = () =>
    user?.user_type === 'superadmin' || user?.roles?.includes('superadmin');

  /** @returns {boolean} True if the user is an admin or superadmin */
  const isAdmin = () =>
    ['admin', 'superadmin'].includes(user?.user_type) ||
    user?.roles?.some(r => ['admin', 'superadmin'].includes(r));

  /** @returns {boolean} True if the user is a CFO, admin, or superadmin */
  const isCFO = () => isAdmin() || user?.roles?.includes('cfo');

  /** @returns {boolean} True if the user is a budget owner or superadmin */
  const isBudgetOwner = () =>
    user?.user_type === 'budget_owner' ||
    user?.roles?.includes('budget_owner') ||
    isSuperAdmin();

  // ── Provide context to the component tree ────────────────
  return (
    <AuthContext.Provider
      value={{
        user, ready, loading,
        login, logout, setNavigate,
        isSuperAdmin, isAdmin, isCFO, isBudgetOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
//  useAuth — Consumer Hook
// ─────────────────────────────────────────────────────────────
/**
 * Returns the current auth context. Must be used inside an
 * <AuthProvider>. Will throw if called outside the provider tree.
 *
 * @returns {ReturnType<typeof AuthContext>}
 */
export const useAuth = () => useContext(AuthContext);
