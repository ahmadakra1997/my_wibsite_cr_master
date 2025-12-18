// frontend/src/components/trading/OrderBook.jsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectOrderBook, selectConnectionStatus, selectTrading } from '../../store/tradingSlice';
import OrderBookAnalyzer from '../../services/OrderBookAnalyzer';
import './OrderBook.css';

const safeNum = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const fallbackAnalyzeOrderBook = (orderBook) => {
  const bids = Array.isArray(orderBook?.bids) ? orderBook.bids : [];
  const asks = Array.isArray(orderBook?.asks) ? orderBook.asks : [];

  const bestBid = bids.length ? safeNum(bids[0]?.price, 0) : 0;
  const bestAsk = asks.length ? safeNum(asks[0]?.price, 0) : 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk ? (spread / bestAsk) * 100 : 0;

  const sumVol = (arr) =>
    arr.reduce((acc, l) => acc + safeNum(l?.quantity ?? l?.size ?? l?.amount, 0), 0);

  const bidVol = sumVol(bids);
  const askVol = sumVol(asks);
  const imbalance = bidVol + askVol > 0 ? (bidVol - askVol) / (bidVol + askVol) : 0;

  return {
    bestBid,
    bestAsk,
    spread,
    spreadPercent: spreadPct,
    bidVolume: bidVol,
    askVolume: askVol,
    imbalance,
    supportLevels: [],
    resistanceLevels: [],
    buyPressure: Math.max(0, imbalance),
    sellPressure: Math.max(0, -imbalance),
    liquidityScore: Math.min(100, (bidVol + askVol) / 10),
  };
};

const OrderBook = ({ maxLevels = 20, showAnalysis = true }) => {
  const orderBook = useSelector(selectOrderBook);
  const connectionStatus = useSelector(selectConnectionStatus);
  const tradingState = useSelector(selectTrading);

  const analyzer = useMemo(() => {
    try {
      return new OrderBookAnalyzer();
    } catch {
      return null;
    }
  }, []);

  const analysis = useMemo(() => {
    // ✅ منع الكراش: إذا ما في بيانات أو الدالة غير موجودة
    if (!orderBook || !Array.isArray(orderBook.bids) || !Array.isArray(orderBook.asks)) return null;

    const fn =
      analyzer && typeof analyzer.analyzeOrderBook === 'function'
        ? analyzer.analyzeOrderBook.bind(analyzer)
        : null;

    try {
      return fn ? fn(orderBook) : fallbackAnalyzeOrderBook(orderBook);
    } catch (e) {
      console.error('[OrderBook] analyze failed, using fallback:', e);
      return fallbackAnalyzeOrderBook(orderBook);
    }
  }, [orderBook, analyzer]);

  const formatPrice = (price) => safeNum(price).toFixed(2);
  const formatQuantity = (qty) => safeNum(qty).toFixed(4);

  const getMaxQuantity = (orders) => {
    if (!orders?.length) return 1;
    const quantities = orders.map((order) => safeNum(order?.quantity, 0));
    return Math.max(...quantities, 1);
  };

  const maxBidQuantity = getMaxQuantity(orderBook?.bids || []);
  const maxAskQuantity = getMaxQuantity(orderBook?.asks || []);

  const displayBids = (orderBook?.bids || []).slice(0, maxLevels);
  const displayAsks = (orderBook?.asks || []).slice(0, maxLevels);

  const isLoadingOrderBook = !!tradingState?.isLoadingOrderBook;
  const orderBookError = tradingState?.orderBookError;

  if (isLoadingOrderBook) {
    return (
      <div className="order-book-container">
        <div className="order-book-header">
          <h3>Order Book</h3>
          <span className="connection-status loading">Loading...</span>
        </div>
        <div className="order-book-loading">
          <div className="loading-spinner"></div>
          <p>Loading order book data...</p>
        </div>
      </div>
    );
  }

  if (orderBookError) {
    return (
      <div className="order-book-container">
        <div className="order-book-header">
          <h3>Order Book</h3>
          <span className="connection-status error">Error</span>
        </div>
        <div className="order-book-error">
          <p>Failed to load order book: {orderBookError}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-book-container">
      <div className="order-book-header">
        <h3>Order Book</h3>
        <span className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'connected' ? 'Live' : 'Disconnected'}
        </span>
      </div>

      <div className="order-book-content">
        <div className="order-book-tables">
          <div className="asks-section">
            <div className="section-header">
              <h4>Asks</h4>
              {analysis && (
                <span className="volume-indicator">
                  Vol: {analysis.askVolume?.toFixed?.(2) ?? '0.00'}
                </span>
              )}
            </div>
            <div className="orders-table">
              {displayAsks.map((ask, index) => (
                <div key={index} className="order-row ask-row">
                  <div
                    className="depth-bar ask-bar"
                    style={{
                      width: `${(safeNum(ask.quantity) / maxAskQuantity) * 100}%`,
                    }}
                  />
                  <span className="price">{formatPrice(ask.price)}</span>
                  <span className="quantity">{formatQuantity(ask.quantity)}</span>
                  <span className="total">{formatPrice(safeNum(ask.price) * safeNum(ask.quantity))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="spread-section">
            {analysis ? (
              <>
                <div className="spread-info">
                  <span className="spread-label">Spread</span>
                  <span className="spread-value">{analysis.spread?.toFixed?.(2) ?? '0.00'}</span>
                  <span className="spread-percent">
                    ({analysis.spreadPercent?.toFixed?.(3) ?? '0.000'}%)
                  </span>
                </div>
                <div className="mid-price">
                  <span className="mid-label">Mid</span>
                  <span className="mid-value">
                    {((safeNum(analysis.bestBid) + safeNum(analysis.bestAsk)) / 2).toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div className="spread-info">
                <span className="spread-label">Waiting for data…</span>
              </div>
            )}
          </div>

          <div className="bids-section">
            <div className="section-header">
              <h4>Bids</h4>
              {analysis && (
                <span className="volume-indicator">
                  Vol: {analysis.bidVolume?.toFixed?.(2) ?? '0.00'}
                </span>
              )}
            </div>
            <div className="orders-table">
              {displayBids.map((bid, index) => (
                <div key={index} className="order-row bid-row">
                  <div
                    className="depth-bar bid-bar"
                    style={{
                      width: `${(safeNum(bid.quantity) / maxBidQuantity) * 100}%`,
                    }}
                  />
                  <span className="price">{formatPrice(bid.price)}</span>
                  <span className="quantity">{formatQuantity(bid.quantity)}</span>
                  <span className="total">{formatPrice(safeNum(bid.price) * safeNum(bid.quantity))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showAnalysis && analysis && (
          <div className="order-book-analysis">
            <h4>Market Analysis</h4>

            <div className="analysis-metrics">
              <div className="metric">
                <span className="metric-label">Imbalance</span>
                <span className={`metric-value ${analysis.imbalance > 0 ? 'positive' : 'negative'}`}>
                  {(safeNum(analysis.imbalance) * 100).toFixed(2)}%
                </span>
              </div>

              <div className="metric">
                <span className="metric-label">Liquidity Score</span>
                <span className="metric-value">{safeNum(analysis.liquidityScore).toFixed(0)}/100</span>
              </div>
            </div>

            <div className="pressure-indicators">
              <div className="pressure-bar">
                <span className="pressure-label">Buy Pressure</span>
                <div className="pressure-progress">
                  <div
                    className="pressure-fill buy-pressure"
                    style={{ width: `${safeNum(analysis.buyPressure) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pressure-bar">
                <span className="pressure-label">Sell Pressure</span>
                <div className="pressure-progress">
                  <div
                    className="pressure-fill sell-pressure"
                    style={{ width: `${safeNum(analysis.sellPressure) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {analysis.supportLevels?.length > 0 && (
              <div className="levels-section">
                <h5>Support Levels</h5>
                <div className="levels-list">
                  {analysis.supportLevels.map((level, index) => (
                    <span key={index} className="level-tag support-level">
                      {formatPrice(level)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.resistanceLevels?.length > 0 && (
              <div className="levels-section">
                <h5>Resistance Levels</h5>
                <div className="levels-list">
                  {analysis.resistanceLevels.map((level, index) => (
                    <span key={index} className="level-tag resistance-level">
                      {formatPrice(level)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderBook;
