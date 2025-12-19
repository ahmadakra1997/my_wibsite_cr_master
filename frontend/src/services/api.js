// frontend/src/services/api.js
import axios from 'axios';

const normalizeBase = (raw) => String(raw || '').trim().replace(/\/+$/, '');
const ensureApiSuffix = (base) => (/\/api(\/v\d+)?$/.test(base) ? base : `${base}/api`);

const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = ensureApiSuffix(normalizeBase(BASE));

export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const unwrap = (res) => {
  const data = res?.data;

  // يدعم نمط {success, data, message}
  if (data && typeof data === 'object' && 'success' in data) {
    if (data.success) return data?.data;
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

const toError = (err) => {
  // Guards قوية على اختلاف أشكال أخطاء axios
  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Network request failed';
  return new Error(String(msg));
};

export const getBotStatus = async () => {
  try {
    return unwrap(await api.get('/bot/status'));
  } catch (e) {
    throw toError(e);
  }
};

export const getPerformanceMetrics = async (params = {}) => {
  try {
    return unwrap(await api.get('/bot/metrics', { params }));
  } catch (e) {
    throw toError(e);
  }
};

export const getTradingHistory = async (params = {}) => {
  try {
    return unwrap(await api.get('/bot/history', { params }));
  } catch (e) {
    throw toError(e);
  }
};

export const getBotSettings = async () => {
  try {
    return unwrap(await api.get('/bot/settings'));
  } catch (e) {
    throw toError(e);
  }
};

export const updateBotSettings = async (settings) => {
  try {
    return unwrap(await api.put('/bot/settings', settings));
  } catch (e) {
    throw toError(e);
  }
};

export const activateTradingBot = async (payload = {}) => {
  try {
    return unwrap(await api.post('/bot/activate', payload));
  } catch (e) {
    throw toError(e);
  }
};

export const deactivateTradingBot = async (payload = {}) => {
  try {
    return unwrap(await api.post('/bot/deactivate', payload));
  } catch (e) {
    throw toError(e);
  }
};

export const controlBot = async (action, payload = {}) => {
  try {
    return unwrap(await api.post('/bot/control', { action, ...payload }));
  } catch (e) {
    throw toError(e);
  }
};

export default api;
