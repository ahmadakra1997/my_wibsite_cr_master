// frontend/src/hooks/useTrading.js

import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setChartLoading,
  setOrderBookLoading,
  setPositionsLoading,
  updateChartData,
  updateOrderBook,
  updatePositions,
  setMarketData,
  closePosition,
  resetTradingState,
  setTradingError,
} from '../store/tradingSlice';

/**
 * هوك موحد للتعامل مع حالة التداول في Redux
 * لا يستبدل استخدام useSelector/useDispatch في المكونات القائمة،
 * لكنه يوفر واجهة مريحة ومركزية للتعامل مع نفس الحالة.
 */
const useTrading = () => {
  const tradingState = useSelector((state) => state.trading);
  const dispatch = useDispatch();

  // مشتقات بسيطة من الحالة
  const derived = useMemo(() => {
    const openPositions = Array.isArray(tradingState.positions)
      ? tradingState.positions.filter((p) => !p.isClosed && !p.closed)
      : [];

    const closedPositions = Array.isArray(tradingState.positions)
      ? tradingState.positions.filter((p) => p.isClosed || p.closed)
      : [];

    return {
      openPositions,
      closedPositions,
      positionsCount: tradingState.positions?.length || 0,
      hasOpenPositions: openPositions.length > 0,
    };
  }, [tradingState.positions]);

  // أكشنات مغلفة
  const actions = useMemo(
    () => ({
      setChartLoading: (value) => dispatch(setChartLoading(value)),
      setOrderBookLoading: (value) => dispatch(setOrderBookLoading(value)),
      setPositionsLoading: (value) => dispatch(setPositionsLoading(value)),

      updateChartData: (data) => dispatch(updateChartData(data)),
      updateOrderBook: (data) => dispatch(updateOrderBook(data)),
      updatePositions: (positions) => dispatch(updatePositions(positions)),
      setMarketData: (data) => dispatch(setMarketData(data)),

      closePosition: (positionId) => dispatch(closePosition(positionId)),
      resetTradingState: () => dispatch(resetTradingState()),
      setTradingError: (error) => dispatch(setTradingError(error)),
    }),
    [dispatch]
  );

  // دوال مساعدة اختيارية (للإستخدام المستقبلي)
  const helpers = {
    // مثال: تحديث شامل للحالة من payload واحد
    applySnapshot: useCallback(
      (snapshot) => {
        if (!snapshot || typeof snapshot !== 'object') return;

        if (snapshot.chartData) actions.updateChartData(snapshot.chartData);
        if (snapshot.orderBook) actions.updateOrderBook(snapshot.orderBook);
        if (snapshot.positions) actions.updatePositions(snapshot.positions);
        if (snapshot.marketData) actions.setMarketData(snapshot.marketData);
      },
      [actions]
    ),
  };

  return {
    ...tradingState,
    ...derived,
    ...actions,
    ...helpers,
  };
};

export default useTrading;
