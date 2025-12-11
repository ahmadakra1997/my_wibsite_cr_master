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

  const safePercentage = Math.max(0, Math.min(100, Number(percentage) || 0));

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
      className={`order-book-row ${isBid ? 'bid' : 'ask'} ${theme}`}
      style={{
        position: 'relative',
        width: '100%',
        border: 'none',
        borderRadius: '6px',
        padding: '0.15rem 0.4rem',
        marginBottom: '0.08rem',
        cursor: 'pointer',
        backgroundColor,
        overflow: 'hidden',
        direction: 'rtl',
        textAlign: 'right',
        fontSize: '0.78rem',
      }}
    >
      {/* شريط العمق في الخلفية */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetInlineStart: isBid ? 'auto' : 0,
          insetInlineEnd: isBid ? 0 : 'auto',
          top: 0,
          bottom: 0,
          width: `${safePercentage}%`,
          background: barColor,
          opacity: 0.6,
        }}
      />

      {/* المحتوى */}
      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 0.8fr',
          alignItems: 'center',
          gap: '0.3rem',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: textColor,
          }}
        >
          {Number.isFinite(price) ? formatNumber(price, 4) : '--'}
        </span>

        <span
          style={{
            color:
              theme === 'light'
                ? '#0f172a'
                : 'rgba(226,232,240,0.95)',
          }}
        >
          {Number.isFinite(quantity) ? formatNumber(quantity, 4) : '--'}
        </span>

        <span
          style={{
            textAlign: 'left',
            color:
              theme === 'light'
                ? 'rgba(71,85,105,0.9)'
                : 'rgba(148,163,184,0.95)',
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
