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

const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));

const MetricPill = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.35)',
      background: 'rgba(248,250,252,0.8)',
      minWidth: 0,
    }}
  >
    <div style={{ color: '#475569', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {label}
    </div>
    <div style={{ color: '#0f172a', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{value}</div>
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
        window.dispatchEvent(
          new CustomEvent('bot-error', { detail: { source: 'BotControls', error: err } }),
        );
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div
      style={{
        borderRadius: 18,
        border: '1px solid rgba(226,232,240,1)',
        background: 'white',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        padding: 22,
        margin: '18px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
            {t('bot.controls.title', 'التحكم السريع في بوت التداول')}
          </div>
          <div style={{ marginTop: 6, color: '#64748b', fontWeight: 600, fontSize: 13 }}>
            {t('bot.controls.subtitle', 'تشغيل/إيقاف مباشر + مؤشرات أداء سريعة.')}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isBusy}
          style={{
            border: 'none',
            borderRadius: 12,
            padding: '12px 16px',
            fontWeight: 900,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            color: 'white',
            background: isActive
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #22c55e, #16a34a)',
            opacity: isBusy ? 0.75 : 1,
            minWidth: 170,
          }}
        >
          {isBusy
            ? t('bot.controls.processing', 'جاري التنفيذ...')
            : isActive
              ? '⏹ إيقاف البوت'
              : '▶ تشغيل البوت'}
        </button>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: isActive ? '#22c55e' : '#ef4444',
            boxShadow: isActive ? '0 0 0 4px rgba(34,197,94,0.15)' : '0 0 0 4px rgba(239,68,68,0.15)',
          }}
        />
        <div style={{ fontWeight: 800, color: '#0f172a' }}>{statusLabel}</div>
        {isBusy ? <div style={{ color: '#64748b', fontWeight: 700 }}>(جاري التحديث…)</div> : null}
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 12,
        }}
      >
        <MetricPill label="إجمالي الربح" value={formatted.profit} />
        <MetricPill label="معدل النجاح" value={formatted.winRate} />
        <MetricPill label="عدد الصفقات" value={formatted.trades} />
      </div>

      {(error || localError) ? (
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(254,242,242,1)',
            border: '1px solid rgba(254,202,202,1)',
            color: '#991b1b',
            fontWeight: 800,
          }}
          role="alert"
        >
          تنبيه: {localError || error}
        </div>
      ) : null}
    </div>
  );
};

export default BotControls;
