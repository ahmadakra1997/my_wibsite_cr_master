// frontend/src/services/tradingService.js
/**
 * TradingService
 * Wrapper حول API endpoints للتداول.
 * ✅ تحسين: تطبيع الردود + نفس الدوال الموجودة بدون حذف + أخطاء أوضح.
 */

import api from './api';

const normalizeError = (e) => {
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    'Request failed';
  return msg;
};

const unwrap = (res) => {
  // يقبل axios response أو payload مباشر
  const payload = res?.data ?? res;

  // { success, data, error }
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (payload.success) return { ok: true, data: payload.data };
    return { ok: false, error: payload.error || payload.message || 'Request failed' };
  }

  // شكل آخر
  return { ok: true, data: payload };
};

class TradingService {
  async fetchMarketData(symbol) {
    try {
      const res = await api.get('/trading/market-data', { params: { symbol } });
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async createOrder(orderData) {
    try {
      const res = await api.post('/trading/order', orderData);
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async closePosition(positionId) {
    try {
      const res = await api.post(`/trading/position/${positionId}/close`);
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async getOpenOrders() {
    try {
      const res = await api.get('/trading/orders');
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async cancelOrder(orderId) {
    try {
      const res = await api.delete(`/trading/order/${orderId}`);
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async getTradeHistory(params = {}) {
    try {
      const res = await api.get('/trading/history', { params });
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async updateRiskSettings(settings) {
    try {
      const res = await api.put('/trading/risk-settings', settings);
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async getRiskMetrics() {
    try {
      const res = await api.get('/trading/risk-metrics');
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async getPerformanceData() {
    try {
      const res = await api.get('/trading/performance');
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async getAISignals(symbol) {
    try {
      const res = await api.get('/trading/ai-signals', { params: { symbol } });
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }

  async getSystemStatus() {
    try {
      const res = await api.get('/trading/status');
      const out = unwrap(res);
      return out.ok ? { success: true, data: out.data } : { success: false, error: out.error };
    } catch (e) {
      return { success: false, error: normalizeError(e) };
    }
  }
}

export default new TradingService();
export { TradingService };
