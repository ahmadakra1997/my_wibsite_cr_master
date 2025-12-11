// frontend/src/components/trading/OrderBookHeader.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * OrderBookHeader
 * رأس دفتر الأوامر: الرمز, حالة الاتصال, أفضل Bid/Ask, السعر الوسطي, السبريد, ضغط السيولة.
 *
 * props:
 * - symbol
 * - lastUpdate
 * - isConnected
 * - stats: ناتج OrderBookAnalyzer.analyzeOrderBook()
 */
const OrderBookHeader = ({ symbol, lastUpdate, isConnected, stats = {} }) => {
  const { t } = useTranslation();

  const { bestBid, bestAsk, midPrice, spreadText, marketPressure } = stats;

  const formatTime = (value) => {
    if (!value) return t('orderBook.noUpdates', 'لا يوجد تحديث بعد');

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

  return (
    <div
      className="order-book-header"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.75rem',
        marginBottom: '0.6rem',
        direction: 'rtl',
      }}
    >
      {/* الرمز + حالة الاتصال */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: '2.3rem',
            height: '2.3rem',
            borderRadius: '999px',
            border: '1px solid rgba(30,64,175,0.8)',
            background:
              'radial-gradient(circle at top, rgba(37,99,235,0.35), rgba(15,23,42,1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}
        >
          📊
        </div>
        <div>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#e5e7eb',
            }}
          >
            {t('orderBook.title', 'دفتر الطلبات')}{' '}
            <span
              style={{
                fontSize: '0.85rem',
                color: 'rgba(148,163,184,0.96)',
              }}
            >
              · {symbol}
            </span>
          </div>
          <div
            style={{
              marginTop: '0.15rem',
              fontSize: '0.78rem',
              color: 'rgba(148,163,184,0.96)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '999px',
                  backgroundColor: connectionColor,
                  boxShadow: `0 0 10px ${connectionColor}`,
                }}
              />
              <span>
                {isConnected
                  ? t('common.connected', 'متصل')
                  : t('common.disconnected', 'غير متصل')}
              </span>
            </span>

            <span
              style={{
                marginInlineStart: '0.6rem',
              }}
            >
              {t('common.lastUpdated', 'آخر تحديث')}: {formatTime(lastUpdate)}
            </span>
          </div>
        </div>
      </div>

      {/* أفضل الأسعار + السبريد + ضغط السيولة */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          gap: '0.6rem',
          fontSize: '0.78rem',
        }}
      >
        <HeaderPill
          label={t('orderBook.bestBid', 'أفضل عرض شراء')}
          value={bestBid}
          color="#22c55e"
        />
        <HeaderPill
          label={t('orderBook.bestAsk', 'أفضل طلب بيع')}
          value={bestAsk}
          color="#ef4444"
        />
        <HeaderPill
          label={t('orderBook.midPrice', 'السعر الوسطي')}
          value={midPrice}
          color="#38bdf8"
        />
        <HeaderPill
          label={t('orderBook.spread', 'فارق السعر (سبريد)')}
          value={spreadText}
          color="#eab308"
        />
        <HeaderPill
          label={t('orderBook.pressure.label', 'اتجاه السيولة')}
          value={pressureLabel}
          color="#a855f7"
        />
      </div>
    </div>
  );
};

const HeaderPill = ({ label, value, color }) => {
  const displayValue =
    value === null || value === undefined || value === '' ? '--' : value;

  return (
    <div
      style={{
        borderRadius: '999px',
        padding: '0.25rem 0.7rem',
        border: `1px solid ${color}`,
        background: 'rgba(15,23,42,0.96)',
        minWidth: '140px',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          color: 'rgba(148,163,184,0.96)',
          marginBottom: '0.05rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color,
        }}
      >
        {displayValue}
      </div>
    </div>
  );
};

export default OrderBookHeader;
