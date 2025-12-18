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
  connectionStatus: 'disconnected',

  marketData: {},     // ticker/market snapshot
  ticker: null,       // optional convenience

  orderBook: { bids: [], asks: [], symbol: null, timestamp: null },
  tradeHistory: [],
  positions: [],
  chartData: [],

  aiSignals: [],
  performanceMetrics: null,
  riskAssessment: null,

  maxTrades: 50,

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
      // لو أضفتها لاحقًا في tradingService رح تشتغل مباشرة
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

    // --------- Market / Ticker ---------
    updateMarketData(state, action) {
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
    positionsLoading(state, action) {
      state.loading.positions = !!action.payload;
    },
    positionsError(state, action) {
      state.error.positions = action.payload || 'Positions error';
      state.loading.positions = false;
    },

    // --------- Trade execution / Position update (older names in your logs) ---------
    tradeExecuted(state, action) {
      const trade = action.payload;
      if (!trade) return;

      state.tradeHistory = [trade, ...state.tradeHistory].slice(0, state.maxTrades);
      state.lastUpdated.trades = new Date().toISOString();
    },

    positionUpdated(state, action) {
      const pos = action.payload;
      if (!pos) return;

      const idx = state.positions.findIndex((p) => (p?.id != null && p.id === pos.id) || (p?.symbol && pos?.symbol && p.symbol === pos.symbol));
      if (idx >= 0) state.positions[idx] = { ...state.positions[idx], ...pos };
      else state.positions.unshift(pos);

      state.lastUpdated.positions = new Date().toISOString();
    },

    updatePosition(state, action) {
      // alias of positionUpdated (يحافظ على imports القديمة)
      const pos = action.payload;
      if (!pos) return;

      const idx = state.positions.findIndex((p) => (p?.id != null && p.id === pos.id) || (p?.symbol && pos?.symbol && p.symbol === pos.symbol));
      if (idx >= 0) state.positions[idx] = { ...state.positions[idx], ...pos };
      else state.positions.unshift(pos);

      state.lastUpdated.positions = new Date().toISOString();
    },

    // --------- Generic (older API in your errors list) ---------
    setLoading(state, action) {
      // supports: boolean OR { scope: 'orderBook'|'trades'|..., value: boolean }
      if (typeof action.payload === 'boolean') {
        state.loading.global = action.payload;
        return;
      }
      const { scope = 'global', value = false } = action.payload || {};
      if (scope in state.loading) state.loading[scope] = !!value;
      else state.loading.global = !!value;
    },

    setError(state, action) {
      // supports: string OR { scope, error }
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
      else {
        Object.keys(state.error).forEach((k) => (state.error[k] = null));
      }
    },

    setTradeHistory(state, action) {
      state.tradeHistory = Array.isArray(action.payload) ? action.payload : state.tradeHistory;
    },

    setTradingData(state, action) {
      // bulk setter (يحافظ على وظائف قديمة)
      const p = action.payload || {};
      if (p.marketData) state.marketData = p.marketData;
      if (p.orderBook) state.orderBook = p.orderBook;
      if (Array.isArray(p.tradeHistory)) state.tradeHistory = p.tradeHistory;
      if (Array.isArray(p.positions)) state.positions = p.positions;
      if (Array.isArray(p.chartData)) state.chartData = p.chartData;
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
        state.error.global = action.payload || action.error.message || 'Failed to close position';
      });
  },
});

export default tradingSlice.reducer;

// -------------------- Actions (new names) --------------------
export const {
  setConnectionStatus,

  updateMarketData,
  tickerUpdated,
  tickerLoading,
  tickerError,

  orderBookUpdated,
  orderBookLoading,
  orderBookError,

  tradesUpdated,
  tradesLoading,
  tradesError,

  chartUpdated,
  chartLoading,
  chartError,

  positionsUpdated,
  positionsLoading,
  positionsError,

  tradeExecuted,
  positionUpdated,
  updatePosition,

  setLoading,
  setError,
  clearError,

  setTradeHistory,
  setTradingData,
  setAISignals,
  setMaxTrades,
  setPerformanceMetrics,
  setRiskAssessment,

  resetTradingState,
} = tradingSlice.actions;

// -------------------- Compatibility Aliases (الأسماء التي يتوقعها useTrading.js) --------------------
export const setMarketData = updateMarketData;

export const updateOrderBook = orderBookUpdated;
export const setOrderBookLoading = orderBookLoading;

export const updateChartData = chartUpdated;
export const setChartLoading = chartLoading;

export const updatePositions = positionsUpdated;
export const setPositionsLoading = positionsLoading;

export const setTradingError = (msg) => setError({ scope: 'global', error: msg });

// -------------------- Selectors (الأسماء التي ظهرت عندك بقائمة possible exports) --------------------
export const selectTrading = (state) => state.trading;
export const selectConnectionStatus = (state) => state.trading.connectionStatus;
export const selectOrderBook = (state) => state.trading.orderBook;
export const selectTradeHistory = (state) => state.trading.tradeHistory;
export const selectPositions = (state) => state.trading.positions;
