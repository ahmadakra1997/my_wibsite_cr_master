// frontend/src/components/trading/TradeHistory.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import './TradeHistory.css'; // اختياري

/**
 * نتوقع شكل الـ trade:
 * {
 *   id: string | number,
 *   price: number | string,
 *   quantity: number | string,
 *   side: 'buy' | 'sell',
 *   timestamp: number | string (ms)
 * }
 */

const TradeHistory = () => {
  const trades = useSelector((state) => state.trading.trades);
  const isLoading = useSelector((state) => state.trading.isLoadingTrades);
  const error = useSelector((state) => state.trading.tradesError);

  const renderState = () => {
    if (error) {
      return (
        <div className="th-state th-state-error">
          <span>Failed to load trades.</span>
          <span className="th-state-sub">{String(error)}</span>
        </div>
      );
    }

    if (isLoading && (!trades || trades.length === 0)) {
      return (
        <div className="th-state th-state-loading">
          <span>Loading trades…</span>
        </div>
      );
    }

    if (!trades || trades.length === 0) {
      return (
        <div className="th-state th-state-empty">
          <span>No trades yet.</span>
        </div>
      );
    }

    return null;
  };

  const stateNode = renderState();
  if (stateNode) {
    return (
      <div className="trade-history-container">
        <div className="th-header">
          <span className="th-title">Recent Trades</span>
        </div>
        {stateNode}
      </div>
    );
  }

  return (
    <div className="trade-history-container">
      <div className="th-header">
        <span className="th-title">Recent Trades</span>
      </div>
      <div className="th-table-header">
        <span>Time</span>
        <span>Side</span>
        <span>Price</span>
        <span>Amount</span>
      </div>
      <div className="th-table-body">
        {trades.map((trade, idx) => {
          const time = trade.timestamp
            ? new Date(Number(trade.timestamp)).toLocaleTimeString()
            : '-';
          const side = (trade.side || '').toLowerCase();
          const isBuy = side === 'buy';
          const isSell = side === 'sell';

          return (
            <div
              key={trade.id || idx}
              className={`th-row ${
                isBuy ? 'th-row-buy' : isSell ? 'th-row-sell' : ''
              }`}
            >
              <span className="th-time">{time}</span>
              <span className={`th-side th-side-${side || 'unknown'}`}>
                {side.toUpperCase() || '-'}
              </span>
              <span className="th-price">
                {Number(trade.price ?? 0).toFixed(4)}
              </span>
              <span className="th-qty">
                {Number(trade.quantity ?? 0).toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TradeHistory;
