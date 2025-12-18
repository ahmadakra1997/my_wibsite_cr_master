// frontend/src/components/bot/BotDashboard.jsx
import React, { useMemo, useState } from 'react';
import './BotDashboard.css';

import useBotData from '../../hooks/useBotData';
import { useToast } from '../common/ToastProvider';

const safeArr = (v) => (Array.isArray(v) ? v : []);

const fmtMoney = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
};

const fmtPct = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)}%`;
};

const fmtTime = (v) => {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
};

function getStatusMeta(status) {
  const s = String(status || 'unknown').toLowerCase();

  if (s === 'active' || s === 'running' || s === 'started') {
    return { label: 'RUNNING', cls: 'is-running', hint: 'البوت يعمل حالياً' };
  }
  if (s === 'paused' || s === 'idle') {
    return { label: 'PAUSED', cls: 'is-paused', hint: 'البوت في وضع إيقاف مؤقت' };
  }
  if (s === 'stopped' || s === 'inactive') {
    return { label: 'STOPPED', cls: 'is-stopped', hint: 'البوت متوقف' };
  }
  if (s === 'emergency') {
    return { label: 'EMERGENCY', cls: 'is-emergency', hint: 'إيقاف طوارئ' };
  }
  return { label: 'UNKNOWN', cls: 'is-unknown', hint: 'الحالة غير معروفة' };
}

export default function BotDashboard() {
  const {
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
  } = useBotData();

  // Toast (بدون كسر لو ToastProvider غير ملفوف)
  let toastApi = null;
  try {
    toastApi = useToast();
  } catch {
    toastApi = null;
  }
  const notify = (type, message) => {
    if (toastApi?.addToast) toastApi.addToast(type, message);
  };

  const [localRiskMode, setLocalRiskMode] = useState('medium');

  const engineStatus = metrics?.engineStatus || {};
  const pnl = metrics?.pnl || { daily: 0, weekly: 0, monthly: 0 };
  const trades = safeArr(metrics?.recentTrades);

  const statusMeta = useMemo(
    () => getStatusMeta(engineStatus?.status),
    [engineStatus?.status]
  );

  const activePairsCount = safeArr(engineStatus?.activePairs).length;

  const totalPnlToday = Number(pnl?.daily || 0);
  const pnlTrendCls = totalPnlToday >= 0 ? 'metric--up' : 'metric--down';

  const canAct = !pendingAction && !loadingBots && !loadingMetrics;

  const onSetRisk = async (mode) => {
    setLocalRiskMode(mode);
    // نحاول نحفظها بالباك-إند بأمان (إذا schema عندك مختلف، سنعدّلها عندما نراجع BotSettings.js)
    try {
      if (typeof updateSettings === 'function') {
        await updateSettings({ riskMode: mode });
        notify('success', `تم ضبط مستوى المخاطر: ${mode}`);
      }
    } catch {
      // لا نكسر الواجهة لو endpoint رفض
    }
  };

  const onStart = async () => {
    try {
      await startBot();
      notify('success', 'تم تشغيل البوت');
    } catch (e) {
      notify('error', e?.message || 'فشل تشغيل البوت');
    }
  };

  const onPause = async () => {
    try {
      await pauseBot();
      notify('info', 'تم إيقاف البوت مؤقتاً');
    } catch (e) {
      notify('error', e?.message || 'فشل الإيقاف المؤقت');
    }
  };

  const onStop = async () => {
    try {
      await stopBot();
      notify('info', 'تم إيقاف البوت');
    } catch (e) {
      notify('error', e?.message || 'فشل الإيقاف');
    }
  };

  const onEmergency = async () => {
    try {
      await emergencyStop();
      notify('error', 'تم تنفيذ إيقاف طوارئ');
    } catch (e) {
      notify('error', e?.message || 'فشل إيقاف الطوارئ');
    }
  };

  return (
    <div className="bot-dashboard">
      {/* Header */}
      <div className="bot-dashboard__header">
        <div>
          <h1 className="bot-dashboard__title">Quantum AI Trading Bot</h1>
          <p className="bot-dashboard__subtitle">
            لوحة تحكم احترافية لإدارة البوت ومراقبة الأداء — بنفس هوية التركوازي/الأزرق/الأخضر.
          </p>
        </div>

        <div className={`bot-statusBadge ${statusMeta.cls}`}>
          <div className="bot-statusBadge__label">{statusMeta.label}</div>
          <div className="bot-statusBadge__meta">
            {statusMeta.hint} • آخر تحديث: {fmtTime(engineStatus?.lastUpdate)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bot-dashboard__toolbar">
        <div className="bot-select">
          <div className="bot-select__label">Bot Selection</div>
          <select
            className="bot-select__control"
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            disabled={loadingBots}
          >
            {safeArr(bots).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || b.id}
              </option>
            ))}
          </select>
          <div className="bot-select__hint">
            اختر البوت الذي تريد التحكم به (حالياً عادة بوت واحد).
          </div>
        </div>

        <div className="bot-actions">
          <div className="bot-actions__label">Bot Actions</div>
          <div className="bot-actions__buttons">
            <button className="btn btn--primary" onClick={onStart} disabled={!canAct}>
              {pendingAction === 'start' ? 'Starting…' : 'Start'}
            </button>
            <button className="btn" onClick={onPause} disabled={!canAct}>
              {pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
            </button>
            <button className="btn" onClick={onStop} disabled={!canAct}>
              {pendingAction === 'stop' ? 'Stopping…' : 'Stop'}
            </button>
            <button className="btn btn--danger" onClick={onEmergency} disabled={!canAct}>
              {pendingAction === 'emergency' ? 'Emergency…' : 'Emergency Stop'}
            </button>
          </div>
        </div>

        <div className="bot-risk">
          <div className="bot-risk__label">Risk Mode</div>
          <div className="segmented" role="tablist" aria-label="Risk mode">
            <button
              type="button"
              className={`segmented__btn ${localRiskMode === 'low' ? 'is-active' : ''}`}
              onClick={() => onSetRisk('low')}
              disabled={!canAct}
            >
              Low
            </button>
            <button
              type="button"
              className={`segmented__btn ${localRiskMode === 'medium' ? 'is-active' : ''}`}
              onClick={() => onSetRisk('medium')}
              disabled={!canAct}
            >
              Medium
            </button>
            <button
              type="button"
              className={`segmented__btn ${localRiskMode === 'high' ? 'is-active' : ''}`}
              onClick={() => onSetRisk('high')}
              disabled={!canAct}
            >
              High
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {!!error && (
        <div className="bot-alert" role="alert">
          <div className="bot-alert__title">تنبيه</div>
          <div className="bot-alert__desc">{String(error)}</div>
        </div>
      )}

      {/* Metrics */}
      <div className="bot-cards">
        <div className="metric">
          <div className="metric__title">Balance</div>
          <div className="metric__value">{fmtMoney(engineStatus?.balance)}</div>
          <div className="metric__hint">الرصيد الحالي</div>
        </div>

        <div className={`metric ${pnlTrendCls}`}>
          <div className="metric__title">Daily PnL</div>
          <div className="metric__value">{fmtMoney(pnl?.daily)}</div>
          <div className="metric__hint">أداء آخر 24 ساعة</div>
        </div>

        <div className="metric metric--up">
          <div className="metric__title">Weekly PnL</div>
          <div className="metric__value">{fmtMoney(pnl?.weekly)}</div>
          <div className="metric__hint">أداء أسبوعي</div>
        </div>

        <div className="metric">
          <div className="metric__title">Active Pairs</div>
          <div className="metric__value">{activePairsCount}</div>
          <div className="metric__hint">عدد الأزواج الفعّالة</div>
        </div>
      </div>

      {/* Trades Panel */}
      <div className="bot-panel">
        <div className="bot-panel__head">
          <div>
            <div className="bot-panel__title">Recent Trades</div>
            <div className="bot-panel__sub">آخر عمليات التداول الواردة من الباك-إند</div>
          </div>
          <div className="muted">
            {loadingMetrics ? 'Loading…' : `${trades.length} trades`}
          </div>
        </div>

        {trades.length === 0 ? (
          <div className="bot-panel__empty">لا توجد صفقات حالياً.</div>
        ) : (
          <>
            <div className="bot-table__head">
              <div>Pair</div>
              <div>Side</div>
              <div>Price</div>
              <div>Volume</div>
              <div>PnL</div>
              <div>Time</div>
            </div>

            <div className="bot-table__body">
              {trades.map((t, idx) => {
                const side = String(t?.side || t?.type || '').toLowerCase();
                const isBuy = side === 'buy' || side === 'long';
                const pnlVal = Number(t?.pnl ?? t?.profit ?? t?.pl ?? 0);

                return (
                  <div className="bot-table__row" key={t?.id || t?._id || idx}>
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        {t?.pair || t?.symbol || t?.market || '—'}
                      </div>
                      <div className="muted mono">
                        {t?.strategy ? `Strategy: ${t.strategy}` : ''}
                      </div>
                    </div>

                    <div>
                      <span className={`pill ${isBuy ? 'is-buy' : 'is-sell'}`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </div>

                    <div className="mono">{fmtMoney(t?.price)}</div>
                    <div className="mono">{fmtMoney(t?.volume ?? t?.qty ?? t?.amount)}</div>

                    <div className={`mono ${pnlVal >= 0 ? 'is-up' : 'is-down'}`}>
                      {fmtMoney(pnlVal)}
                    </div>

                    <div className="muted">{fmtTime(t?.time || t?.timestamp || t?.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
