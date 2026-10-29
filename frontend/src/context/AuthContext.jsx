import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  const [authState, setAuthState] = useState('loading');
  const restoreInFlight = useRef(false);

  // Initial session restoration — called once on mount
  const restoreSession = useCallback(async () => {
    if (restoreInFlight.current) return;
    restoreInFlight.current = true;
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      setAuthState('authenticated');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        // Genuine unauthenticated state — clear stale tokens
        sessionStorage.removeItem('kc_auth_token');
        localStorage.removeItem('kc_token');
        localStorage.removeItem('kc_user');
        setUser(null);
        setAuthState('unauthenticated');
      } else {
        // Network / server error — don't log the user out for a temporary blip
        setUser(null);
        setAuthState('error');
      }
    } finally {
      restoreInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const { user: u, token } = res.data;

    // Store token according to remember-me policy for non-cookie environments
    if (credentials.remember) {
      localStorage.setItem('kc_token', token);
    } else {
      sessionStorage.setItem('kc_auth_token', token);
      localStorage.removeItem('kc_token');
    }

    setUser(u);
    setAuthState('authenticated');
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { user: u, token } = res.data;
    sessionStorage.setItem('kc_auth_token', token);
    setUser(u);
    setAuthState('authenticated');
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Logout failed on backend — still clear local state
      console.warn('Logout API error (local state cleared anyway):', e?.response?.status || e?.message);
    } finally {
      sessionStorage.removeItem('kc_auth_token');
      localStorage.removeItem('kc_token');
      localStorage.removeItem('kc_user');
      setUser(null);
      setAuthState('unauthenticated');
      toast.success('Signed out successfully');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      setAuthState('authenticated');
      return res.data.user;
    } catch (e) {
      const status = e.response?.status;
      if (status === 401 || status === 403) {
        setUser(null);
        setAuthState('unauthenticated');
      }
      throw e;
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await authApi.updateProfile(data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const changePassword = useCallback(async (data) => {
    const res = await authApi.changePassword(data);
    // Server issues a fresh token after password change — update stored token
    if (res.data.token) {
      if (localStorage.getItem('kc_token')) {
        localStorage.setItem('kc_token', res.data.token);
      } else {
        sessionStorage.setItem('kc_auth_token', res.data.token);
      }
    }
    if (res.data.user) {
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      // Derived booleans — convenient for callers
      loading: authState === 'loading',
      isAuthenticated: authState === 'authenticated' && !!user,
      authError: authState === 'error',
      authState,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
