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
  const ticker = useSelector((state) => state?.trading?.ticker);
  const tradesRaw = useSelector((state) => state?.trading?.trades);
  const orderBook = useSelector((state) => state?.trading?.orderBook);
  const connectionStatus = useSelector((state) => state?.trading?.connectionStatus);

  const trades = Array.isArray(tradesRaw) ? tradesRaw : [];

  const analyzer = useMemo(() => new OrderBookAnalyzer({ maxDepth: 30 }), []);

  const { priceStats, tradeStats, depthStats } = useMemo(() => {
    // ----- Price / ticker stats -----
    const lastPrice = ticker?.lastPrice ?? null;
    const priceChangePercent = ticker?.priceChangePercent ?? null;
    const volume24h = ticker?.volume ?? null;

    const priceStats = {
      lastPrice: lastPrice != null ? Number(lastPrice).toFixed(4) : '—',
      priceChangePercent: priceChangePercent != null ? Number(priceChangePercent).toFixed(2) : null,
      volume24h: volume24h != null ? Number(volume24h).toFixed(2) : null,
      isUp: Number(priceChangePercent) > 0,
      isDown: Number(priceChangePercent) < 0,
    };

    // ----- Trade stats -----
    const count = trades.length;
    let totalQty = 0;
    let buys = 0;
    let sells = 0;

    trades.forEach((t) => {
      const qty = Number(t?.quantity ?? 0);
      totalQty += qty;

      const side = String(t?.side || '').toLowerCase();
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

  // نفس المنطق القديم للون بحسب الانحياز في دفتر الأوامر
  const imbalanceClass =
    depthStats.imbalanceLabel === 'strong-bullish' || depthStats.imbalanceLabel === 'bullish'
      ? 'text-up'
      : depthStats.imbalanceLabel === 'strong-bearish' || depthStats.imbalanceLabel === 'bearish'
        ? 'text-down'
        : '';

  // تحويل حالة الاتصال لعرض بصري فقط
  const connectionMeta = useMemo(() => {
    const status = String(connectionStatus || '').toLowerCase();

    if (status === 'open') return { label: 'LIVE', tone: 'live' };
    if (status === 'connecting') return { label: 'CONNECTING', tone: 'connecting' };
    if (status === 'error') return { label: 'ERROR', tone: 'error' };
    if (status === 'closed' || status === 'disconnected') return { label: 'DISCONNECTED', tone: 'offline' };

    return { label: String(connectionStatus || 'UNKNOWN').toUpperCase(), tone: 'offline' };
  }, [connectionStatus]);

  const hasDepth =
    typeof depthStats.bidDepthNear === 'number' &&
    typeof depthStats.askDepthNear === 'number' &&
    (depthStats.bidDepthNear !== 0 || depthStats.askDepthNear !== 0);

  const imbalanceText = String(depthStats.imbalanceLabel || 'neutral').replace(/-/g, ' ').toUpperCase();

  return (
    <div className="qa-dashboard-overview" style={{ padding: 14, maxWidth: 1100, margin: '0 auto' }}>
      <header
        className="qa-dashboard-header"
        style={{
          borderRadius: 18,
          padding: 14,
          border: '1px solid rgba(56,189,248,0.18)',
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95), rgba(8,47,73,0.70))',
          boxShadow: '0 20px 60px rgba(2,6,23,0.72)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, fontSize: 18 }}>Quantum AI Overview</div>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', lineHeight: 1.7, fontSize: 13 }}>
            High-level cockpit — prices, trades and liquidity at a glance.
          </div>
        </div>

        <div
          className={`qa-conn-pill tone-${connectionMeta.tone}`}
          style={{
            borderRadius: 999,
            padding: '6px 10px',
            border: '1px solid rgba(0,255,136,0.25)',
            background: 'rgba(0,255,136,0.08)',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 950,
            letterSpacing: '0.08em',
            fontSize: 12,
          }}
          aria-label="connection-status"
          title={String(connectionStatus || 'unknown')}
        >
          {connectionMeta.label}
        </div>
      </header>

      <section
        className="qa-dashboard-grid"
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {/* بطاقة السوق / الأسعار */}
        <div
          className="qa-card qa-card-market"
          style={{
            borderRadius: 18,
            padding: 14,
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, marginBottom: 6 }}>Market</div>
          <div style={{ color: 'rgba(148,163,184,0.95)', fontWeight: 900, marginBottom: 10 }}>
            {ticker?.symbol || 'SYMBOL'}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>Last Price</span>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>{priceStats.lastPrice}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>24h Volume</span>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                {priceStats.volume24h ? priceStats.volume24h : '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>24h Change</span>
              <span
                style={{
                  color:
                    priceStats.priceChangePercent == null
                      ? 'rgba(226,232,240,0.96)'
                      : priceStats.isUp
                        ? 'rgba(0,255,136,0.95)'
                        : 'rgba(255,59,92,0.95)',
                  fontWeight: 950,
                }}
              >
                {priceStats.priceChangePercent != null ? `${priceStats.priceChangePercent}%` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* بطاقة نشاط التداول */}
        <div
          className="qa-card qa-card-trades"
          style={{
            borderRadius: 18,
            padding: 14,
            border: '1px solid rgba(56,189,248,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, marginBottom: 6 }}>Trades</div>
          <div style={{ color: 'rgba(148,163,184,0.95)', marginBottom: 10 }}>Recent activity snapshot</div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>Count</span>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>{tradeStats.count}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>Avg size</span>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>{tradeStats.avgSize}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>Buys / Sells</span>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                {tradeStats.buys} / {tradeStats.sells}
              </span>
            </div>
          </div>
        </div>

        {/* بطاقة سيولة دفتر الأوامر */}
        <div
          className="qa-card qa-card-liquidity"
          style={{
            borderRadius: 18,
            padding: 14,
            border: '1px solid rgba(0,255,136,0.14)',
            background: 'rgba(15,23,42,0.55)',
            boxShadow: '0 18px 46px rgba(2,6,23,0.45)',
          }}
        >
          <div style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950, marginBottom: 6 }}>
            Order Book Liquidity
          </div>
          <div style={{ color: 'rgba(148,163,184,0.95)', marginBottom: 10 }}>Near-mid depth snapshot</div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>Bid / Ask depth</span>
              <span style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                {hasDepth
                  ? `${Number(depthStats.bidDepthNear).toFixed(2)} / ${Number(depthStats.askDepthNear).toFixed(2)}`
                  : '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: 'rgba(148,163,184,0.95)' }}>Imbalance</span>
              <span className={imbalanceClass} style={{ color: 'rgba(226,232,240,0.96)', fontWeight: 950 }}>
                {imbalanceText}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
