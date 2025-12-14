// frontend/src/components/bot/BotDashboard.jsx
import React, { useCallback, useMemo, useState } from 'react';
import './BotDashboard.css';
import { useBotData } from '../../hooks/useBotData';
import { useToast } from '../common/ToastProvider';

/**
 * BotDashboard
 * واجهة احترافية لإدارة بوتات التداول — متصلة فعليًا بـ useBotData (API + Metrics)
 * بدون تغيير منطق التشغيل: start/pause/stop/emergency/updateSettings كما هو
 */
const BotDashboard = () => {
  const botData = useBotData?.() || {};
  const {
    bots = [],
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
  } = botData;

  const toast = useToast?.() || {};
  const addToast = toast.addToast || (() => {});

  const [localRiskMode, setLocalRiskMode] = useState('balanced');

  const selectedBot = useMemo(() => {
    const id = String(selectedBotId ?? '');
    return (bots || []).find((b) => String(b?._id ?? b?.id ?? '') === id) || null;
  }, [bots, selectedBotId]);

  const engineStatus = metrics?.engineStatus || null;
  const recentTrades = Array.isArray(metrics?.recentTrades) ? metrics.recentTrades : [];

  const status = useMemo(() => {
    if (engineStatus?.status) return engineStatus.status;
    if (selectedBot?.status) return selectedBot.status;
    return 'unknown';
  }, [engineStatus, selectedBot]);

  const statusMeta = useMemo(() => getStatusMeta(status), [status]);

  const runtimeLabel = useMemo(
    () => formatRuntime(engineStatus?.runtimeSeconds),
    [engineStatus?.runtimeSeconds],
  );

  const pnlPercent = engineStatus?.pnlPercent;
  const maxDrawdown = engineStatus?.maxDrawdownPercent;

  const isActionDisabled = useCallback(
    (action) => {
      if (!selectedBotId) return true;
      if (pendingAction && pendingAction !== action) return true;
      return false;
    },
    [pendingAction, selectedBotId],
  );

  const handleAction = useCallback(
    async (action) => {
      if (!selectedBotId || !selectedBot) return;

      try {
        if (action === 'start') {
          await startBot?.(selectedBotId, {});
        } else if (action === 'pause') {
          await pauseBot?.(selectedBotId);
        } else if (action === 'stop') {
          await stopBot?.(selectedBotId);
        } else if (action === 'emergency') {
          await emergencyStop?.(selectedBotId);
        }

        addToast({
          title: `Bot action executed`,
          description: `Bot "${selectedBot.name || selectedBotId}" → ${action}`,
          type: 'success',
        });
      } catch (err) {
        addToast({
          title: `Failed to ${action} bot`,
          description: err?.message || 'Unexpected error',
          type: 'error',
        });
      }
    },
    [addToast, emergencyStop, pauseBot, selectedBot, selectedBotId, startBot, stopBot],
  );

  const handleRiskModeChange = useCallback(
    async (mode) => {
      setLocalRiskMode(mode);
      if (!selectedBotId || !selectedBot) return;

      try {
        await updateSettings?.(selectedBotId, { riskMode: mode });
        addToast({
          title: 'Risk mode updated',
          description: `Bot "${selectedBot.name || selectedBotId}" risk mode set to ${mode}`,
          type: 'success',
        });
      } catch (err) {
        addToast({
          title: 'Failed to update risk mode',
          description: err?.message || 'Unexpected error',
          type: 'error',
        });
      }
    },
    [addToast, selectedBot, selectedBotId, updateSettings],
  );

  const topTrades = useMemo(() => recentTrades.slice(0, 10), [recentTrades]);

  return (
    <div className="bot-dashboard" dir="ltr">
      {/* Header */}
      <div className="bot-dashboard__header">
        <div className="bot-dashboard__titleBlock">
          <h1 className="bot-dashboard__title">Quantum AI Trading Bot</h1>
          <p className="bot-dashboard__subtitle">
            Configure, start and monitor your automated strategies from a single control panel.
          </p>
        </div>

        <div className={`bot-statusBadge is-${statusMeta.key}`}>
          <span className="bot-statusBadge__dot" />
          <div className="bot-statusBadge__text">
            <div className="bot-statusBadge__label">{statusMeta.label}</div>
            <div className="bot-statusBadge__sub">Runtime: {runtimeLabel}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bot-dashboard__toolbar">
        {/* Select Bot */}
        <div className="bot-select">
          <label className="bot-select__label">Active Bot</label>

          <select
            className="bot-select__control"
            value={selectedBotId || ''}
            onChange={(e) => setSelectedBotId?.(e.target.value)}
            disabled={Boolean(loadingBots) || !bots?.length}
          >
            <option value="" disabled>
              {loadingBots ? 'Loading bots…' : bots?.length ? 'Select a bot…' : 'No bots found'}
            </option>

            {(bots || []).map((bot) => {
              const id = String(bot?._id ?? bot?.id ?? '');
              return (
                <option key={id} value={id}>
                  {bot?.name || 'Bot'} – {bot?.symbol || '—'}@{bot?.exchange || '—'}
                </option>
              );
            })}
          </select>

          {!loadingBots && (!bots || bots.length === 0) && (
            <div className="bot-select__hint">
              No bots configured yet. Create one via the backend or admin panel.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bot-actions">
          <div className="bot-actions__label">Controls</div>
          <div className="bot-actions__row">
            <button
              className="qbtn qbtn-primary"
              onClick={() => handleAction('start')}
              disabled={isActionDisabled('start')}
              type="button"
            >
              {pendingAction === 'start' ? 'Starting…' : 'Start'}
            </button>

            <button
              className="qbtn qbtn-soft"
              onClick={() => handleAction('pause')}
              disabled={isActionDisabled('pause')}
              type="button"
            >
              {pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
            </button>

            <button
              className="qbtn qbtn-soft"
              onClick={() => handleAction('stop')}
              disabled={isActionDisabled('stop')}
              type="button"
            >
              {pendingAction === 'stop' ? 'Stopping…' : 'Stop'}
            </button>

            <button
              className="qbtn qbtn-danger"
              onClick={() => handleAction('emergency')}
              disabled={isActionDisabled('emergency')}
              type="button"
            >
              {pendingAction === 'emergency' ? 'Emergency…' : 'Emergency Stop'}
            </button>
          </div>
        </div>

        {/* Risk Mode */}
        <div className="bot-risk">
          <div className="bot-risk__label">Risk Mode</div>
          <div className="segmented">
            {[
              { key: 'conservative', label: 'Conservative' },
              { key: 'balanced', label: 'Balanced' },
              { key: 'aggressive', label: 'Aggressive' },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                className={`segmented__btn ${localRiskMode === m.key ? 'is-active' : ''}`}
                onClick={() => handleRiskModeChange(m.key)}
                disabled={!selectedBotId}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bot-alert bot-alert--error">
          <strong>API Error:</strong> {error?.message || String(error)}
        </div>
      )}

      {/* Metrics cards */}
      <div className="bot-cards">
        <MetricCard
          title="PnL (Today)"
          value={
            pnlPercent != null && Number.isFinite(Number(pnlPercent))
              ? `${Number(pnlPercent).toFixed(2)}%`
              : '—'
          }
          hint="Realized & unrealized, combined (as reported by engine)."
          tone={pnlPercent == null ? 'neutral' : Number(pnlPercent) >= 0 ? 'up' : 'down'}
          loading={Boolean(loadingMetrics)}
        />

        <MetricCard
          title="Runtime"
          value={runtimeLabel}
          hint="As reported by the Python engine."
          tone="neutral"
          loading={Boolean(loadingMetrics)}
        />

        <MetricCard
          title="Max Drawdown"
          value={
            maxDrawdown != null && Number.isFinite(Number(maxDrawdown))
              ? `-${Number(maxDrawdown).toFixed(2)}%`
              : '—'
          }
          hint="Peak-to-trough drawdown (engine)."
          tone="down"
          loading={Boolean(loadingMetrics)}
        />

        <MetricCard
          title="Recent trades (last 50)"
          value={String(recentTrades?.length || 0)}
          hint="Pulled from MongoDB TradeHistory."
          tone="neutral"
          loading={Boolean(loadingMetrics)}
        />
      </div>

      {/* Recent trades */}
      <div className="bot-panel">
        <div className="bot-panel__header">
          <h2 className="bot-panel__title">Recent trades</h2>
          <div className="bot-panel__meta">{recentTrades.length} records</div>
        </div>

        {loadingMetrics && (
          <div className="bot-panel__loading">
            <span className="bot-spinner" /> Loading metrics…
          </div>
        )}

        {!loadingMetrics && topTrades.length === 0 && (
          <div className="bot-panel__empty">No trades yet. Once the bot trades, you’ll see them here.</div>
        )}

        {!loadingMetrics && topTrades.length > 0 && (
          <div className="bot-table">
            <div className="bot-table__head">
              <div>Market</div>
              <div>Side</div>
              <div>Price</div>
              <div>Qty</div>
              <div>PnL</div>
              <div>Time</div>
            </div>

            <div className="bot-table__body">
              {topTrades.map((t, idx) => {
                const market = t?.symbol || t?.pair || t?.market || '—';
                const side = (t?.side || t?.type || '—').toString();
                const price = safeNumber(t?.price);
                const qty = safeNumber(t?.qty ?? t?.quantity ?? t?.amount);
                const pnl = safeNumber(t?.pnl ?? t?.profit);
                const time = formatTime(t?.time ?? t?.timestamp ?? t?.createdAt);

                const pnlTone = pnl == null ? '' : pnl >= 0 ? 'is-up' : 'is-down';

                return (
                  <div className="bot-table__row" key={`${market}-${idx}`}>
                    <div className="mono">{market}</div>
                    <div className={`pill ${side.toLowerCase() === 'buy' ? 'is-buy' : side.toLowerCase() === 'sell' ? 'is-sell' : ''}`}>
                      {side}
                    </div>
                    <div className="mono">{price == null ? '—' : price}</div>
                    <div className="mono">{qty == null ? '—' : qty}</div>
                    <div className={`mono ${pnlTone}`}>{pnl == null ? '—' : pnl}</div>
                    <div className="muted">{time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, hint, tone = 'neutral', loading }) => {
  return (
    <div className={`metric metric--${tone}`}>
      <div className="metric__title">{title}</div>
      <div className={`metric__value ${loading ? 'is-loading' : ''}`}>{loading ? '—' : value}</div>
      <div className="metric__hint">{hint}</div>
    </div>
  );
};

function getStatusMeta(status) {
  switch (String(status || '').toLowerCase()) {
    case 'running':
      return { key: 'running', label: 'RUNNING' };
    case 'paused':
      return { key: 'paused', label: 'PAUSED' };
    case 'stopped':
      return { key: 'stopped', label: 'STOPPED' };
    case 'emergency-stopped':
    case 'emergency':
      return { key: 'emergency', label: 'EMERGENCY STOP' };
    default:
      return { key: 'unknown', label: 'UNKNOWN' };
  }
}

function formatRuntime(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return '00:00:00';

  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const r = String(Math.floor(s % 60)).padStart(2, '0');
  return `${h}:${m}:${r}`;
}

function safeNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  // منع أرقام طويلة بشكل مزعج في UI
  return Math.abs(n) >= 1000 ? n.toFixed(0) : n.toFixed(4).replace(/\.?0+$/, '');
}

function formatTime(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

export default BotDashboard;
