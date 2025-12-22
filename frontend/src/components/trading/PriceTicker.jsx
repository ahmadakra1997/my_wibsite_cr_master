// frontend/src/components/trading/PriceTicker.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import './PriceTicker.css';

const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const PriceTicker = () => {
  // ✅ Guards + توافق مع أكثر من شكل state
  const ticker = useSelector((state) => state?.trading?.ticker ?? state?.trading?.marketData?.ticker ?? null);

  // ✅ slice الحقيقي يستخدم loading.ticker/errors.ticker :contentReference[oaicite:11]{index=11}
  const isLoading = useSelector((state) => {
    const t = state?.trading;
    return !!(t?.loading?.ticker ?? t?.isLoadingTicker ?? t?.tickerLoading);
  });

  const error = useSelector((state) => {
    const t = state?.trading;
    return t?.errors?.ticker ?? t?.tickerError ?? null;
  });

  if (error) {
    return (
      <div className="price-ticker" style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(255,59,92,0.30)', background: 'rgba(255,59,92,0.08)' }}>
        <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Ticker Error</div>
        <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.95)', fontSize: 12 }}>
          Failed to load ticker: {String(error)}
        </div>
      </div>
    );
  }

  if (isLoading && !ticker) {
    return (
      <div className="price-ticker" style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(56,189,248,0.24)', background: 'rgba(56,189,248,0.08)' }}>
        <div style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>Loading ticker…</div>
      </div>
    );
  }

  if (!ticker) {
    return (
      <div className="price-ticker" style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(148,163,184,0.20)', background: 'rgba(148,163,184,0.06)' }}>
        <div style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>No ticker data yet.</div>
      </div>
    );
  }

  const symbol = ticker?.symbol ?? ticker?.pair ?? 'SYMBOL';
  const lastPrice = toNumber(ticker?.lastPrice ?? ticker?.price ?? 0, 0);
  const highPrice = toNumber(ticker?.highPrice ?? ticker?.high ?? 0, 0);
  const lowPrice = toNumber(ticker?.lowPrice ?? ticker?.low ?? 0, 0);
  const volume = toNumber(ticker?.volume ?? 0, 0);
  const priceChange = toNumber(ticker?.priceChange ?? 0, 0);
  const priceChangePercent = toNumber(ticker?.priceChangePercent ?? 0, 0);

  const isUp = priceChange > 0;
  const isDown = priceChange < 0;

  const changeClass = ['ticker-change', isUp ? 'ticker-up' : '', isDown ? 'ticker-down' : ''].filter(Boolean).join(' ');
  const lastPriceClass = ['ticker-last-price', isUp ? 'ticker-up' : '', isDown ? 'ticker-down' : ''].filter(Boolean).join(' ');

  return (
    <div className="price-ticker" style={{ borderRadius: 18, padding: 12, border: '1px solid rgba(56,189,248,0.18)', background: 'linear-gradient(135deg, rgba(2,6,23,0.92), rgba(8,47,73,0.52))' }}>
      <div className="ticker-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div className="ticker-symbol" style={{ fontWeight: 900, letterSpacing: '0.08em', color: 'rgba(226,232,240,0.95)' }}>
          {String(symbol)}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div className={lastPriceClass} style={{ fontWeight: 900, fontSize: 18, color: 'rgba(226,232,240,0.95)' }}>
            {lastPrice.toFixed(4)}
          </div>

          <div className={changeClass} style={{ fontWeight: 900, color: 'rgba(148,163,184,0.95)' }}>
            {isUp ? '+' : ''}
            {priceChange.toFixed(4)} ({isUp ? '+' : ''}
            {priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="ticker-stats" style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <div className="ticker-stat" style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
          <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>High</div>
          <div style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>{highPrice.toFixed(4)}</div>
        </div>

        <div className="ticker-stat" style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
          <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Low</div>
          <div style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>{lowPrice.toFixed(4)}</div>
        </div>

        <div className="ticker-stat" style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
          <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Volume</div>
          <div style={{ color: 'rgba(226,232,240,0.95)', fontWeight: 900 }}>{volume.toFixed(3)}</div>
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
