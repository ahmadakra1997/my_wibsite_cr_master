// frontend/src/components/trading/PerformanceAnalytics.jsx

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PositionAnalyzer from '../../services/positionAnalyzer';

/**
 * PerformanceAnalytics
 * لوحة تحليلات الأداء مبنية على المراكز الموجودة في trading.positions
 * عبر خدمة PositionAnalyzer.
 *
 * تُستخدم داخل TradingInterface أسفل الصفحة.
 */
const PerformanceAnalytics = () => {
  const { t } = useTranslation();

  const { positions = [], isLoading } = useSelector((state) => {
    const trading = state?.trading || {};
    return {
      positions: trading.positions || [],
      isLoading: trading.isLoading || false,
    };
  });

  const analyzer = useMemo(() => new PositionAnalyzer(), []);

  const stats = useMemo(
    () => analyzer.calculatePositionStats(Array.isArray(positions) ? positions : []),
    [positions, analyzer],
  );

  const {
    totalPositions = 0,
    openPositions = 0,
    closedPositions = 0,
    netProfit = 0,
    winRate = 0,
    maxDrawdown = 0,
    bestTrade,
    worstTrade,
  } = stats || {};

  const netProfitColor =
    netProfit > 0
      ? 'text-emerald-300'
      : netProfit < 0
        ? 'text-rose-300'
        : 'text-slate-100';

  const ddColor = maxDrawdown > 0 ? 'text-amber-300' : 'text-slate-100';

  const metrics = [
    {
      key: 'netProfit',
      label: t('analytics.netProfit', 'صافي الربح'),
      value: formatNumber(netProfit, 2),
      suffix: 'USDT',
      icon: '💰',
      className: netProfitColor,
    },
    {
      key: 'winRate',
      label: t('analytics.winRate', 'نسبة الصفقات الرابحة'),
      value: formatNumber(winRate, 2),
      suffix: '%',
      icon: '📈',
    },
    {
      key: 'totalPositions',
      label: t('analytics.totalPositions', 'إجمالي المراكز'),
      value: totalPositions,
      suffix: '',
      icon: '📊',
    },
    {
      key: 'openPositions',
      label: t('analytics.openPositions', 'مفتوحة الآن'),
      value: openPositions,
      suffix: '',
      icon: '🟢',
    },
    {
      key: 'closedPositions',
      label: t('analytics.closedPositions', 'مغلقة'),
      value: closedPositions,
      suffix: '',
      icon: '⚪',
    },
    {
      key: 'maxDrawdown',
      label: t('analytics.maxDrawdown', 'أقصى تراجع'),
      value: formatNumber(maxDrawdown, 2),
      suffix: 'USDT',
      icon: '📉',
      className: ddColor,
    },
  ];

  return (
    <div
      className="space-y-3"
      style={{ direction: 'rtl' }}
      data-testid="performance-analytics"
    >
      {/* رأس اللوحة */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-lg">📊</span>
            {t('analytics.title', 'تحليلات الأداء')}
          </h2>
          <p className="text-[0.75rem] text-slate-400 mt-0.5">
            {t(
              'analytics.subtitle',
              'نظرة شاملة على نتائج تداولاتك: الربحية، نسبة الفوز، وأقصى تراجع في الحساب.',
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-[0.7rem] text-slate-400">
          {isLoading && (
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              {t('analytics.loading', 'جاري تحديث بيانات الأداء...')}
            </span>
          )}
          <span>
            {t('analytics.totalTradesLabel', 'إجمالي المراكز المسجّلة')}:{' '}
            <span className="text-slate-100 font-semibold">{totalPositions}</span>
          </span>
        </div>
      </div>

      {/* شبكة المقاييس الأساسية */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </div>

      {/* أفضل / أسوأ صفقة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
        <TradeHighlight
          type="best"
          trade={bestTrade}
          title={t('analytics.bestTrade', 'أفضل صفقة')}
          icon="🏆"
        />
        <TradeHighlight
          type="worst"
          trade={worstTrade}
          title={t('analytics.worstTrade', 'أسوأ صفقة')}
          icon="⚠️"
        />
      </div>
    </div>
  );
};

const MetricCard = ({ metric }) => {
  const { label, value, suffix, icon, className } = metric;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 shadow-sm shadow-slate-950/80">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[0.72rem] text-slate-400 mb-1">{label}</span>
          <span
            className={`text-xs font-semibold text-slate-100 ${className || ''}`}
          >
            {value}{' '}
            {suffix && (
              <span className="text-[0.7rem] text-slate-400">{suffix}</span>
            )}
          </span>
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center text-base">
          <span>{icon}</span>
        </div>
      </div>
    </div>
  );
};

const TradeHighlight = ({ trade, type, title, icon }) => {
  const { t } = useTranslation();

  if (!trade) {
    return (
      <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-[0.75rem] text-slate-400">
        {type === 'best'
          ? t('analytics.noBestTrade', 'لم يتم تسجيل صفقة رابحة بعد.')
          : t('analytics.noWorstTrade', 'لم يتم تسجيل صفقة خاسرة بعد.')}
      </div>
    );
  }

  const pnl = Number(trade.realizedPnl || trade.pnl || 0);
  const pnlColor =
    pnl > 0 ? 'text-emerald-300' : pnl < 0 ? 'text-rose-300' : 'text-slate-100';

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      const d = value instanceof Date ? value : new Date(value);
      return d.toLocaleString();
    } catch {
      return String(value);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5 text-[0.75rem]">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-semibold text-slate-100">{title}</span>
        </div>
        <span className={`text-xs font-semibold ${pnlColor}`}>
          {pnl.toFixed(2)} USDT
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-[0.7rem] text-slate-400">
        <span>
          {t('analytics.symbol', 'الرمز')}: {trade.symbol || '—'}
        </span>
        <span>
          {t('analytics.side', 'الاتجاه')}:{' '}
          {trade.side === 'long'
            ? t('positions.long', 'شراء (Long)')
            : trade.side === 'short'
              ? t('positions.short', 'بيع (Short)')
              : '—'}
        </span>
      </div>
      <div className="mt-1 text-[0.7rem] text-slate-500">
        {t('analytics.closedAt', 'تاريخ الإغلاق')}: {formatDate(trade.closedAt)}
      </div>
    </div>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PerformanceAnalytics;
