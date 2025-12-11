// frontend/src/components/dashboard/Dashboard.jsx

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import './Dashboard.css';
import OrderBookAnalyzer from '../../services/OrderBookAnalyzer';


/**
 * Dashboard
 *
 * لوحة أداء عامة تعطي نظرة سريعة على:
 * - حالة السوق الحالية (السعر، التغيير، الحجم)
 * - نشاط التداول (عدد الصفقات، متوسط الحجم...)
 * - سيولة دفتر الأوامر (عمق الـ bids / asks)
 */
const Dashboard = () => {
  const ticker = useSelector((state) => state.trading.ticker);
  const trades = useSelector((state) => state.trading.trades);
  const orderBook = useSelector((state) => state.trading.orderBook);
  const connectionStatus = useSelector(
    (state) => state.trading.connectionStatus,
  );

  const analyzer = useMemo(
    () =>
      new OrderBookAnalyzer({
        maxDepth: 30,
      }),
    [],
  );

  const { priceStats, tradeStats, depthStats } = useMemo(() => {
    // ----- Price / ticker stats -----
    const lastPrice = ticker?.lastPrice ?? null;
    const priceChangePercent = ticker?.priceChangePercent ?? null;
    const volume24h = ticker?.volume ?? null;

    const priceStats = {
      lastPrice:
        lastPrice != null ? Number(lastPrice).toFixed(4) : '—',
      priceChangePercent:
        priceChangePercent != null
          ? Number(priceChangePercent).toFixed(2)
          : null,
      volume24h:
        volume24h != null ? Number(volume24h).toFixed(2) : null,
      isUp: priceChangePercent > 0,
      isDown: priceChangePercent < 0,
    };

    // ----- Trade stats -----
    const count = trades.length;
    let totalQty = 0;
    let buys = 0;
    let sells = 0;

    trades.forEach((t) => {
      const qty = Number(t.quantity ?? 0);
      totalQty += qty;
      const side = (t.side || '').toLowerCase();
      if (side === 'buy') buys += 1;
      if (side === 'sell') sells += 1;
    });

    const avgSize = count ? totalQty / count : 0;

    const tradeStats = {
      count,
      avgSize: avgSize ? avgSize.toFixed(3) : '0.000',
      buys,
      sells,
    };

    // ----- Order book depth stats -----
    let depthStats = {
      bidDepthNear: 0,
      askDepthNear: 0,
      imbalanceLabel: 'neutral',
    };

    if (orderBook?.bids && orderBook?.asks) {
      const analysis = analyzer.analyzeOrderBook(orderBook);
      if (analysis && analysis.depthMetrics) {
        depthStats = {
          bidDepthNear: analysis.depthMetrics.bidDepthNear,
          askDepthNear: analysis.depthMetrics.askDepthNear,
          imbalanceLabel: analysis.imbalanceLabel,
        };
      }
    }

    return { priceStats, tradeStats, depthStats };
  }, [ticker, trades, orderBook, analyzer]);

  const imbalanceClass =
    depthStats.imbalanceLabel === 'strong-bullish' ||
    depthStats.imbalanceLabel === 'bullish'
      ? 'text-up'
      : depthStats.imbalanceLabel === 'strong-bearish' ||
        depthStats.imbalanceLabel === 'bearish'
      ? 'text-down'
      : '';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title-block">
          <h1 className="dashboard-title">Quantum AI Overview</h1>
          <p className="dashboard-subtitle">
            High-level cockpit for your trading system — prices, trades and
            liquidity at a glance.
          </p>
        </div>

        <div className="trading-connection">
          <span
            className={`trading-connection-dot trading-connection-${connectionStatus}`}
          />
          <span className="trading-connection-text">
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Price / Market card */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">Market</div>
              <div className="dashboard-card-sub">
                {ticker?.symbol || 'SYMBOL'}
              </div>
            </div>
          </div>
          <div className="dashboard-card-value">
            {priceStats.lastPrice}
          </div>
          <div className="dashboard-card-sub">
            24h Volume:{' '}
            {priceStats.volume24h
              ? `${priceStats.volume24h}`
              : '—'}
          </div>
          <div className="dashboard-card-footer">
            <span>24h Change</span>
            <span
              className={
                priceStats.isUp
                  ? 'text-up'
                  : priceStats.isDown
                  ? 'text-down'
                  : ''
              }
            >
              {priceStats.priceChangePercent != null
                ? `${priceStats.priceChangePercent}%`
                : '—'}
            </span>
          </div>
        </div>

        {/* Trades card */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">Trades</div>
              <div className="dashboard-card-sub">
                Recent activity snapshot
              </div>
            </div>
          </div>
          <div className="dashboard-card-value">
            {tradeStats.count}
          </div>
          <div className="dashboard-card-sub">
            Avg size: {tradeStats.avgSize}
          </div>
          <div className="dashboard-card-footer">
            <span>Buys / Sells</span>
            <span>
              <span className="text-up">{tradeStats.buys}</span> /{' '}
              <span className="text-down">{tradeStats.sells}</span>
            </span>
          </div>
        </div>

        {/* Liquidity / Depth card */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">
                Order Book Liquidity
              </div>
              <div className="dashboard-card-sub">
                Near-mid depth snapshot
              </div>
            </div>
          </div>
          <div className="dashboard-card-value">
            {depthStats.bidDepthNear || depthStats.askDepthNear
              ? `${depthStats.bidDepthNear.toFixed(
                  2,
                )} / ${depthStats.askDepthNear.toFixed(2)}`
              : '—'}
          </div>
          <div className="dashboard-card-sub">
            Bid / Ask depth (near mid)
          </div>
          <div className="dashboard-card-footer">
            <span>Imbalance</span>
            <span className={imbalanceClass}>
              {depthStats.imbalanceLabel
                .replace('-', ' ')
                .toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
