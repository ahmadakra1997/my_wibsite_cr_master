// frontend/src/App.js

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';

// صفحات رئيسية
import TradingInterface from './components/trading/TradingInterface';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import BotDashboard from './components/bot/BotDashboard';
import AuthPanel from './components/auth/AuthPanel';
import SettingsPage from './components/settings/SettingsPage';

import { ToastProvider } from './components/common/ToastProvider';
import ErrorBoundary from './components/common/ErrorBoundary';

import './index.css';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <ErrorBoundary>
            <Routes>
              {/* صفحة الهبوط */}
              <Route path="/" element={<LandingPage />} />

              {/* واجهة التداول */}
              <Route path="/trading" element={<TradingInterface />} />

              {/* لوحة الـ Overview */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* لوحة إدارة البوتات */}
              <Route path="/bot" element={<BotDashboard />} />

              {/* صفحة الدخول/التسجيل */}
              <Route path="/auth" element={<AuthPanel />} />

              {/* إعدادات المستخدم / الواجهة */}
              <Route path="/settings" element={<SettingsPage />} />

              {/* أي مسار غلط يرجع للـ Landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
