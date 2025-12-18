// frontend/src/services/botService.js
import axios from 'axios';

const normalizeBase = (raw) => String(raw || '').trim().replace(/\/+$/, '');
const ensureApiSuffix = (base) => (/\/api(\/v\d+)?$/.test(base) ? base : `${base}/api`);

const BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

const API_URL = ensureApiSuffix(normalizeBase(BASE));

const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object' && 'success' in data) {
    if (data.success) return data.data;
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const fail = (err) => {
  const msg =
    err?.response?.data?.message ||
    err?.message ||
    'Network request failed';
  throw new Error(msg);
};

class BotService {
  async getBotStatus() {
    try {
      return unwrap(await axios.get(`${API_URL}/bot/status`));
    } catch (e) {
      fail(e);
    }
  }

  async getPerformanceMetrics(params = {}) {
    try {
      return unwrap(await axios.get(`${API_URL}/bot/metrics`, { params }));
    } catch (e) {
      fail(e);
    }
  }

  async getTradingHistory(params = {}) {
    try {
      return unwrap(await axios.get(`${API_URL}/bot/history`, { params }));
    } catch (e) {
      fail(e);
    }
  }

  async getBotSettings() {
    try {
      return unwrap(await axios.get(`${API_URL}/bot/settings`));
    } catch (e) {
      fail(e);
    }
  }

  async updateBotSettings(settings) {
    try {
      return unwrap(await axios.put(`${API_URL}/bot/settings`, settings));
    } catch (e) {
      fail(e);
    }
  }

  async activateBot(payload = {}) {
    try {
      return unwrap(await axios.post(`${API_URL}/bot/activate`, payload));
    } catch (e) {
      fail(e);
    }
  }

  async deactivateBot(payload = {}) {
    try {
      return unwrap(await axios.post(`${API_URL}/bot/deactivate`, payload));
    } catch (e) {
      fail(e);
    }
  }

  async controlBot(action, payload = {}) {
    try {
      return unwrap(await axios.post(`${API_URL}/bot/control`, { action, ...payload }));
    } catch (e) {
      fail(e);
    }
  }
}

export default new BotService();
