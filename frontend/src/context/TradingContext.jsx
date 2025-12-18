// frontend/src/context/TradingContext.jsx
import React, { createContext, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectTrading,
  setActivePair,
  setTimeframe,
  resetTradingState,
} from '../store/tradingSlice';

const TradingContext = createContext(null);

export const TradingProvider = ({ children }) => {
  const dispatch = useDispatch();
  const trading = useSelector(selectTrading);

  const api = useMemo(() => ({
    state: trading,

    setPair: (pair) => dispatch(setActivePair(pair)),
    setTimeframe: (tf) => dispatch(setTimeframe(tf)),

    reset: () => dispatch(resetTradingState()),
  }), [dispatch, trading]);

  return (
    <TradingContext.Provider value={api}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTradingContext must be used within TradingProvider');
  return ctx;
};

export default TradingContext;
