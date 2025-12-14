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

const BOT_ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BOT_STATUS: 'SET_BOT_STATUS',
  SET_BOT_PERFORMANCE: 'SET_BOT_PERFORMANCE',
  SET_BOT_HISTORY: 'SET_BOT_HISTORY',
  RESET_BOT: 'RESET_BOT',
};

const initialState = {
  loading: false,
  error: null,
  botStatus: null,
  botPerformance: null,
  botHistory: [],
};

function botReducer(state, action) {
  switch (action.type) {
    case BOT_ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };
    case BOT_ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload };
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
      return initialState;
    default:
      return state;
  }
}

const BotContext = createContext(null);

export function BotProvider({ children }) {
  const [state, dispatch] = useReducer(botReducer, initialState);

  // ✅ يمنع "تذبذب" loading عند تعدد الطلبات بالتوازي
  const loadingCountRef = useRef(0);
  const beginLoading = useCallback(() => {
    loadingCountRef.current += 1;
    dispatch({ type: BOT_ACTION_TYPES.SET_LOADING, payload: true });
  }, []);
  const endLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
    if (loadingCountRef.current === 0) {
      dispatch({ type: BOT_ACTION_TYPES.SET_LOADING, payload: false });
    }
  }, []);

  const setError = useCallback((error) => {
    const msg = error instanceof Error ? error.message : String(error || '');
    dispatch({ type: BOT_ACTION_TYPES.SET_ERROR, payload: msg });
  }, []);

  const loadBotStatus = useCallback(async () => {
    beginLoading();
    try {
      const status = await botService.getBotStatus();
      dispatch({ type: BOT_ACTION_TYPES.SET_BOT_STATUS, payload: status });
    } catch (error) {
      console.error('[BotContext] Failed to load bot status:', error);
      setError(error);
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading, setError]);

  const loadBotPerformance = useCallback(async () => {
    beginLoading();
    try {
      const performance = await botService.getPerformanceMetrics();
      dispatch({ type: BOT_ACTION_TYPES.SET_BOT_PERFORMANCE, payload: performance });
    } catch (error) {
      console.error('[BotContext] Failed to load bot performance:', error);
      setError(error);
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading, setError]);

  const loadBotHistory = useCallback(async () => {
    beginLoading();
    try {
      const history = await botService.getTradingHistory();
      dispatch({ type: BOT_ACTION_TYPES.SET_BOT_HISTORY, payload: history });
    } catch (error) {
      console.error('[BotContext] Failed to load bot history:', error);
      setError(error);
    } finally {
      endLoading();
    }
  }, [beginLoading, endLoading, setError]);

  useEffect(() => {
    // تحميل مبدئي بالتوازي
    loadBotStatus();
    loadBotPerformance();
    loadBotHistory();
  }, [loadBotStatus, loadBotPerformance, loadBotHistory]);

  const resetBotState = useCallback(() => {
    dispatch({ type: BOT_ACTION_TYPES.RESET_BOT });
  }, []);

  const hasActiveBot = !!state.botStatus?.isActive;

  const value = useMemo(
    () => ({
      ...state,
      hasActiveBot,
      loadBotStatus,
      loadBotPerformance,
      loadBotHistory,
      resetBotState,
    }),
    [state, hasActiveBot, loadBotStatus, loadBotPerformance, loadBotHistory, resetBotState],
  );

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
}

export function useBot() {
  const context = useContext(BotContext);
  if (!context) throw new Error('useBot must be used within a BotProvider');
  return context;
}

export default BotContext;
