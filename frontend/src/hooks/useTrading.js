// frontend/src/hooks/useTrading.js
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import websocketService from '../services/websocketService';
import {
  selectTrading,
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

  setActivePair,
  setTimeframe,
} from '../store/tradingSlice';

export default function useTrading(options = {}) {
  const dispatch = useDispatch();
  const trading = useSelector(selectTrading);
  const mountedRef = useRef(false);

  const connect = useCallback(() => {
    // status listeners
    const unsubStatus = websocketService.on('statusChange', (status) => {
      dispatch(setConnectionStatus(status));
    });

    const unsubErr = websocketService.on('error', () => {
      dispatch(setConnectionStatus('error'));
    });

    // loading flags
    dispatch(orderBookLoading());
    dispatch(tradesLoading());
    dispatch(tickerLoading());

    // channel subscriptions
    const unsubOrderBook = websocketService.subscribe('orderBook', (payload) => {
      try {
        dispatch(orderBookUpdated(payload));
      } catch (e) {
        dispatch(orderBookError(e?.message || 'OrderBook parse error'));
      }
    });

    const unsubTrades = websocketService.subscribe('trades', (payload) => {
      try {
        dispatch(tradesUpdated(payload));
      } catch (e) {
        dispatch(tradesError(e?.message || 'Trades parse error'));
      }
    });

    const unsubTicker = websocketService.subscribe('ticker', (payload) => {
      try {
        dispatch(tickerUpdated(payload));
      } catch (e) {
        dispatch(tickerError(e?.message || 'Ticker parse error'));
      }
    });

    websocketService.connect();

    return () => {
      unsubStatus();
      unsubErr();
      unsubOrderBook();
      unsubTrades();
      unsubTicker();
    };
  }, [dispatch]);

  useEffect(() => {
    if (options.autoConnect === false) return;
    mountedRef.current = true;
    const cleanup = connect();
    return () => {
      mountedRef.current = false;
      if (options.keepAlive !== true) {
        // إذا تبغى الاتصال يبقى مفتوح لمكوّنات ثانية: حط keepAlive: true
        websocketService.close();
      }
      cleanup?.();
    };
  }, [connect, options.autoConnect, options.keepAlive]);

  const setPair = useCallback((pair) => dispatch(setActivePair(pair)), [dispatch]);
  const setTf = useCallback((tf) => dispatch(setTimeframe(tf)), [dispatch]);

  return useMemo(() => ({
    ...trading,
    setPair,
    setTimeframe: setTf,
    reconnect: () => websocketService.connect(),
    disconnect: () => websocketService.close(),
  }), [trading, setPair, setTf]);
}
