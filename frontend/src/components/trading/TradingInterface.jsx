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

const TradingInterface = () => {
  const dispatch = useDispatch();
  const connectionStatus = useSelector(selectConnectionStatus);

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
      unsubscribeStatus();
      unsubscribeError();
      unsubscribeOrderBook();
      unsubscribeTrades();
      unsubscribeTicker();
      // إذا بدك تغلق WS عند مغادرة الصفحة:
      // websocketService.close();
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

  return (
    <div className="trading-interface">
      {/* Header */}
      <div className="ti-header">
        <div className="ti-titleBlock">
          <h1 className="ti-title">Quantum AI Trading Cockpit</h1>
          <p className="ti-subtitle">
            Live order book, trade flow, risk metrics and AI overlays in one console.
          </p>
        </div>

        <div className={`ti-status ti-status--${statusConfig.tone}`}>
          <span className="ti-statusDot" />
          <div className="ti-statusText">
            <div className="ti-statusLabel">{statusConfig.label}</div>
            <div className="ti-statusCode">{String(connectionStatus || 'disconnected').toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="ti-topRow">
        <ErrorBoundary>
          <PriceTicker />
        </ErrorBoundary>
      </div>

      {/* Main grid */}
      <div className="ti-grid">
        <div className="ti-col ti-col--left">
          <div className="ti-card">
            <div className="ti-cardHeader">
              <h3>Order Book</h3>
              <span className="ti-cardHint">Depth & liquidity</span>
            </div>

            {/* ✅ مهم: نلفّ OrderBook بـ ErrorBoundary لمنع كراش كامل لو Analyzer فيه مشكلة */}
            <ErrorBoundary>
              <OrderBook />
            </ErrorBoundary>
          </div>
        </div>

        <div className="ti-col ti-col--right">
          <div className="ti-card">
            <div className="ti-cardHeader">
              <h3>Risk Monitor</h3>
              <span className="ti-cardHint">Exposure & alerts</span>
            </div>

            <ErrorBoundary>
              <RiskMonitor />
            </ErrorBoundary>
          </div>

          <div className="ti-card">
            <div className="ti-cardHeader">
              <h3>Trade History</h3>
              <span className="ti-cardHint">Flow & executions</span>
            </div>

            <ErrorBoundary>
              <TradeHistory />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;
