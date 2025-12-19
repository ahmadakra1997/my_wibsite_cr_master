// frontend/src/context/BotContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { botAPI } from '../services/api';

const BotContext = createContext(null);

export const BotProvider = ({ children }) => {
  const [botStatus, setBotStatus] = useState(null);
  const [botSettings, setBotSettings] = useState(null);
  const [performance, setPerformance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBotData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hasApi =
        botAPI &&
        (typeof botAPI.getStatus === 'function' ||
          typeof botAPI.getSettings === 'function' ||
          typeof botAPI.getPerformance === 'function');

      if (!hasApi) {
        // لا نكسر الواجهة: فقط نعرض خطأ مفهوم
        throw new Error('Bot API is not available (botAPI methods missing).');
      }

      const [statusResponse, settingsResponse, performanceResponse] = await Promise.all([
        typeof botAPI.getStatus === 'function' ? botAPI.getStatus() : Promise.resolve(null),
        typeof botAPI.getSettings === 'function' ? botAPI.getSettings() : Promise.resolve(null),
        typeof botAPI.getPerformance === 'function' ? botAPI.getPerformance() : Promise.resolve(null),
      ]);

      setBotStatus(statusResponse?.data ?? statusResponse ?? null);
      setBotSettings(settingsResponse?.data ?? settingsResponse ?? null);
      setPerformance(performanceResponse?.data ?? performanceResponse ?? null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load bot data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBotData();
  }, [loadBotData]);

  const updateSettings = useCallback(async (newSettings) => {
    setLoading(true);
    setError(null);

    try {
      if (!botAPI || typeof botAPI.updateSettings !== 'function') {
        throw new Error('botAPI.updateSettings is not available.');
      }

      const response = await botAPI.updateSettings(newSettings);
      setBotSettings(response?.data ?? response ?? newSettings);

      return response?.data ?? response;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update settings';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBot = useCallback(async (action) => {
    setLoading(true);
    setError(null);

    try {
      if (!botAPI) throw new Error('Bot API is not available.');

      // نحافظ على نفس فكرة action بدون فرض شكل جديد
      // إن كان عندك start/stop أو toggleBot في api، ندعمها كلها:
      const normalized = String(action || '').toLowerCase();

      let response = null;

      if (normalized === 'start' && typeof botAPI.start === 'function') {
        response = await botAPI.start();
      } else if (normalized === 'stop' && typeof botAPI.stop === 'function') {
        response = await botAPI.stop();
      } else if (typeof botAPI.toggleBot === 'function') {
        response = await botAPI.toggleBot(action);
      } else if (typeof botAPI.setStatus === 'function') {
        response = await botAPI.setStatus(action);
      } else {
        throw new Error('No suitable bot control method found in botAPI.');
      }

      setBotStatus(response?.data ?? response ?? null);
      return response?.data ?? response;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to control bot';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    botStatus,
    botSettings,
    performance,
    loading,
    error,
    loadBotData,
    updateSettings,
    toggleBot,
    setBotStatus,
    setBotSettings,
    setPerformance,
  };

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
};

export const useBot = () => {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBot must be used within BotProvider');
  }
  return context;
};

// لتوافق الاستيراد الموجود عندك: import BotProvider from './context/BotContext'
export default BotProvider;
