// frontend/src/components/trading/OrderBook.jsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import OrderBookAnalyzer, { orderBookAnalyzer as sharedAnalyzer } from '../../services/OrderBookAnalyzer';
import {
  selectOrderBook,
  selectConnectionStatus,
  orderBookLoading,
  orderBookError,
} from '../../store/tradingSlice';
import './OrderBook.css';

const toNumber = (v, fallback = 0) => {
  const n =
    typeof v === 'string'
      ? Number(v.replace(/,/g, '').trim())
      : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatPrice = (price) => toNumber(price, 0).toFixed(4);
const formatQty = (qty) => toNumber(qty, 0).toFixed(3);

const getLevelPrice = (lvl) => (lvl && typeof lvl === 'object' ? (lvl.price ?? lvl) : lvl);
const getLevelQty = (lvl) => (lvl && typeof lvl === 'object' ? (lvl.quantity ?? lvl.qty ?? lvl.size ?? 0) : 0);

const OrderBook = () => {
  const orderBook = useSelector(selectOrderBook);
  const connectionStatus = useSelector(selectConnectionStatus);
  const isLoading = useSelector(orderBookLoading);
  const error = useSelector(orderBookError);

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

    return (
      <div key={`${type}-${level.price}-${qty}`} className={`order-book-level ${type}-level`}>
        <div className="level-bar" style={{ width: `${width}%` }} />
        <div className="level-content">
          <span className="level-price">{formatPrice(level.price)}</span>
          <span className="level-quantity">{formatQty(qty)}</span>
          <span className="level-total">{formatPrice(level.price * qty)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="order-book">
      <div className="order-book-header">
        <h3>Order Book</h3>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus || 'disconnected'}`} />
          <span>{connectionStatus || 'disconnected'}</span>
        </div>
      </div>

      {error ? (
        <div className="order-book-error">
          <strong>Failed to load order book.</strong>
          <div>{String(error)}</div>
        </div>
      ) : null}

      {isLoading && (!bids?.length && !asks?.length) ? (
        <div className="order-book-loading">Loading order book…</div>
      ) : null}

      <div className="order-book-content">
        <div className="order-book-asks">
          <div className="asks-header">
            <span>Price</span>
            <span>Amount</span>
            <span>Total</span>
          </div>
          <div className="asks-orders">
            {askLevels.map((lvl) => renderLevel(lvl, 'ask'))}
          </div>
        </div>

        <div className="order-book-spread">
          <div className="spread-info">
            <div className="spread-value">
              Spread:{' '}
              {analysis?.spread != null ? formatPrice(analysis.spread) : '—'} (
              {toNumber(analysis?.spreadPercent, 0).toFixed(3)}%)
            </div>
            <div className="spread-mid">
              Mid:{' '}
              {analysis?.bestBid != null && analysis?.bestAsk != null
                ? formatPrice((analysis.bestBid + analysis.bestAsk) / 2)
                : '—'}
            </div>
          </div>
        </div>

        <div className="order-book-bids">
          <div className="bids-header">
            <span>Price</span>
            <span>Amount</span>
            <span>Total</span>
          </div>
          <div className="bids-orders">
            {bidLevels.map((lvl) => renderLevel(lvl, 'bid'))}
          </div>
        </div>
      </div>

      <div className="order-book-analysis">
        <h4>Market Analysis</h4>

        <div className="analysis-item">
          <span className="analysis-label">Imbalance</span>
          <span
            className={[
              'analysis-value',
              toNumber(analysis?.imbalance, 0) > 0 ? 'positive' : toNumber(analysis?.imbalance, 0) < 0 ? 'negative' : '',
            ].join(' ')}
          >
            {(toNumber(analysis?.imbalance, 0) * 100).toFixed(2)}%
          </span>
        </div>

        <div className="analysis-item">
          <span className="analysis-label">Liquidity Score</span>
          <span className="analysis-value">{toNumber(analysis?.liquidityScore, 0)}%</span>
        </div>

        <div className="analysis-item">
          <span className="analysis-label">Buy / Sell Pressure</span>
          <div className="pressure-bars">
            <div className="pressure-bar buy-pressure" style={{ width: `${toNumber(analysis?.buyPressure, 50)}%` }}>
              <span className="pressure-label">BUY</span>
              <span className="pressure-value">{toNumber(analysis?.buyPressure, 50).toFixed(0)}%</span>
            </div>
            <div className="pressure-bar sell-pressure" style={{ width: `${toNumber(analysis?.sellPressure, 50)}%` }}>
              <span className="pressure-label">SELL</span>
              <span className="pressure-value">{toNumber(analysis?.sellPressure, 50).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="analysis-item">
          <span className="analysis-label">Support Levels</span>
          <div className="level-tags">
            {safeArray(analysis?.supportLevels).map((lvl, i) => (
              <span key={`sup-${i}`} className="level-tag">
                {formatPrice(getLevelPrice(lvl))} ({formatQty(getLevelQty(lvl))})
              </span>
            ))}
          </div>
        </div>

        <div className="analysis-item">
          <span className="analysis-label">Resistance Levels</span>
          <div className="level-tags">
            {safeArray(analysis?.resistanceLevels).map((lvl, i) => (
              <span key={`res-${i}`} className="level-tag">
                {formatPrice(getLevelPrice(lvl))} ({formatQty(getLevelQty(lvl))})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// local helper for arrays (kept internal)
function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

export default OrderBook;
