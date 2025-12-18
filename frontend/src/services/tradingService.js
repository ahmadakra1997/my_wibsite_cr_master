// frontend/src/services/tradingService.js
import api from './api';

class TradingService {
  constructor() {
    this.api = api;
  }

  _unwrap(res) {
    // يدعم:
    // axios => res.data
    // { success, data, message }
    const data = res?.data ?? res;
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success) return data.data;
      const msg = data.message || 'Request failed';
      throw new Error(msg);
    }
    return data;
  }

  _handleError(error, context = '') {
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'خطأ غير معروف';

    console.error(`[TradingService] ${context} error:`, error);
    return { success: false, error: msg };
  }

  async getPositions() {
    try {
      const res = await this.api.get('/trading/positions');
      const data = this._unwrap(res);
      return { success: true, data };
    } catch (error) {
      return this._handleError(error, 'getPositions');
    }
  }

  async closePosition(positionId) {
    try {
      const res = await this.api.post(`/trading/positions/${positionId}/close`);
      const data = this._unwrap(res);
      return { success: true, data };
    } catch (error) {
      return this._handleError(error, 'closePosition');
    }
  }

  async modifyPosition(positionId, modifications) {
    try {
      const res = await this.api.put(`/trading/positions/${positionId}`, modifications);
      const data = this._unwrap(res);
      return { success: true, data };
    } catch (error) {
      return this._handleError(error, 'modifyPosition');
    }
  }

  // ✅ إضافات توافق (اختيارية) — لا تكسر شيء حتى لو الباكيند ما يدعمها
  async getOrderBook(symbol) {
    try {
      const res = await this.api.get('/trading/orderbook', { params: { symbol } });
      const data = this._unwrap(res);
      return { success: true, data };
    } catch (error) {
      return this._handleError(error, 'getOrderBook');
    }
  }

  async getTradeHistory(params = {}) {
    try {
      const res = await this.api.get('/trading/history', { params });
      const data = this._unwrap(res);
      return { success: true, data };
    } catch (error) {
      return this._handleError(error, 'getTradeHistory');
    }
  }

  async getTicker(symbol) {
    try {
      const res = await this.api.get('/trading/ticker', { params: { symbol } });
      const data = this._unwrap(res);
      return { success: true, data };
    } catch (error) {
      return this._handleError(error, 'getTicker');
    }
  }
}

const tradingService = new TradingService();
export default tradingService;
