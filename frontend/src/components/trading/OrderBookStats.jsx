// frontend/src/components/trading/OrderBookStats.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * OrderBookStats
 *
 * لوحة إحصائيات مختصرة لدفتر الأوامر.
 *
 * props:
 * - analysis: ناتج OrderBookAnalyzer.analyzeOrderBook(orderBook)، المتوقع أن يحتوي:
 *   {
 *     bestBid,
 *     bestAsk,
 *     midPrice,
 *     spread,
 *     spreadText,
 *     totalBidVolume,
 *     totalAskVolume,
 *     volumeImbalance, // بين -1 و +1 تقريبًا
 *     imbalanceLabel,
 *     largeOrders
 *   }
 * - compact: عرض مضغوط أم كامل
 * - theme: 'dark' | 'light'
 */
const OrderBookStats = ({ analysis, compact = false, theme = 'dark' }) => {
  const { t } = useTranslation();

  if (!analysis) return null;

  const {
    bestBid,
    bestAsk,
    midPrice,
    spreadText,
    totalBidVolume,
    totalAskVolume,
    volumeImbalance,
    imbalanceLabel,
  } = analysis;

  const imbalancePercent = Number.isFinite(volumeImbalance)
    ? (volumeImbalance * 100).toFixed(1)
    : null;

  const isDark = theme === 'dark';

  const containerStyle = {
    borderRadius: compact ? 16 : 20,
    padding: compact ? '6px 9px' : '8px 10px',
    border: isDark
      ? '1px solid rgba(30,64,175,0.75)'
      : '1px solid rgba(148,163,184,0.7)',
    background: isDark
      ? 'radial-gradient(circle at top, rgba(56,189,248,0.10), rgba(15,23,42,0.98))'
      : 'linear-gradient(135deg, #f9fafb, #e0f2fe)',
    boxShadow: isDark
      ? '0 18px 35px rgba(15,23,42,0.95)'
      : '0 10px 22px rgba(148,163,184,0.45)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: compact
      ? 'repeat(2, minmax(0, 1fr))'
      : 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 6,
    marginTop: 4,
  };

  const imbalanceColor =
    imbalancePercent == null
      ? 'var(--qa-text-soft, #9ca3af)'
      : volumeImbalance > 0.1
      ? '#4ade80'
      : volumeImbalance < -0.1
      ? '#fca5a5'
      : '#e5e7eb';

  return (
    <section className="orderbook-stats" style={containerStyle}>
      {/* العنوان */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? '#e5e7eb' : '#0f172a',
            }}
          >
            {t('orderBook.statsTitle', 'إحصائيات دفتر الأوامر')}
          </span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft, #9ca3af)',
            }}
          >
            {t(
              'orderBook.statsSubtitle',
              'نظرة سريعة على أفضل الأسعار وحجم السيولة والسبريد.',
            )}
          </span>
        </div>

        {imbalancePercent != null && (
          <span
            style={{
              fontSize: 11,
              color: imbalanceColor,
              textAlign: 'end',
            }}
          >
            {t(
              'orderBook.imbalanceShort',
              'اختلال السيولة',
            )}
            :{' '}
            <strong style={{ color: imbalanceColor }}>
              {imbalancePercent}%{' '}
            </strong>
            {imbalanceLabel && (
              <span
                style={{
                  fontSize: 10,
                  opacity: 0.8,
                }}
              >
                · {imbalanceLabel}
              </span>
            )}
          </span>
        )}
      </div>

      {/* شبكة الأرقام */}
      <div style={gridStyle}>
        <StatPill
          label={t('orderBook.bestBid', 'أفضل Bid')}
          value={formatNumber(bestBid)}
          accent="#4ade80"
        />
        <StatPill
          label={t('orderBook.bestAsk', 'أفضل Ask')}
          value={formatNumber(bestAsk)}
          accent="#fca5a5"
        />
        <StatPill
          label={t('orderBook.midPrice', 'السعر الوسطي')}
          value={formatNumber(midPrice)}
          accent="#38bdf8"
        />
        <StatPill
          label={t('orderBook.spread', 'السبريد')}
          value={spreadText || '--'}
          accent="#e5e7eb"
        />
        <StatPill
          label={t('orderBook.totalBidVolume', 'إجمالي حجم الـ Bid')}
          value={formatNumber(totalBidVolume, 3)}
          accent="#22c55e"
        />
        <StatPill
          label={t('orderBook.totalAskVolume', 'إجمالي حجم الـ Ask')}
          value={formatNumber(totalAskVolume, 3)}
          accent="#fb7185"
        />
      </div>
    </section>
  );
};

const StatPill = ({ label, value, accent }) => (
  <div
    style={{
      borderRadius: 999,
      padding: '5px 9px',
      border: '1px solid rgba(30,64,175,0.7)',
      background:
        'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,1))',
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
        color: accent || '#e5e7eb',
      }}
    >
      {value}
    </span>
  </div>
);

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num.toFixed(digits);
};

export default OrderBookStats;
