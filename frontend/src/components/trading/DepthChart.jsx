// frontend/src/components/trading/DepthChart.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeLevels = (levels) => {
  // levels might be: [[price, qty], ...] OR [{price, quantity}, ...]
  if (!Array.isArray(levels)) return [];
  return levels
    .map((x) => {
      if (Array.isArray(x)) {
        const [p, q] = x;
        return { price: toNumber(p, 0), qty: toNumber(q, 0) };
      }
      if (x && typeof x === 'object') {
        return {
          price: toNumber(x.price ?? x.p ?? 0, 0),
          qty: toNumber(x.qty ?? x.quantity ?? x.amount ?? x.q ?? 0, 0),
        };
      }
      return null;
    })
    .filter((x) => x && x.price > 0 && x.qty > 0);
};

const buildCumulative = (levels, side) => {
  const sorted = [...levels].sort((a, b) => (side === 'bids' ? b.price - a.price : a.price - b.price));
  let cum = 0;
  return sorted.map((l) => {
    cum += l.qty;
    return { price: l.price, cum };
  });
};

const DepthChart = ({ orderBookData, width = 520, height = 180 }) => {
  const { t } = useTranslation();

  const { bids, asks, maxCum, minPrice, maxPrice } = useMemo(() => {
    const rawBids = normalizeLevels(orderBookData?.bids);
    const rawAsks = normalizeLevels(orderBookData?.asks);

    const bidsCum = buildCumulative(rawBids, 'bids');
    const asksCum = buildCumulative(rawAsks, 'asks');

    const all = [...bidsCum, ...asksCum];
    const maxCum = all.reduce((m, p) => Math.max(m, p.cum || 0), 0) || 1;

    const prices = all.map((p) => p.price).filter((p) => Number.isFinite(p));
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 1;

    return { bids: bidsCum, asks: asksCum, maxCum, minPrice, maxPrice };
  }, [orderBookData]);

  const padding = 12;

  const xScale = (price) => {
    if (maxPrice === minPrice) return padding;
    return padding + ((price - minPrice) / (maxPrice - minPrice)) * (width - padding * 2);
  };

  const yScale = (cum) => {
    return height - padding - (cum / maxCum) * (height - padding * 2);
  };

  const toPath = (points) => {
    if (!points || points.length === 0) return '';
    return points
      .map((p, i) => {
        const x = xScale(p.price);
        const y = yScale(p.cum);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  };

  const bidsPath = useMemo(() => toPath(bids), [bids]);
  const asksPath = useMemo(() => toPath(asks), [asks]);

  const isEmpty = (bids?.length || 0) === 0 && (asks?.length || 0) === 0;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>
          {t('orderBook.depthChart', 'Depth Chart')}
        </div>
        <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>
          {isEmpty ? t('common.noData', 'No data') : t('orderBook.liquidity', 'Liquidity')}
        </div>
      </div>

      <div
        style={{
          borderRadius: 14,
          border: '1px solid rgba(148,163,184,0.18)',
          background: 'rgba(2,6,23,0.55)',
          padding: 10,
          overflowX: 'auto',
        }}
      >
        <svg width={width} height={height} role="img" aria-label="Depth chart">
          {/* grid */}
          {[0.25, 0.5, 0.75].map((k) => {
            const y = padding + (height - padding * 2) * k;
            return (
              <line
                key={k}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(148,163,184,0.10)"
                strokeWidth="1"
              />
            );
          })}

          {/* bids */}
          {bidsPath ? (
            <path d={bidsPath} fill="none" stroke="rgba(0,255,136,0.85)" strokeWidth="2" />
          ) : null}

          {/* asks */}
          {asksPath ? (
            <path d={asksPath} fill="none" stroke="rgba(56,189,248,0.85)" strokeWidth="2" />
          ) : null}

          {/* empty state */}
          {isEmpty ? (
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              fill="rgba(148,163,184,0.9)"
              style={{ fontSize: 12, fontWeight: 900 }}
            >
              {t('common.noData', 'No data')}
            </text>
          ) : null}
        </svg>
      </div>
    </div>
  );
};

export default DepthChart;
