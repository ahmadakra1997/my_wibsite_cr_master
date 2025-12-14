// frontend/src/components/trading/OrderBook.jsx

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import OrderBookAnalyzer from '../../services/OrderBookAnalyzer';
import './OrderBook.css'; // تأكد أن الملف موجود

/**
 * OrderBook
 *
 * - عرض دفتر الأوامر (bids / asks)
 * - إظهار ملخص الإحصائيات (best bid/ask, spread, imbalance, walls)
 */
const OrderBook = () => {
  const orderBook = useSelector((state) => state.trading.orderBook);
  const connectionStatus = useSelector(
    (state) => state.trading.connectionStatus,
  );
  const isLoading = useSelector(
    (state) => state.trading.isLoadingOrderBook,
  );
  const error = useSelector(
    (state) => state.trading.orderBookError,
  );

  const analyzer = useMemo(
    () =>
      new OrderBookAnalyzer({
        maxDepth: 25,
        minVolumeThreshold: 0,
      }),
    [],
  );

  const analysis = useMemo(() => {
    if (!orderBook || !orderBook.bids || !orderBook.asks) return null;
    return analyzer.analyzeOrderBook(orderBook);
  }, [orderBook, analyzer]);

  const isDisconnected =
    connectionStatus === 'disconnected' ||
    connectionStatus === 'closed' ||
    connectionStatus === 'error';

  // -----------------------------
  // Render helpers
  // -----------------------------

  const renderHeader = () => {
    const safeStatus = (connectionStatus || 'UNKNOWN').toUpperCase();
    const statusTone = (connectionStatus || '').toLowerCase();

    return (
      <header className="orderbook-header">
        <div className="orderbook-header-left">
          <h2 className="orderbook-title">
            Order Book
            {orderBook?.symbol && (
              <span className="orderbook-symbol">
                {' '}
                – {orderBook.symbol}
              </span>
            )}
          </h2>

          {orderBook?.updatedAt && (
            <p className="orderbook-updated">
              Last update:{' '}
              <span>
                {new Date(orderBook.updatedAt).toLocaleTimeString()}
              </span>
            </p>
          )}
        </div>

        <div
          className={`
            orderbook-connection
            orderbook-connection--${statusTone}
          `}
        >
          <span className="orderbook-connection-dot" />
          <span className="orderbook-connection-label">
            {safeStatus}
          </span>
        </div>
      </header>
    );
  };

  const renderSummary = () => {
    if (!analysis) return null;

    const {
      bestBid,
      bestAsk,
      midPrice,
      spreadText,
      totalBidVolume,
      totalAskVolume,
      volumeImbalance,
      imbalanceLabel,
      largeOrders,
    } = analysis;

    const imbalancePercent = isFinite(volumeImbalance)
      ? (volumeImbalance * 100).toFixed(1)
      : null;

    let imbalanceTone = 'neutral';
    if (
      imbalanceLabel === 'bullish' ||
      imbalanceLabel === 'strong-bullish'
    ) {
      imbalanceTone = 'bullish';
    } else if (
      imbalanceLabel === 'bearish' ||
      imbalanceLabel === 'strong-bearish'
    ) {
      imbalanceTone = 'bearish';
    }

    return (
      <section className="orderbook-summary">
        <div className="orderbook-summary-grid">
          <div className="orderbook-summary-item">
            <span className="orderbook-summary-label">Best Bid</span>
            <span className="orderbook-summary-value">
              {bestBid ?? '-'}
            </span>
          </div>

          <div className="orderbook-summary-item">
            <span className="orderbook-summary-label">Best Ask</span>
            <span className="orderbook-summary-value">
              {bestAsk ?? '-'}
            </span>
          </div>

          <div className="orderbook-summary-item">
            <span className="orderbook-summary-label">Mid Price</span>
            <span className="orderbook-summary-value">
              {midPrice ?? '-'}
            </span>
          </div>

          <div className="orderbook-summary-item">
            <span className="orderbook-summary-label">Spread</span>
            <span className="orderbook-summary-value">
              {spreadText ?? '-'}
            </span>
          </div>

          <div className="orderbook-summary-item">
            <span className="orderbook-summary-label">Bid Vol</span>
            <span className="orderbook-summary-value">
              {totalBidVolume != null
                ? totalBidVolume.toFixed(3)
                : '-'}
            </span>
          </div>

          <div className="orderbook-summary-item">
            <span className="orderbook-summary-label">Ask Vol</span>
            <span className="orderbook-summary-value">
              {totalAskVolume != null
                ? totalAskVolume.toFixed(3)
                : '-'}
            </span>
          </div>

          <div className="orderbook-summary-item">
            <span className="orderbook-summary-label">
              Imbalance
            </span>
            <span
              className={`
                orderbook-summary-value
                orderbook-imbalance orderbook-imbalance--${imbalanceTone}
              `}
            >
              {imbalancePercent != null
                ? `${imbalancePercent}%`
                : '-'}
            </span>
          </div>
        </div>

        {largeOrders && largeOrders.length > 0 && (
          <div className="orderbook-walls">
            <div className="orderbook-walls-title">Walls</div>
            <div className="orderbook-walls-list">
              {largeOrders.slice(0, 4).map((wall, idx) => (
                <div key={idx} className="orderbook-wall-row">
                  <span className="orderbook-wall-side">
                    {wall.side.toUpperCase()}
                  </span>
                  <span className="orderbook-wall-price">
                    @ {wall.price}
                  </span>
                  <span className="orderbook-wall-qty">
                    ({wall.quantity.toFixed(3)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderBody = () => {
    if (error) {
      return (
        <div className="orderbook-state orderbook-state--error">
          Failed to load order book.{' '}
          <span>{String(error)}</span>
        </div>
      );
    }

    if (isLoading && !orderBook) {
      return (
        <div className="orderbook-state orderbook-state--loading">
          Loading order book…
        </div>
      );
    }

    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return (
        <div className="orderbook-state orderbook-state--empty">
          <div>No order book data yet.</div>
          {isDisconnected && (
            <div className="orderbook-state-note">
              WebSocket is disconnected. Waiting for reconnection…
            </div>
          )}
        </div>
      );
    }

    const bids = Array.isArray(orderBook.bids)
      ? orderBook.bids.slice(0, 25)
      : [];
    const asks = Array.isArray(orderBook.asks)
      ? orderBook.asks.slice(0, 25)
      : [];

    return (
      <div className="orderbook-body">
        {/* Asks في اليسار */}
        <div className="orderbook-side orderbook-side--asks">
          <div className="orderbook-side-header">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div className="orderbook-rows">
            {asks.map((l, idx) => {
              const price = Array.isArray(l) ? l[0] : l.price;
              const qty = Array.isArray(l) ? l[1] : l.quantity;

              return (
                <div
                  key={`ask-${idx}`}
                  className="orderbook-row orderbook-row--ask"
                >
                  <span className="orderbook-cell-price">
                    {Number(price).toFixed(4)}
                  </span>
                  <span className="orderbook-cell-qty">
                    {Number(qty).toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bids في اليمين */}
        <div className="orderbook-side orderbook-side--bids">
          <div className="orderbook-side-header">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div className="orderbook-rows">
            {bids.map((l, idx) => {
              const price = Array.isArray(l) ? l[0] : l.price;
              const qty = Array.isArray(l) ? l[1] : l.quantity;

              return (
                <div
                  key={`bid-${idx}`}
                  className="orderbook-row orderbook-row--bid"
                >
                  <span className="orderbook-cell-price">
                    {Number(price).toFixed(4)}
                  </span>
                  <span className="orderbook-cell-qty">
                    {Number(qty).toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="orderbook-panel">
      {renderHeader()}
      {renderSummary()}
      {renderBody()}
    </section>
  );
};

export default OrderBook;
