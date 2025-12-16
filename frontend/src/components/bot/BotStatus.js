// frontend/src/components/bot/BotStatus.js
import React, { useCallback, useMemo, useState } from 'react';
import useBotData from '../../hooks/useBotData';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getBotStatus, getPerformanceMetrics, getTradingHistory } from '../../services/api';
import './BotStatus.css';

const safeArray = (v) => (Array.isArray(v) ? v : []);
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const unwrap = (res) =>
  res && typeof res === 'object' && 'success' in res ? (res.success ? res.data : null) : res;

export default function BotStatus() {
  const { metrics, loadingMetrics, pendingAction, error, startBot, pauseBot, stopBot, emergencyStop } = useBotData();
  const { isConnected } = useWebSocket('bot-status');

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);

  const current = snapshot || metrics || {};
  const engine = current?.engineStatus || {};
  const pnl = current?.pnl || { daily: 0, weekly: 0, monthly: 0 };
  const trades = safeArray(current?.recentTrades).slice(0, 10);

  const derived = useMemo(() => {
    const profitSum = trades.reduce((acc, tr) => acc + toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl), 0);
    const wins = trades.filter((tr) => toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl) > 0).length;
    const total = trades.length;

    const statusRaw = String(engine?.status ?? 'unknown').toLowerCase();
    const isActive = statusRaw === 'active' || statusRaw === 'running' || statusRaw === 'on';
    const isPaused = statusRaw === 'paused' || statusRaw === 'stopped' || statusRaw === 'idle';

    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return { profitSum, wins, total, winRate, isActive, isPaused, statusRaw };
  }, [engine?.status, trades]);

  const formatMoney = (v) => {
    const n = toNum(v);
    const sign = n >= 0 ? '+' : '-';
    return `${sign}${Math.abs(n).toFixed(2)} USDT`;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statusRes, perfRes, histRes] = await Promise.allSettled([
        Promise.resolve(getBotStatus()).catch(() => null),
        Promise.resolve(getPerformanceMetrics({ range: '24h' })).catch(() => null),
        Promise.resolve(getTradingHistory({ limit: 20 })).catch(() => null),
      ]);

      const status = statusRes.status === 'fulfilled' ? unwrap(statusRes.value) : null;
      const perf = perfRes.status === 'fulfilled' ? unwrap(perfRes.value) : null;
      const history = histRes.status === 'fulfilled' ? unwrap(histRes.value) : null;

      const isActive = !!status?.isActive;
      const recentTrades = safeArray(history?.trades || history?.items || history).slice(0, 20);

      setSnapshot({
        ...current,
        engineStatus: {
          status: isActive ? 'active' : 'paused',
          lastUpdate: new Date().toISOString(),
          balance: status?.currentBalance ?? status?.balance ?? current?.engineStatus?.balance ?? 0,
          activePairs: safeArray(status?.activePairs ?? current?.engineStatus?.activePairs),
        },
        pnl: {
          daily: perf?.pnl?.daily ?? perf?.dailyPnl ?? current?.pnl?.daily ?? 0,
          weekly: perf?.pnl?.weekly ?? perf?.weeklyPnl ?? current?.pnl?.weekly ?? 0,
          monthly: perf?.pnl?.monthly ?? perf?.monthlyPnl ?? current?.pnl?.monthly ?? 0,
        },
        recentTrades,
      });
    } catch (e) {
      // عرض فقط — لا نكسر الواجهة
      console.error('[BotStatus] refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [current]);

  const disableControls = Boolean(loadingMetrics) || Boolean(pendingAction) || refreshing;

  const badgeClass = derived.isActive ? 'is-active' : derived.isPaused ? 'is-paused' : '';
  const badgeText = derived.isActive ? 'نشط' : derived.isPaused ? 'متوقف/مؤقت' : 'غير معروف';

  return (
    <section className="botStatus">
      <div className="botStatus__header">
        <div>
          <h3 className="botStatus__title">مركز حالة البوت</h3>
          <p className="botStatus__subtitle">
            عرض حالة المحرك + آخر التحديثات + أزرار التحكم — بدون تغيير منطق التداول.
          </p>
        </div>

        <div className="botStatus__headerRight">
          <span className={`botStatus__conn ${isConnected ? 'is-on' : 'is-off'}`}>
            <span className="botStatus__dot" />
            {isConnected ? 'متصل' : 'غير متصل'}
          </span>

          <button className="botStatus__btn ghost" type="button" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </div>
      </div>

      <div className="botStatus__actions">
        <button className="botStatus__btn primary" type="button" onClick={startBot} disabled={disableControls}>
          تشغيل
        </button>

        <button className="botStatus__btn" type="button" onClick={pauseBot} disabled={disableControls}>
          إيقاف مؤقت
        </button>

        <button className="botStatus__btn" type="button" onClick={stopBot} disabled={disableControls}>
          إيقاف
        </button>

        <button className="botStatus__btn danger" type="button" onClick={emergencyStop} disabled={disableControls}>
          إيقاف طوارئ
        </button>

        <span className={`botStatus__badge ${badgeClass}`}>
          <span className="botStatus__badgeDot" />
          {badgeText}
        </span>

        <span className="botStatus__meta">
          {engine?.lastUpdate ? `آخر تحديث: ${new Date(engine.lastUpdate).toLocaleString('ar-SA')}` : ''}
        </span>
      </div>

      {loadingMetrics && !error && (
        <div className="botStatus__state">
          <span className="botStatus__spinner" />
          جاري التحميل...
        </div>
      )}

      {error && (
        <div className="botStatus__error">
          <span>⚠️</span>
          <span>{String(error)}</span>
        </div>
      )}

      <div className="botStatus__tabs">
        <button
          className={`botStatus__tab ${activeTab === 'overview' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('overview')}
        >
          نظرة عامة
        </button>

        <button
          className={`botStatus__tab ${activeTab === 'history' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('history')}
        >
          آخر الصفقات
        </button>

        <button
          className={`botStatus__tab ${activeTab === 'system' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('system')}
        >
          النظام
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="botStatus__grid">
          <div className="botStatus__card">
            <div className="botStatus__cardLabel">الرصيد</div>
            <div className="botStatus__cardValue mono">{toNum(engine?.balance ?? 0).toFixed(2)} USDT</div>
            <div className="botStatus__cardHint">القيمة من الباكيند/WS</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__cardLabel">ربحية اليوم</div>
            <div className={`botStatus__cardValue mono ${toNum(pnl.daily) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(pnl.daily)}
            </div>
            <div className="botStatus__cardHint">Daily PnL</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__cardLabel">ربحية الأسبوع</div>
            <div className={`botStatus__cardValue mono ${toNum(pnl.weekly) >= 0 ? 'profit' : 'loss'}`}>
              {formatMoney(pnl.weekly)}
            </div>
            <div className="botStatus__cardHint">Weekly PnL</div>
          </div>

          <div className="botStatus__card">
            <div className="botStatus__cardLabel">معدل الفوز (آخر 10)</div>
            <div className="botStatus__cardValue">{derived.winRate.toFixed(1)}%</div>
            <div className="botStatus__cardHint">مبني على آخر الصفقات فقط</div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="botStatus__tableWrap">
          <table className="botStatus__table">
            <thead>
              <tr>
                <th>الأصل</th>
                <th>النوع</th>
                <th>السعر</th>
                <th>الكمية</th>
                <th>الربح</th>
                <th>الوقت</th>
              </tr>
            </thead>

            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td className="botStatus__emptyCell" colSpan={6}>
                    لا توجد صفقات حالياً
                  </td>
                </tr>
              ) : (
                trades.map((tr, idx) => {
                  const pair = tr?.pair ?? tr?.symbol ?? '—';
                  const sideRaw = String(tr?.type ?? tr?.side ?? '').toLowerCase();
                  const side = sideRaw.includes('buy') ? 'شراء' : sideRaw.includes('sell') ? 'بيع' : '—';
                  const price = tr?.price ?? tr?.entryPrice ?? '—';
                  const qty = tr?.volume ?? tr?.qty ?? '—';
                  const profit = toNum(tr?.profit ?? tr?.pnl ?? tr?.realizedPnl);
                  const time = tr?.timestamp ?? tr?.createdAt ?? null;

                  return (
                    <tr key={`${pair}-${idx}`}>
                      <td>{pair}</td>
                      <td>{side}</td>
                      <td className="mono">{String(price)}</td>
                      <td className="mono">{String(qty)}</td>
                      <td className={`mono ${profit >= 0 ? 'profit' : 'loss'}`}>
                        {(profit >= 0 ? '+' : '-') + Math.abs(profit).toFixed(2)}
                      </td>
                      <td>{time ? new Date(time).toLocaleString('ar-SA') : '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="botStatus__system">
          <div className="botStatus__sysRow">
            <span>حالة المحرك</span>
            <span className="mono">{String(engine?.status ?? 'unknown')}</span>
          </div>

          <div className="botStatus__sysRow">
            <span>أزواج مفعّلة</span>
            <span className="mono">{safeArray(engine?.activePairs).length || 0}</span>
          </div>

          <div className="botStatus__sysRow">
            <span>اتصال WS</span>
            <span className="mono">{isConnected ? 'متصل' : 'غير متصل'}</span>
          </div>
        </div>
      )}
    </section>
  );
}
