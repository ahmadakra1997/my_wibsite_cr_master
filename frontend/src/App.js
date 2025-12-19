// frontend/src/App.js
import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import store from './store/store';

import LandingPage from './components/landing/LandingPage';
import TradingInterface from './components/trading/TradingInterface';
import Dashboard from './components/dashboard/Dashboard';
import BotDashboard from './components/bot/BotDashboard';
import AuthPanel from './components/auth/AuthPanel';
import SettingsPage from './components/settings/SettingsPage';
import Profile from './pages/Profile';

import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';

import ErrorBoundary from './components/common/ErrorBoundary';
import MaintenanceMode from './components/common/MaintenanceMode';
import { ToastProvider } from './components/common/ToastProvider';

import AuthProvider, { useAuth } from './context/AuthContext';
import BotProvider from './context/BotContext';

import './App.css';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const auth = useAuth?.();

  const isLoading = !!auth?.loading;
  const isAuthenticated = !!auth?.isAuthenticated;

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 18, color: 'rgba(226,232,240,0.92)' }}>
        <div style={{ fontWeight: 800, color: '#00a3ff' }}>Loading…</div>
        <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.9)' }}>Preparing your secure session.</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location?.pathname || '/' }} />;
  }

  return children;
}

function AppContent() {
  // Guarded selector: لو ما في app slice لن يكسر
  const maintenanceMode = useSelector((state) => !!(state && state.app && state.app.maintenanceMode));

  if (maintenanceMode) return <MaintenanceMode />;

  return (
    <BrowserRouter>
      <AppHeader />

      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPanel />} />

          <Route
            path="/trading"
            element={
              <ProtectedRoute>
                <TradingInterface />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bot/dashboard"
            element={
              <ProtectedRoute>
                <BotDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>

      <AppFooter />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AuthProvider>
          <BotProvider>
            <AppContent />
          </BotProvider>
        </AuthProvider>
      </ToastProvider>
    </Provider>
  );
}
