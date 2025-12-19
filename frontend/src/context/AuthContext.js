// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'token';
const STORAGE_USER_KEY = 'user';

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function safeJsonParse(value, fallback = null) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

export const AuthProvider = ({ children }) => {
  const w = safeWindow();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bootstrap from storage
  useEffect(() => {
    try {
      const storedToken = w?.localStorage?.getItem(STORAGE_TOKEN_KEY) || null;
      const storedUserRaw = w?.localStorage?.getItem(STORAGE_USER_KEY) || null;
      const storedUser = safeJsonParse(storedUserRaw, null);

      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(storedUser);
    } catch (_) {
      // ignore storage errors
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(credentials);
      const data = response?.data || response || {};

      const nextToken = data?.token || data?.accessToken || null;
      const nextUser = data?.user || data?.profile || null;

      if (nextToken) setToken(nextToken);
      if (nextUser) setUser(nextUser);

      try {
        if (nextToken) w?.localStorage?.setItem(STORAGE_TOKEN_KEY, nextToken);
        if (nextUser) w?.localStorage?.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
      } catch (_) {
        // ignore
      }

      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [w]);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(userData);
      const data = response?.data || response || {};

      // بعض الباك-إند يرجع token مباشرة بعد التسجيل
      const nextToken = data?.token || data?.accessToken || null;
      const nextUser = data?.user || data?.profile || null;

      if (nextToken) setToken(nextToken);
      if (nextUser) setUser(nextUser);

      try {
        if (nextToken) w?.localStorage?.setItem(STORAGE_TOKEN_KEY, nextToken);
        if (nextUser) w?.localStorage?.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
      } catch (_) {
        // ignore
      }

      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [w]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);

    try {
      w?.localStorage?.removeItem(STORAGE_TOKEN_KEY);
      w?.localStorage?.removeItem(STORAGE_USER_KEY);
    } catch (_) {
      // ignore
    }
  }, [w]);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    setUser, // لا نحذف أي إمكانيات مستقبلية
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// لتوافق الاستيراد الموجود عندك: import AuthProvider from './context/AuthContext'
export default AuthProvider;
