// frontend/src/components/trading/TradingInterface.jsx
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import websocketService from '../../services/websocketService';
import {
  setConnectionStatus,
  orderBookLoading,
  orderBookUpdated,
  orderBookError,
  tradesLoading,
  tradesUpdated,
  tradesError,
  tickerLoading,
  tickerUpdated,
  tickerError,
  selectConnectionStatus,
  selectTrading,
} from '../../store/tradingSlice';

import './TradingInterface.css';

const safeNum = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

const fmt = (v, digits = 4) => {
  const n = safeNum(v, 0);
  return n.toFixed(digits);
};

const formatMaybeTime = (ts) => {
  if (!ts) return '—';
  try {
    // لو رقم أو سترنغ رقم
    const n = typeof ts === 'string' && /^\d+$/.test(ts) ? Number(ts) : ts;
    const d = new Date(n);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString();
  } catch {
    return '—';
  }
};

const StatusPill = ({ label, tone, raw }) => {
  const tones = {
    success: { bg: 'rgba(0,255,136,0.14)', bd: 'rgba(0,255,136,0.55)', tx: '#00ff88' },
    warn: { bg: 'rgba(255,159,28,0.14)', bd: 'rgba(255,159,28,0.55)', tx: '#ff9f1c' },
    danger: { bg: 'rgba(255,59,92,0.14)', bd: 'rgba(255,59,92,0.55)', tx: '#ff3b5c' },
    muted: { bg: 'rgba(148,163,184,0.10)', bd: 'rgba(148,163,184,0.30)', tx: 'rgba(226,232,240,0.75)' },
  };
  const c = tones[tone] || tones.muted;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          padding: '6px 10px',
          borderRadius: 999,
          background: c.bg,
          border: `1px solid ${c.bd}`,
          color: c.tx,
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 700 }}>
        {String(raw || '').toUpperCase()}
      </span>
    </div>
  );
};

const Panel = ({ title, subtitle, right, children }) => (
  <section
    style={{
      borderRadius: 18,
      border: '1px solid rgba(148,163,184,0.18)',
      background: 'rgba(15,23,42,0.65)',
      boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
      padding: 14,
      overflow: 'hidden',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
      <div>
        <div style={{ color: '#00a3ff', fontWeight: 900, letterSpacing: '0.06em' }}>{title}</div>
        {subtitle ? <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, marginTop: 4 }}>{subtitle}</div> : null}
      </div>
      {right || null}
    </div>
    {children}
  </section>
);

const TradingInterface = () => {
  const dispatch = useDispatch();
  const connectionStatus = useSelector(selectConnectionStatus);
  const trading = useSelector(selectTrading);

  useEffect(() => {
    const unsubscribeStatus = websocketService.on('statusChange', (status) => {
      dispatch(setConnectionStatus(status));
    });

    const unsubscribeError = websocketService.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[TradingInterface] WebSocket error:', err);
      dispatch(setConnectionStatus('error'));
    });

    // initial loading states
    dispatch(orderBookLoading());
    dispatch(tradesLoading());
    dispatch(tickerLoading());

    const unsubscribeOrderBook = websocketService.subscribe('orderBook', (payload) => {
      try {
        dispatch(orderBookUpdated(payload));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[TradingInterface] orderBook handler error:', e);
        dispatch(orderBookError(e?.message || 'OrderBook parse error'));
      }
    });

    const unsubscribeTrades = websocketService.subscribe('trades', (payload) => {
      try {
        dispatch(tradesUpdated(payload));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[TradingInterface] trades handler error:', e);
        dispatch(tradesError(e?.message || 'Trades parse error'));
      }
    });

    const unsubscribeTicker = websocketService.subscribe('ticker', (payload) => {
      try {
        dispatch(tickerUpdated(payload));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[TradingInterface] ticker handler error:', e);
        dispatch(tickerError(e?.message || 'Ticker parse error'));
      }
    });

    websocketService.connect();

    return () => {
      unsubscribeStatus?.();
      unsubscribeError?.();
      unsubscribeOrderBook?.();
      unsubscribeTrades?.();
      unsubscribeTicker?.();
      // إذا بدك تغلق WS عند مغادرة الصفحة:
      // websocketService.close();
    };
  }, [dispatch]);

  const statusConfig = useMemo(() => {
    const s = String(connectionStatus || 'disconnected').toLowerCase();
    if (s === 'open' || s === 'connected') return { label: 'متصل', tone: 'success' };
    if (s === 'connecting') return { label: 'جاري الاتصال', tone: 'warn' };
    if (s === 'error') return { label: 'خطأ اتصال', tone: 'danger' };
    if (s === 'closed') return { label: 'مغلق', tone: 'muted' };
    return { label: 'غير متصل', tone: 'muted' };
  }, [connectionStatus]);

  const ticker = trading?.ticker || null;
  const tickerLoadingState = !!trading?.isLoadingTicker;
  const tickerErr = trading?.tickerError;

  const orderBook = trading?.orderBook || trading?.orderbook || null;
  const obLoading = !!trading?.isLoadingOrderBook;
  const obErr = trading?.orderBookError;

  const trades = Array.isArray(trading?.trades) ? trading.trades : [];
  const tradesLoadingState = !!trading?.isLoadingTrades;
  const tradesErr = trading?.tradesError;

  const bids = Array.isArray(orderBook?.bids) ? orderBook.bids : [];
  const asks = Array.isArray(orderBook?.asks) ? orderBook.asks : [];

  const maxLevels = 16;

  const maxQty = useMemo(() => {
    const all = [...bids.slice(0, maxLevels), ...asks.slice(0, maxLevels)];
    const m = all.reduce((acc, l) => Math.max(acc, safeNum(l?.quantity ?? l?.size ?? l?.amount, 0)), 0);
    return Math.max(1, m);
  }, [bids, asks]);

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '18px 16px 28px', color: 'rgba(226,232,240,0.92)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, letterSpacing: '0.08em' }}>Quantum AI Trading Cockpit</h1>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.9)', fontSize: 13, lineHeight: 1.5 }}>
            Live order book, trade flow, risk metrics and AI overlays in one console.
          </div>
        </div>

        <StatusPill label={statusConfig.label} tone={statusConfig.tone} raw={connectionStatus || 'disconnected'} />
      </div>

      {/* Ticker */}
      <Panel
        title="Price Ticker"
        subtitle="Realtime symbol snapshot"
        right={
          tickerLoadingState ? (
            <span style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 700, fontSize: 12 }}>Loading…</span>
          ) : null
        }
      >
        {tickerErr ? (
          <div style={{ color: '#ff3b5c', fontWeight: 700 }}>Failed to load ticker: {String(tickerErr)}</div>
        ) : !ticker ? (
          <div style={{ color: 'rgba(148,163,184,0.9)' }}>No ticker data yet.</div>
        ) : (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, color: '#00a3ff' }}>{ticker.symbol || 'SYMBOL'}</div>
            <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
              {fmt(ticker.lastPrice, 4)}
              <span style={{ marginLeft: 10, color: safeNum(ticker.priceChange) >= 0 ? '#00ff88' : '#ff3b5c' }}>
                {safeNum(ticker.priceChange) >= 0 ? '+' : ''}
                {fmt(ticker.priceChange, 4)} ({safeNum(ticker.priceChangePercent) >= 0 ? '+' : ''}
                {fmt(ticker.priceChangePercent, 2)}%)
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap', color: 'rgba(226,232,240,0.85)' }}>
              <span>High {fmt(ticker.highPrice, 4)}</span>
              <span>Low {fmt(ticker.lowPrice, 4)}</span>
              <span>Vol {fmt(ticker.volume, 3)}</span>
            </div>
          </div>
        )}
      </Panel>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14, marginTop: 14 }}>
        <Panel
          title="Order Book"
          subtitle="Depth & liquidity"
          right={obLoading ? <span style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 700, fontSize: 12 }}>Loading…</span> : null}
        >
          {obErr ? (
            <div style={{ color: '#ff3b5c', fontWeight: 700 }}>Failed to load order book: {String(obErr)}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Asks */}
              <div>
                <div style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', marginBottom: 8 }}>
                  ASKS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {asks.slice(0, maxLevels).map((a, idx) => {
                    const q = safeNum(a?.quantity ?? a?.size ?? a?.amount, 0);
                    const p = safeNum(a?.price, 0);
                    const pct = clamp((q / maxQty) * 100, 0, 100);
                    return (
                      <div key={`a_${idx}`} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.12)' }}>
                        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'rgba(255,59,92,0.10)' }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '7px 10px', fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ color: '#ff3b5c', fontWeight: 800 }}>{fmt(p, 2)}</span>
                          <span style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 700 }}>{fmt(q, 4)}</span>
                          <span style={{ color: 'rgba(148,163,184,0.9)' }}>{fmt(p * q, 2)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {!asks?.length && <div style={{ color: 'rgba(148,163,184,0.9)' }}>Waiting for asks…</div>}
                </div>
              </div>

              {/* Bids */}
              <div>
                <div style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 900, fontSize: 12, letterSpacing: '0.08em', marginBottom: 8 }}>
                  BIDS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {bids.slice(0, maxLevels).map((b, idx) => {
                    const q = safeNum(b?.quantity ?? b?.size ?? b?.amount, 0);
                    const p = safeNum(b?.price, 0);
                    const pct = clamp((q / maxQty) * 100, 0, 100);
                    return (
                      <div key={`b_${idx}`} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.12)' }}>
                        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'rgba(0,255,136,0.10)' }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '7px 10px', fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ color: '#00ff88', fontWeight: 800 }}>{fmt(p, 2)}</span>
                          <span style={{ color: 'rgba(226,232,240,0.9)', fontWeight: 700 }}>{fmt(q, 4)}</span>
                          <span style={{ color: 'rgba(148,163,184,0.9)' }}>{fmt(p * q, 2)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {!bids?.length && <div style={{ color: 'rgba(148,163,184,0.9)' }}>Waiting for bids…</div>}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Trade History"
          subtitle="Flow & executions"
          right={tradesLoadingState ? <span style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 700, fontSize: 12 }}>Loading…</span> : null}
        >
          {tradesErr ? (
            <div style={{ color: '#ff3b5c', fontWeight: 700 }}>Failed to load trades: {String(tradesErr)}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(trades.slice(0, 18) || []).map((t, idx) => {
                const price = safeNum(t?.price, 0);
                const qty = safeNum(t?.quantity ?? t?.size ?? t?.amount, 0);
                const side = String(t?.side || t?.type || '').toLowerCase();
                const isBuy = side.includes('buy');
                const ts = t?.timestamp || t?.time || t?.ts;

                return (
                  <div
                    key={`tr_${idx}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.1fr 1fr 1fr',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.12)',
                      background: 'rgba(2,6,23,0.35)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <div style={{ fontWeight: 900, color: isBuy ? '#00ff88' : '#ff3b5c' }}>{fmt(price, 2)}</div>
                    <div style={{ fontWeight: 700, color: 'rgba(226,232,240,0.9)' }}>{fmt(qty, 5)}</div>
                    <div style={{ color: 'rgba(148,163,184,0.9)', textAlign: 'right' }}>
                      {formatMaybeTime(ts)}
                    </div>
                  </div>
                );
              })}
              {!trades?.length && <div style={{ color: 'rgba(148,163,184,0.9)' }}>No trades yet.</div>}
            </div>
          )}
        </Panel>
      </div>

      {/* Risk (مبدئي - Guarded) */}
      <div style={{ marginTop: 14 }}>
        <Panel title="Risk Monitor" subtitle="Protection & alerts (Guarded)">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                border: '1px solid rgba(148,163,184,0.14)',
                background: 'radial-gradient(circle at top left, rgba(0,163,255,0.12), transparent), rgba(2,6,23,0.35)',
              }}
            >
              <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 800 }}>WS</div>
              <div style={{ color: '#00a3ff', fontWeight: 900 }}>{statusConfig.label}</div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                border: '1px solid rgba(148,163,184,0.14)',
                background: 'radial-gradient(circle at top left, rgba(0,255,136,0.10), transparent), rgba(2,6,23,0.35)',
              }}
            >
              <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 800 }}>Guards</div>
              <div style={{ color: '#00ff88', fontWeight: 900 }}>Null-safe • No-crash</div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: 14,
                border: '1px solid rgba(148,163,184,0.14)',
                background: 'radial-gradient(circle at top left, rgba(56,189,248,0.10), transparent), rgba(2,6,23,0.35)',
              }}
            >
              <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, fontWeight: 800 }}>Data</div>
              <div style={{ color: 'rgba(226,232,240,0.92)', fontWeight: 900 }}>
                Bids: {bids.length} • Asks: {asks.length} • Trades: {trades.length}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default TradingInterface;
