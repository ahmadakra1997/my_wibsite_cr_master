// frontend/src/components/trading/OrderBookHeader.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * OrderBookHeader
 * رأس دفتر الأوامر: الرمز, حالة الاتصال, أفضل Bid/Ask,
 * السعر الوسطي, السبريد, ضغط السيولة.
 *
 * props:
 * - symbol
 * - lastUpdate
 * - isConnected
 * - stats: ناتج OrderBookAnalyzer.analyzeOrderBook()
 */
const OrderBookHeader = ({
  symbol,
  lastUpdate,
  isConnected,
  stats = {},
}) => {
  const { t } = useTranslation();
  const {
    bestBid,
    bestAsk,
    midPrice,
    spreadText,
    marketPressure,
  } = stats;

  const formatTime = (value) => {
    if (!value)
      return t(
        'orderBook.noUpdates',
        'لا يوجد تحديث بعد',
      );

    if (value instanceof Date) return value.toLocaleTimeString();

    if (typeof value === 'number') {
      try {
        return new Date(value).toLocaleTimeString();
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const connectionColor = isConnected ? '#22c55e' : '#ef4444';

  const pressureLabel =
    marketPressure === 'bullish'
      ? t('orderBook.pressure.bullish', 'ضغط شرائي')
      : marketPressure === 'bearish'
      ? t('orderBook.pressure.bearish', 'ضغط بيعي')
      : t('orderBook.pressure.neutral', 'توازن');

  const pressureColor =
    marketPressure === 'bullish'
      ? '#4ade80'
      : marketPressure === 'bearish'
      ? '#fca5a5'
      : '#e5e7eb';

  const containerStyle = {
    borderRadius: 18,
    padding: '8px 10px',
    border: '1px solid rgba(30,64,175,0.8)',
    background:
      'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.96))',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  return (
    <header className="orderbook-header" style={containerStyle}>
      {/* الرمز + حالة الاتصال + الوقت */}
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
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#e5e7eb',
              }}
            >
              {t('orderBook.title', 'دفتر الطلبات')}{' '}
              {symbol ? `· ${symbol}` : ''}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.6)',
                background: 'rgba(15,23,42,0.95)',
                color: '#e5e7eb',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '999px',
                  backgroundColor: connectionColor,
                  boxShadow: `0 0 0 4px ${
                    isConnected
                      ? 'rgba(34,197,94,0.25)'
                      : 'rgba(248,113,113,0.25)'
                  }`,
                }}
              />
              {isConnected
                ? t('common.connected', 'متصل')
                : t('common.disconnected', 'غير متصل')}
            </span>
          </div>

          <div
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft, #9ca3af)',
            }}
          >
            {t('common.lastUpdated', 'آخر تحديث')}:{' '}
            <span
              style={{
                color: '#e5e7eb',
              }}
            >
              {formatTime(lastUpdate)}
            </span>
          </div>
        </div>

        {/* الضغط الشرائي/البيعي */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'flex-end',
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft, #9ca3af)',
            }}
          >
            {t(
              'orderBook.pressureLabel',
              'حالة ضغط السيولة',
            )}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: pressureColor,
            }}
          >
            {pressureLabel}
          </span>
        </div>
      </div>

      {/* أفضل الأسعار + السبريد */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 6,
          marginTop: 4,
        }}
      >
        <HeaderPill
          label={t('orderBook.bestBid', 'أفضل Bid')}
          value={formatNumber(bestBid)}
          color="#4ade80"
        />
        <HeaderPill
          label={t('orderBook.bestAsk', 'أفضل Ask')}
          value={formatNumber(bestAsk)}
          color="#fca5a5"
        />
        <HeaderPill
          label={t('orderBook.midPrice', 'السعر الوسطي')}
          value={formatNumber(midPrice)}
          color="#38bdf8"
        />
        <HeaderPill
          label={t('orderBook.spread', 'السبريد')}
          value={spreadText || '--'}
          color="#e5e7eb"
        />
      </div>
    </header>
  );
};

const HeaderPill = ({ label, value, color }) => {
  const displayValue =
    value === null || value === undefined || value === ''
      ? '--'
      : value;

  return (
    <div
      style={{
        borderRadius: 999,
        padding: '5px 10px',
        border: '1px solid rgba(30,64,175,0.75)',
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
          color: color || '#e5e7eb',
        }}
      >
        {displayValue}
      </span>
    </div>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  if (Math.abs(num) >= 1000) return num.toFixed(2);
  return num.toFixed(digits);
};

export default OrderBookHeader;
