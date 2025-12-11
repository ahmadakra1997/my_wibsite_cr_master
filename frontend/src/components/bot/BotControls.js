// frontend/src/components/bot/BotControls.js
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBot } from '../../context/BotContext';
import botService from '../../services/botService';

/**
 * BotControls
 * لوحة تحكم سريعة بالبوت على مستوى عالمي:
 * - زر تشغيل/إيقاف البوت
 * - عرض حالة الاتصال والنشاط
 * - ملخص أداء صغير (الربح الكلي، عدد الصفقات، نسبة الفوز)
 *
 * تعتمد على:
 * - BotContext للحصول على حالة البوت وأدائه
 * - botService لاستدعاء APIs التفعيل/الإيقاف
 */
const BotControls = () => {
  const { t } = useTranslation();

  // نقرأ ما يوفره BotContext، مع قيم افتراضية للمشروع لو بعض الحقول غير موجودة
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

  const statusColor = isActive ? 'bg-emerald-500' : 'bg-slate-500';

  const totalProfit = botPerformance.totalProfit ?? 0;
  const winRate = botPerformance.winRate ?? 0;
  const totalTrades = botPerformance.totalTrades ?? 0;

  const formattedTotalProfit = useMemo(
    () => formatNumber(totalProfit, 2),
    [totalProfit],
  );

  const formattedWinRate = useMemo(
    () => formatNumber(winRate, 1),
    [winRate],
  );

  const formattedTotalTrades = useMemo(
    () => (Number.isFinite(Number(totalTrades)) ? totalTrades : '--'),
    [totalTrades],
  );

  const handleToggle = async () => {
    if (isBusy) return;

    setLocalError(null);
    setLocalLoading(true);

    try {
      if (isActive) {
        // إيقاف البوت
        await botService.deactivateBot();
      } else {
        // تشغيل البوت
        await botService.activateBot();
      }

      // تحديث حالة البوت من الـ Context إن توفرت الدوال
      if (typeof loadBotStatus === 'function') {
        await loadBotStatus();
      }
      if (typeof loadBotPerformance === 'function') {
        await loadBotPerformance();
      }
    } catch (err) {
      console.error('❌ Error toggling bot:', err);
      const message =
        err?.message ||
        t('bot.errors.generic', 'حدث خطأ أثناء تحديث حالة البوت.');

      setLocalError(message);

      // إرسال حدث عام ليستفيد منه ErrorTrackingService إن وجد
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('bot-error', {
            detail: { source: 'BotControls', error: err },
          }),
        );
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const primaryButtonLabel = isActive
    ? t('bot.controls.stop', 'إيقاف البوت')
    : t('bot.controls.start', 'تشغيل البوت');

  const primaryButtonColor = isActive
    ? 'bg-rose-500 hover:bg-rose-600'
    : 'bg-emerald-500 hover:bg-emerald-600';

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 shadow-xl space-y-4">
      {/* العنوان وحالة البوت */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            {t('bot.controls.title', 'التحكم السريع في بوت التداول')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              'bot.controls.subtitle',
              'قم بتشغيل أو إيقاف البوت فوراً مع نظرة سريعة على الأداء.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-slate-200">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full shadow-lg ${statusColor}`}
            />
            {statusLabel}
          </span>
          {isBusy && (
            <span className="text-xs text-sky-300 animate-pulse">
              {t('bot.controls.updating', 'جاري التحديث...')}
            </span>
          )}
        </div>
      </div>

      {/* أزرار التحكم + ملخص الأداء */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* زر تشغيل/إيقاف */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isBusy}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-slate-950 shadow-lg transition ${primaryButtonColor} ${
              isBusy ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isBusy ? (
              <>
                <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-1" />
                {t('bot.controls.processing', 'جاري التنفيذ...')}
              </>
            ) : (
              <>
                <span className="mr-1">{isActive ? '⏹' : '▶'}</span>
                {primaryButtonLabel}
              </>
            )}
          </button>
        </div>

        {/* ملخص الأداء السريع */}
        <div className="flex flex-wrap gap-3 text-xs">
          <MetricPill
            label={t('bot.metrics.totalProfit', 'الربح الكلي')}
            value={`${formattedTotalProfit} USDT`}
          />
          <MetricPill
            label={t('bot.metrics.winRate', 'نسبة الفوز')}
            value={`${formattedWinRate}%`}
          />
          <MetricPill
            label={t('bot.metrics.totalTrades', 'إجمالي الصفقات')}
            value={formattedTotalTrades}
          />
        </div>
      </div>

      {/* رسائل الأخطاء إن وجدت */}
      {(error || localError) && (
        <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-700/70 rounded-lg px-3 py-2">
          <strong className="mr-1">
            {t('bot.controls.errorTitle', 'تنبيه:')}
          </strong>
          {localError || error}
        </div>
      )}
    </div>
  );
};

const MetricPill = ({ label, value }) => (
  <div className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 flex items-center gap-2">
    <span className="text-slate-400">{label}</span>
    <span className="text-slate-50 font-semibold">{value}</span>
  </div>
);

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default BotControls;
