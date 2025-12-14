// frontend/src/components/bot/BotControls.js
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBot } from '../../context/BotContext';
import botService from '../../services/botService';

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

const MetricPill = ({ label, value }) => (
  <div className="metric-pill">
    <span className="metric-pill-label">{label}</span>
    <span className="metric-pill-value">{value}</span>
  </div>
);

const BotControls = () => {
  const { t } = useTranslation();

  const {
    botStatus = {},
    botPerformance = {},
    hasActiveBot,
    loading,
    error,
    loadBotStatus,
    loadBotPerformance,
  } = useBot() || {};

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const isActive = botStatus.isActive ?? hasActiveBot ?? false;
  const isBusy = Boolean(loading) || localLoading;

  const statusLabel = isActive
    ? t('bot.status.active', 'البوت مفعل')
    : t('bot.status.inactive', 'البوت متوقف');

  const totalProfit = botPerformance.totalProfit ?? 0;
  const winRate = botPerformance.winRate ?? 0;
  const totalTrades = botPerformance.totalTrades ?? 0;

  const formattedTotalProfit = useMemo(() => formatNumber(totalProfit, 2), [totalProfit]);
  const formattedWinRate = useMemo(() => formatNumber(winRate * 100, 1), [winRate]);
  const formattedTotalTrades = useMemo(
    () => (Number.isFinite(Number(totalTrades)) ? totalTrades : '--'),
    [totalTrades],
  );

  const handleToggle = async () => {
    if (isBusy) return;
    setLocalError(null);
    setLocalLoading(true);

    try {
      if (isActive) await botService.deactivateBot();
      else await botService.activateBot();

      if (typeof loadBotStatus === 'function') await loadBotStatus();
      if (typeof loadBotPerformance === 'function') await loadBotPerformance();
    } catch (err) {
      console.error('❌ Error toggling bot:', err);
      const msg = err?.message || t('bot.errors.generic', 'حدث خطأ أثناء تحديث حالة البوت.');
      setLocalError(msg);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('bot-error', { detail: { source: 'BotControls', error: err } }),
        );
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="bot-controls-card" dir="rtl">
      <div className="bot-controls-header">
        <div>
          <h3 className="bot-controls-title">
            {t('bot.controls.title', 'التحكم السريع في بوت التداول')}
          </h3>
          <p className="bot-controls-subtitle">
            {t('bot.controls.subtitle', 'قم بتشغيل أو إيقاف البوت فوراً مع نظرة سريعة على الأداء.')}
          </p>
        </div>

        <div className={`bot-controls-status ${isActive ? 'active' : 'inactive'}`}>
          <span className="status-dot" />
          <span>{statusLabel}</span>
          {isBusy ? <span className="status-loading">{t('bot.controls.updating', 'جاري التحديث...')}</span> : null}
        </div>
      </div>

      <div className="bot-controls-body">
        <button
          className={`bot-primary-btn ${isActive ? 'danger' : 'primary'}`}
          type="button"
          onClick={handleToggle}
          disabled={isBusy}
        >
          {isBusy ? t('bot.controls.processing', 'جاري التنفيذ...') : isActive ? '⏹ إيقاف البوت' : '▶ تشغيل البوت'}
        </button>

        <div className="bot-metrics-row">
          <MetricPill label="صافي الربح" value={`${formattedTotalProfit} USDT`} />
          <MetricPill label="معدل الفوز" value={`${formattedWinRate}%`} />
          <MetricPill label="إجمالي الصفقات" value={formattedTotalTrades} />
        </div>

        {(error || localError) ? (
          <div className="bot-controls-error">
            <strong>{t('bot.controls.errorTitle', 'تنبيه:')}</strong> {localError || error}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BotControls;
