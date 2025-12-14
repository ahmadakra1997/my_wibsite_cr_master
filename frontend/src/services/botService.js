// frontend/src/services/botService.js - نسخة مصححة (بدون كسر)
// ✅ نفس endpoints والدوال الموجودة، فقط إصلاح Syntax وتحسين handleError

import api from './api';

class BotService {
  constructor() {
    this.baseURL = '/api/bot';
  }

  // خدمات البوت الأساسية
  async activateBot() {
    try {
      const response = await api.post(`${this.baseURL}/activate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deactivateBot() {
    try {
      const response = await api.post(`${this.baseURL}/deactivate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async restartBot() {
    try {
      const response = await api.post(`${this.baseURL}/restart`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async emergencyStop() {
    try {
      const response = await api.post(`${this.baseURL}/emergency-stop`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات حالة البوت وأدائه
  async getBotStatus() {
    try {
      const response = await api.get(`${this.baseURL}/status`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPerformanceMetrics(timeframe = '24h') {
    try {
      const tf = encodeURIComponent(timeframe);
      const response = await api.get(`${this.baseURL}/performance?timeframe=${tf}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTradingAnalytics(timeframe = '24h') {
    try {
      const tf = encodeURIComponent(timeframe);
      const response = await api.get(`${this.baseURL}/analytics?timeframe=${tf}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLiveMetrics() {
    try {
      const response = await api.get(`${this.baseURL}/metrics`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات السجل والتاريخ
  async getTradingHistory(limit = 50, offset = 0) {
    try {
      const response = await api.get(
        `${this.baseURL}/history?limit=${Number(limit)}&offset=${Number(offset)}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBotLogs(limit = 100, level = 'info') {
    try {
      const lv = encodeURIComponent(level);
      const response = await api.get(`${this.baseURL}/logs?limit=${Number(limit)}&level=${lv}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ⚙️ خدمات الإعدادات
  async getBotSettings() {
    try {
      const response = await api.get(`${this.baseURL}/settings`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateBotSettings(settings) {
    try {
      const response = await api.put(`${this.baseURL}/settings`, settings);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetBotSettings() {
    try {
      const response = await api.post(`${this.baseURL}/settings/reset`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async testBotSettings() {
    try {
      const response = await api.post(`${this.baseURL}/settings/test`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات الاتصال والاختبار
  async testExchangeConnection() {
    try {
      const response = await api.post(`${this.baseURL}/test-connection`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBotHealth() {
    try {
      const response = await api.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async validateBotConfig() {
    try {
      const response = await api.post(`${this.baseURL}/validate`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات البيانات الإضافية
  async getTradingPairs() {
    try {
      const response = await api.get(`${this.baseURL}/pairs`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTradingStrategies() {
    try {
      const response = await api.get(`${this.baseURL}/strategies`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBotStatistics() {
    try {
      const response = await api.get(`${this.baseURL}/statistics`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات النسخ الاحتياطي
  async backupBotConfig() {
    try {
      const response = await api.post(`${this.baseURL}/backup`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async restoreBotConfig(backupId) {
    try {
      const response = await api.post(`${this.baseURL}/restore`, { backupId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // خدمات النظام
  async getBotVersion() {
    try {
      const response = await api.get(`${this.baseURL}/version`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkEligibility() {
    try {
      const response = await api.get(`${this.baseURL}/eligibility`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ✅ معالج أخطاء مصحح (كان عندك مكسور بسبب newline داخل نص بين quotes) 
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
