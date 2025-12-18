// frontend/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import tradingReducer from './tradingSlice';

const store = configureStore({
  reducer: {
    trading: tradingReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
