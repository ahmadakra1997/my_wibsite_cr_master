// frontend/src/components/trading/TradingInterface.jsx

import React, { useEffect } from 'react';
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
} from '../../store/tradingSlice';

import OrderBook from './OrderBook';
import TradeHistory from './TradeHistory';
import PriceTicker from './PriceTicker';
import RiskMonitor from './RiskMonitor';

import './TradingInterface.css';

const TradingInterface = () => {
  const dispatch = useDispatch();
  const connectionStatus = useSelector(
    (state) => state.trading.connectionStatus,
  );

  useEffect(() => {
    // WebSocket status
    const unsubscribeStatus = websocketService.on(
      'statusChange',
      (status) => {
        dispatch(setConnectionStatus(status));
      },
    );

    const unsubscribeError = websocketService.on('error', (err) => {
      console.error('[TradingInterface] WebSocket error:', err);
      dispatch(setConnectionStatus('error'));
    });

    // initial loading states
    dispatch(orderBookLoading());
    dispatch(tradesLoading());
    dispatch(tickerLoading());

    // orderBook channel
    const unsubscribeOrderBook = websocketService.subscribe(
      'orderBook',
      (payload) => {
        try {
          dispatch(orderBookUpdated(payload));
        } catch (e) {
          console.error('[TradingInterface] orderBook handler error:', e);
          dispatch(orderBookError(e.message || 'OrderBook parse error'));
        }
      },
    );

    // trades channel
    const unsubscribeTrades = websocketService.subscribe(
      'trades',
      (payload) => {
        try {
          dispatch(tradesUpdated(payload));
        } catch (e) {
          console.error('[TradingInterface] trades handler error:', e);
          dispatch(tradesError(e.message || 'Trades parse error'));
        }
      },
    );

    // ticker channel
    const unsubscribeTicker = websocketService.subscribe(
      'ticker',
      (payload) => {
        try {
          dispatch(tickerUpdated(payload));
        } catch (e) {
          console.error('[TradingInterface] ticker handler error:', e);
          dispatch(tickerError(e.message || 'Ticker parse error'));
        }
      },
    );

    // open connection
    websocketService.connect();

    return () => {
      unsubscribeStatus();
      unsubscribeError();
      unsubscribeOrderBook();
      unsubscribeTrades();
      unsubscribeTicker();
      // نترك الاتصال مفتوح لمكوّنات أخرى، إلا لو أردت إغلاقه عند مغادرة هذه الصفحة فقط.
      // websocketService.close();
    };
  }, [dispatch]);

  return (
    <div className="trading-interface">
      <div className="trading-header">
        <div className="trading-title">
          <h2>Quantum AI Trading Cockpit</h2>
          <span className="trading-subtitle">
            Live order book, trade flow and risk metrics in one neon console.
          </span>
        </div>

        <div className="trading-connection">
          <span
            className={`trading-connection-dot trading-connection-${connectionStatus}`}
          />
          <span className="trading-connection-text">
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* شريط التيكر في أعلى الواجهة */}
      <PriceTicker />

      <div className="trading-main-grid">
        {/* العمود الأيسر: دفتر الأوامر */}
        <div className="trading-main-left">
          <OrderBook />
        </div>

        {/* العمود الأيمن: المخاطر + سجل الصفقات */}
        <div className="trading-main-right">
          <RiskMonitor />
          <TradeHistory />
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;
