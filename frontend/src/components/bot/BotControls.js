// frontend/src/components/bot/BotControls.js
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBot } from '../../context/BotContext';
import botService from '../../services/botService';
import './BotControls.css';

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const MetricPill = ({ label, value }) => {
  return (
    <div className="metric-pill" role="group" aria-label={label}>
      <div className="metric-pill__label">{label}</div>
      <div className="metric-pill__value">{value}</div>
    </div>
  );
};

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
  } = useBot();

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const isActive = botStatus?.isActive ?? hasActiveBot ?? false;
  const isBusy = Boolean(loading) || localLoading;

  const totalProfit = botPerformance?.totalProfit ?? 0;
  const winRate = botPerformance?.winRate ?? 0;
  const totalTrades = botPerformance?.totalTrades ?? 0;

  const formatted = useMemo(() => {
    const wr = formatNumber(Number(winRate) * 100, 1);
    const tt = Number.isFinite(Number(totalTrades)) ? Number(totalTrades) : 0;
    return {
      profit: currency(totalProfit),
      winRate: `${wr}%`,
      trades: String(tt),
    };
  }, [totalProfit, totalTrades, winRate]);

  const statusLabel = isActive
    ? t('bot.status.active', 'البوت مفعل')
    : t('bot.status.inactive', 'البوت متوقف');

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
        window.dispatchEvent(new CustomEvent('bot-error', { detail: { source: 'BotControls', error: err } }));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <section className="bot-controls">
      <header className="bot-controls__header">
        <div>
          <h3 className="bot-controls__title">{t('bot.controls.title', 'التحكم السريع في بوت التداول')}</h3>
          <p className="bot-controls__subtitle">
            {t('bot.controls.subtitle', 'تشغيل/إيقاف مباشر + مؤشرات أداء سريعة.')}
          </p>
        </div>

        <div className={`status-chip ${isActive ? 'status-chip--active' : ''}`}>
          <span className="status-chip__dot" aria-hidden="true" />
          <span className="status-chip__text">{statusLabel}</span>
        </div>
      </header>

      <div className="bot-controls__metrics">
        <MetricPill label={t('bot.controls.metrics.profit', 'الربح الإجمالي')} value={formatted.profit} />
        <MetricPill label={t('bot.controls.metrics.winRate', 'نسبة الفوز')} value={formatted.winRate} />
        <MetricPill label={t('bot.controls.metrics.trades', 'عدد الصفقات')} value={formatted.trades} />
      </div>

      <button
        type="button"
        className={`bot-controls__toggleBtn ${isActive ? 'is-active' : ''}`}
        onClick={handleToggle}
        disabled={isBusy}
      >
        {isBusy
          ? t('bot.controls.processing', 'جاري التنفيذ...')
          : isActive
            ? t('bot.controls.stop', '⏹ إيقاف البوت')
            : t('bot.controls.start', '▶ تشغيل البوت')}
      </button>

      {(error || localError) ? (
        <div className="bot-controls__error">
          {t('bot.controls.alert', 'تنبيه')}: {localError || error}
        </div>
      ) : null}
    </section>
  );
};

export default BotControls;
