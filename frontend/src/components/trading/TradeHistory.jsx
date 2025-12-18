// frontend/src/components/trading/TradeHistory.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectTradeHistory,
  selectTrading,
  tradesLoading,
} from '../../store/tradingSlice';
import './TradeHistory.css';

const toNumber = (v, fallback = 0) => {
  const n =
    typeof v === 'string'
      ? Number(v.replace(/,/g, '').trim())
      : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const TradeHistory = () => {
  const tradeHistory = useSelector(selectTradeHistory);
  const trading = useSelector(selectTrading);

  const trades = Array.isArray(tradeHistory)
    ? tradeHistory
    : Array.isArray(tradeHistory?.trades)
      ? tradeHistory.trades
      : Array.isArray(trading?.trades)
        ? trading.trades
        : [];

  const isLoading = useSelector(tradesLoading) || !!trading?.loading?.trades;

  const error =
    trading?.errors?.trades ??
    trading?.tradesError ??
    trading?.error ??
    null;

  const renderState = () => {
    if (error) {
      return (
        <div className="trade-history-error">
          <strong>Failed to load trades.</strong>
          <div>{String(error)}</div>
        </div>
      );
    }

    if (isLoading && trades.length === 0) {
      return <div className="trade-history-loading">Loading trades…</div>;
    }

    if (trades.length === 0) {
      return <div className="trade-history-empty">No trades yet.</div>;
    }

    return null;
  };

  const stateNode = renderState();
  if (stateNode) {
    return (
      <div className="trade-history">
        <h3>Recent Trades</h3>
        {stateNode}
      </div>
    );
  }

  return (
    <div className="trade-history">
      <h3>Recent Trades</h3>

      <div className="trade-history-table">
        <div className="th-header">
          <span>Time</span>
          <span>Side</span>
          <span>Price</span>
          <span>Amount</span>
        </div>

        <div className="th-body">
          {trades.map((trade, idx) => {
            const ts = trade.timestamp ?? trade.time ?? trade.createdAt ?? null;
            const time = ts ? new Date(Number(ts)).toLocaleTimeString() : '-';

            const rawSide = String(trade.side ?? trade.type ?? '').toLowerCase();
            const isBuy = rawSide === 'buy';
            const isSell = rawSide === 'sell';

            const sideText = rawSide ? rawSide.toUpperCase() : '—';

            const price = toNumber(trade.price ?? trade.rate ?? 0, 0);
            const qty = toNumber(trade.quantity ?? trade.amount ?? trade.size ?? 0, 0);

            const rowClass = [
              'th-row',
              isBuy ? 'th-row-buy' : '',
              isSell ? 'th-row-sell' : '',
            ]
              .filter(Boolean)
              .join(' ');

            const sideClass = [
              'th-side',
              isBuy ? 'th-side-buy' : isSell ? 'th-side-sell' : 'th-side-unknown',
            ].join(' ');

            return (
              <div key={trade.id ?? `${price}-${qty}-${idx}`} className={rowClass}>
                <span className="th-time">{time}</span>
                <span className={sideClass}>{sideText}</span>
                <span className="th-price">{price.toFixed(4)}</span>
                <span className="th-amount">{qty.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
