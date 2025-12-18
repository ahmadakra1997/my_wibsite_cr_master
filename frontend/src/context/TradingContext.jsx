// frontend/src/context/TradingContext.jsx
import React, { createContext, useContext } from 'react';
import useTrading from '../hooks/useTrading';

const TradingContext = createContext(null);

export const TradingProvider = ({ children }) => {
  const trading = useTrading();
  return <TradingContext.Provider value={trading}>{children}</TradingContext.Provider>;
};

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return context;
};

export default TradingContext;
