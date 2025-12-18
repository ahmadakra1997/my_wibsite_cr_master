// frontend/src/hooks/useBotData.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, {
  activateTradingBot,
  controlBot,
  deactivateTradingBot,
  getBotSettings,
  getBotStatus,
  getPerformanceMetrics,
  getTradingHistory,
  updateBotSettings,
} from '../services/api';
import { useWebSocket } from './useWebSocket';

const safeArray = (v) => (Array.isArray(v) ? v : []);
const unwrap = (res) =>
  res && typeof res === 'object' && 'success' in res
    ? (res.success ? res.data : null)
    : res;

const resolveBotIdAndPayload = (selectedBotId, first, second) => {
  // يدعم:
  // fn()
  // fn(botId)
  // fn(botId, payload)
  // fn(payload)
  if (typeof first === 'string') return [first, second ?? {}];
  return [selectedBotId, first ?? {}];
};

export function useBotData() {
  const mountedRef = useRef(true);

  const [bots, setBots] = useState([{ id: 'default', name: 'Trading Bot', status: 'unknown' }]);
  const [selectedBotId, setSelectedBotId] = useState('default');

  const [metrics, setMetrics] = useState({
    engineStatus: { status: 'unknown', lastUpdate: null },
    pnl: { daily: 0, weekly: 0, monthly: 0 },
    recentTrades: [],
    risk: { level: 'medium', exposure: 0, alerts: [] },
    settings: null,
  });

  const [loadingBots, setLoadingBots] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);

  const { lastMessage } = useWebSocket('bot-status');

  const safeSet = (setter) => (value) => {
    if (mountedRef.current) setter(value);
  };

  const refreshAll = useCallback(async () => {
    safeSet(setError)(null);
    safeSet(setLoadingBots)(true);
    safeSet(setLoadingMetrics)(true);

    try {
      const [statusRes, perfRes, historyRes, settingsRes] = await Promise.allSettled([
        getBotStatus(),
        getPerformanceMetrics({ range: '24h' }),
        getTradingHistory({ limit: 20 }),
        getBotSettings(),
      ]);

      const status = statusRes.status === 'fulfilled' ? unwrap(statusRes.value) : null;
      const perf = perfRes.status === 'fulfilled' ? unwrap(perfRes.value) : null;
      const history = historyRes.status === 'fulfilled' ? unwrap(historyRes.value) : null;
      const settings = settingsRes.status === 'fulfilled' ? unwrap(settingsRes.value) : null;

      const isActive = !!status?.isActive;

      safeSet(setBots)([
        {
          id: 'default',
          name: settings?.general?.botName || 'Trading Bot',
          status: isActive ? 'active' : 'paused',
        },
      ]);

      safeSet(setMetrics)((prev) => ({
        ...prev,
        engineStatus: {
          status: isActive ? 'active' : 'paused',
          lastUpdate: new Date().toISOString(),
          balance: status?.currentBalance ?? status?.balance ?? 0,
          activePairs: safeArray(status?.activePairs),
        },
        pnl: {
          daily: perf?.pnl?.daily ?? perf?.dailyPnl ?? prev.pnl.daily,
          weekly: perf?.pnl?.weekly ?? perf?.weeklyPnl ?? prev.pnl.weekly,
          monthly: perf?.pnl?.monthly ?? perf?.monthlyPnl ?? prev.pnl.monthly,
        },
        recentTrades: safeArray(history?.trades || history?.items || history).slice(0, 20),
        settings: settings || prev.settings,
      }));
    } catch (e) {
      console.error('[useBotData] refreshAll error:', e);
      safeSet(setError)(e?.message || 'فشل تحميل بيانات البوت');
    } finally {
      safeSet(setLoadingBots)(false);
      safeSet(setLoadingMetrics)(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshAll();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshAll]);

  useEffect(() => {
    if (!lastMessage) return;

    let data = null;
    try {
      data = typeof lastMessage === 'object' ? lastMessage : JSON.parse(lastMessage.data || lastMessage);
    } catch {
      return;
    }

    if (!data) return;

    if (data.type === 'status_update' || data.type === 'bot_status') {
      safeSet(setMetrics)((prev) => ({
        ...prev,
        engineStatus: {
          ...prev.engineStatus,
          status: data.isActive ? 'active' : 'paused',
          lastUpdate: new Date().toISOString(),
          balance: data.currentBalance ?? prev.engineStatus.balance,
          activePairs: safeArray(data.activePairs ?? prev.engineStatus.activePairs),
        },
      }));
    }

    if (data.type === 'trade_executed' && data.trade) {
      safeSet(setMetrics)((prev) => ({
        ...prev,
        recentTrades: [data.trade, ...safeArray(prev.recentTrades)].slice(0, 20),
      }));
    }
  }, [lastMessage]);

  const startBot = useCallback(async (botIdOrPayload, maybePayload) => {
    const [botId, payload] = resolveBotIdAndPayload(selectedBotId, botIdOrPayload, maybePayload);
    safeSet(setPendingAction)('start');
    safeSet(setError)(null);
    try {
      await activateTradingBot({ botId, ...payload });
      await refreshAll();
    } catch (e) {
      safeSet(setError)(e?.message || 'فشل تشغيل البوت');
    } finally {
      safeSet(setPendingAction)(null);
    }
  }, [refreshAll, selectedBotId]);

  const pauseBot = useCallback(async (botIdOrPayload, maybePayload) => {
    const [botId, payload] = resolveBotIdAndPayload(selectedBotId, botIdOrPayload, maybePayload);
    safeSet(setPendingAction)('pause');
    safeSet(setError)(null);
    try {
      await controlBot('pause', { botId, ...payload });
      await refreshAll();
    } catch (e) {
      try {
        await deactivateTradingBot({ botId });
        await refreshAll();
      } catch (e2) {
        safeSet(setError)(e2?.message || e?.message || 'فشل إيقاف/إيقاف مؤقت');
      }
    } finally {
      safeSet(setPendingAction)(null);
    }
  }, [refreshAll, selectedBotId]);

  const stopBot = useCallback(async (botIdOrPayload, maybePayload) => {
    const [botId] = resolveBotIdAndPayload(selectedBotId, botIdOrPayload, maybePayload);
    safeSet(setPendingAction)('stop');
    safeSet(setError)(null);
    try {
      await deactivateTradingBot({ botId });
      await refreshAll();
    } catch (e) {
      safeSet(setError)(e?.message || 'فشل إيقاف البوت');
    } finally {
      safeSet(setPendingAction)(null);
    }
  }, [refreshAll, selectedBotId]);

  const emergencyStop = useCallback(async (botIdOrPayload, maybePayload) => {
    const [botId] = resolveBotIdAndPayload(selectedBotId, botIdOrPayload, maybePayload);
    safeSet(setPendingAction)('emergency');
    safeSet(setError)(null);
    try {
      const res = await api.post('/bot/emergency-stop', { botId });
      if (res?.data?.success === false) throw new Error(res.data.message || 'Emergency stop failed');
      await refreshAll();
    } catch (e) {
      try {
        await deactivateTradingBot({ botId });
        await refreshAll();
      } catch (e2) {
        safeSet(setError)(e2?.message || e?.message || 'فشل إيقاف الطوارئ');
      }
    } finally {
      safeSet(setPendingAction)(null);
    }
  }, [refreshAll, selectedBotId]);

  const updateSettings = useCallback(async (botIdOrPatch, maybePatch) => {
    const botId = typeof botIdOrPatch === 'string' ? botIdOrPatch : selectedBotId;
    const patch = typeof botIdOrPatch === 'string' ? maybePatch : botIdOrPatch;

    if (!patch || typeof patch !== 'object') return;

    safeSet(setPendingAction)('settings');
    safeSet(setError)(null);

    try {
      const current = metrics.settings || (await unwrap(await getBotSettings())) || {};
      const merged = { ...current, ...patch, botId };
      await updateBotSettings(merged);
      await refreshAll();
    } catch (e) {
      safeSet(setError)(e?.message || 'فشل تحديث الإعدادات');
    } finally {
      safeSet(setPendingAction)(null);
    }
  }, [metrics.settings, refreshAll, selectedBotId]);

  return useMemo(() => ({
    bots,
    selectedBotId,
    setSelectedBotId,
    metrics,
    loadingBots,
    loadingMetrics,
    pendingAction,
    error,
    startBot,
    pauseBot,
    stopBot,
    emergencyStop,
    updateSettings,
    refreshAll,
  }), [
    bots,
    selectedBotId,
    metrics,
    loadingBots,
    loadingMetrics,
    pendingAction,
    error,
    startBot,
    pauseBot,
    stopBot,
    emergencyStop,
    updateSettings,
    refreshAll,
  ]);
}

export default useBotData;
