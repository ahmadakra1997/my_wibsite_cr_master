// frontend/src/context/AuthContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';

// ✅ تصدير الـ Context لتوافق أي imports قديمة: import { AuthContext } ...
export const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'token';
const STORAGE_USER_KEY = 'user';

const normalizeLangSafe = (v) => (v == null ? '' : String(v));

function safeJsonParse(value, fallback = null) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getStoredToken() {
  try {
    return typeof window !== 'undefined' ? window.localStorage?.getItem(STORAGE_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

function getStoredUser() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage?.getItem(STORAGE_USER_KEY) : null;
    return safeJsonParse(raw, null);
  } catch {
    return null;
  }
}

function setStoredAuth(token, user) {
  try {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage?.setItem(STORAGE_TOKEN_KEY, token);
    if (user) window.localStorage?.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

function clearStoredAuth() {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage?.removeItem(STORAGE_TOKEN_KEY);
    window.localStorage?.removeItem(STORAGE_USER_KEY);
  } catch {
    // ignore
  }
}

/**
 * ✅ مسارات auth قابلة للتخصيص بدون كسر الباك-إند:
 * - لو عندك endpoints مختلفة فقط ضع env:
 *   REACT_APP_AUTH_LOGIN_PATH=/user/login
 *   REACT_APP_AUTH_REGISTER_PATH=/user/register
 */
const AUTH_LOGIN_PATH = normalizeLangSafe(process.env.REACT_APP_AUTH_LOGIN_PATH) || '/auth/login';
const AUTH_REGISTER_PATH = normalizeLangSafe(process.env.REACT_APP_AUTH_REGISTER_PATH) || '/auth/register';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // لتفادي تكرار ضبط headers بشكل مزعج
  const lastTokenRef = useRef(null);

  // Bootstrap from storage
  useEffect(() => {
    try {
      const t = getStoredToken();
      const u = getStoredUser();
      if (t) setToken(t);
      if (u) setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ربط Authorization مع axios instance بدون تغيير منطق الباك-إند
  useEffect(() => {
    const nextToken = token || null;
    if (lastTokenRef.current === nextToken) return;

    lastTokenRef.current = nextToken;

    try {
      if (nextToken) {
        api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      } else {
        // حذف الهيدر لو ما في token
        // eslint-disable-next-line no-param-reassign
        delete api.defaults.headers.common.Authorization;
      }
    } catch {
      // ignore
    }
  }, [token]);

  const login = useCallback(async (credentials = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(AUTH_LOGIN_PATH, credentials);
      const data = res?.data ?? res ?? {};

      const nextToken = data?.token || data?.accessToken || null;
      const nextUser = data?.user || data?.profile || null;

      if (nextToken) setToken(nextToken);
      if (nextUser) setUser(nextUser);

      setStoredAuth(nextToken, nextUser);
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login failed';
      setError(String(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(AUTH_REGISTER_PATH, payload);
      const data = res?.data ?? res ?? {};

      // بعض الباك-إند يرجع token بعد التسجيل
      const nextToken = data?.token || data?.accessToken || null;
      const nextUser = data?.user || data?.profile || null;

      if (nextToken) setToken(nextToken);
      if (nextUser) setUser(nextUser);

      setStoredAuth(nextToken, nextUser);
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed';
      setError(String(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    clearStoredAuth();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      isAuthenticated: !!token,
      login,
      register,
      logout,

      // ✅ لا نحذف أي إمكانيات مستقبلية كانت موجودة (نحافظ عليها)
      setUser,
      setToken,
    }),
    [user, token, loading, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// لتوافق الاستيراد الموجود عندك: import AuthProvider from './context/AuthContext'
export default AuthProvider;
