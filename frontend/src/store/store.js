// frontend/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import tradingReducer from './tradingSlice';

// Factory مفيد للاختبارات / SSR (وما يكسر الاستخدام الحالي)
export const createAppStore = (preloadedState) =>
  configureStore({
    reducer: {
      trading: tradingReducer,
    },
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });

const store = createAppStore();
export default store;
