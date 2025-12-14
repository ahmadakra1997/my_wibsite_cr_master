// frontend/src/components/trading/DepthChart.jsx

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * DepthChart
 * مخطط عمق بسيط باستخدام SVG:
 * - يعرض منحنى عروض الشراء (bids) والبيع (asks) مع الحجم التراكمي.
 *
 * props:
 * - bids: قائمة مستويات الشراء
 * - asks: قائمة مستويات البيع
 * - theme: 'dark' | 'light'
 * - height: ارتفاع المخطط بالبكسل
 */
const DepthChart = ({ bids = [], asks = [], theme = 'dark', height = 200 }) => {
  const { t } = useTranslation();

  const { bidPoints, askPoints } = useMemo(() => {
    const normalizeSide = (orders, isBid) => {
      if (!Array.isArray(orders) || orders.length === 0) return [];

      const normalized = orders
        .map((o) => {
          const price = Number(o.price ?? o[0]);
          const quantity = Number(o.quantity ?? o.qty ?? o[1]);

          if (!Number.isFinite(price) || !Number.isFinite(quantity)) return null;
          return { price, quantity };
        })
        .filter(Boolean);

      // sort by price
      normalized.sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));

      let cumulative = 0;
      return normalized.map((level, index) => {
        cumulative += level.quantity;
        return {
          index,
          price: level.price,
          cumulative,
        };
      });
    };

    const bidLevels = normalizeSide(bids, true);
    const askLevels = normalizeSide(asks, false);

    const maxCum = Math.max(
      bidLevels.length ? bidLevels[bidLevels.length - 1].cumulative : 0,
      askLevels.length ? askLevels[askLevels.length - 1].cumulative : 0,
    );

    const buildPoints = (levels, isBid) => {
      if (!levels.length || !maxCum) return '';

      const sideWidth = 50; // نصف الـ SVG لكل جانب
      const xStart = isBid ? 0 : 50;

      return levels
        .map((level, idx) => {
          const x = xStart + (idx / Math.max(levels.length - 1, 1)) * sideWidth;
          const y = 100 - (level.cumulative / maxCum) * 100;
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
    };

    return {
      bidPoints: buildPoints(bidLevels, true),
      askPoints: buildPoints(askLevels, false),
    };
  }, [bids, asks]);

  const bg =
    theme === 'light'
      ? 'rgba(248,250,252,1)'
      : 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,1))';

  const gridColor =
    theme === 'light'
      ? 'rgba(226,232,240,0.9)'
      : 'rgba(30,64,175,0.8)';

  const bidColor = theme === 'light' ? '#22c55e' : '#4ade80';
  const askColor = theme === 'light' ? '#ef4444' : '#fca5a5';

  return (
    <div
      className="depth-chart"
      style={{
        borderRadius: 18,
        border: '1px solid rgba(30,64,175,0.55)',
        background: bg,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        className="depth-chart-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: theme === 'light' ? '#0f172a' : '#e5e7eb',
          }}
        >
          {t('orderBook.depthChart', 'مخطط العمق')}
        </span>

        <div
          className="depth-chart-legend"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '999px',
              background: bidColor,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              color: theme === 'light' ? '#0f172a' : '#cbd5f5',
            }}
          >
            {t('orderBook.bids', 'عروض الشراء')}
          </span>

          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '999px',
              background: askColor,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              color: theme === 'light' ? '#0f172a' : '#cbd5f5',
            }}
          >
            {t('orderBook.asks', 'طلبات البيع')}
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          width: '100%',
          height,
          borderRadius: 12,
          background: theme === 'light' ? '#f9fafb' : '#020617',
        }}
      >
        {/* Grid lines */}
        {[25, 50, 75].map((y) => (
          <line
            // eslint-disable-next-line react/no-array-index-key
            key={y}
            x1="0"
            y1={`${y}%`}
            x2="100"
            y2={`${y}%`}
            stroke={gridColor}
            strokeWidth="0.4"
          />
        ))}

        {/* Bid depth curve */}
        {bidPoints && (
          <polyline
            points={bidPoints}
            fill="none"
            stroke={bidColor}
            strokeWidth="1.4"
          />
        )}

        {/* Ask depth curve */}
        {askPoints && (
          <polyline
            points={askPoints}
            fill="none"
            stroke={askColor}
            strokeWidth="1.4"
          />
        )}
      </svg>
    </div>
  );
};

export default DepthChart;
