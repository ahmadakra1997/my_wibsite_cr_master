// frontend/src/components/trading/OrderBookRow.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * OrderBookRow
 * صف واحد في دفتر الأوامر: سعر + كمية + نسبة من إجمالي العمق.
 *
 * props:
 * - order: { price, quantity } أو [price, quantity]
 * - isBid: true لعروض الشراء، false لطلبات البيع
 * - total: إجمالي الحجم لكل الجانب (للمستقبل)
 * - percentage: نسبة هذا الصف من إجمالي حجم الجانب
 * - onClick(order)
 * - theme: 'dark' | 'light'
 */
const OrderBookRow = ({
  order,
  isBid = true,
  total = 0,
  percentage = 0,
  onClick,
  theme = 'dark',
}) => {
  const { t } = useTranslation();
  if (!order) return null;

  const price = Number(order.price ?? order[0]);
  const quantity = Number(order.quantity ?? order.qty ?? order[1]);

  const safePercentage = Math.max(
    0,
    Math.min(100, Number(percentage) || 0),
  );

  const formatNumber = (value, digits = 4) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '--';
    return num.toFixed(digits);
  };

  const backgroundColor =
    theme === 'light'
      ? isBid
        ? 'rgba(34,197,94,0.12)'
        : 'rgba(248,113,113,0.12)'
      : isBid
      ? 'rgba(22,163,74,0.18)'
      : 'rgba(248,113,113,0.18)';

  const barColor =
    theme === 'light'
      ? isBid
        ? 'rgba(34,197,94,0.35)'
        : 'rgba(248,113,113,0.35)'
      : isBid
      ? 'rgba(22,163,74,0.5)'
      : 'rgba(248,113,113,0.5)';

  const textColor =
    theme === 'light'
      ? isBid
        ? '#166534'
        : '#b91c1c'
      : isBid
      ? '#4ade80'
      : '#fca5a5';

  const handleClick = () => {
    if (onClick) onClick(order);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="orderbook-row"
      style={{
        position: 'relative',
        width: '100%',
        border: 'none',
        outline: 'none',
        padding: 0,
        background: 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'right',
      }}
    >
      {/* شريط العمق في الخلفية */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor:
            theme === 'dark'
              ? 'rgba(15,23,42,0.95)'
              : '#f9fafb',
        }}
      >
        {safePercentage > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              [isBid ? 'left' : 'right']: 0,
              width: `${safePercentage}%`,
              background: backgroundColor,
            }}
          />
        )}
      </div>

      {/* المحتوى */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 0.8fr)',
          gap: 6,
          padding: '3px 8px',
          fontSize: 11,
        }}
      >
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            color: textColor,
          }}
        >
          {Number.isFinite(price)
            ? formatNumber(price, 4)
            : '--'}
        </span>

        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            color: '#e5e7eb',
          }}
        >
          {Number.isFinite(quantity)
            ? formatNumber(quantity, 4)
            : '--'}
        </span>

        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--qa-text-soft, #9ca3af)',
          }}
        >
          {safePercentage > 0
            ? `${safePercentage.toFixed(1)}%`
            : t('orderBook.minVolume', 'حجم بسيط')}
        </span>
      </div>
    </button>
  );
};

export default OrderBookRow;
