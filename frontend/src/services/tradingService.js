// frontend/src/services/tradingService.js

import api, { tradingAPI } from './api';

/**
 * TradingService
 * طبقة خدمة للتعامل مع عمليات التداول من الواجهة الأمامية.
 * تُستخدم في مكون PositionManager وغيرها لإدارة المراكز.
 */
class TradingService {
  constructor() {
    this.baseURL = '/trading';
  }

  /**
   * جلب جميع المراكز من الخادم
   */
  async getPositions() {
    try {
      // نستخدم tradingAPI إن وجد، أو نسقط إلى endpoint مباشر
      const response =
        typeof tradingAPI?.getPositions === 'function'
          ? await tradingAPI.getPositions()
          : await api.get(`${this.baseURL}/positions`);

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'فشل في جلب المراكز');
    }
  }

  /**
   * إغلاق مركز محدد
   * @param {string|number} positionId
   * @param {object} closeData
   */
  async closePosition(positionId, closeData = {}) {
    if (!positionId) {
      throw new Error('positionId is required to close a position');
    }

    try {
      const path = `${this.baseURL}/positions/${encodeURIComponent(
        positionId
      )}/close`;

      const response = await api.post(path, closeData);
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'فشل في إغلاق المركز');
    }
  }

  /**
   * تعديل مركز (مثل تعديل وقف الخسارة أو جني الأرباح)
   * @param {string|number} positionId
   * @param {object} modificationData
   */
  async modifyPosition(positionId, modificationData = {}) {
    if (!positionId) {
      throw new Error('positionId is required to modify a position');
    }

    try {
      const path = `${this.baseURL}/positions/${encodeURIComponent(positionId)}`;
      const response = await api.put(path, modificationData);
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'فشل في تعديل المركز');
    }
  }

  /**
   * معالج أخطاء موحد للخدمة
   */
  _handleError(error, fallbackMessage) {
    const message =
      error?.data?.message ||
      error?.message ||
      fallbackMessage ||
      'خطأ غير متوقع في خدمة التداول';

    const wrapped = new Error(message);
    wrapped.originalError = error;
    return wrapped;
  }
}

export default TradingService;
