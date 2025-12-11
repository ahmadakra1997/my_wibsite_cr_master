// frontend/src/hooks/useBotData.js

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export const useBotData = () => {
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const [loadingBots, setLoadingBots] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // start / pause / stop / emergency
  const [error, setError] = useState(null);

  const fetchBots = useCallback(async () => {
    setLoadingBots(true);
    setError(null);
    try {
      const res = await apiClient.get('/bot');
      const list = res.data || [];
      setBots(list);
      // لو لا يوجد بوت مختار، اختر أول واحد
      if (!selectedBotId && list.length > 0) {
        setSelectedBotId(String(list[0]._id || list[0].id));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoadingBots(false);
    }
  }, [selectedBotId]);

  const fetchMetrics = useCallback(
    async (botId) => {
      if (!botId) return;
      setLoadingMetrics(true);
      setError(null);
      try {
        const res = await apiClient.get(`/bot/${botId}/metrics`);
        setMetrics(res.data || null);
      } catch (err) {
        setError(err);
      } finally {
        setLoadingMetrics(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  useEffect(() => {
    if (selectedBotId) {
      fetchMetrics(selectedBotId);
    }
  }, [selectedBotId, fetchMetrics]);

  const performAction = useCallback(
    async (botId, action, body = {}) => {
      if (!botId) throw new Error('No bot selected');
      setPendingAction(action);
      setError(null);
      try {
        const res = await apiClient.post(
          `/bot/${botId}/${action}`,
          body,
        );
        // بعد أي أكشن، حدّث قائمة البوتات والميتركس
        await fetchBots();
        await fetchMetrics(botId);
        return res;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setPendingAction(null);
      }
    },
    [fetchBots, fetchMetrics],
  );

  const startBot = (botId, configOverrides = {}) =>
    performAction(botId, 'start', configOverrides);

  const pauseBot = (botId) => performAction(botId, 'pause');

  const stopBot = (botId) => performAction(botId, 'stop');

  const emergencyStop = (botId) =>
    performAction(botId, 'emergency-stop');

  const updateSettings = async (botId, config) => {
    if (!botId) throw new Error('No bot selected');
    setPendingAction('settings');
    setError(null);
    try {
      const res = await apiClient.put(
        `/bot/${botId}/settings`,
        config,
      );
      await fetchMetrics(botId);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setPendingAction(null);
    }
  };

  return {
    bots,
    selectedBotId,
    setSelectedBotId,
    metrics,
    loadingBots,
    loadingMetrics,
    pendingAction,
    error,
    refreshBots: fetchBots,
    refreshMetrics: () => fetchMetrics(selectedBotId),
    startBot,
    pauseBot,
    stopBot,
    emergencyStop,
    updateSettings,
  };
};
