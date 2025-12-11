// src/services/api.js
// طبقة HTTP موحّدة لكل استدعاءات الـ backend
// تستخدم axios + REACT_APP_API_BASE_URL

import axios from 'axios';

// 👈 استخدم متغير البيئة لو موجود، وإلا localhost
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// ⭐ axios instance موحد
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

// ✅ Interceptors للطلبات (إضافة توكن مثلاً)
api.interceptors.request.use(
  (config) => {
    // مثال: لو تخزن التوكن في localStorage:
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Interceptors للردود (تجهيز لرسائل الخطأ / التوست)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // هنا نقدر نضيف تكامل مع Toast/ErrorBoundary
    console.error('[API ERROR]', error?.response || error?.message);
    return Promise.reject(error);
  },
);

// ==========================
//   دوال خاصة بالـ Bot
// ==========================

// ⚙️ إعدادات البوت
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

// 📈 بيانات استراتيجيات وأزواج التداول
export async function getTradingPairs() {
  const res = await api.get('/bot/trading-pairs');
  return res.data;
}

export async function getTradingStrategies() {
  const res = await api.get('/bot/trading-strategies');
  return res.data;
}

// 🧠 حالة الأداء والهستوري
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
//   Export افتراضي للـ instance
//   يستخدمه botService: `import api from './api'`
// ==========================
export default api;
// =====================================================
// 🧠 دوال تحكم البوت (تكميلية للمنظومة الحالية)
// =====================================================

/**
 * تفعيل البوت التداولي من الواجهة الأمامية
 * يعتمد على مسار /api/bot/activate في الباكيند
 */
export async function activateTradingBot() {
  const response = await api.post('/api/bot/activate', {
    action: 'start', // لو الباكيند يستخدم payload مختلف، عدّله هنا
  });
  return response.data;
}

/**
 * إيقاف البوت التداولي
 * يعتمد على نفس المسار مع action مختلف
 */
export async function deactivateTradingBot() {
  const response = await api.post('/api/bot/activate', {
    action: 'stop', // لو الباكيند يستخدم /api/bot/deactivate غيره هنا
  });
  return response.data;
}

/**
 * جلب تحليلات التداول المتقدمة (للرسوم والتحليلات في BotPerformance)
 * إذا كان عندك مسار مختلف في الباكيند، عدّل الـ URL أدناه فقط.
 */
export async function getTradingAnalytics(timeRange = '24h') {
  const response = await api.get('/api/bot/performance/analytics', {
    params: { range: timeRange },
  });
  return response.data;
}
