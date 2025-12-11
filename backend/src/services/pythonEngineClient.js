// backend/src/services/pythonEngineClient.js
// طبقة اتصال رسمية مع محرك التداول Python (FastAPI)
// لا تغيّر أي منطق تداول، فقط قناة HTTP منظمة

const axios = require('axios');
const pythonEngineConfig = require('../config/pythonEngine');
// لو عندك logger جاهز في utils استخدمه، وإلا يمكن لاحقًا إضافته
let logger;
try {
  logger = require('../utils/logger');
} catch (e) {
  logger = console;
}

class PythonEngineClient {
  constructor() {
    this.baseUrl = pythonEngineConfig.baseUrl;
    this.enabled =
      process.env.ENABLE_PYTHON_INTEGRATION === 'true' ||
      process.env.ENABLE_PYTHON_INTEGRATION === '1';
    this.defaultTimeout = Number(process.env.PYTHON_ENGINE_TIMEOUT || 8000);
  }

  ensureEnabled() {
    if (!this.enabled) {
      const error = new Error(
        'Python engine integration is disabled (ENABLE_PYTHON_INTEGRATION is not true)',
      );
      error.code = 'PYTHON_ENGINE_DISABLED';
      throw error;
    }
  }

  async getHealth() {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/health`;
    try {
      const res = await axios.get(url, { timeout: this.defaultTimeout });
      return res.data;
    } catch (err) {
      logger.error('[PythonEngineClient] getHealth error:', err.message);
      throw this.normalizeError(err, 'ENGINE_HEALTH_FAILED');
    }
  }

  async getStatus() {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/status`;
    try {
      const res = await axios.get(url, { timeout: this.defaultTimeout });
      return res.data;
    } catch (err) {
      logger.error('[PythonEngineClient] getStatus error:', err.message);
      throw this.normalizeError(err, 'ENGINE_STATUS_FAILED');
    }
  }

  async requestSignals(payload) {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/signals`;
    try {
      const res = await axios.post(url, payload, {
        timeout: this.defaultTimeout,
      });
      return res.data;
    } catch (err) {
      logger.error('[PythonEngineClient] requestSignals error:', err.message);
      throw this.normalizeError(err, 'ENGINE_SIGNALS_FAILED');
    }
  }

  async startBot(botId, config = {}) {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/bot/${encodeURIComponent(
      botId,
    )}/start`;
    try {
      const res = await axios.post(url, config, {
        timeout: this.defaultTimeout,
      });
      return res.data;
    } catch (err) {
      logger.error('[PythonEngineClient] startBot error:', err.message);
      throw this.normalizeError(err, 'ENGINE_BOT_START_FAILED');
    }
  }

  async pauseBot(botId) {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/bot/${encodeURIComponent(
      botId,
    )}/pause`;
    try {
      const res = await axios.post(url, {}, { timeout: this.defaultTimeout });
      return res.data;
    } catch (err) {
      logger.error('[PythonEngineClient] pauseBot error:', err.message);
      throw this.normalizeError(err, 'ENGINE_BOT_PAUSE_FAILED');
    }
  }

  async stopBot(botId) {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/bot/${encodeURIComponent(
      botId,
    )}/stop`;
    try {
      const res = await axios.post(url, {}, { timeout: this.defaultTimeout });
      return res.data;
    } catch (err) {
      logger.error('[PythonEngineClient] stopBot error:', err.message);
      throw this.normalizeError(err, 'ENGINE_BOT_STOP_FAILED');
    }
  }

  async updateBotConfig(botId, config) {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/bot/${encodeURIComponent(
      botId,
    )}/update-config`;
    try {
      const res = await axios.post(url, config, {
        timeout: this.defaultTimeout,
      });
      return res.data;
    } catch (err) {
      logger.error(
        '[PythonEngineClient] updateBotConfig error:',
        err.message,
      );
      throw this.normalizeError(err, 'ENGINE_BOT_UPDATE_CONFIG_FAILED');
    }
  }

  async backtest(params) {
    this.ensureEnabled();
    const url = `${this.baseUrl}/engine/backtest`;
    try {
      const res = await axios.post(url, params, {
        timeout: this.defaultTimeout * 3, // backtest قد يأخذ وقت أطول
      });
      return res.data;
    } catch (err) {
      logger.error('[PythonEngineClient] backtest error:', err.message);
      throw this.normalizeError(err, 'ENGINE_BACKTEST_FAILED');
    }
  }

  normalizeError(err, defaultCode) {
    const error = new Error(
      err.response?.data?.message ||
        err.message ||
        'Python engine request failed',
    );
    error.status = err.response?.status || 500;
    error.code = err.response?.data?.code || defaultCode;
    error.details = err.response?.data || null;
    return error;
  }
}

module.exports = new PythonEngineClient();
