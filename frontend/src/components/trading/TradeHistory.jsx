// frontend/src/components/trading/TradeHistory.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import './TradeHistory.css';

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
  const isLoading = useSelector(
    (state) => state.trading.isLoadingTrades
  );
  const error = useSelector(
    (state) => state.trading.tradesError
  );

  const renderState = () => {
    if (error) {
      return (
        <div className="th-state th-state-error">
          Failed to load trades.
          <span className="th-state-sub">
            {String(error)}
          </span>
        </div>
      );
    }

    if (isLoading && (!trades || trades.length === 0)) {
      return (
        <div className="th-state th-state-loading">
          Loading trades…
        </div>
      );
    }

    if (!trades || trades.length === 0) {
      return (
        <div className="th-state th-state-empty">
          No trades yet.
        </div>
      );
    }

    return null;
  };

  const stateNode = renderState();

  // حالة خطأ / تحميل / لا يوجد بيانات
  if (stateNode) {
    return (
      <section className="trade-history-container">
        <header className="th-header">
          <h3 className="th-title">Recent Trades</h3>
        </header>
        {stateNode}
      </section>
    );
  }

  // حالة وجود بيانات
  return (
    <section className="trade-history-container">
      <header className="th-header">
        <h3 className="th-title">Recent Trades</h3>
      </header>

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

          const rawSide = (trade.side || '').toLowerCase();
          const isBuy = rawSide === 'buy';
          const isSell = rawSide === 'sell';

          const sideText =
            rawSide ? rawSide.toUpperCase() : '—';

          const rowClass = [
            'th-row',
            isBuy ? 'th-row-buy' : '',
            isSell ? 'th-row-sell' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const sideClass = [
            'th-side',
            isBuy
              ? 'th-side-buy'
              : isSell
              ? 'th-side-sell'
              : 'th-side-unknown',
          ].join(' ');

          return (
            <div
              key={trade.id || idx}
              className={rowClass}
            >
              <span className="th-time">{time}</span>
              <span className={sideClass}>{sideText}</span>
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
    </section>
  );
};

export default TradeHistory;
