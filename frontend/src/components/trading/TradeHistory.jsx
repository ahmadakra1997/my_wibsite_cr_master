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
    typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
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

  // لا نستخدم tradesLoading كـ selector بشكل مباشر (قد تكون action)
  const isLoadingFromState = useSelector(
    (state) => !!state?.trading?.isLoadingTrades
  );

  const isLoadingMaybe = useSelector((state) => {
    try {
      const r = typeof tradesLoading === 'function' ? tradesLoading(state) : undefined;
      return typeof r === 'boolean' ? r : undefined;
    } catch {
      return undefined;
    }
  });

  const isLoading =
    (typeof isLoadingMaybe === 'boolean' ? isLoadingMaybe : false) ||
    !!trading?.loading?.trades ||
    isLoadingFromState;

  const error =
    trading?.errors?.trades ??
    trading?.tradesError ??
    trading?.error ??
    null;

  const renderState = () => {
    if (error) {
      return (
        <div className="th-state th-error">
          <div style={{ fontWeight: 700 }}>Failed to load trades.</div>
          <div style={{ opacity: 0.9 }}>{String(error)}</div>
        </div>
      );
    }

    if (isLoading && trades.length === 0) {
      return <div className="th-state th-loading">Loading trades…</div>;
    }

    if (trades.length === 0) {
      return <div className="th-state th-empty">No trades yet.</div>;
    }

    return null;
  };

  const stateNode = renderState();

  if (stateNode) {
    return (
      <div className="th-root">
        <div className="th-title">Recent Trades</div>
        {stateNode}
      </div>
    );
  }

  return (
    <div className="th-root">
      <div className="th-title">Recent Trades</div>

      <div className="th-table" role="table" aria-label="Recent trades">
        <div className="th-head" role="row">
          <div role="columnheader">Time</div>
          <div role="columnheader">Side</div>
          <div role="columnheader">Price</div>
          <div role="columnheader">Amount</div>
        </div>

        <div className="th-body" role="rowgroup">
          {trades.map((trade, idx) => {
            const ts = trade?.timestamp ?? trade?.time ?? trade?.createdAt ?? null;
            const time = ts ? new Date(Number(ts)).toLocaleTimeString() : '-';

            const rawSide = String(trade?.side ?? trade?.type ?? '').toLowerCase();
            const isBuy = rawSide === 'buy';
            const isSell = rawSide === 'sell';
            const sideText = rawSide ? rawSide.toUpperCase() : '—';

            const price = toNumber(trade?.price ?? trade?.rate ?? 0, 0);
            const qty = toNumber(trade?.quantity ?? trade?.amount ?? trade?.size ?? 0, 0);

            const rowClass = ['th-row', isBuy ? 'th-row-buy' : '', isSell ? 'th-row-sell' : '']
              .filter(Boolean)
              .join(' ');

            const sideClass = ['th-side', isBuy ? 'th-side-buy' : isSell ? 'th-side-sell' : 'th-side-unknown']
              .filter(Boolean)
              .join(' ');

            return (
              <div className={rowClass} role="row" key={trade?.id ?? `${idx}-${time}-${sideText}`}>
                <div role="cell">{time}</div>
                <div role="cell" className={sideClass}>{sideText}</div>
                <div role="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {price.toFixed(4)}
                </div>
                <div role="cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {qty.toFixed(3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
