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
      // لو جاي من الـ crosshair كقيمة واحدة فقط
      close = price;
    } else if (typeof price === 'object') {
      open = price.open ?? price.o ?? null;
      high = price.high ?? price.h ?? null;
      low = price.low ?? price.l ?? null;
      close = price.close ?? price.c ?? null;
    }

    const formatTime = (tVal) => {
      if (!tVal) return '--';

      // timestamp بالثواني
      if (typeof tVal === 'number') {
        try {
          const d = new Date(tVal * 1000);
          return d.toLocaleString();
        } catch {
          return String(tVal);
        }
      }

      // BusinessDay من lightweight-charts ({ year, month, day })
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

  const isLight = theme === 'light';

  const containerStyle = {
    borderRadius: 16,
    padding: '6px 9px',
    border: isLight
      ? '1px solid rgba(148,163,184,0.45)'
      : '1px solid rgba(30,64,175,0.8)',
    background: isLight
      ? 'linear-gradient(135deg, #f9fafb, #e0f2fe)'
      : 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.96))',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  };

  return (
    <section className="chart-legend" style={containerStyle}>
      {/* العنوان والوقت */}
      <div style={headerStyle}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isLight ? '#0f172a' : '#e5e7eb',
            }}
          >
            {currentSymbol}{' '}
            ·{' '}
            {t('charts.legendTitle', 'بيانات الشمعة الحالية')}
          </span>

          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 999,
              border: isLight
                ? '1px solid rgba(59,130,246,0.5)'
                : '1px solid rgba(56,189,248,0.8)',
              color: isLight ? '#1f2937' : '#e0f2fe',
              background: isLight
                ? 'rgba(219,234,254,0.8)'
                : 'rgba(15,23,42,0.9)',
            }}
          >
            {parsed
              ? parsed.timeLabel
              : t(
                  'charts.legendHint',
                  'حرّك المؤشر فوق الشموع لعرض التفاصيل.',
                )}
          </span>
        </div>

        {parsed && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft, #9ca3af)',
            }}
          >
            {t('charts.currentPrice', 'السعر الحالي')}: {' '}
            <strong
              style={{
                color: isLight ? '#111827' : '#e5e7eb',
              }}
            >
              {formatNumber(parsed.close)}
            </strong>
          </span>
        )}
      </div>

      {/* قيم O / H / L / C */}
      {parsed && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 6,
            marginTop: 4,
          }}
        >
          <LegendItem
            label="O"
            value={parsed.open}
            color="#38bdf8"
          />
          <LegendItem
            label="H"
            value={parsed.high}
            color="#4ade80"
          />
          <LegendItem
            label="L"
            value={parsed.low}
            color="#f97373"
          />
          <LegendItem
            label="C"
            value={parsed.close}
            color="#e5e7eb"
          />
        </div>
      )}
    </section>
  );
};

const LegendItem = ({ label, value, color }) => {
  const num =
    value != null && Number.isFinite(Number(value))
      ? Number(value)
      : null;

  const formatted = (() => {
    if (num == null) return '--';
    if (Math.abs(num) >= 1000) return num.toFixed(2);
    if (Math.abs(num) >= 1) return num.toFixed(4);
    return num.toFixed(6);
  })();

  return (
    <div
      style={{
        borderRadius: 10,
        padding: '4px 6px',
        border: '1px solid rgba(30,64,175,0.6)',
        background:
          'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,1))',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        fontSize: 11,
      }}
    >
      <span
        style={{
          color: 'var(--qa-text-soft, #9ca3af)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: color || '#e5e7eb',
        }}
      >
        {formatted}
      </span>
    </div>
  );
};

const formatNumber = (value, digits = 4) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num.toFixed(digits);
};

export default ChartLegend;
