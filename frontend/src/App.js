// frontend/src/App.js

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
            <div className="quantum-theme">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/trading" element={<TradingInterface />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/bot" element={<BotDashboard />} />
                <Route path="/auth" element={<AuthPanel />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </ErrorBoundary>
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
