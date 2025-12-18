// frontend/src/context/BotContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import botService from '../services/botService';

const BotContext = createContext(null);

const normalizeError = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  return err?.response?.data?.message || err?.message || 'Request failed';
};

export function BotProvider({ children }) {
  const mountedRef = useRef(true);

  const [botStatus, setBotStatus] = useState(null);
  const [botPerformance, setBotPerformance] = useState(null);
  const [botSettings, setBotSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasActiveBot = useMemo(() => {
    const s = botStatus;
    if (!s) return false;
    return Boolean(s?.isActive ?? s?.active ?? (s?.status === 'active'));
  }, [botStatus]);

  const safeSet = (setter) => (value) => {
    if (mountedRef.current) setter(value);
  };

  const loadBotStatus = useCallback(async () => {
    try {
      const data = await botService.getBotStatus();
      safeSet(setBotStatus)(data);
      return data;
    } catch (e) {
      safeSet(setError)(normalizeError(e));
      return null;
    }
  }, []);

  const loadBotPerformance = useCallback(async (params = {}) => {
    try {
      const data = await botService.getPerformanceMetrics(params);
      safeSet(setBotPerformance)(data);
      return data;
    } catch (e) {
      safeSet(setError)(normalizeError(e));
      return null;
    }
  }, []);

  const loadBotSettings = useCallback(async () => {
    try {
      const data = await botService.getBotSettings();
      safeSet(setBotSettings)(data);
      return data;
    } catch (e) {
      safeSet(setError)(normalizeError(e));
      return null;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    safeSet(setError)(null);
    safeSet(setLoading)(true);
    try {
      await Promise.all([
        loadBotStatus(),
        loadBotPerformance({ range: '24h' }),
        loadBotSettings(),
      ]);
    } finally {
      safeSet(setLoading)(false);
    }
  }, [loadBotPerformance, loadBotSettings, loadBotStatus]);

  const activateBot = useCallback(async (payload = {}) => {
    safeSet(setError)(null);
    try {
      await botService.activateBot(payload);
      await refreshAll();
      return true;
    } catch (e) {
      safeSet(setError)(normalizeError(e));
      return false;
    }
  }, [refreshAll]);

  const deactivateBot = useCallback(async (payload = {}) => {
    safeSet(setError)(null);
    try {
      await botService.deactivateBot(payload);
      await refreshAll();
      return true;
    } catch (e) {
      safeSet(setError)(normalizeError(e));
      return false;
    }
  }, [refreshAll]);

  const updateBotSettings = useCallback(async (nextSettings) => {
    safeSet(setError)(null);
    try {
      await botService.updateBotSettings(nextSettings);
      await loadBotSettings();
      return true;
    } catch (e) {
      safeSet(setError)(normalizeError(e));
      return false;
    }
  }, [loadBotSettings]);

  useEffect(() => {
    mountedRef.current = true;
    refreshAll();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshAll]);

  const value = useMemo(() => ({
    botStatus,
    botPerformance,
    botSettings,
    hasActiveBot,
    loading,
    error,

    loadBotStatus,
    loadBotPerformance,
    loadBotSettings,
    refreshAll,

    activateBot,
    deactivateBot,
    updateBotSettings,
  }), [
    botStatus,
    botPerformance,
    botSettings,
    hasActiveBot,
    loading,
    error,
    loadBotStatus,
    loadBotPerformance,
    loadBotSettings,
    refreshAll,
    activateBot,
    deactivateBot,
    updateBotSettings,
  ]);

  return (
    <BotContext.Provider value={value}>
      {children}
    </BotContext.Provider>
  );
}

export function useBot() {
  const ctx = useContext(BotContext);
  if (!ctx) throw new Error('useBot must be used within <BotProvider>');
  return ctx;
}

export default BotContext;
