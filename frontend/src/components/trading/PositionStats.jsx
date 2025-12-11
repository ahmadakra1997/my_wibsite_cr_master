// frontend/src/components/trading/PositionStats.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PositionStats
 * يعرض ملخصًا سريعًا لإحصائيات المحفظة:
 * - إجمالي وعدد المراكز المفتوحة/المغلقة
 * - صافي الربح، الربح الإجمالي، الخسارة الإجمالية
 * - نسبة الفوز، أقصى تراجع
 *
 * يعتمد على كائن stats القادم من PositionAnalyzer.calculatePositionStats().
 */
const PositionStats = ({ stats, compact = false }) => {
  const { t } = useTranslation();

  if (!stats) return null;

  const {
    totalPositions = 0,
    openPositions = 0,
    closedPositions = 0,
    netProfit = 0,
    grossProfit = 0,
    grossLoss = 0,
    winRate = 0,
    maxDrawdown = 0,
    riskLevel = 'low',
  } = stats;

  const profitClass =
    netProfit > 0
      ? 'text-emerald-300'
      : netProfit < 0
        ? 'text-rose-300'
        : 'text-slate-200';

  const drawdownClass =
    maxDrawdown > 0 ? 'text-amber-200' : 'text-slate-200';

  const containerClasses = compact
    ? 'py-2.5 px-3 rounded-xl'
    : 'py-3 px-3.5 rounded-2xl';

  return (
    <div
      className={`bg-slate-900/80 border border-slate-700/80 shadow-inner shadow-slate-950/80 ${containerClasses}`}
      data-testid="position-stats"
    >
      {/* العنوان */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">
            {t('positions.overview', 'ملخص المراكز')}
          </span>
          <RiskChip riskLevel={riskLevel} />
        </div>
        <span className="text-[0.7rem] text-slate-400">
          {t('positions.totalPositions', 'إجمالي المراكز')}: {totalPositions}
        </span>
      </div>

      {/* شبكة الأرقام */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[0.72rem]">
        <StatItem
          label={t('positions.openPositions', 'المراكز المفتوحة')}
          value={openPositions}
        />
        <StatItem
          label={t('positions.closedPositions', 'المراكز المغلقة')}
          value={closedPositions}
        />
        <StatItem
          label={t('positions.netProfit', 'صافي الربح')}
          value={`${formatNumber(netProfit, 2)} USDT`}
          valueClass={profitClass}
        />
        <StatItem
          label={t('positions.winRate', 'نسبة الصفقات الرابحة')}
          value={`${formatNumber(winRate, 2)}%`}
        />
        {!compact && (
          <>
            <StatItem
              label={t('positions.grossProfit', 'إجمالي الأرباح')}
              value={`${formatNumber(grossProfit, 2)} USDT`}
            />
            <StatItem
              label={t('positions.grossLoss', 'إجمالي الخسائر')}
              value={`${formatNumber(grossLoss, 2)} USDT`}
            />
            <StatItem
              label={t('positions.maxDrawdown', 'أقصى تراجع')}
              value={`${formatNumber(maxDrawdown, 2)} USDT`}
              valueClass={drawdownClass}
            />
          </>
        )}
      </div>
    </div>
  );
};

const StatItem = ({ label, value, valueClass }) => (
  <div className="flex flex-col">
    <span className="text-slate-400 text-[0.7rem] mb-0.5">{label}</span>
    <span className={`text-xs font-medium ${valueClass || 'text-slate-100'}`}>
      {value}
    </span>
  </div>
);

const RiskChip = ({ riskLevel }) => {
  let label = 'منخفض';
  let klass = 'bg-emerald-900/70 text-emerald-300 border-emerald-500/50';

  if (riskLevel === 'medium') {
    label = 'متوسط';
    klass = 'bg-amber-900/70 text-amber-200 border-amber-500/50';
  } else if (riskLevel === 'high') {
    label = 'عالٍ';
    klass = 'bg-orange-900/70 text-orange-200 border-orange-500/50';
  } else if (riskLevel === 'critical') {
    label = 'حرِج';
    klass = 'bg-rose-900/70 text-rose-200 border-rose-500/50';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[0.65rem] ${klass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{label}</span>
    </span>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PositionStats;
