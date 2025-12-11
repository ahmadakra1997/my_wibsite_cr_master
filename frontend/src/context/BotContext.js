// frontend/src/context/BotContext.js
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import botService from '../services/botService';

// أنواع الإجراءات
const BOT_ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BOT_STATUS: 'SET_BOT_STATUS',
  SET_BOT_PERFORMANCE: 'SET_BOT_PERFORMANCE',
  SET_BOT_HISTORY: 'SET_BOT_HISTORY',
  RESET_BOT: 'RESET_BOT',
};

// الحالة الابتدائية
const initialState = {
  loading: false,
  error: null,
  botStatus: null,
  botPerformance: null,
  botHistory: [],
};

// Reducer لإدارة الحالة
function botReducer(state, action) {
  switch (action.type) {
    case BOT_ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case BOT_ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case BOT_ACTION_TYPES.SET_BOT_STATUS:
      return {
        ...state,
        botStatus: action.payload,
        error: null,
      };

    case BOT_ACTION_TYPES.SET_BOT_PERFORMANCE:
      return {
        ...state,
        botPerformance: action.payload,
        error: null,
      };

    case BOT_ACTION_TYPES.SET_BOT_HISTORY:
      return {
        ...state,
        botHistory: Array.isArray(action.payload) ? action.payload : [],
        error: null,
      };

    case BOT_ACTION_TYPES.RESET_BOT:
      return initialState;

    default:
      return state;
  }
}

// إنشاء السياق
const BotContext = createContext(null);

// Provider للسياق
export function BotProvider({ children }) {
  const [state, dispatch] = useReducer(botReducer, initialState);

  const setLoading = (value) => {
    dispatch({ type: BOT_ACTION_TYPES.SET_LOADING, payload: value });
  };

  const setError = (error) => {
    dispatch({
      type: BOT_ACTION_TYPES.SET_ERROR,
      payload: error instanceof Error ? error.message : error,
    });
  };

  // تحميل حالة البوت من الـ API
  const loadBotStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await botService.getBotStatus();
      dispatch({ type: BOT_ACTION_TYPES.SET_BOT_STATUS, payload: status });
    } catch (error) {
      console.error('[BotContext] Failed to load bot status:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل أداء البوت من الـ API
  const loadBotPerformance = useCallback(async () => {
    setLoading(true);
    try {
      const performance = await botService.getPerformanceMetrics();
      dispatch({
        type: BOT_ACTION_TYPES.SET_BOT_PERFORMANCE,
        payload: performance,
      });
    } catch (error) {
      console.error('[BotContext] Failed to load bot performance:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل سجل التداول / تاريخ البوت
  const loadBotHistory = useCallback(async () => {
    setLoading(true);
    try {
      const history = await botService.getTradingHistory();
      dispatch({
        type: BOT_ACTION_TYPES.SET_BOT_HISTORY,
        payload: history,
      });
    } catch (error) {
      console.error('[BotContext] Failed to load bot history:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل مبدئي عند فتح Dashboard
  useEffect(() => {
    // نستدعيها بالتوازي
    loadBotStatus();
    loadBotPerformance();
    loadBotHistory();
  }, [loadBotStatus, loadBotPerformance, loadBotHistory]);

  const resetBotState = () => {
    dispatch({ type: BOT_ACTION_TYPES.RESET_BOT });
  };

  const hasActiveBot = !!state.botStatus?.isActive;

  const value = {
    ...state,
    hasActiveBot,
    loadBotStatus,
    loadBotPerformance,
    loadBotHistory,
    resetBotState,
  };

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
}

// Hook مخصص لاستخدام السياق
export function useBot() {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
}

export default BotContext;
