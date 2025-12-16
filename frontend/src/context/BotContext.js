// frontend/src/context/BotContext.js
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
      return { ...state, loading: Boolean(action.payload) };

    case BOT_ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload ?? null };

    case BOT_ACTION_TYPES.SET_BOT_STATUS:
      return { ...state, botStatus: action.payload, error: null };

    case BOT_ACTION_TYPES.SET_BOT_PERFORMANCE:
      return { ...state, botPerformance: action.payload, error: null };

    case BOT_ACTION_TYPES.SET_BOT_HISTORY:
      return {
        ...state,
        botHistory: Array.isArray(action.payload) ? action.payload : [],
        error: null,
      };

    case BOT_ACTION_TYPES.RESET_BOT:
      return { ...initialState };

    default:
      return state;
  }
}

// إنشاء السياق
const BotContext = createContext(null);
BotContext.displayName = 'BotContext';

// Provider للسياق
export function BotProvider({ children }) {
  const [state, dispatch] = useReducer(botReducer, initialState);

  // لمنع تحديث state بعد unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // لمنع مشكلة الـ loading عند تشغيل طلبات بالتوازي
  const pendingRef = useRef(0);

  const safeDispatch = useCallback((action) => {
    if (!isMountedRef.current) return;
    dispatch(action);
  }, []);

  const beginRequest = useCallback(() => {
    pendingRef.current += 1;
    safeDispatch({ type: BOT_ACTION_TYPES.SET_LOADING, payload: true });
  }, [safeDispatch]);

  const endRequest = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    if (pendingRef.current === 0) {
      safeDispatch({ type: BOT_ACTION_TYPES.SET_LOADING, payload: false });
    }
  }, [safeDispatch]);

  const setError = useCallback(
    (error) => {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'حدث خطأ غير متوقع';
      safeDispatch({ type: BOT_ACTION_TYPES.SET_ERROR, payload: msg });
    },
    [safeDispatch]
  );

  // تحميل حالة البوت من الـ API
  const loadBotStatus = useCallback(async () => {
    beginRequest();
    try {
      const status = await botService.getBotStatus();
      safeDispatch({ type: BOT_ACTION_TYPES.SET_BOT_STATUS, payload: status });
    } catch (error) {
      console.error('[BotContext] Failed to load bot status:', error);
      setError(error);
    } finally {
      endRequest();
    }
  }, [beginRequest, endRequest, safeDispatch, setError]);

  // تحميل أداء البوت من الـ API
  const loadBotPerformance = useCallback(async () => {
    beginRequest();
    try {
      const performance = await botService.getPerformanceMetrics();
      safeDispatch({
        type: BOT_ACTION_TYPES.SET_BOT_PERFORMANCE,
        payload: performance,
      });
    } catch (error) {
      console.error('[BotContext] Failed to load bot performance:', error);
      setError(error);
    } finally {
      endRequest();
    }
  }, [beginRequest, endRequest, safeDispatch, setError]);

  // تحميل سجل التداول / تاريخ البوت
  const loadBotHistory = useCallback(async () => {
    beginRequest();
    try {
      const history = await botService.getTradingHistory();
      safeDispatch({ type: BOT_ACTION_TYPES.SET_BOT_HISTORY, payload: history });
    } catch (error) {
      console.error('[BotContext] Failed to load bot history:', error);
      setError(error);
    } finally {
      endRequest();
    }
  }, [beginRequest, endRequest, safeDispatch, setError]);

  // تحميل مبدئي عند فتح Dashboard
  useEffect(() => {
    loadBotStatus();
    loadBotPerformance();
    loadBotHistory();
  }, [loadBotStatus, loadBotPerformance, loadBotHistory]);

  const resetBotState = useCallback(() => {
    safeDispatch({ type: BOT_ACTION_TYPES.RESET_BOT });
  }, [safeDispatch]);

  const hasActiveBot = Boolean(state?.botStatus?.isActive);

  const value = useMemo(
    () => ({
      ...state,
      hasActiveBot,
      loadBotStatus,
      loadBotPerformance,
      loadBotHistory,
      resetBotState,
    }),
    [state, hasActiveBot, loadBotStatus, loadBotPerformance, loadBotHistory, resetBotState]
  );

  // ✅ الإصلاح الحقيقي هنا
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
