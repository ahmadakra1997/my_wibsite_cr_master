import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    [engineStatus?.runtimeSeconds]
  );

  const pnlPercentNum = Number(engineStatus?.pnlPercent);
  const maxDrawdownNum = Number(engineStatus?.maxDrawdownPercent);

  const pnlValue =
    Number.isFinite(pnlPercentNum) ? `${safeNumber(pnlPercentNum)}%` : '—';
  const ddValue =
    Number.isFinite(maxDrawdownNum) ? `${safeNumber(maxDrawdownNum)}%` : '—';

  const pnlTone =
    !Number.isFinite(pnlPercentNum) ? 'neutral' : pnlPercentNum >= 0 ? 'up' : 'down';

  const ddTone =
    !Number.isFinite(maxDrawdownNum) ? 'neutral' : maxDrawdownNum <= 10 ? 'up' : 'down';

  const [localRiskMode, setLocalRiskMode] = useState('balanced');

  // ✅ مزامنة الوضع المختار عند تغيير البوت/البيانات (بدون تغيير منطق API)
  useEffect(() => {
    const incoming =
      selectedBot?.riskMode ||
      selectedBot?.settings?.riskMode ||
      engineStatus?.riskMode ||
      'balanced';

    const norm = String(incoming).toLowerCase();
    if (['conservative', 'balanced', 'aggressive'].includes(norm)) {
      setLocalRiskMode(norm);
    }
  }, [selectedBotId, selectedBot, engineStatus?.riskMode]);

  const isActionDisabled = useCallback(
    (action) => {
      if (!selectedBotId) return true;
      if (pendingAction && pendingAction !== action) return true;
      return false;
    },
    [pendingAction, selectedBotId]
  );

  const handleAction = useCallback(
    async (action) => {
      if (!selectedBotId || !selectedBot) return;

      try {
        if (action === 'start') await startBot?.(selectedBotId, {});
        else if (action === 'pause') await pauseBot?.(selectedBotId);
        else if (action === 'stop') await stopBot?.(selectedBotId);
        else if (action === 'emergency') await emergencyStop?.(selectedBotId);

        addToast({
          title: 'Bot action executed',
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
    [addToast, emergencyStop, pauseBot, selectedBot, selectedBotId, startBot, stopBot]
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
    [addToast, selectedBot, selectedBotId, updateSettings]
  );

  const topTrades = useMemo(() => recentTrades.slice(0, 10), [recentTrades]);

  return (
    <div className="bot-dashboard bot-page">
      {/* Header */}
      <div className="bot-dashboard__header">
        <div>
          <h1 className="bot-dashboard__title">
            <span className="q-gradient-text">Quantum</span> AI Trading Bot
          </h1>
          <p className="bot-dashboard__subtitle">
            تحكّم بالبوتات، راقب الأداء، وغيّر وضع المخاطرة من لوحة واحدة — بنفس هوية (تركوازي/أزرق/أخضر).
          </p>
        </div>

        <div className={`bot-statusBadge is-${statusMeta.key}`}>
          <div className="bot-statusBadge__label">{statusMeta.label}</div>
          <div className="bot-statusBadge__meta">Runtime: {runtimeLabel}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bot-dashboard__toolbar">
        <div className="bot-select">
          <label className="bot-select__label">Active Bot</label>

          <select
            className="bot-select__control"
            value={selectedBotId ?? ''}
            onChange={(e) => setSelectedBotId?.(e.target.value)}
            disabled={Boolean(loadingBots) || !(bots?.length > 0)}
          >
            <option value="">
              {loadingBots ? 'Loading bots…' : bots?.length ? 'Select a bot…' : 'No bots found'}
            </option>

            {(bots || []).map((bot) => {
              const id = String(bot?._id ?? bot?.id ?? '');
              return (
                <option key={id} value={id}>
                  {bot?.name || 'Bot'} — {bot?.symbol || '—'} @ {bot?.exchange || '—'}
                </option>
              );
            })}
          </select>

          {!loadingBots && (!bots || bots.length === 0) && (
            <div className="bot-select__hint">
              لا يوجد بوتات حالياً. أنشئ بوت من الباك-إند/لوحة الإدارة ثم ارجع هنا.
            </div>
          )}
        </div>

        <div className="bot-actions">
          <div className="bot-actions__label">Controls</div>
          <div className="bot-actions__buttons">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => handleAction('start')}
              disabled={isActionDisabled('start')}
            >
              {pendingAction === 'start' ? 'Starting…' : 'Start'}
            </button>

            <button
              className="btn"
              type="button"
              onClick={() => handleAction('pause')}
              disabled={isActionDisabled('pause')}
            >
              {pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
            </button>

            <button
              className="btn"
              type="button"
              onClick={() => handleAction('stop')}
              disabled={isActionDisabled('stop')}
            >
              {pendingAction === 'stop' ? 'Stopping…' : 'Stop'}
            </button>

            <button
              className="btn btn--danger"
              type="button"
              onClick={() => handleAction('emergency')}
              disabled={isActionDisabled('emergency')}
            >
              {pendingAction === 'emergency' ? 'Emergency…' : 'Emergency Stop'}
            </button>
          </div>
        </div>

        <div className="bot-risk">
          <div className="bot-risk__label">Risk Mode</div>

          <div className="segmented" role="tablist" aria-label="Risk mode">
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
        <div className="bot-alert">
          <div className="bot-alert__title">API Error</div>
          <div className="bot-alert__desc">{error?.message || String(error)}</div>
        </div>
      )}

      {/* Metrics cards */}
      <div className="bot-cards">
        <MetricCard
          title="Status"
          value={statusMeta.label}
          hint={selectedBot?.name ? `Bot: ${selectedBot.name}` : '—'}
          tone={statusMeta.key === 'running' ? 'up' : statusMeta.key === 'emergency' ? 'down' : 'neutral'}
          loading={Boolean(loadingMetrics)}
        />

        <MetricCard
          title="PnL"
          value={pnlValue}
          hint="Profit / Loss (percent)"
          tone={pnlTone}
          loading={Boolean(loadingMetrics)}
        />

        <MetricCard
          title="Max Drawdown"
          value={ddValue}
          hint="Peak-to-trough drawdown"
          tone={ddTone}
          loading={Boolean(loadingMetrics)}
        />

        <MetricCard
          title="Trades"
          value={`${recentTrades.length}`}
          hint="Recent trade records"
          tone="neutral"
          loading={Boolean(loadingMetrics)}
        />
      </div>

      {/* Recent trades */}
      <div className="bot-panel">
        <div className="bot-panel__head">
          <div>
            <div className="bot-panel__title">Recent trades</div>
            <div className="bot-panel__sub">{recentTrades.length} records</div>
          </div>
        </div>

        {loadingMetrics && <div className="bot-panel__empty">Loading metrics…</div>}

        {!loadingMetrics && topTrades.length === 0 && (
          <div className="bot-panel__empty">
            No trades yet. Once the bot trades, you’ll see them here.
          </div>
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
                const pnlToneRow =
                  pnl == null ? '' : Number(pnl) >= 0 ? 'is-up' : 'is-down';

                return (
                  <div className="bot-table__row" key={`${market}-${idx}`}>
                    <div className="mono">{market}</div>
                    <div>
                      <span className={`pill ${side.toLowerCase().includes('buy') ? 'is-buy' : side.toLowerCase().includes('sell') ? 'is-sell' : ''}`}>
                        {side}
                      </span>
                    </div>
                    <div className="mono">{price == null ? '—' : price}</div>
                    <div className="mono">{qty == null ? '—' : qty}</div>
                    <div className={`mono ${pnlToneRow}`}>{pnl == null ? '—' : pnl}</div>
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
      <div className="metric__value">{loading ? '—' : value}</div>
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
