// frontend/src/services/botService.js
import api from './api';

class BotService {
  constructor() {
    const envBase = (process.env.REACT_APP_BOT_BASE_PATH || '/bot').trim();
    this.basePath = this.normalizeBasePath(envBase);
  }

  normalizeBasePath(path) {
    let p = path || '/bot';
    if (!p.startsWith('/')) p = `/${p}`;
    p = p.replace(/\/+$/, ''); // remove trailing slash

    // ✅ لو كتبنا /api/bot بالغلط، نزيل /api لأن api.js أصلاً مضاف فيه /api
    if (p.startsWith('/api/')) p = p.replace(/^\/api/, '');

    // fallback
    if (p === '') p = '/bot';
    return p;
  }

  url(endpoint) {
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.basePath}${ep}`;
  }

  // خدمات البوت الأساسية
  async activateBot(payload = {}) {
    try {
      const response = await api.post(this.url('/activate'), payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deactivateBot(payload = {}) {
    try {
      const response = await api.post(this.url('/deactivate'), payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async restartBot(payload = {}) {
    try {
      const response = await api.post(this.url('/restart'), payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async emergencyStop(payload = {}) {
    try {
      const response = await api.post(this.url('/emergency-stop'), payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات حالة البوت وأدائه
  async getBotStatus() {
    try {
      const response = await api.get(this.url('/status'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPerformanceMetrics(timeframe = '24h') {
    try {
      const tf = encodeURIComponent(timeframe);
      const response = await api.get(this.url(`/performance?timeframe=${tf}`));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTradingAnalytics(timeframe = '24h') {
    try {
      const tf = encodeURIComponent(timeframe);
      const response = await api.get(this.url(`/analytics?timeframe=${tf}`));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLiveMetrics() {
    try {
      const response = await api.get(this.url('/metrics'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات السجل والتاريخ
  async getTradingHistory(limit = 50, offset = 0) {
    try {
      const response = await api.get(
        this.url(`/history?limit=${Number(limit)}&offset=${Number(offset)}`)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBotLogs(limit = 100, level = 'info') {
    try {
      const lv = encodeURIComponent(level);
      const response = await api.get(this.url(`/logs?limit=${Number(limit)}&level=${lv}`));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ⚙️ خدمات الإعدادات
  async getBotSettings() {
    try {
      const response = await api.get(this.url('/settings'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateBotSettings(settings) {
    try {
      const response = await api.put(this.url('/settings'), settings);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetBotSettings() {
    try {
      const response = await api.post(this.url('/settings/reset'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async testBotSettings() {
    try {
      const response = await api.post(this.url('/settings/test'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات الاتصال والاختبار
  async testExchangeConnection() {
    try {
      const response = await api.post(this.url('/test-connection'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBotHealth() {
    try {
      const response = await api.get(this.url('/health'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async validateBotConfig() {
    try {
      const response = await api.post(this.url('/validate'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات البيانات الإضافية
  async getTradingPairs() {
    try {
      const response = await api.get(this.url('/pairs'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTradingStrategies() {
    try {
      const response = await api.get(this.url('/strategies'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBotStatistics() {
    try {
      const response = await api.get(this.url('/statistics'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات النسخ الاحتياطي
  async backupBotConfig() {
    try {
      const response = await api.post(this.url('/backup'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async restoreBotConfig(backupId) {
    try {
      const response = await api.post(this.url('/restore'), { backupId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات النظام
  async getBotVersion() {
    try {
      const response = await api.get(this.url('/version'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkEligibility() {
    try {
      const response = await api.get(this.url('/eligibility'));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ✅ معالج أخطاء
  handleError(error) {
    console.error('BotService Error:', error);

    if (error?.response?.data) {
      const serverError = error.response.data;
      return new Error(serverError.message || serverError.error || 'حدث خطأ في الخادم');
    }

    if (error?.request) {
      return new Error('فشل في الاتصال بالخادم.\nيرجى التحقق من اتصال الشبكة.');
    }

    return new Error(error?.message || 'حدث خطأ غير متوقع');
  }

  // دوال مساعدة (كما هي)
  getStatusColor(status) {
    const statusColors = {
      active: 'success',
      inactive: 'secondary',
      paused: 'warning',
      error: 'danger',
      initializing: 'info',
    };
    return statusColors[status] || 'secondary';
  }

  formatProfitLoss(value) {
    const num = Number(value) || 0;
    const absValue = Math.abs(num);
    const sign = num >= 0 ? '+' : '-';
    return `${sign} $${absValue.toFixed(2)}`;
  }

  calculateEfficiency(winRate, totalProfit, maxDrawdown) {
    const wr = Number(winRate) || 0;
    const tp = Number(totalProfit) || 0;
    const dd = Number(maxDrawdown) || 0;

    const winRateScore = wr * 0.6;
    const profitScore = Math.min(tp / 1000, 30);
    const drawdownPenalty = Math.max(0, dd * 2);

    return Math.max(0, winRateScore + profitScore - drawdownPenalty);
  }
}

const botService = new BotService();
export { BotService };
export default botService;
