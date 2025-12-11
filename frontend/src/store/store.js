// frontend/src/store/store.js

import { configureStore } from '@reduxjs/toolkit';
import tradingReducer from './tradingSlice';

// لو عندك Slices أخرى (auth, ui, settings...) أضفها هنا
// import authReducer from './authSlice';
// import uiReducer from './uiSlice';

const store = configureStore({
  reducer: {
    trading: tradingReducer,
    // auth: authReducer,
    // ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // مفيد لو عندك بيانات غير قابلة للتسلسل 100%
    }),
});

export default store;
