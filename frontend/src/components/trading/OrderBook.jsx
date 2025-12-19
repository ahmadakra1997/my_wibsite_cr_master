// frontend/src/components/trading/OrderBook.jsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import OrderBookAnalyzer, {
  orderBookAnalyzer as sharedAnalyzer,
} from '../../services/OrderBookAnalyzer';

import {
  selectOrderBook,
  selectConnectionStatus,
  orderBookLoading,
  orderBookError,
} from '../../store/tradingSlice';

import './OrderBook.css';

const toNumber = (v, fallback = 0) => {
  const n =
    typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatPrice = (price) => toNumber(price, 0).toFixed(4);
const formatQty = (qty) => toNumber(qty, 0).toFixed(3);

const getLevelPrice = (lvl) =>
  lvl && typeof lvl === 'object' ? lvl.price ?? lvl : lvl;

const getLevelQty = (lvl) =>
  lvl && typeof lvl === 'object'
    ? lvl.quantity ?? lvl.qty ?? lvl.size ?? 0
    : 0;

// local helper for arrays (kept internal)
function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

const OrderBook = () => {
  const orderBook = useSelector(selectOrderBook);
  const connectionStatus = useSelector(selectConnectionStatus);

  // ⚠️ مهم: لا نستخدم orderBookLoading/orderBookError كـ selectors مباشرة (قد تكون actions)
  const isLoadingFromState = useSelector(
    (state) => !!state?.trading?.isLoadingOrderBook
  );
  const errorFromState = useSelector(
    (state) => state?.trading?.orderBookError ?? null
  );

  // نحافظ على الـ imports بدون كسر (Guard)
  const isLoadingMaybe = useSelector((state) => {
    try {
      const r = typeof orderBookLoading === 'function' ? orderBookLoading(state) : undefined;
      return typeof r === 'boolean' ? r : undefined;
    } catch {
      return undefined;
    }
  });

  const errorMaybe = useSelector((state) => {
    try {
      const r = typeof orderBookError === 'function' ? orderBookError(state) : undefined;
      // نسمح فقط بقيم خطأ منطقية
      if (r instanceof Error) return r;
      if (typeof r === 'string') return r;
      return undefined;
    } catch {
      return undefined;
    }
  });

  const isLoading = typeof isLoadingMaybe === 'boolean' ? isLoadingMaybe : isLoadingFromState;
  const error = errorMaybe ?? errorFromState;

  // ✅ analyzer: يدعم class/instance بأي شكل بدون كسر
  const analyzer = useMemo(() => {
    try {
      if (OrderBookAnalyzer && typeof OrderBookAnalyzer === 'function') {
        return new OrderBookAnalyzer();
      }
      if (OrderBookAnalyzer && typeof OrderBookAnalyzer === 'object') {
        return OrderBookAnalyzer;
      }
      return sharedAnalyzer || null;
    } catch {
      return sharedAnalyzer || null;
    }
  }, []);

  const fallbackAnalyze = (ob) => {
    const bids = Array.isArray(ob?.bids) ? ob.bids : [];
    const asks = Array.isArray(ob?.asks) ? ob.asks : [];

    const norm = (x) => {
      if (Array.isArray(x))
        return { price: toNumber(x[0], 0), quantity: toNumber(x[1], 0) };
      if (x && typeof x === 'object')
        return {
          price: toNumber(x.price ?? x.p ?? 0, 0),
          quantity: toNumber(x.quantity ?? x.q ?? x.size ?? 0, 0),
        };
      return { price: 0, quantity: 0 };
    };

    const b = bids
      .map(norm)
      .filter((x) => x.price > 0)
      .sort((a, c) => c.price - a.price);

    const a = asks
      .map(norm)
      .filter((x) => x.price > 0)
      .sort((a2, c2) => a2.price - c2.price);

    const bestBid = b[0]?.price ?? null;
    const bestAsk = a[0]?.price ?? null;

    const spread =
      bestBid != null && bestAsk != null ? Math.max(0, bestAsk - bestBid) : null;

    const mid =
      bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;

    const spreadPercent = mid ? (spread / mid) * 100 : 0;

    return {
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      bidVolume: b
        .slice(0, 20)
        .reduce((acc, x) => acc + toNumber(x.quantity, 0), 0),
      askVolume: a
        .slice(0, 20)
        .reduce((acc, x) => acc + toNumber(x.quantity, 0), 0),
      imbalance: 0,
      supportLevels: b.slice(0, 3),
      resistanceLevels: a.slice(0, 3),
      buyPressure: 50,
      sellPressure: 50,
      liquidityScore: 50,
    };
  };

  const analysis = useMemo(() => {
    const fn =
      analyzer && typeof analyzer.analyzeOrderBook === 'function'
        ? analyzer.analyzeOrderBook.bind(analyzer)
        : analyzer && typeof analyzer.analyze === 'function'
        ? analyzer.analyze.bind(analyzer)
        : null;

    try {
      return fn ? fn(orderBook) : fallbackAnalyze(orderBook);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[OrderBook] analysis failed:', e);
      return fallbackAnalyze(orderBook);
    }
  }, [analyzer, orderBook]);

  const bids = Array.isArray(orderBook?.bids) ? orderBook.bids : [];
  const asks = Array.isArray(orderBook?.asks) ? orderBook.asks : [];

  const normalize = (x) => {
    if (Array.isArray(x))
      return { price: toNumber(x[0], 0), quantity: toNumber(x[1], 0) };
    if (x && typeof x === 'object')
      return {
        price: toNumber(x.price ?? x.p ?? 0, 0),
        quantity: toNumber(x.quantity ?? x.q ?? x.size ?? 0, 0),
      };
    return { price: 0, quantity: 0 };
  };

  const bidLevels = bids
    .map(normalize)
    .filter((x) => x.price > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, 15);

  const askLevels = asks
    .map(normalize)
    .filter((x) => x.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 15);

  const maxQty = Math.max(
    1,
    ...bidLevels.map((x) => toNumber(x.quantity, 0)),
    ...askLevels.map((x) => toNumber(x.quantity, 0))
  );

  const renderLevel = (level, type) => {
    const qty = toNumber(level.quantity, 0);
    const width = Math.min(100, (qty / maxQty) * 100);
    const isAsk = type === 'ask';

    return (
      <div
        key={`${type}-${level.price}-${qty}`}
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          padding: '6px 8px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(2,6,23,0.35)',
          overflow: 'hidden',
          fontSize: 12,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${width}%`,
            background: isAsk
              ? 'linear-gradient(90deg, rgba(251,59,127,0.22), transparent)'
              : 'linear-gradient(90deg, rgba(0,245,155,0.18), transparent)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', fontVariantNumeric: 'tabular-nums' }}>
          {formatPrice(level.price)}
        </div>
        <div style={{ position: 'relative', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
          {formatQty(qty)}
        </div>
        <div style={{ position: 'relative', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
          {formatPrice(level.price * qty)}
        </div>
      </div>
    );
  };

  const hasAnyLevels = bidLevels.length > 0 || askLevels.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <div style={{ fontWeight: 800, color: '#e5f4ff' }}>Order Book</div>
        <div style={{ fontSize: 11, color: 'var(--qa-text-muted, #7b8ca8)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {String(connectionStatus || 'disconnected')}
        </div>
      </div>

      {error ? (
        <div style={{ borderRadius: 12, padding: 10, border: '1px solid rgba(251,59,127,0.35)', background: 'rgba(251,59,127,0.08)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load order book.</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{String(error)}</div>
        </div>
      ) : null}

      {isLoading && !hasAnyLevels ? (
        <div style={{ borderRadius: 12, padding: 10, border: '1px solid rgba(0,229,255,0.25)', background: 'rgba(0,229,255,0.06)' }}>
          Loading order book…
        </div>
      ) : null}

      {!isLoading && !error && !hasAnyLevels ? (
        <div style={{ borderRadius: 12, padding: 10, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.03)', color: 'var(--qa-text-muted, #7b8ca8)' }}>
          No order book data yet.
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)', marginBottom: 6 }}>
            Asks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {askLevels.map((lvl) => renderLevel(lvl, 'ask'))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(148,163,184,0.12)', paddingTop: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12 }}>
            <div style={{ color: '#e5f4ff' }}>
              Spread:{' '}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {analysis?.spread != null ? formatPrice(analysis.spread) : '—'}
              </span>{' '}
              <span style={{ color: 'var(--qa-text-muted, #7b8ca8)' }}>
                ({toNumber(analysis?.spreadPercent, 0).toFixed(3)}%)
              </span>
            </div>
            <div style={{ color: '#e5f4ff' }}>
              Mid:{' '}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {analysis?.bestBid != null && analysis?.bestAsk != null
                  ? formatPrice((analysis.bestBid + analysis.bestAsk) / 2)
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)', marginBottom: 6 }}>
            Bids
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bidLevels.map((lvl) => renderLevel(lvl, 'bid'))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 4, borderRadius: 14, padding: 10, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontWeight: 800, color: '#e5f4ff', marginBottom: 8 }}>Market Analysis</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)' }}>Imbalance</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e5f4ff', fontVariantNumeric: 'tabular-nums' }}>
              {(toNumber(analysis?.imbalance, 0) * 100).toFixed(2)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)' }}>Liquidity Score</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e5f4ff', fontVariantNumeric: 'tabular-nums' }}>
              {toNumber(analysis?.liquidityScore, 0).toFixed(0)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)' }}>Buy Pressure</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e5f4ff', fontVariantNumeric: 'tabular-nums' }}>
              {toNumber(analysis?.buyPressure, 50).toFixed(0)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)' }}>Sell Pressure</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e5f4ff', fontVariantNumeric: 'tabular-nums' }}>
              {toNumber(analysis?.sellPressure, 50).toFixed(0)}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)', marginBottom: 6 }}>Support Levels</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {safeArray(analysis?.supportLevels).slice(0, 4).map((lvl, i) => (
                <span
                  key={`sup-${i}`}
                  style={{
                    borderRadius: 999,
                    padding: '4px 10px',
                    border: '1px solid rgba(0,245,155,0.22)',
                    background: 'rgba(0,245,155,0.06)',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatPrice(getLevelPrice(lvl))} ({formatQty(getLevelQty(lvl))})
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)', marginBottom: 6 }}>Resistance Levels</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {safeArray(analysis?.resistanceLevels).slice(0, 4).map((lvl, i) => (
                <span
                  key={`res-${i}`}
                  style={{
                    borderRadius: 999,
                    padding: '4px 10px',
                    border: '1px solid rgba(251,59,127,0.22)',
                    background: 'rgba(251,59,127,0.06)',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatPrice(getLevelPrice(lvl))} ({formatQty(getLevelQty(lvl))})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
