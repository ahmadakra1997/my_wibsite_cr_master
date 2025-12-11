// frontend/src/components/trading/OrderBookStats.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * OrderBookStats
 * لوحة إحصاءات مكملة لدفتر الأوامر:
 * - إجمالي حجم الـ bids والـ asks
 * - عدد مستويات كل جانب
 * - انحياز العمق (depthImbalance)
 * - اتجاه السيولة (bullish / bearish / neutral)
 *
 * props:
 * - stats: ناتج OrderBookAnalyzer.analyzeOrderBook()
 * - symbol
 * - theme
 */
const OrderBookStats = ({ stats = {}, symbol, theme = 'dark' }) => {
  const { t } = useTranslation();

  const {
    totalBidVolume = 0,
    totalAskVolume = 0,
    bidLevels = 0,
    askLevels = 0,
    depthImbalance = 0,
    marketPressure = 'neutral',
    spreadText,
  } = stats;

  const formatNumber = (value, digits = 4) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '--';
    return num.toFixed(digits);
  };

  const imbalancePercent = Math.round((depthImbalance || 0) * 100);

  const pressureLabel =
    marketPressure === 'bullish'
      ? t('orderBook.pressure.bullish', 'ضغط شرائي')
      : marketPressure === 'bearish'
        ? t('orderBook.pressure.bearish', 'ضغط بيعي')
        : t('orderBook.pressure.neutral', 'توازن');

  const pressureColor =
    marketPressure === 'bullish'
      ? '#22c55e'
      : marketPressure === 'bearish'
        ? '#ef4444'
        : '#eab308';

  return (
    <div
      className={`order-book-stats ${theme}`}
      style={{
        marginTop: '0.7rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '12px',
        border: '1px solid rgba(30,64,175,0.8)',
        background:
          theme === 'light'
            ? 'rgba(248,250,252,0.98)'
            : 'rgba(15,23,42,0.98)',
        direction: 'rtl',
        fontSize: '0.8rem',
      }}
    >
      <div
        style={{
          marginBottom: '0.45rem',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: theme === 'light' ? '#0f172a' : '#e5e7eb',
          }}
        >
          {t('orderBook.statsTitle', 'إحصائيات دفتر الطلبات')}{' '}
          {symbol && (
            <span
              style={{
                fontSize: '0.78rem',
                color:
                  theme === 'light'
                    ? 'rgba(71,85,105,0.95)'
                    : 'rgba(148,163,184,0.96)',
              }}
            >
              · {symbol}
            </span>
          )}
        </div>

        {spreadText && (
          <div
            style={{
              fontSize: '0.78rem',
              color:
                theme === 'light'
                  ? 'rgba(71,85,105,0.9)'
                  : 'rgba(148,163,184,0.96)',
            }}
          >
            {t('orderBook.spread', 'السبريد')}: {spreadText}
          </div>
        )}
      </div>

      <div
        className="order-book-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.5rem',
        }}
      >
        <StatItem
          label={t('orderBook.totalBidVolume', 'إجمالي حجم الطلبات (شراء)')}
          value={formatNumber(totalBidVolume)}
        />
        <StatItem
          label={t('orderBook.totalAskVolume', 'إجمالي حجم الطلبات (بيع)')}
          value={formatNumber(totalAskVolume)}
        />
        <StatItem
          label={t('orderBook.levelsBid', 'عدد مستويات الشراء')}
          value={bidLevels}
        />
        <StatItem
          label={t('orderBook.levelsAsk', 'عدد مستويات البيع')}
          value={askLevels}
        />
        <StatItem
          label={t('orderBook.depthImbalance', 'انحياز عمق السوق')}
          value={
            Number.isFinite(imbalancePercent)
              ? `${imbalancePercent > 0 ? '+' : ''}${imbalancePercent}%`
              : '--'
          }
          color={pressureColor}
        />
        <StatItem
          label={t('orderBook.pressure.label', 'اتجاه السيولة')}
          value={pressureLabel}
          color={pressureColor}
        />
      </div>
    </div>
  );
};

const StatItem = ({ label, value, color }) => (
  <div
    style={{
      borderRadius: '10px',
      padding: '0.4rem 0.55rem',
      border: '1px solid rgba(30,64,175,0.7)',
      background: 'rgba(15,23,42,0.96)',
    }}
  >
    <div
      style={{
        fontSize: '0.76rem',
        color: 'rgba(148,163,184,0.96)',
        marginBottom: '0.1rem',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: '0.82rem',
        fontWeight: 600,
        color: color || '#e5e7eb',
      }}
    >
      {value}
    </div>
  </div>
);

export default OrderBookStats;
