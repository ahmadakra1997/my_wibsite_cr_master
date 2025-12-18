// frontend/src/store/tradingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tradingService from '../services/tradingService';

/**
 * ✅ هدف هذا الـ slice:
 * - يدعم أسماء الأكشن/السليكتور القديمة والجديدة بنفس الوقت (Compatibility Layer)
 * - يمنع أخطاء الـ compile في TradingInterface و useTrading
 * - ما بحذف أي وظيفة: فقط أضيف + أوحّد
 */

const initialState = {
  // Connection
  connectionStatus: 'disconnected',

  // Preferences (كانت ناقصة عندك)
  activePair: null,
  timeframe: '1m',

  // Market snapshot
  marketData: {},
  ticker: null,

  // Core datasets
  orderBook: { bids: [], asks: [], symbol: null, timestamp: null },
  tradeHistory: [],
  positions: [],
  chartData: [],

  // Analytics
  riskMetrics: null,          // ✅ جديد (للواجهة)
  riskAssessment: null,       // ✅ موجود سابقاً (نحافظ عليه)
  aiSignals: [],
  performanceMetrics: null,

  // Limits
  maxTrades: 50,

  // Loading/Error (scoped)
  loading: {
    global: false,
    orderBook: false,
    trades: false,
    ticker: false,
    chart: false,
    positions: false,
  },
  error: {
    global: null,
    orderBook: null,
    trades: null,
    ticker: null,
    chart: null,
    positions: null,
  },
  lastUpdated: {
    orderBook: null,
    trades: null,
    ticker: null,
    chart: null,
    positions: null,
    market: null,
  },
};

/**
 * ✅ thunk اختياري لإغلاق مركز
 * (لو ما عندك endpoint بالباكيند، رح يشتغل كـ optimistic update بدون كسر)
 */
export const closePosition = createAsyncThunk(
  'trading/closePosition',
  async (positionId, { rejectWithValue }) => {
    try {
      if (typeof tradingService?.closePosition === 'function') {
        await tradingService.closePosition(positionId);
      }
      return positionId;
    } catch (e) {
      return rejectWithValue(e?.message || 'Failed to close position');
    }
  }
);

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    // --------- Core status ---------
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload || 'disconnected';
    },

    // --------- Preferences (مطلوبة لتكامل الواجهة) ---------
    setActivePair(state, action) {
      state.activePair = action.payload ?? state.activePair;
    },
    setTimeframe(state, action) {
      state.timeframe = action.payload ?? state.timeframe;
    },

    // --------- Market / Ticker ---------
    updateMarketData(state, action) {
      const payload = action.payload || {};
      state.marketData = typeof payload === 'object' ? payload : state.marketData;
      state.lastUpdated.market = new Date().toISOString();
    },

    // ✅ اسم متوقع من useTrading
    setMarketData(state, action) {
      const payload = action.payload || {};
      state.marketData = typeof payload === 'object' ? payload : state.marketData;
      state.lastUpdated.market = new Date().toISOString();
    },

    tickerUpdated(state, action) {
      state.ticker = action.payload ?? state.ticker;
      state.loading.ticker = false;
      state.error.ticker = null;
      state.lastUpdated.ticker = new Date().toISOString();
    },
    tickerLoading(state, action) {
      state.loading.ticker = !!action.payload;
    },
    tickerError(state, action) {
      state.error.ticker = action.payload || 'Ticker error';
      state.loading.ticker = false;
    },

    // --------- OrderBook ---------
    orderBookUpdated(state, action) {
      state.orderBook = action.payload || state.orderBook;
      state.loading.orderBook = false;
      state.error.orderBook = null;
      state.lastUpdated.orderBook = new Date().toISOString();
    },

    // ✅ اسم متوقع من useTrading
    setOrderBook(state, action) {
      state.orderBook = action.payload || state.orderBook;
      state.lastUpdated.orderBook = new Date().toISOString();
    },

    orderBookLoading(state, action) {
      state.loading.orderBook = !!action.payload;
    },
    orderBookError(state, action) {
      state.error.orderBook = action.payload || 'OrderBook error';
      state.loading.orderBook = false;
    },

    // --------- Trades / History ---------
    tradesUpdated(state, action) {
      const items = action.payload;
      state.tradeHistory = Array.isArray(items) ? items : state.tradeHistory;
      state.loading.trades = false;
      state.error.trades = null;
      state.lastUpdated.trades = new Date().toISOString();
    },
    // ✅ اسم متوقع
    setTradeHistory(state, action) {
      state.tradeHistory = Array.isArray(action.payload) ? action.payload : state.tradeHistory;
      state.lastUpdated.trades = new Date().toISOString();
    },

    tradesLoading(state, action) {
      state.loading.trades = !!action.payload;
    },
    tradesError(state, action) {
      state.error.trades = action.payload || 'Trades error';
      state.loading.trades = false;
    },

    // --------- Chart ---------
    chartUpdated(state, action) {
      const items = action.payload;
      state.chartData = Array.isArray(items) ? items : state.chartData;
      state.loading.chart = false;
      state.error.chart = null;
      state.lastUpdated.chart = new Date().toISOString();
    },

    // ✅ اسم متوقع
    setChartData(state, action) {
      const items = action.payload;
      state.chartData = Array.isArray(items) ? items : state.chartData;
      state.lastUpdated.chart = new Date().toISOString();
    },

    chartLoading(state, action) {
      state.loading.chart = !!action.payload;
    },
    chartError(state, action) {
      state.error.chart = action.payload || 'Chart error';
      state.loading.chart = false;
    },

    // --------- Positions ---------
    positionsUpdated(state, action) {
      const items = action.payload;
      state.positions = Array.isArray(items) ? items : state.positions;
      state.loading.positions = false;
      state.error.positions = null;
      state.lastUpdated.positions = new Date().toISOString();
    },

    // ✅ اسم متوقع
    setPositions(state, action) {
      const items = action.payload;
      state.positions = Array.isArray(items) ? items : state.positions;
      state.lastUpdated.positions = new Date().toISOString();
    },

    positionsLoading(state, action) {
      state.loading.positions = !!action.payload;
    },
    positionsError(state, action) {
      state.error.positions = action.payload || 'Positions error';
      state.loading.positions = false;
    },

    // --------- Risk metrics (Front UI) ---------
    setRiskMetrics(state, action) {
      state.riskMetrics = action.payload ?? state.riskMetrics;
    },

    // --------- Trade execution / Position update (older names) ---------
    tradeExecuted(state, action) {
      const trade = action.payload;
      if (!trade) return;
      state.tradeHistory = [trade, ...state.tradeHistory].slice(0, state.maxTrades);
      state.lastUpdated.trades = new Date().toISOString();
    },
    positionUpdated(state, action) {
      const pos = action.payload;
      if (!pos) return;

      const idx = state.positions.findIndex(
        (p) =>
          (p?.id != null && p.id === pos.id) ||
          (p?.symbol && pos?.symbol && p.symbol === pos.symbol)
      );

      if (idx >= 0) state.positions[idx] = { ...state.positions[idx], ...pos };
      else state.positions.unshift(pos);

      state.lastUpdated.positions = new Date().toISOString();
    },
    updatePosition(state, action) {
      // alias of positionUpdated
      const pos = action.payload;
      if (!pos) return;

      const idx = state.positions.findIndex(
        (p) =>
          (p?.id != null && p.id === pos.id) ||
          (p?.symbol && pos?.symbol && p.symbol === pos.symbol)
      );

      if (idx >= 0) state.positions[idx] = { ...state.positions[idx], ...pos };
      else state.positions.unshift(pos);

      state.lastUpdated.positions = new Date().toISOString();
    },

    // --------- Generic (backward compatible) ---------
    setLoading(state, action) {
      if (typeof action.payload === 'boolean') {
        state.loading.global = action.payload;
        return;
      }
      const { scope = 'global', value = false } = action.payload || {};
      if (scope in state.loading) state.loading[scope] = !!value;
      else state.loading.global = !!value;
    },

    setError(state, action) {
      if (typeof action.payload === 'string') {
        state.error.global = action.payload;
        return;
      }
      const { scope = 'global', error = null } = action.payload || {};
      if (scope in state.error) state.error[scope] = error;
      else state.error.global = error;
    },

    clearError(state, action) {
      const scope = action.payload;
      if (scope && scope in state.error) state.error[scope] = null;
      else Object.keys(state.error).forEach((k) => (state.error[k] = null));
    },

    // bulk setter
    setTradingData(state, action) {
      const p = action.payload || {};
      if (p.marketData) state.marketData = p.marketData;
      if (p.orderBook) state.orderBook = p.orderBook;
      if (Array.isArray(p.tradeHistory)) state.tradeHistory = p.tradeHistory;
      if (Array.isArray(p.positions)) state.positions = p.positions;
      if (Array.isArray(p.chartData)) state.chartData = p.chartData;

      if (p.activePair != null) state.activePair = p.activePair;
      if (p.timeframe != null) state.timeframe = p.timeframe;
      if (p.riskMetrics != null) state.riskMetrics = p.riskMetrics;

      state.lastUpdated.market = new Date().toISOString();
    },

    setAISignals(state, action) {
      state.aiSignals = Array.isArray(action.payload) ? action.payload : state.aiSignals;
    },
    setPerformanceMetrics(state, action) {
      state.performanceMetrics = action.payload ?? state.performanceMetrics;
    },
    setRiskAssessment(state, action) {
      state.riskAssessment = action.payload ?? state.riskAssessment;
    },
    setMaxTrades(state, action) {
      const n = Number(action.payload);
      if (Number.isFinite(n) && n > 0) state.maxTrades = n;
    },

    resetTradingState() {
      return { ...initialState };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(closePosition.fulfilled, (state, action) => {
        const id = action.payload;
        if (!id) return;
        state.positions = state.positions.filter((p) => p?.id !== id);
      })
      .addCase(closePosition.rejected, (state, action) => {
        state.error.global =
          action.payload || action.error.message || 'Failed to close position';
      });
  },
});

export default tradingSlice.reducer;

export const {
  setConnectionStatus,

  setActivePair,
  setTimeframe,

  updateMarketData,
  setMarketData,

  tickerUpdated,
  tickerLoading,
  tickerError,

  orderBookUpdated,
  setOrderBook,
  orderBookLoading,
  orderBookError,

  tradesUpdated,
  setTradeHistory,
  tradesLoading,
  tradesError,

  chartUpdated,
  setChartData,
  chartLoading,
  chartError,

  positionsUpdated,
  setPositions,
  positionsLoading,
  positionsError,

  setRiskMetrics,

  tradeExecuted,
  positionUpdated,
  updatePosition,

  setLoading,
  setError,
  clearError,

  setTradingData,
  setAISignals,
  setMaxTrades,
  setPerformanceMetrics,
  setRiskAssessment,

  resetTradingState,
} = tradingSlice.actions;

// -------------------- Selectors --------------------
export const selectTrading = (state) => state.trading;
export const selectConnectionStatus = (state) => state.trading.connectionStatus;
export const selectOrderBook = (state) => state.trading.orderBook;
export const selectTradeHistory = (state) => state.trading.tradeHistory;
export const selectPositions = (state) => state.trading.positions;
export const selectActivePair = (state) => state.trading.activePair;
export const selectTimeframe = (state) => state.trading.timeframe;
