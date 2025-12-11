// frontend/src/services/botService.js - النسخة المتكاملة والمحدثة
import api from './api';

class BotService {
  constructor() {
    this.baseURL = '/api/bot';
  }

  // 🎯 خدمات البوت الأساسية
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

  // 📊 خدمات حالة البوت وأدائه
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
      const response = await api.get(`${this.baseURL}/performance?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTradingAnalytics(timeframe = '24h') {
    try {
      const response = await api.get(`${this.baseURL}/analytics?timeframe=${timeframe}`);
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

  // 📋 خدمات السجل والتاريخ
  async getTradingHistory(limit = 50, offset = 0) {
    try {
      const response = await api.get(`${this.baseURL}/history?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBotLogs(limit = 100, level = 'info') {
    try {
      const response = await api.get(`${this.baseURL}/logs?limit=${limit}&level=${level}`);
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

  // 🔗 خدمات الاتصال والاختبار
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

  // 📈 خدمات البيانات الإضافية
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

  // 💾 خدمات النسخ الاحتياطي
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

  // 🔧 خدمات النظام
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

  // 🛡️ معالج الأخطاء المحسن
  handleError(error) {
    console.error('BotService Error:', error);

    if (error.response?.data) {
      const serverError = error.response.data;
      return new Error(
        serverError.message || 
        serverError.error || 
        'حدث خطأ في الخادم'
      );
    }

    if (error.request) {
      return new Error('فشل في الاتصال بالخادم. يرجى التحقق من اتصال الشبكة.');
    }

    return new Error('حدث خطأ غير متوقع');
  }

  // 🎯 دوال مساعدة للاستخدام السهل
  getStatusColor(status) {
    const statusColors = {
      active: 'success',
      inactive: 'secondary',
      paused: 'warning',
      error: 'danger',
      initializing: 'info'
    };
    return statusColors[status] || 'secondary';
  }

  formatProfitLoss(value) {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '+' : '-';
    return `${sign} $${absValue.toFixed(2)}`;
  }

  calculateEfficiency(winRate, totalProfit, maxDrawdown) {
    const winRateScore = winRate * 0.6;
    const profitScore = Math.min(totalProfit / 1000, 30);
    const drawdownPenalty = Math.max(0, maxDrawdown * 2);
    return Math.max(0, winRateScore + profitScore - drawdownPenalty);
  }
}

// إنشاء نسخة واحدة من الخدمة
const botService = new BotService();

// تصدير الخدمة والكلاس للاستخدام
export { BotService };
export default botService;
