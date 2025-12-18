// frontend/src/hooks/useTrading.js
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setActivePair,
  setChartData,
  setConnectionStatus,
  setMarketData,
  setOrderBook,
  setRiskMetrics,
  setTimeframe,
  setTradeHistory,
  setPositions,
  setLoading,
  setError,
} from '../store/tradingSlice';

const isClosedPosition = (p) => {
  if (!p || typeof p !== 'object') return false;
  const status = String(p.status ?? '').toLowerCase();
  return Boolean(p.isClosed || p.closed || status === 'closed' || status === 'close');
};

const safeArray = (v) => (Array.isArray(v) ? v : []);
const safeObject = (v) => (v && typeof v === 'object' ? v : {});

export default function useTrading() {
  const dispatch = useDispatch();
  const tradingState = useSelector((state) => safeObject(state?.trading));

  const positions = safeArray(tradingState.positions);
  const openPositions = useMemo(() => positions.filter((p) => !isClosedPosition(p)), [positions]);
  const closedPositions = useMemo(() => positions.filter((p) => isClosedPosition(p)), [positions]);

  const actions = useMemo(
    () => ({
      setActivePair: (pair) => dispatch(setActivePair(pair)),
      setTimeframe: (timeframe) => dispatch(setTimeframe(timeframe)),
      setMarketData: (data) => dispatch(setMarketData(data)),
      setOrderBook: (data) => dispatch(setOrderBook(data)),
      setTradeHistory: (data) => dispatch(setTradeHistory(data)),
      setRiskMetrics: (data) => dispatch(setRiskMetrics(data)),
      setChartData: (data) => dispatch(setChartData(data)),
      setPositions: (data) => dispatch(setPositions(data)),
      setLoading: (loading) => dispatch(setLoading(loading)),
      setError: (error) => dispatch(setError(error)),
      setConnectionStatus: (status) => dispatch(setConnectionStatus(status)),
    }),
    [dispatch]
  );

  // ✅ Apply a snapshot safely (e.g. WS payload or REST payload)
  const applySnapshot = useCallback(
    (snapshot = {}) => {
      if (!snapshot || typeof snapshot !== 'object') return;

      if (snapshot.marketData != null) actions.setMarketData(snapshot.marketData);
      if (snapshot.orderBook != null) actions.setOrderBook(snapshot.orderBook);
      if (snapshot.tradeHistory != null) actions.setTradeHistory(snapshot.tradeHistory);
      if (snapshot.riskMetrics != null) actions.setRiskMetrics(snapshot.riskMetrics);
      if (snapshot.chartData != null) actions.setChartData(snapshot.chartData);
      if (snapshot.positions != null) actions.setPositions(snapshot.positions);

      if (snapshot.activePair != null) actions.setActivePair(snapshot.activePair);
      if (snapshot.timeframe != null) actions.setTimeframe(snapshot.timeframe);

      if (snapshot.isConnected != null) actions.setConnectionStatus(snapshot.isConnected ? 'connected' : 'disconnected');
      if (snapshot.connectionStatus != null) actions.setConnectionStatus(snapshot.connectionStatus);

      if (snapshot.loading != null) actions.setLoading(Boolean(snapshot.loading));
      if (snapshot.error != null) actions.setError(snapshot.error);
    },
    [actions]
  );

  return useMemo(
    () => ({
      ...tradingState,
      marketData: safeObject(tradingState.marketData),
      orderBook: safeObject(tradingState.orderBook),
      tradeHistory: safeArray(tradingState.tradeHistory),
      riskMetrics: safeObject(tradingState.riskMetrics),
      chartData: safeArray(tradingState.chartData),
      positions,

      openPositions,
      closedPositions,

      actions,
      helpers: { applySnapshot },
    }),
    [tradingState, positions, openPositions, closedPositions, actions, applySnapshot]
  );
}
