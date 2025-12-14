// frontend/src/services/api.js
import axios from 'axios';

/**
 * هدفنا:
 * - لو REACT_APP_API_BASE_URL = http://localhost:5000  => نخلي baseURL = http://localhost:5000/api
 * - لو REACT_APP_API_BASE_URL = http://localhost:5000/api => نخلي baseURL = http://localhost:5000/api (بدون تكرار)
 */
function resolveApiBaseURL() {
  const raw = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').trim();
  const cleaned = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  if (cleaned.endsWith('/api')) return cleaned;
  return `${cleaned}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseURL(),
  withCredentials: true,
  timeout: 30000,
});

// ✅ Interceptors للطلبات (توكن)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Interceptors للردود (تجهيز لرسائل الخطأ)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API ERROR]', error?.response?.data || error?.message);
    return Promise.reject(error);
  },
);

// ==========================
// دوال خاصة بالـ Bot (Settings / Status / Performance / History)
// ==========================
export async function getBotSettings(params = {}) {
  const res = await api.get('/bot/settings', { params });
  return res.data;
}

export async function updateBotSettings(payload) {
  const res = await api.put('/bot/settings', payload);
  return res.data;
}

export async function resetBotSettings() {
  const res = await api.post('/bot/settings/reset');
  return res.data;
}

export async function testBotConnection() {
  const res = await api.post('/bot/test-connection');
  return res.data;
}

export async function getTradingPairs() {
  const res = await api.get('/bot/trading-pairs');
  return res.data;
}

export async function getTradingStrategies() {
  const res = await api.get('/bot/trading-strategies');
  return res.data;
}

export async function getBotStatus() {
  const res = await api.get('/bot/status');
  return res.data;
}

export async function getPerformanceMetrics(params = {}) {
  const res = await api.get('/bot/performance', { params });
  return res.data;
}

export async function getTradingHistory(params = {}) {
  const res = await api.get('/bot/history', { params });
  return res.data;
}

// ==========================
// تحكم البوت (بدون تكرار /api)
// ==========================
export async function controlBot(action, payload = {}) {
  const res = await api.post('/bot/activate', { action, ...payload });
  return res.data;
}

export async function activateTradingBot(payload = {}) {
  return controlBot('start', payload);
}

export async function deactivateTradingBot(payload = {}) {
  return controlBot('stop', payload);
}

export async function getTradingAnalytics(timeRange = '24h') {
  const res = await api.get('/bot/performance/analytics', { params: { range: timeRange } });
  return res.data;
}

export default api;
