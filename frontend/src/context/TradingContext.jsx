// frontend/src/context/TradingContext.jsx
import React, { createContext, useContext, useMemo } from 'react';
import useTrading from '../hooks/useTrading';

const TradingContext = createContext(null);

export const TradingProvider = ({ children }) => {
  // نستخدم الهوك الحالي (Redux-based) ونمرره عبر Context
  const trading = useTrading();

  // useMemo لتثبيت المرجع وتقليل re-render غير الضروري
  const value = useMemo(() => trading, [trading]);

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

export const useTradingContext = () => {
  const ctx = useContext(TradingContext);
  if (!ctx) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return ctx;
};

export default TradingContext;
