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
} from '../../store/tradingSlice';

import PriceTicker from './PriceTicker';
import OrderBook from './OrderBook';
import TradeHistory from './TradeHistory';
import RiskMonitor from './RiskMonitor';
import ErrorBoundary from '../common/ErrorBoundary';

import './TradingInterface.css';

const safeCall = (fn) => {
  try {
    if (typeof fn === 'function') fn();
  } catch {
    // ignore cleanup errors
  }
};

const TradingInterface = () => {
  const dispatch = useDispatch();
  const connectionStatus = useSelector(selectConnectionStatus);

  useEffect(() => {
    const unsubscribeStatus = websocketService?.on?.('statusChange', (status) => {
      dispatch(setConnectionStatus(status));
    });

    const unsubscribeError = websocketService?.on?.('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[TradingInterface] WebSocket error:', err);
      dispatch(setConnectionStatus('error'));
    });

    // initial loading states
    dispatch(orderBookLoading());
    dispatch(tradesLoading());
    dispatch(tickerLoading());

    const unsubscribeOrderBook = websocketService?.subscribe?.('orderBook', (payload) => {
      try {
        dispatch(orderBookUpdated(payload));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[TradingInterface] orderBook handler error:', e);
        dispatch(orderBookError(e?.message || 'OrderBook parse error'));
      }
    });

    const unsubscribeTrades = websocketService?.subscribe?.('trades', (payload) => {
      try {
        dispatch(tradesUpdated(payload));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[TradingInterface] trades handler error:', e);
        dispatch(tradesError(e?.message || 'Trades parse error'));
      }
    });

    const unsubscribeTicker = websocketService?.subscribe?.('ticker', (payload) => {
      try {
        dispatch(tickerUpdated(payload));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[TradingInterface] ticker handler error:', e);
        dispatch(tickerError(e?.message || 'Ticker parse error'));
      }
    });

    websocketService?.connect?.();

    return () => {
      safeCall(unsubscribeStatus);
      safeCall(unsubscribeError);
      safeCall(unsubscribeOrderBook);
      safeCall(unsubscribeTrades);
      safeCall(unsubscribeTicker);

      // إذا بدك تغلق WS عند مغادرة الصفحة:
      // websocketService?.close?.();
    };
  }, [dispatch]);

  const statusConfig = useMemo(() => {
    const s = String(connectionStatus || 'disconnected').toLowerCase();
    if (s === 'open') return { label: 'متصل', tone: 'success' };
    if (s === 'connecting') return { label: 'جاري الاتصال', tone: 'warn' };
    if (s === 'error') return { label: 'خطأ اتصال', tone: 'danger' };
    if (s === 'closed') return { label: 'مغلق', tone: 'muted' };
    return { label: 'غير متصل', tone: 'muted' };
  }, [connectionStatus]);

  const toneStyle = useMemo(() => {
    const t = statusConfig.tone;
    if (t === 'success') return { bd: 'rgba(0,255,136,0.45)', bg: 'rgba(0,255,136,0.10)' };
    if (t === 'warn') return { bd: 'rgba(255,159,28,0.50)', bg: 'rgba(255,159,28,0.10)' };
    if (t === 'danger') return { bd: 'rgba(255,59,92,0.50)', bg: 'rgba(255,59,92,0.10)' };
    return { bd: 'rgba(148,163,184,0.28)', bg: 'rgba(148,163,184,0.08)' };
  }, [statusConfig.tone]);

  return (
    <div className="trading-interface" style={{ padding: '14px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          borderRadius: 18,
          padding: '14px',
          border: '1px solid rgba(56,189,248,0.22)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.92), rgba(8,47,73,0.55))',
          boxShadow: '0 18px 46px rgba(2,6,23,0.65)',
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 220 }}>
          <div style={{ fontWeight: 900, letterSpacing: '0.06em', color: 'rgba(226,232,240,0.95)' }}>
            Quantum AI Trading Cockpit
          </div>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.92)', fontSize: 13, lineHeight: 1.4 }}>
            Live order book, trade flow, risk metrics and AI overlays in one console.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              borderRadius: 999,
              padding: '6px 10px',
              border: `1px solid ${toneStyle.bd}`,
              background: toneStyle.bg,
              color: 'rgba(226,232,240,0.92)',
              fontWeight: 900,
              fontSize: 12,
              display: 'inline-flex',
              gap: 8,
              alignItems: 'center',
            }}
            title={String(connectionStatus || 'disconnected')}
          >
            <span aria-hidden="true">📡</span>
            <span>{statusConfig.label}</span>
            <span style={{ opacity: 0.8 }}>{String(connectionStatus || 'disconnected').toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ marginBottom: 12 }}>
        <ErrorBoundary onReset={() => dispatch(tickerLoading())}>
          <PriceTicker />
        </ErrorBoundary>
      </div>

      {/* Main grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 12,
        }}
      >
        {/* Order Book */}
        <div
          style={{
            borderRadius: 18,
            padding: 12,
            border: '1px solid rgba(56,189,248,0.16)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
            <div>
              <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Order Book</div>
              <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Depth & liquidity</div>
            </div>
          </div>

          {/* ✅ مهم: نلفّ OrderBook بـ ErrorBoundary لمنع كراش كامل لو Analyzer فيه مشكلة */}
          <div style={{ marginTop: 10, minWidth: 0 }}>
            <ErrorBoundary onReset={() => dispatch(orderBookLoading())}>
              <OrderBook />
            </ErrorBoundary>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
          {/* Risk Monitor */}
          <div
            style={{
              borderRadius: 18,
              padding: 12,
              border: '1px solid rgba(0,255,136,0.14)',
              background: 'rgba(15,23,42,0.55)',
              boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
              minWidth: 0,
            }}
          >
            <div>
              <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Risk Monitor</div>
              <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Exposure & alerts</div>
            </div>

            <div style={{ marginTop: 10 }}>
              <ErrorBoundary>
                <RiskMonitor />
              </ErrorBoundary>
            </div>
          </div>

          {/* Trade History */}
          <div
            style={{
              borderRadius: 18,
              padding: 12,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.55)',
              boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
              minWidth: 0,
            }}
          >
            <div>
              <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Trade History</div>
              <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Flow & executions</div>
            </div>

            <div style={{ marginTop: 10 }}>
              <ErrorBoundary onReset={() => dispatch(tradesLoading())}>
                <TradeHistory />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive tweak بدون CSS إضافي */}
      <style>
        {`
          @media (max-width: 980px) {
            .trading-interface > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
    </div>
  );
};

export default TradingInterface;
