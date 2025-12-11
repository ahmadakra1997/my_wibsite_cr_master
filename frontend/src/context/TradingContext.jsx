// frontend/src/context/TradingContext.jsx
import React, { createContext, useContext } from 'react';
import useTrading from '../hooks/useTrading';

/**
 * TradingContext
 * سياق اختياري لتجميع حالة التداول وإجراءاتها في مكان واحد.
 * حالياً لا تعتمد عليه المكونات الموجودة، لكنه يوفر واجهة نظيفة
 * لو أحببت لاحقاً استبدال useSelector/useDispatch المباشرين.
 */

const TradingContext = createContext(null);

export const TradingProvider = ({ children }) => {
  // استخدام الهوك الموحد الذي يتعامل مع Redux
  const trading = useTrading();

  return (
    <TradingContext.Provider value={trading}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return context;
};

export default TradingContext;
