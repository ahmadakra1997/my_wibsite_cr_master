// frontend/src/components/trading/ChartLegend.jsx

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ChartLegend
 * يعرض تفاصيل الشمعة الحالية بحسب موقع مؤشر الماوس (crosshairData):
 * - وقت الشمعة
 * - Open / High / Low / Close
 *
 * props:
 * - crosshairData: { time, price } حيث price إما رقم أو كائن { open, high, low, close }
 * - currentSymbol
 * - theme: 'dark' | 'light'
 */
const ChartLegend = ({ crosshairData, currentSymbol, theme = 'dark' }) => {
  const { t } = useTranslation();

  const parsed = useMemo(() => {
    if (!crosshairData || !crosshairData.price) return null;

    const { time, price } = crosshairData;

    let open = null;
    let high = null;
    let low = null;
    let close = null;

    if (typeof price === 'number') {
      close = price;
    } else if (typeof price === 'object') {
      open = price.open ?? price.o ?? null;
      high = price.high ?? price.h ?? null;
      low = price.low ?? price.l ?? null;
      close = price.close ?? price.c ?? null;
    }

    const formatTime = (tVal) => {
      if (!tVal) return '--';
      // لو كان timestamp بالثواني
      if (typeof tVal === 'number') {
        try {
          const d = new Date(tVal * 1000);
          return d.toLocaleString();
        } catch {
          return String(tVal);
        }
      }
      // BusinessDay من lightweight-charts (كائن { year, month, day })
      if (typeof tVal === 'object') {
        const y = tVal.year || tVal.y;
        const m = tVal.month || tVal.m;
        const d = tVal.day || tVal.d;
        if (y && m && d) {
          const mm = String(m).padStart(2, '0');
          const dd = String(d).padStart(2, '0');
          return `${y}-${mm}-${dd}`;
        }
      }
      return String(tVal);
    };

    return {
      open,
      high,
      low,
      close,
      timeLabel: formatTime(time),
    };
  }, [crosshairData]);

  const bg =
    theme === 'light'
      ? 'bg-slate-50 border-slate-200'
      : 'bg-slate-900/90 border-slate-700/80';

  return (
    <div
      className={`mt-2 rounded-xl border px-3 py-2.5 text-[0.78rem] ${bg}`}
      data-testid="chart-legend"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-100">
            {currentSymbol}{' '}
            <span className="text-[0.7rem] text-slate-400">
              {t('charts.legendTitle', 'بيانات الشمعة الحالية')}
            </span>
          </span>
          <span className="text-[0.7rem] text-slate-400">
            {parsed ? parsed.timeLabel : t(
              'charts.legendHint',
              'حرّك المؤشر فوق الشموع لعرض التفاصيل.',
            )}
          </span>
        </div>
      </div>

      {parsed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <LegendItem
            label={t('charts.open', 'الافتتاح')}
            value={parsed.open}
            color="text-amber-300"
          />
          <LegendItem
            label={t('charts.high', 'الأعلى')}
            value={parsed.high}
            color="text-emerald-300"
          />
          <LegendItem
            label={t('charts.low', 'الأدنى')}
            value={parsed.low}
            color="text-rose-300"
          />
          <LegendItem
            label={t('charts.close', 'الإغلاق')}
            value={parsed.close}
            color="text-sky-300"
          />
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ label, value, color }) => {
  const num =
    value != null && Number.isFinite(Number(value)) ? Number(value) : null;

  const formatted = (() => {
    if (num == null) return '--';
    if (Math.abs(num) >= 1000) return num.toFixed(2);
    if (Math.abs(num) >= 1) return num.toFixed(4);
    return num.toFixed(6);
  })();

  return (
    <div className="flex flex-col">
      <span className="text-[0.7rem] text-slate-400 mb-0.5">
        {label}
      </span>
      <span className={`text-xs font-semibold ${color || 'text-slate-100'}`}>
        {formatted}
      </span>
    </div>
  );
};

export default ChartLegend;
