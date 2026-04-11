import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

// Decode a JWT payload without a library to inspect the exp claim.
const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const expiry = getTokenExpiry(token);
  return expiry === null || Date.now() >= expiry;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('ghumfir_token');
    const stored = localStorage.getItem('ghumfir_user');
    if (!token || !stored || isTokenExpired(token)) {
      localStorage.removeItem('ghumfir_token');
      localStorage.removeItem('ghumfir_user');
      return null;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('ghumfir_token');
    localStorage.removeItem('ghumfir_user');
    setUser(null);
  }, []);

  // Auto-logout: schedule a timeout for when the current token expires.
  useEffect(() => {
    const token = localStorage.getItem('ghumfir_token');
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    const delay = expiry - Date.now();
    if (delay <= 0) { logout(); return; }
    const timer = setTimeout(() => logout(), delay);
    return () => clearTimeout(timer);
  }, [user, logout]);

  const _persistSession = (token, userData) => {
    localStorage.setItem('ghumfir_token', token);
    localStorage.setItem('ghumfir_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    _persistSession(data.token, data.user);
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    _persistSession(data.token, data.user);
    return data;
  };

  // Called after Google OAuth redirect — stores token then fetches full profile.
  const loginWithToken = async (token) => {
    localStorage.setItem('ghumfir_token', token);
    try {
      const { data } = await authAPI.getMe();
      localStorage.setItem('ghumfir_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      localStorage.removeItem('ghumfir_token');
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('ghumfir_user', JSON.stringify(data.user));
    } catch {
      logout();
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithToken,
    refreshUser,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
