// frontend/src/components/trading/TradeHistory.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { selectTradeHistory, selectTrading } from '../../store/tradingSlice';
import './TradeHistory.css';

const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const TradeHistory = () => {
  const tradeHistory = useSelector(selectTradeHistory);
  const trading = useSelector(selectTrading);

  const trades = Array.isArray(tradeHistory)
    ? tradeHistory
    : Array.isArray(tradeHistory?.trades)
      ? tradeHistory.trades
      : Array.isArray(trading?.tradeHistory?.trades)
        ? trading.tradeHistory.trades
        : [];

  // ✅ slice الحقيقي: loading.trades/errors.trades :contentReference[oaicite:19]{index=19}
  const isLoading = useSelector((state) => !!(state?.trading?.loading?.trades)) || !!trading?.loading?.trades;
  const error =
    useSelector((state) => state?.trading?.errors?.trades ?? null) ??
    trading?.errors?.trades ??
    trading?.tradesError ??
    trading?.error ??
    null;

  const renderState = () => {
    if (error) {
      return (
        <div style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(255,59,92,0.30)', background: 'rgba(255,59,92,0.08)' }}>
          <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Failed to load trades.</div>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontSize: 12 }}>{String(error)}</div>
        </div>
      );
    }

    if (isLoading && trades.length === 0) {
      return (
        <div style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(56,189,248,0.24)', background: 'rgba(56,189,248,0.08)', color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>
          Loading trades…
        </div>
      );
    }

    if (trades.length === 0) {
      return (
        <div style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(148,163,184,0.20)', background: 'rgba(148,163,184,0.06)', color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>
          No trades yet.
        </div>
      );
    }

    return null;
  };

  const stateNode = renderState();
  if (stateNode) {
    return (
      <div className="trade-history" style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Recent Trades</div>
        {stateNode}
      </div>
    );
  }

  return (
    <div className="trade-history" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Recent Trades</div>
        <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>
          {trading?.tradeHistory?.lastUpdate ? `Updated: ${new Date(trading.tradeHistory.lastUpdate).toLocaleTimeString()}` : ''}
        </div>
      </div>

      <div className="th-table" style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr 1fr 1fr', gap: 10, color: 'rgba(148,163,184,0.85)', fontSize: 12, fontWeight: 900, padding: '0 10px' }}>
          <div>Time</div>
          <div>Side</div>
          <div>Price</div>
          <div>Amount</div>
        </div>

        {trades.map((trade, idx) => {
          const ts = trade?.timestamp ?? trade?.time ?? trade?.createdAt ?? null;
          const time = ts ? new Date(Number(ts)).toLocaleTimeString() : '-';

          const rawSide = String(trade?.side ?? trade?.type ?? '').toLowerCase();
          const isBuy = rawSide === 'buy';
          const isSell = rawSide === 'sell';
          const sideText = rawSide ? rawSide.toUpperCase() : '—';

          const price = toNumber(trade?.price ?? trade?.rate ?? 0, 0);
          const qty = toNumber(trade?.quantity ?? trade?.amount ?? trade?.size ?? 0, 0);

          const rowClass = ['th-row', isBuy ? 'th-row-buy' : '', isSell ? 'th-row-sell' : ''].filter(Boolean).join(' ');
          const sideClass = ['th-side', isBuy ? 'th-side-buy' : isSell ? 'th-side-sell' : 'th-side-unknown'].join(' ');

          return (
            <div
              key={trade?.id ?? `${time}-${idx}`}
              className={rowClass}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 0.6fr 1fr 1fr',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.12)',
                background: 'rgba(15,23,42,0.45)',
              }}
            >
              <div style={{ color: 'rgba(226,232,240,0.92)', fontWeight: 800 }}>{time}</div>
              <div className={sideClass} style={{ fontWeight: 900, color: isBuy ? 'rgba(0,255,136,0.95)' : isSell ? 'rgba(255,59,92,0.95)' : 'rgba(148,163,184,0.95)' }}>
                {sideText}
              </div>
              <div style={{ color: 'rgba(226,232,240,0.92)', fontWeight: 900 }}>{price.toFixed(4)}</div>
              <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 800 }}>{qty.toFixed(3)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TradeHistory;
