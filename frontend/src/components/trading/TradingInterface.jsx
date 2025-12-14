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
} from '../../store/tradingSlice';

import OrderBook from './OrderBook';
import TradeHistory from './TradeHistory';
import PriceTicker from './PriceTicker';
import RiskMonitor from './RiskMonitor';

import './TradingInterface.css';

/**
 * TradingInterface
 * واجهة تجمع:
 * - PriceTicker في الأعلى
 * - OrderBook على اليسار
 * - RiskMonitor + TradeHistory على اليمين
 * مع إدارة WebSocket عبر websocketService.
 */
const TradingInterface = () => {
  const dispatch = useDispatch();
  const connectionStatus = useSelector(
    (state) => state.trading.connectionStatus,
  );

  // الاشتراك في قنوات الـ WebSocket
  useEffect(() => {
    // WebSocket status
    const unsubscribeStatus = websocketService.on(
      'statusChange',
      (status) => {
        dispatch(setConnectionStatus(status));
      },
    );

    const unsubscribeError = websocketService.on(
      'error',
      (err) => {
        // eslint-disable-next-line no-console
        console.error(
          '[TradingInterface] WebSocket error:',
          err,
        );
        dispatch(setConnectionStatus('error'));
      },
    );

    // initial loading states
    dispatch(orderBookLoading());
    dispatch(tradesLoading());
    dispatch(tickerLoading());

    // orderBook channel
    const unsubscribeOrderBook =
      websocketService.subscribe(
        'orderBook',
        (payload) => {
          try {
            dispatch(orderBookUpdated(payload));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(
              '[TradingInterface] orderBook handler error:',
              e,
            );
            dispatch(
              orderBookError(
                e.message || 'OrderBook parse error',
              ),
            );
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
          // eslint-disable-next-line no-console
          console.error(
            '[TradingInterface] trades handler error:',
            e,
          );
          dispatch(
            tradesError(
              e.message || 'Trades parse error',
            ),
          );
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
          // eslint-disable-next-line no-console
          console.error(
            '[TradingInterface] ticker handler error:',
            e,
          );
          dispatch(
            tickerError(
              e.message || 'Ticker parse error',
            ),
          );
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
      // نترك الاتصال مفتوحًا لمكوّنات أخرى في حال استخدامها في صفحات أخرى
      // لو أردت إغلاقه فقط عند مغادرة هذه الصفحة، يمكن تفعيل:
      // websocketService.close();
    };
  }, [dispatch]);

  const statusConfig = useMemo(() => {
    const s = (connectionStatus || 'disconnected').toLowerCase();

    if (s === 'open') {
      return {
        label: 'متصل',
        color: '#4ade80',
        bg: 'rgba(22,163,74,0.2)',
      };
    }
    if (s === 'connecting') {
      return {
        label: 'جاري الاتصال',
        color: '#facc15',
        bg: 'rgba(250,204,21,0.18)',
      };
    }
    if (s === 'error') {
      return {
        label: 'خطأ في الاتصال',
        color: '#fecaca',
        bg: 'rgba(248,113,113,0.25)',
      };
    }
    if (s === 'closed') {
      return {
        label: 'مغلق',
        color: '#e5e7eb',
        bg: 'rgba(148,163,184,0.16)',
      };
    }
    return {
      label: 'غير متصل',
      color: '#e5e7eb',
      bg: 'rgba(148,163,184,0.16)',
    };
  }, [connectionStatus]);

  return (
    <section className="trading-interface-root">
      {/* رأس الكوكبيت */}
      <header className="trading-interface-header">
        <div className="trading-header-left">
          <h2 className="trading-title">
            Quantum AI Trading Cockpit
          </h2>
          <p className="trading-subtitle">
            Live order book, trade flow, risk metrics and AI
            overlays in one neon console.
          </p>
        </div>

        <div className="trading-header-right">
          <span className="status-label">
            WS:
            <span
              className="status-chip"
              style={{
                color: statusConfig.color,
                backgroundColor: statusConfig.bg,
              }}
            >
              {statusConfig.label}
            </span>
          </span>
          <span className="status-raw">
            {String(connectionStatus || 'disconnected').toUpperCase()}
          </span>
        </div>
      </header>

      {/* شريط التيكر في أعلى الواجهة */}
      <div className="trading-ticker-row">
        <PriceTicker />
      </div>

      {/* الشبكة الرئيسية */}
      <main className="trading-interface-grid">
        {/* العمود الأيسر: دفتر الأوامر + مخطط العمق / الأحجام (يمكن توسعته لاحقاً) */}
        <section className="trading-column trading-column-left">
          <OrderBook />
        </section>

        {/* العمود الأيمن: المخاطر + سجل الصفقات */}
        <section className="trading-column trading-column-right">
          <div className="trading-secondary-row">
            <RiskMonitor />
          </div>
          <div className="trading-secondary-row">
            <TradeHistory />
          </div>
        </section>
      </main>
    </section>
  );
};

export default TradingInterface;
