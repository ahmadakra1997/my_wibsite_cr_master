// frontend/src/context/BotContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  getBotStatus,
  getBotSettings,
  getPerformanceMetrics,
  updateBotSettings,
  activateTradingBot,
  deactivateTradingBot,
  controlBot,
} from '../services/api';

// ✅ تصدير الـ Context لتوافق أي imports قديمة مستقبلًا
export const BotContext = createContext(null);

export function BotProvider({ children }) {
  const [botStatus, setBotStatus] = useState(null);
  const [botSettings, setBotSettings] = useState(null);
  const [performance, setPerformance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBotData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, settings, perf] = await Promise.all([
        typeof getBotStatus === 'function' ? getBotStatus() : Promise.resolve(null),
        typeof getBotSettings === 'function' ? getBotSettings() : Promise.resolve(null),
        typeof getPerformanceMetrics === 'function' ? getPerformanceMetrics() : Promise.resolve(null),
      ]);

      setBotStatus(status ?? null);
      setBotSettings(settings ?? null);
      setPerformance(perf ?? null);
    } catch (err) {
      const msg = err?.message || 'Failed to load bot data';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // تحميل أولي بدون كسر
    loadBotData();
  }, [loadBotData]);

  const updateSettings = useCallback(async (newSettings = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (typeof updateBotSettings !== 'function') {
        throw new Error('updateBotSettings is not available in services/api.js');
      }
      const updated = await updateBotSettings(newSettings);
      setBotSettings(updated ?? newSettings);
      return updated;
    } catch (err) {
      const msg = err?.message || 'Failed to update settings';
      setError(String(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ✅ نحافظ على فكرة action بدون فرض شكل جديد:
   * - start/activate -> activateTradingBot
   * - stop/deactivate -> deactivateTradingBot
   * - غير ذلك -> controlBot(action)
   */
  const toggleBot = useCallback(async (action, payload = {}) => {
    setLoading(true);
    setError(null);
    try {
      const a = String(action || '').toLowerCase().trim();

      let res = null;
      if ((a === 'start' || a === 'activate' || a === 'on') && typeof activateTradingBot === 'function') {
        res = await activateTradingBot(payload);
      } else if ((a === 'stop' || a === 'deactivate' || a === 'off') && typeof deactivateTradingBot === 'function') {
        res = await deactivateTradingBot(payload);
      } else if (typeof controlBot === 'function') {
        res = await controlBot(action, payload);
      } else {
        throw new Error('No bot control method available in services/api.js');
      }

      setBotStatus(res ?? null);
      return res;
    } catch (err) {
      const msg = err?.message || 'Failed to control bot';
      setError(String(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      botStatus,
      botSettings,
      performance,
      loading,
      error,
      loadBotData,
      updateSettings,
      toggleBot,

      // ✅ نحافظ على setters كإمكانيات مستقبلية
      setBotStatus,
      setBotSettings,
      setPerformance,
    }),
    [botStatus, botSettings, performance, loading, error, loadBotData, updateSettings, toggleBot],
  );

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
}

export const useBot = () => {
  const context = useContext(BotContext);
  if (!context) throw new Error('useBot must be used within BotProvider');
  return context;
};

// لتوافق الاستيراد الموجود عندك: import BotProvider from './context/BotContext'
export default BotProvider;
