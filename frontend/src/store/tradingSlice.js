// frontend/src/store/tradingSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  connectionStatus: 'disconnected',

  loading: {
    ticker: false,
    orderBook: false,
    trades: false,
    positions: false,
    risk: false,
    performance: false,
    ai: false,
  },

  errors: {
    ticker: null,
    orderBook: null,
    trades: null,
    positions: null,
    risk: null,
    performance: null,
    ai: null,
    general: null,
  },

  // Live blocks
  ticker: null, // { symbol, price, ... }
  orderBook: { bids: [], asks: [], lastUpdate: null },
  tradeHistory: { trades: [], lastUpdate: null },
  positions: [],

  // Analytics blocks
  riskAssessment: null,
  performanceMetrics: null,
  aiSignals: null,

  // UI prefs / helpers
  activePair: 'BTCUSDT',
  timeframe: '1m',
  chartData: null,

  maxTrades: 50,
  lastUpdatedAt: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    // -------------------------
    // Connection
    // -------------------------
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload || 'disconnected';
      state.lastUpdatedAt = new Date().toISOString();
    },

    // -------------------------
    // Generic Loading / Error
    // -------------------------
    setLoading(state, action) {
      const { key, value } = action.payload || {};
      if (key && key in state.loading) state.loading[key] = !!value;
    },

    setError(state, action) {
      const { key, error } = action.payload || {};
      if (key && key in state.errors) state.errors[key] = error || null;
      else state.errors.general = error || null;
    },

    clearError(state, action) {
      const key = action.payload;
      if (key && key in state.errors) state.errors[key] = null;
      else state.errors.general = null;
    },

    // -------------------------
    // Unified setters
    // -------------------------
    setTradingData(state, action) {
      const patch = action.payload || {};
      Object.keys(patch).forEach((k) => {
        state[k] = patch[k];
      });
      state.lastUpdatedAt = new Date().toISOString();
    },

    setTradeHistory(state, action) {
      const payload = action.payload;
      const trades = Array.isArray(payload?.trades)
        ? payload.trades
        : Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
      state.tradeHistory = {
        trades,
        lastUpdate: new Date().toISOString(),
      };
      state.lastUpdatedAt = new Date().toISOString();
    },

    updatePosition(state, action) {
      const p = action.payload;
      if (!p) return;

      const id = p.id || p.positionId || `${p.symbol || ''}-${p.side || ''}`;
      const idx = state.positions.findIndex((x) => (x.id || x.positionId || `${x.symbol || ''}-${x.side || ''}`) === id);

      if (idx >= 0) state.positions[idx] = { ...state.positions[idx], ...p };
      else state.positions.unshift(p);

      state.lastUpdatedAt = new Date().toISOString();
    },

    positionUpdated(state, action) {
      // alias رسمي حتى لا نكسر أي imports قديمة
      const p = action.payload;
      if (!p) return;

      const id = p.id || p.positionId || `${p.symbol || ''}-${p.side || ''}`;
      const idx = state.positions.findIndex((x) => (x.id || x.positionId || `${x.symbol || ''}-${x.side || ''}`) === id);

      if (idx >= 0) state.positions[idx] = { ...state.positions[idx], ...p };
      else state.positions.unshift(p);

      state.lastUpdatedAt = new Date().toISOString();
    },

    tradeExecuted(state, action) {
      const t = action.payload;
      if (!t) return;

      const current = Array.isArray(state.tradeHistory?.trades) ? state.tradeHistory.trades : [];
      const next = [t, ...current].slice(0, state.maxTrades || 50);

      state.tradeHistory = {
        trades: next,
        lastUpdate: new Date().toISOString(),
      };
      state.lastUpdatedAt = new Date().toISOString();
    },

    // -------------------------
    // Dedicated channel reducers
    // -------------------------
    orderBookLoading(state) {
      state.loading.orderBook = true;
      state.errors.orderBook = null;
    },
    tradesLoading(state) {
      state.loading.trades = true;
      state.errors.trades = null;
    },
    tickerLoading(state) {
      state.loading.ticker = true;
      state.errors.ticker = null;
    },

    orderBookError(state, action) {
      state.loading.orderBook = false;
      state.errors.orderBook = action.payload || 'OrderBook error';
    },
    tradesError(state, action) {
      state.loading.trades = false;
      state.errors.trades = action.payload || 'Trades error';
    },
    tickerError(state, action) {
      state.loading.ticker = false;
      state.errors.ticker = action.payload || 'Ticker error';
    },

    orderBookUpdated(state, action) {
      const payload = action.payload || {};
      const bids = Array.isArray(payload?.bids) ? payload.bids : Array.isArray(payload?.buy) ? payload.buy : [];
      const asks = Array.isArray(payload?.asks) ? payload.asks : Array.isArray(payload?.sell) ? payload.sell : [];

      state.orderBook = {
        bids,
        asks,
        lastUpdate: new Date().toISOString(),
      };

      state.loading.orderBook = false;
      state.errors.orderBook = null;
      state.lastUpdatedAt = new Date().toISOString();
    },

    tradesUpdated(state, action) {
      const payload = action.payload;
      const trades = Array.isArray(payload?.trades)
        ? payload.trades
        : Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

      state.tradeHistory = {
        trades: trades.slice(0, state.maxTrades || 50),
        lastUpdate: new Date().toISOString(),
      };

      state.loading.trades = false;
      state.errors.trades = null;
      state.lastUpdatedAt = new Date().toISOString();
    },

    tickerUpdated(state, action) {
      state.ticker = action.payload || null;
      state.loading.ticker = false;
      state.errors.ticker = null;
      state.lastUpdatedAt = new Date().toISOString();
    },

    // -------------------------
    // Analytics setters
    // -------------------------
    setAISignals(state, action) {
      state.aiSignals = action.payload ?? null;
      state.loading.ai = false;
      state.errors.ai = null;
      state.lastUpdatedAt = new Date().toISOString();
    },

    setPerformanceMetrics(state, action) {
      state.performanceMetrics = action.payload ?? null;
      state.loading.performance = false;
      state.errors.performance = null;
      state.lastUpdatedAt = new Date().toISOString();
    },

    setRiskAssessment(state, action) {
      state.riskAssessment = action.payload ?? null;
      state.loading.risk = false;
      state.errors.risk = null;
      state.lastUpdatedAt = new Date().toISOString();
    },

    setMaxTrades(state, action) {
      const n = Number(action.payload);
      if (Number.isFinite(n) && n > 0) state.maxTrades = Math.min(500, Math.max(5, n));
    },

    // -------------------------
    // Preferences
    // -------------------------
    setActivePair(state, action) {
      state.activePair = action.payload || state.activePair;
    },
    setTimeframe(state, action) {
      state.timeframe = action.payload || state.timeframe;
    },
    setChartData(state, action) {
      state.chartData = action.payload ?? null;
    },

    // -------------------------
    // Reset
    // -------------------------
    resetTradingState() {
      return { ...initialState };
    },
  },
});

export const {
  setConnectionStatus,
  setLoading,
  setError,
  clearError,
  setTradingData,
  setTradeHistory,
  updatePosition,
  positionUpdated,
  tradeExecuted,

  orderBookLoading,
  tradesLoading,
  tickerLoading,
  orderBookUpdated,
  tradesUpdated,
  tickerUpdated,
  orderBookError,
  tradesError,
  tickerError,

  setAISignals,
  setPerformanceMetrics,
  setRiskAssessment,
  setMaxTrades,

  // compatibility + UI prefs
  setActivePair,
  setTimeframe,
  setChartData,

  resetTradingState,
} = tradingSlice.actions;

// ✅ Aliases لتوافق useTrading القديم (بدون كسر)
export const setMarketData = (data) => setTradingData({ marketData: data });
export const setOrderBook = (data) => orderBookUpdated(data);
export const setPositions = (positions) => setTradingData({ positions: Array.isArray(positions) ? positions : [] });
export const setRiskMetrics = (risk) => setRiskAssessment(risk);

export default tradingSlice.reducer;

// Selectors
export const selectTrading = (state) => state.trading;
export const selectOrderBook = (state) => state.trading.orderBook;
export const selectTradeHistory = (state) => state.trading.tradeHistory;
export const selectPositions = (state) => state.trading.positions;
export const selectConnectionStatus = (state) => state.trading.connectionStatus;
