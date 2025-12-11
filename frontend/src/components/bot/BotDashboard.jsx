// frontend/src/components/bot/BotDashboard.jsx

import React, { useMemo, useState } from 'react';
import './BotDashboard.css';
import { useBotData } from '../../hooks/useBotData';
import { useToast } from '../common/ToastProvider';

/**
 * BotDashboard
 *
 * واجهة احترافية لإدارة بوتات التداول
 * متصلة فعليًا بـ /api/bot و /api/bot/:id/metrics
 */

const BotDashboard = () => {
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

  const { addToast } = useToast();
  const [localRiskMode, setLocalRiskMode] = useState('balanced');

  const selectedBot = useMemo(
    () => bots.find((b) => String(b._id || b.id) === String(selectedBotId)),
    [bots, selectedBotId],
  );

  const engineStatus = metrics?.engineStatus || null;
  const recentTrades = metrics?.recentTrades || [];

  // استنتاج حالة البوت الحالية
  const status = useMemo(() => {
    // لو عندنا حالة من محرك بايثون نستخدمها أولاً
    if (engineStatus?.status) return engineStatus.status;
    if (selectedBot?.status) return selectedBot.status;
    return 'unknown';
  }, [engineStatus, selectedBot]);

  const statusText = useMemo(() => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      case 'stopped':
        return 'Stopped';
      case 'emergency-stopped':
        return 'Emergency Stopped';
      default:
        return 'Unknown';
    }
  }, [status]);

  const runtime = useMemo(() => {
    const seconds = engineStatus?.runtimeSeconds;
    if (!seconds || seconds <= 0) return '00:00:00';

    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [engineStatus]);

  const pnlPercent = engineStatus?.pnlPercent ?? null;
  const maxDrawdown = engineStatus?.maxDrawdownPercent ?? null;

  const handleAction = async (action) => {
    if (!selectedBot) return;
    try {
      if (action === 'start') {
        await startBot(selectedBotId, {});
      } else if (action === 'pause') {
        await pauseBot(selectedBotId);
      } else if (action === 'stop') {
        await stopBot(selectedBotId);
      } else if (action === 'emergency') {
        await emergencyStop(selectedBotId);
      }
      addToast({
        title: `Bot ${action} executed`,
        description: `Bot "${selectedBot.name}" action: ${action}`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: `Failed to ${action} bot`,
        description: err.message || 'Unexpected error',
        type: 'error',
      });
    }
  };

  const handleRiskModeChange = async (mode) => {
    setLocalRiskMode(mode);
    if (!selectedBot) return;
    try {
      await updateSettings(selectedBotId, { riskMode: mode });
      addToast({
        title: 'Risk mode updated',
        description: `Bot "${selectedBot.name}" risk mode set to ${mode}`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Failed to update risk mode',
        description: err.message || 'Unexpected error',
        type: 'error',
      });
    }
  };

  const isActionDisabled = (action) => {
    if (!selectedBotId) return true;
    if (pendingAction && pendingAction !== action) return true;
    return false;
  };

  return (
    <div className="bot-dashboard-container">
      <div className="bot-header">
        <div className="bot-header-left">
          <h1 className="bot-title">Quantum AI Trading Bot</h1>
          <p className="bot-subtitle">
            Configure, start and monitor your automated strategies from a single
            control panel.
          </p>
        </div>

        <div className={`bot-status-pill bot-status-${status}`}>
          <span className="bot-status-dot" />
          <span>{statusText.toUpperCase()}</span>
        </div>
      </div>

      {/* اختيار البوت */}
      <div className="bot-select-row">
        <div className="bot-section-title">Active Bot</div>
        {loadingBots && <span className="bot-select-hint">Loading bots…</span>}
        {!loadingBots && bots.length === 0 && (
          <span className="bot-select-hint">
            No bots configured yet. Create one via the backend or admin panel.
          </span>
        )}
        {!loadingBots && bots.length > 0 && (
          <select
            className="bot-select"
            value={selectedBotId || ''}
            onChange={(e) => setSelectedBotId(e.target.value)}
          >
            {bots.map((bot) => (
              <option key={bot._id || bot.id} value={bot._id || bot.id}>
                {bot.name} – {bot.symbol}@{bot.exchange}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bot-error-banner">
          {error.message || 'An error occurred while talking to the API'}
        </div>
      )}

      <div className="bot-layout">
        {/* Controls */}
        <div className="bot-controls-card">
          <div className="bot-section-title">Controls</div>

          <div className="bot-actions">
            <button
              type="button"
              className="bot-button bot-button-primary"
              disabled={isActionDisabled('start')}
              onClick={() => handleAction('start')}
            >
              {pendingAction === 'start' ? 'Starting…' : 'Start Bot'}
            </button>
            <button
              type="button"
              className="bot-button"
              disabled={isActionDisabled('pause')}
              onClick={() => handleAction('pause')}
            >
              {pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
            </button>
            <button
              type="button"
              className="bot-button"
              disabled={isActionDisabled('stop')}
              onClick={() => handleAction('stop')}
            >
              {pendingAction === 'stop' ? 'Stopping…' : 'Stop'}
            </button>
            <button
              type="button"
              className="bot-button bot-button-danger"
              disabled={isActionDisabled('emergency')}
              onClick={() => handleAction('emergency')}
            >
              {pendingAction === 'emergency'
                ? 'Emergency…'
                : 'Emergency Stop'}
            </button>
          </div>

          <div className="bot-section-title" style={{ marginTop: 12 }}>
            Risk Mode
          </div>

          <div className="bot-actions">
            <button
              type="button"
              className={`bot-button ${
                localRiskMode === 'conservative'
                  ? 'bot-button-primary'
                  : ''
              }`}
              onClick={() => handleRiskModeChange('conservative')}
            >
              Conservative
            </button>
            <button
              type="button"
              className={`bot-button ${
                localRiskMode === 'balanced' ? 'bot-button-primary' : ''
              }`}
              onClick={() => handleRiskModeChange('balanced')}
            >
              Balanced
            </button>
            <button
              type="button"
              className={`bot-button ${
                localRiskMode === 'aggressive'
                  ? 'bot-button-primary'
                  : ''
              }`}
              onClick={() => handleRiskModeChange('aggressive')}
            >
              Aggressive
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="bot-metrics-card">
          <div className="bot-section-title">Bot Performance</div>

          {loadingMetrics && (
            <div className="bot-select-hint">Loading metrics…</div>
          )}

          <div className="dashboard-grid" style={{ marginTop: 6 }}>
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">PnL (Today)</div>
              </div>
              <div
                className={
                  pnlPercent != null && pnlPercent >= 0
                    ? 'dashboard-card-value text-up'
                    : 'dashboard-card-value text-down'
                }
              >
                {pnlPercent != null
                  ? `${pnlPercent.toFixed(2)}%`
                  : '—'}
              </div>
              <div className="dashboard-card-sub">
                Realized &amp; unrealized, combined (as reported by engine).
              </div>
              <div className="dashboard-card-footer">
                <span>Runtime</span>
                <span>{runtime}</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">Max Drawdown</div>
              </div>
              <div className="dashboard-card-value text-down">
                {maxDrawdown != null
                  ? `-${maxDrawdown.toFixed(2)}%`
                  : '—'}
              </div>
              <div className="dashboard-card-sub">
                As reported by the Python engine.
              </div>
              <div className="dashboard-card-footer">
                <span>Current risk mode</span>
                <span>{localRiskMode.toUpperCase()}</span>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">
                  Recent trades (last 50)
                </div>
              </div>
              <div className="dashboard-card-value">
                {recentTrades.length}
              </div>
              <div className="dashboard-card-sub">
                Pulled from MongoDB TradeHistory.
              </div>
              <div className="dashboard-card-footer">
                <span>Engine status</span>
                <span>{statusText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotDashboard;
