// frontend/src/store/tradingSlice.js

import { createSlice } from '@reduxjs/toolkit';

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
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    // -----------------------------
    //      WebSocket status
    // -----------------------------
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload || 'disconnected';
    },

    // -----------------------------
    //        Order Book
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
    //         Trades
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
    //          Ticker
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
  },
});

export const {
  setConnectionStatus,
  orderBookLoading,
  orderBookUpdated,
  orderBookError,
  tradesLoading,
  tradesUpdated,
  tradePushed,
  tradesError,
  tickerLoading,
  tickerUpdated,
  tickerError,
} = tradingSlice.actions;

export default tradingSlice.reducer;
