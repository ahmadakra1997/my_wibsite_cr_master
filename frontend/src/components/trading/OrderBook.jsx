// frontend/src/components/trading/OrderBook.jsx

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import OrderBookAnalyzer from '../../services/OrderBookAnalyzer';
import './OrderBook.css'; // اختياري: لو لديك ملف ستايل منفصل

/**
 * OrderBook
 *
 * مسؤول عن:
 * - عرض دفتر الأوامر (bids / asks).
 * - إظهار ملخص الإحصائيات (best bid/ask, spread, imbalance, walls).
 *
 * يفترض أن شكل orderBook في الـ store تقريبًا:
 * {
 *   symbol: 'BTCUSDT',
 *   bids: [[price, qty], ...] أو [{ price, quantity }, ...],
 *   asks: [[price, qty], ...] أو [{ price, quantity }, ...],
 *   updatedAt: timestamp
 * }
 */

const OrderBook = () => {
  // من tradingSlice – عدّل المسار/الأسماء حسب تطبيقك الحالي:
  const orderBook = useSelector((state) => state.trading.orderBook);
  const connectionStatus = useSelector(
    (state) => state.trading.connectionStatus,
  );
  const isLoading = useSelector((state) => state.trading.isLoadingOrderBook);
  const error = useSelector((state) => state.trading.orderBookError);

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
  //         Render helpers
  // -----------------------------

  const renderHeader = () => {
    return (
      <div className="ob-header">
        <div className="ob-title">
          <span className="ob-title-main">
            Order Book
            {orderBook?.symbol ? ` – ${orderBook.symbol}` : ''}
          </span>
          {orderBook?.updatedAt && (
            <span className="ob-updated-at">
              Last update:{' '}
              {new Date(orderBook.updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="ob-connection">
          <span
            className={`ob-connection-dot ob-connection-${connectionStatus}`}
          />
          <span className="ob-connection-text">
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>
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

    const imbalancePercent = (volumeImbalance * 100).toFixed(1);

    return (
      <div className="ob-summary">
        <div className="ob-summary-item">
          <span className="ob-summary-label">Best Bid</span>
          <span className="ob-summary-value ob-bid">{bestBid ?? '-'}</span>
        </div>
        <div className="ob-summary-item">
          <span className="ob-summary-label">Best Ask</span>
          <span className="ob-summary-value ob-ask">{bestAsk ?? '-'}</span>
        </div>
        <div className="ob-summary-item">
          <span className="ob-summary-label">Mid Price</span>
          <span className="ob-summary-value">{midPrice ?? '-'}</span>
        </div>
        <div className="ob-summary-item">
          <span className="ob-summary-label">Spread</span>
          <span className="ob-summary-value">
            {spreadText ?? '-'}
          </span>
        </div>
        <div className="ob-summary-item">
          <span className="ob-summary-label">Bid Vol</span>
          <span className="ob-summary-value">
            {totalBidVolume?.toFixed(3) ?? '-'}
          </span>
        </div>
        <div className="ob-summary-item">
          <span className="ob-summary-label">Ask Vol</span>
          <span className="ob-summary-value">
            {totalAskVolume?.toFixed(3) ?? '-'}
          </span>
        </div>
        <div className="ob-summary-item">
          <span className="ob-summary-label">Imbalance</span>
          <span className={`ob-summary-value ob-imbalance-${imbalanceLabel}`}>
            {isFinite(volumeImbalance) ? `${imbalancePercent}%` : '-'}
          </span>
        </div>

        {largeOrders && largeOrders.length > 0 && (
          <div className="ob-summary-large-orders">
            <span className="ob-summary-label">Walls</span>
            <div className="ob-summary-walls-list">
              {largeOrders.slice(0, 4).map((wall, idx) => (
                <span
                  key={`${wall.side}-${wall.price}-${idx}`}
                  className={`ob-wall ob-wall-${wall.side}`}
                >
                  {wall.side.toUpperCase()} @ {wall.price} (
                  {wall.quantity.toFixed(3)})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBody = () => {
    if (error) {
      return (
        <div className="ob-state ob-state-error">
          <span>Failed to load order book.</span>
          <span className="ob-state-sub">{String(error)}</span>
        </div>
      );
    }

    if (isLoading && !orderBook) {
      return (
        <div className="ob-state ob-state-loading">
          <span>Loading order book…</span>
        </div>
      );
    }

    if (!orderBook || !orderBook.bids || !orderBook.asks) {
      return (
        <div className="ob-state ob-state-empty">
          <span>No order book data yet.</span>
          {isDisconnected && (
            <span className="ob-state-sub">
              WebSocket is disconnected. Waiting for reconnection…
            </span>
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
      <div className="ob-body">
        <div className="ob-side ob-side-asks">
          <div className="ob-table-header">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div className="ob-table-body">
            {asks.map((l, idx) => {
              const price = Array.isArray(l) ? l[0] : l.price;
              const qty = Array.isArray(l) ? l[1] : l.quantity;
              return (
                <div key={`ask-${price}-${idx}`} className="ob-row">
                  <span className="ob-price ob-price-ask">
                    {Number(price).toFixed(4)}
                  </span>
                  <span className="ob-qty">{Number(qty).toFixed(3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ob-side ob-side-bids">
          <div className="ob-table-header">
            <span>Price</span>
            <span>Amount</span>
          </div>
          <div className="ob-table-body">
            {bids.map((l, idx) => {
              const price = Array.isArray(l) ? l[0] : l.price;
              const qty = Array.isArray(l) ? l[1] : l.quantity;
              return (
                <div key={`bid-${price}-${idx}`} className="ob-row">
                  <span className="ob-price ob-price-bid">
                    {Number(price).toFixed(4)}
                  </span>
                  <span className="ob-qty">{Number(qty).toFixed(3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="order-book-container">
      {renderHeader()}
      {renderSummary()}
      {renderBody()}
    </div>
  );
};

export default OrderBook;
