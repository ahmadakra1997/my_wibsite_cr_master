// frontend/src/components/trading/OrderBook.jsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import OrderBookAnalyzer, { orderBookAnalyzer as sharedAnalyzer } from '../../services/OrderBookAnalyzer';
import { selectOrderBook, selectConnectionStatus } from '../../store/tradingSlice';
import './OrderBook.css';

const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatPrice = (price) => toNumber(price, 0).toFixed(4);
const formatQty = (qty) => toNumber(qty, 0).toFixed(3);

const getLevelPrice = (lvl) => (lvl && typeof lvl === 'object' ? (lvl.price ?? lvl) : lvl);
const getLevelQty = (lvl) => (lvl && typeof lvl === 'object' ? (lvl.quantity ?? lvl.qty ?? lvl.size ?? 0) : 0);

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

const OrderBook = () => {
  const orderBook = useSelector(selectOrderBook);
  const connectionStatus = useSelector(selectConnectionStatus);

  // ✅ slice الحقيقي: loading.orderBook / errors.orderBook :contentReference[oaicite:15]{index=15}
  const isLoading = useSelector((state) => !!(state?.trading?.loading?.orderBook));
  const error = useSelector((state) => state?.trading?.errors?.orderBook ?? null);

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
      if (Array.isArray(x)) return { price: toNumber(x[0], 0), quantity: toNumber(x[1], 0) };
      if (x && typeof x === 'object') return { price: toNumber(x.price ?? x.p ?? 0, 0), quantity: toNumber(x.quantity ?? x.q ?? x.size ?? 0, 0) };
      return { price: 0, quantity: 0 };
    };

    const b = bids.map(norm).filter((x) => x.price > 0).sort((a, c) => c.price - a.price);
    const a = asks.map(norm).filter((x) => x.price > 0).sort((a2, c2) => a2.price - c2.price);

    const bestBid = b[0]?.price ?? null;
    const bestAsk = a[0]?.price ?? null;
    const spread = bestBid != null && bestAsk != null ? Math.max(0, bestAsk - bestBid) : null;
    const mid = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;
    const spreadPercent = mid ? (spread / mid) * 100 : 0;

    return {
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      bidVolume: b.slice(0, 20).reduce((acc, x) => acc + toNumber(x.quantity, 0), 0),
      askVolume: a.slice(0, 20).reduce((acc, x) => acc + toNumber(x.quantity, 0), 0),
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
    if (Array.isArray(x)) return { price: toNumber(x[0], 0), quantity: toNumber(x[1], 0) };
    if (x && typeof x === 'object') return { price: toNumber(x.price ?? x.p ?? 0, 0), quantity: toNumber(x.quantity ?? x.q ?? x.size ?? 0, 0) };
    return { price: 0, quantity: 0 };
  };

  const bidLevels = bids.map(normalize).filter((x) => x.price > 0).sort((a, b) => b.price - a.price).slice(0, 15);
  const askLevels = asks.map(normalize).filter((x) => x.price > 0).sort((a, b) => a.price - b.price).slice(0, 15);

  const maxQty = Math.max(
    1,
    ...bidLevels.map((x) => toNumber(x.quantity, 0)),
    ...askLevels.map((x) => toNumber(x.quantity, 0))
  );

  const renderLevel = (level, type) => {
    const qty = toNumber(level.quantity, 0);
    const width = Math.min(100, (qty / maxQty) * 100);

    const rowStyle = {
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.12)',
      background: 'rgba(15,23,42,0.45)',
      overflow: 'hidden',
    };

    const meterStyle = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: `${width}%`,
      right: type === 'ask' ? 0 : 'auto',
      left: type === 'bid' ? 0 : 'auto',
      background: type === 'ask' ? 'rgba(255,59,92,0.10)' : 'rgba(0,255,136,0.10)',
      borderRight: type === 'bid' ? '1px solid rgba(0,255,136,0.18)' : undefined,
      borderLeft: type === 'ask' ? '1px solid rgba(255,59,92,0.18)' : undefined,
      pointerEvents: 'none',
    };

    return (
      <div key={`${type}-${level.price}-${level.quantity}`} className={`ob-row ${type}`} style={rowStyle}>
        <div style={meterStyle} />
        <div style={{ zIndex: 1, color: 'rgba(226,232,240,0.95)', fontWeight: 800 }}>{formatPrice(level.price)}</div>
        <div style={{ zIndex: 1, color: 'rgba(148,163,184,0.95)', fontWeight: 800 }}>{formatQty(qty)}</div>
        <div style={{ zIndex: 1, color: 'rgba(148,163,184,0.95)', fontWeight: 800 }}>{formatPrice(level.price * qty)}</div>
      </div>
    );
  };

  return (
    <div className="order-book" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)', letterSpacing: '0.06em' }}>Order Book</div>
          <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>
            WS: <b style={{ color: 'rgba(226,232,240,0.95)' }}>{String(connectionStatus || 'disconnected')}</b>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(56,189,248,0.18)', background: 'rgba(56,189,248,0.08)', color: 'rgba(226,232,240,0.92)', fontWeight: 900, fontSize: 12 }}>
            Spread: {analysis?.spread != null ? formatPrice(analysis.spread) : '—'} ({toNumber(analysis?.spreadPercent, 0).toFixed(3)}%)
          </div>
          <div style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(0,255,136,0.18)', background: 'rgba(0,255,136,0.08)', color: 'rgba(226,232,240,0.92)', fontWeight: 900, fontSize: 12 }}>
            Liquidity: {toNumber(analysis?.liquidityScore, 0).toFixed(0)}%
          </div>
        </div>
      </div>

      {error ? (
        <div style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(255,59,92,0.30)', background: 'rgba(255,59,92,0.08)' }}>
          <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Failed to load order book.</div>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontSize: 12 }}>{String(error)}</div>
        </div>
      ) : null}

      {isLoading && (!bids?.length && !asks?.length) ? (
        <div style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(56,189,248,0.24)', background: 'rgba(56,189,248,0.08)', color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>
          Loading order book…
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 8, color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 900 }}>ASKS</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, color: 'rgba(148,163,184,0.85)', fontSize: 12, fontWeight: 900, padding: '0 10px' }}>
              <div>Price</div><div>Amount</div><div>Total</div>
            </div>
            {askLevels.map((lvl) => renderLevel(lvl, 'ask'))}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 8, color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 900 }}>BIDS</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, color: 'rgba(148,163,184,0.85)', fontSize: 12, fontWeight: 900, padding: '0 10px' }}>
              <div>Price</div><div>Amount</div><div>Total</div>
            </div>
            {bidLevels.map((lvl) => renderLevel(lvl, 'bid'))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(148,163,184,0.14)', paddingTop: 12 }}>
        <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)', marginBottom: 8 }}>Market Analysis</div>

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <div style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
            <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Imbalance</div>
            <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>{(toNumber(analysis?.imbalance, 0) * 100).toFixed(2)}%</div>
          </div>

          <div style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
            <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Buy / Sell Pressure</div>
            <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>
              BUY {toNumber(analysis?.buyPressure, 50).toFixed(0)}% • SELL {toNumber(analysis?.sellPressure, 50).toFixed(0)}%
            </div>
          </div>

          <div style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
            <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Support Levels</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {safeArray(analysis?.supportLevels).map((lvl, i) => (
                <span key={`s-${i}`} style={{ padding: '6px 8px', borderRadius: 999, border: '1px solid rgba(0,255,136,0.18)', background: 'rgba(0,255,136,0.08)', color: 'rgba(226,232,240,0.95)', fontWeight: 900, fontSize: 12 }}>
                  {formatPrice(getLevelPrice(lvl))} ({formatQty(getLevelQty(lvl))})
                </span>
              ))}
            </div>
          </div>

          <div style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
            <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Resistance Levels</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {safeArray(analysis?.resistanceLevels).map((lvl, i) => (
                <span key={`r-${i}`} style={{ padding: '6px 8px', borderRadius: 999, border: '1px solid rgba(255,59,92,0.18)', background: 'rgba(255,59,92,0.08)', color: 'rgba(226,232,240,0.95)', fontWeight: 900, fontSize: 12 }}>
                  {formatPrice(getLevelPrice(lvl))} ({formatQty(getLevelQty(lvl))})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .order-book > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default OrderBook;
