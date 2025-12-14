// frontend/src/hooks/useBotData.js
import { useCallback, useEffect, useMemo, useState } from 'react';
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
const unwrap = (res) => (res && typeof res === 'object' && 'success' in res ? (res.success ? res.data : null) : res);

export default function useBotData() {
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

  // ✅ قناة WS (لو موجودة عندك)
  const { lastMessage } = useWebSocket('bot-status');

  const refreshAll = useCallback(async () => {
    setError(null);
    setLoadingBots(true);
    setLoadingMetrics(true);

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

      // Bots list (عندك غالباً بوت واحد)
      const isActive = !!status?.isActive;
      setBots([{ id: 'default', name: settings?.general?.botName || 'Trading Bot', status: isActive ? 'active' : 'paused' }]);

      setMetrics((prev) => ({
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
      setError(e?.message || 'فشل تحميل بيانات البوت');
    } finally {
      setLoadingBots(false);
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ✅ WebSocket updates (اختياري — لا يكسر لو الرسائل غير موجودة)
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
      setMetrics((prev) => ({
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
      setMetrics((prev) => ({
        ...prev,
        recentTrades: [data.trade, ...safeArray(prev.recentTrades)].slice(0, 20),
      }));
    }
  }, [lastMessage]);

  const startBot = useCallback(async () => {
    setPendingAction('start');
    setError(null);
    try {
      await activateTradingBot({ botId: selectedBotId });
      await refreshAll();
    } catch (e) {
      setError(e?.message || 'فشل تشغيل البوت');
    } finally {
      setPendingAction(null);
    }
  }, [refreshAll, selectedBotId]);

  const pauseBot = useCallback(async () => {
    setPendingAction('pause');
    setError(null);
    try {
      // لو الباكيند ما يدعم pause، ما رح نكسر. جرّبنا بأمان.
      await controlBot('pause', { botId: selectedBotId });
      await refreshAll();
    } catch (e) {
      // fallback: stop
      try {
        await deactivateTradingBot({ botId: selectedBotId });
        await refreshAll();
      } catch (e2) {
        setError(e2?.message || e?.message || 'فشل إيقاف/إيقاف مؤقت');
      }
    } finally {
      setPendingAction(null);
    }
  }, [refreshAll, selectedBotId]);

  const stopBot = useCallback(async () => {
    setPendingAction('stop');
    setError(null);
    try {
      await deactivateTradingBot({ botId: selectedBotId });
      await refreshAll();
    } catch (e) {
      setError(e?.message || 'فشل إيقاف البوت');
    } finally {
      setPendingAction(null);
    }
  }, [refreshAll, selectedBotId]);

  const emergencyStop = useCallback(async () => {
    setPendingAction('emergency');
    setError(null);
    try {
      // محاولة endpoint “طوارئ” لو موجود:
      const res = await api.post('/bot/emergency-stop', { botId: selectedBotId });
      if (res?.data?.success === false) throw new Error(res.data.message || 'Emergency stop failed');
      await refreshAll();
    } catch (e) {
      // fallback: stop
      try {
        await deactivateTradingBot({ botId: selectedBotId });
        await refreshAll();
      } catch (e2) {
        setError(e2?.message || e?.message || 'فشل إيقاف الطوارئ');
      }
    } finally {
      setPendingAction(null);
    }
  }, [refreshAll, selectedBotId]);

  const updateSettingsSafe = useCallback(async (patch) => {
    setPendingAction('settings');
    setError(null);
    try {
      const current = metrics.settings || (await unwrap(await getBotSettings())) || {};
      const merged = { ...current, ...patch };
      await updateBotSettings(merged);
      await refreshAll();
    } catch (e) {
      setError(e?.message || 'فشل تحديث الإعدادات');
    } finally {
      setPendingAction(null);
    }
  }, [metrics.settings, refreshAll]);

  const computed = useMemo(() => ({
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
    updateSettings: updateSettingsSafe,
  }), [bots, selectedBotId, metrics, loadingBots, loadingMetrics, pendingAction, error, startBot, pauseBot, stopBot, emergencyStop, updateSettingsSafe]);

  return computed;
}
