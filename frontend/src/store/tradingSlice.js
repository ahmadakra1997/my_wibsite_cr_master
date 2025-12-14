import { createSlice } from '@reduxjs/toolkit';

/**
 * tradingSlice
 * مركز حالة التداول في الواجهة:
 * - WebSocket connectionStatus
 * - OrderBook / Trades / Ticker
 * - Chart data
 * - AI signals
 * - Positions + performance
 */
const initialState = {
  // حالة الاتصال بالـ WebSocket
  connectionStatus: 'disconnected', // 'connecting' | 'open' | 'closed' | 'error'

  // دفتر الأوامر
  orderBook: null,
  isLoadingOrderBook: false,
  orderBookError: null,

  // سجل الصفقات
  trades: [],
  isLoadingTrades: false,
  tradesError: null,
  maxTrades: 200, // الحد الأقصى لحفظ الصفقات في الذاكرة

  // التيكر (آخر سعر / تغيّرات)
  ticker: null,
  isLoadingTicker: false,
  tickerError: null,

  // بيانات الشارت الحي (LiveCharts)
  chartLoading: false,
  chartData: null,
  chartError: null,

  // إشارات الذكاء الاصطناعي (AISignals)
  aiSignals: [],
  isLoadingAiSignals: false,
  aiSignalsError: null,

  // المراكز (لـ PerformanceAnalytics / PositionManager / PositionStats)
  positions: [],
  // ملاحظة: PerformanceAnalytics و PositionManager يقرآن isLoading مباشرة من trading
  isLoading: false,
  positionsError: null,

  // بيانات سوقية مساعدة لتحليل المخاطر (RiskService)
  marketData: {},

  // خطأ عام للتداول (للـ UI العام مثل LiveCharts)
  error: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    // -----------------------------
    // WebSocket status
    // -----------------------------
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload || 'disconnected';
    },

    // -----------------------------
    // Order Book
    // -----------------------------
    orderBookLoading(state) {
      state.isLoadingOrderBook = true;
      state.orderBookError = null;
    },
    orderBookUpdated(state, action) {
      state.isLoadingOrderBook = false;
      state.orderBookError = null;
      state.orderBook = {
        ...(action.payload || {}),
        updatedAt: action.payload?.updatedAt || Date.now(),
      };
    },
    orderBookError(state, action) {
      state.isLoadingOrderBook = false;
      state.orderBookError = action.payload || 'Order book error';
    },

    // -----------------------------
    // Trades
    // -----------------------------
    tradesLoading(state) {
      state.isLoadingTrades = true;
      state.tradesError = null;
    },
    tradesUpdated(state, action) {
      state.isLoadingTrades = false;
      state.tradesError = null;

      const incoming = Array.isArray(action.payload)
        ? action.payload
        : action.payload
        ? [action.payload]
        : [];

      const merged = [...incoming, ...state.trades];

      // نحتفظ بعدد محدود فقط (أحدث الصفقات أولاً)
      state.trades = merged.slice(0, state.maxTrades);
    },
    tradePushed(state, action) {
      if (!action.payload) return;
      state.trades = [action.payload, ...state.trades].slice(
        0,
        state.maxTrades,
      );
    },
    tradesError(state, action) {
      state.isLoadingTrades = false;
      state.tradesError = action.payload || 'Trades error';
    },

    // -----------------------------
    // Ticker
    // -----------------------------
    tickerLoading(state) {
      state.isLoadingTicker = true;
      state.tickerError = null;
    },
    tickerUpdated(state, action) {
      state.isLoadingTicker = false;
      state.tickerError = null;
      state.ticker = action.payload || null;
    },
    tickerError(state, action) {
      state.isLoadingTicker = false;
      state.tickerError = action.payload || 'Ticker error';
    },

    // -----------------------------
    // Chart (LiveCharts integration)
    // -----------------------------
    setChartLoading(state, action) {
      const value =
        typeof action.payload === 'boolean' ? action.payload : true;
      state.chartLoading = value;
      if (value) {
        state.chartError = null;
      }
    },
    updateChartData(state, action) {
      state.chartLoading = false;
      state.chartError = null;
      state.chartData = action.payload || null;
    },
    chartError(state, action) {
      state.chartLoading = false;
      state.chartError = action.payload || 'Chart error';
    },

    // خطأ تداول عام (يُستخدم مثلاً في LiveCharts كـ globalError)
    setTradingError(state, action) {
      state.error = action.payload || null;
    },

    // -----------------------------
    // AI Signals (AISignals.jsx)
    // -----------------------------
    aiSignalsLoading(state) {
      state.isLoadingAiSignals = true;
      state.aiSignalsError = null;
    },
    aiSignalsUpdated(state, action) {
      state.isLoadingAiSignals = false;
      state.aiSignalsError = null;
      state.aiSignals = Array.isArray(action.payload)
        ? action.payload
        : action.payload
        ? [action.payload]
        : [];
    },
    aiSignalsError(state, action) {
      state.isLoadingAiSignals = false;
      state.aiSignalsError = action.payload || 'AI signals error';
    },

    // -----------------------------
    // Positions / Performance
    // -----------------------------
    setPositionsLoading(state, action) {
      const value =
        typeof action.payload === 'boolean' ? action.payload : true;
      state.isLoading = value;
      state.positionsError = null;
    },
    updatePositions(state, action) {
      state.isLoading = false;
      const positionsArray = Array.isArray(action.payload)
        ? action.payload
        : action.payload
        ? [action.payload]
        : [];
      state.positions = positionsArray;
    },
    positionsError(state, action) {
      state.isLoading = false;
      state.positionsError = action.payload || 'Positions error';
    },
    closePosition(state, action) {
      const id = action.payload;
      if (!id) return;

      state.positions = state.positions.map((pos) => {
        if (pos.id === id || pos.positionId === id) {
          return {
            ...pos,
            status: pos.status || 'closed',
          };
        }
        return pos;
      });
    },

    // تحديث بيانات السوق المساعدة لتحليل المخاطر
    updateMarketData(state, action) {
      state.marketData = action.payload || {};
    },
  },
});

export const {
  setConnectionStatus,
  // order book
  orderBookLoading,
  orderBookUpdated,
  orderBookError,
  // trades
  tradesLoading,
  tradesUpdated,
  tradePushed,
  tradesError,
  // ticker
  tickerLoading,
  tickerUpdated,
  tickerError,
  // chart
  setChartLoading,
  updateChartData,
  chartError,
  // global trading error
  setTradingError,
  // AI signals
  aiSignalsLoading,
  aiSignalsUpdated,
  aiSignalsError,
  // positions / performance
  setPositionsLoading,
  updatePositions,
  positionsError,
  closePosition,
  // market data
  updateMarketData,
} = tradingSlice.actions;

export default tradingSlice.reducer;
