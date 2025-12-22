// frontend/src/components/trading/TradingInterface.jsx
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import PriceTicker from './PriceTicker';
import OrderBook from './OrderBook';
import TradeHistory from './TradeHistory';
import RiskMonitor from './RiskMonitor';

import ErrorBoundary from '../common/ErrorBoundary';

import {
  selectConnectionStatus,
  tickerLoading,
  orderBookLoading,
  tradesLoading,
  setConnectionStatus,
} from '../../store/tradingSlice';

import websocketService from '../../services/websocketService';
import './TradingInterface.css';

const safeCall = (fn) => {
  try {
    fn?.();
  } catch {
    // ignore (guarded)
  }
};

const StatusPill = ({ statusLabel, tone }) => {
  const dot =
    tone === 'ok' ? 'rgba(0,255,136,0.95)' : tone === 'warn' ? 'rgba(56,189,248,0.95)' : 'rgba(255,59,92,0.95)';
  const border =
    tone === 'ok' ? 'rgba(0,255,136,0.35)' : tone === 'warn' ? 'rgba(56,189,248,0.35)' : 'rgba(255,59,92,0.35)';
  const bg =
    tone === 'ok'
      ? 'rgba(0,255,136,0.10)'
      : tone === 'warn'
        ? 'rgba(56,189,248,0.10)'
        : 'rgba(255,59,92,0.10)';

  return (
    <div
      className="trading-status-pill"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 999,
        padding: '8px 12px',
        border: `1px solid ${border}`,
        background: bg,
        color: 'rgba(226,232,240,0.95)',
        fontWeight: 900,
        letterSpacing: '0.06em',
        fontSize: 12,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: dot,
          boxShadow: `0 0 0 4px rgba(2,6,23,0.55), 0 0 18px ${dot}`,
        }}
      />
      <span>{statusLabel}</span>
    </div>
  );
};

const PanelHeader = ({ title, subtitle, onRefresh, refreshLabel }) => {
  return (
    <div className="trading-panel-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)', letterSpacing: '0.04em' }}>{title}</div>
        {subtitle ? (
          <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.92)', fontSize: 12, lineHeight: 1.4 }}>{subtitle}</div>
        ) : null}
      </div>

      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="trading-refresh-btn"
          style={{
            borderRadius: 12,
            padding: '8px 10px',
            border: '1px solid rgba(56,189,248,0.35)',
            background: 'rgba(56,189,248,0.10)',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 900,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          aria-label={refreshLabel || 'Refresh'}
        >
          {refreshLabel || 'Refresh'}
        </button>
      ) : null}
    </div>
  );
};

const TradingInterface = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const connectionStatus = useSelector(selectConnectionStatus);

  const statusMeta = useMemo(() => {
    const s = String(connectionStatus || 'disconnected').toLowerCase();
    if (s === 'open' || s === 'connected') return { tone: 'ok', label: t('trading.status.connected', 'CONNECTED') };
    if (s === 'connecting') return { tone: 'warn', label: t('trading.status.connecting', 'CONNECTING') };
    if (s === 'error') return { tone: 'bad', label: t('trading.status.error', 'ERROR') };
    return { tone: 'bad', label: t('trading.status.disconnected', 'DISCONNECTED') };
  }, [connectionStatus, t]);

  useEffect(() => {
    // ✅ اتصال WS (بدون فرض بروتوكول محدد)
    safeCall(() => websocketService.connect());

    // ✅ تحديث الحالة في Redux حسب خدمة WS
    const offStatus = websocketService.on?.('statusChange', (st) => {
      dispatch(setConnectionStatus(st || 'disconnected'));
    });

    // ✅ Trigger loading flags (لا يغيّر منطق التداول، فقط UI state)
    dispatch(tickerLoading());
    dispatch(orderBookLoading());
    dispatch(tradesLoading());

    return () => {
      safeCall(() => offStatus?.());
      // لا نغلق websocketService لأنّه shared على مستوى التطبيق
    };
  }, [dispatch]);

  const refreshTicker = () => dispatch(tickerLoading());
  const refreshOrderBook = () => dispatch(orderBookLoading());
  const refreshTrades = () => dispatch(tradesLoading());

  return (
    <div
      className="trading-shell"
      style={{
        maxWidth: 1200,
        margin: '18px auto',
        padding: '0 14px',
        display: 'grid',
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        className="trading-header"
        style={{
          borderRadius: 18,
          padding: 14,
          border: '1px solid rgba(56,189,248,0.20)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.92), rgba(8,47,73,0.50))',
          boxShadow: '0 18px 46px rgba(2,6,23,0.65)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)', letterSpacing: '0.06em', fontSize: 16 }}>
            {t('trading.title', 'TRADING')}
          </div>
          <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.92)', fontSize: 13, lineHeight: 1.45 }}>
            {t('trading.subtitle', 'Live ticker, order book depth, trade flow and risk snapshot (compile-safe UI).')}
          </div>
        </div>
        <StatusPill statusLabel={statusMeta.label} tone={statusMeta.tone} />
      </div>

      {/* Ticker */}
      <div
        className="trading-panel"
        style={{
          borderRadius: 18,
          padding: 14,
          border: '1px solid rgba(148,163,184,0.16)',
          background: 'rgba(15,23,42,0.55)',
        }}
      >
        <PanelHeader
          title={t('ticker.title', 'Ticker')}
          subtitle={t('ticker.subtitle', 'Latest price snapshot')}
          onRefresh={refreshTicker}
          refreshLabel={t('common.refresh', 'Refresh')}
        />
        <div style={{ marginTop: 12 }}>
          <ErrorBoundary>
            <PriceTicker />
          </ErrorBoundary>
        </div>
      </div>

      {/* Main grid */}
      <div
        className="trading-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.65fr)',
          gap: 12,
        }}
      >
        {/* Order Book */}
        <div
          className="trading-panel"
          style={{
            borderRadius: 18,
            padding: 14,
            border: '1px solid rgba(148,163,184,0.16)',
            background: 'rgba(15,23,42,0.55)',
            minWidth: 0,
          }}
        >
          <PanelHeader
            title={t('orderBook.title', 'Order Book')}
            subtitle={t('orderBook.subtitle', 'Depth & liquidity')}
            onRefresh={refreshOrderBook}
            refreshLabel={t('common.refresh', 'Refresh')}
          />
          <div style={{ marginTop: 12 }}>
            <ErrorBoundary>
              <OrderBook />
            </ErrorBoundary>
          </div>
        </div>

        {/* Side panels */}
        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
          {/* Risk */}
          <div
            className="trading-panel"
            style={{
              borderRadius: 18,
              padding: 14,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.55)',
              minWidth: 0,
            }}
          >
            <PanelHeader
              title={t('risk.title', 'Risk Monitor')}
              subtitle={t('risk.subtitle', 'Exposure & alerts')}
            />
            <div style={{ marginTop: 12 }}>
              <ErrorBoundary>
                <RiskMonitor />
              </ErrorBoundary>
            </div>
          </div>

          {/* Trade History */}
          <div
            className="trading-panel"
            style={{
              borderRadius: 18,
              padding: 14,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.55)',
              minWidth: 0,
            }}
          >
            <PanelHeader
              title={t('trades.title', 'Trade History')}
              subtitle={t('trades.subtitle', 'Flow & executions')}
              onRefresh={refreshTrades}
              refreshLabel={t('common.refresh', 'Refresh')}
            />
            <div style={{ marginTop: 12 }}>
              <ErrorBoundary>
                <TradeHistory />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive hint (no extra CSS required) */}
      <style>{`
        @media (max-width: 980px) {
          .trading-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default TradingInterface;
