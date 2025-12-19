// frontend/src/components/trading/PriceTicker.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import './PriceTicker.css';

const toNumber = (v, fallback = 0) => {
  const n =
    typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const fmt = (v, digits) => toNumber(v, 0).toFixed(digits);

const PriceTicker = () => {
  const ticker = useSelector((state) => state?.trading?.ticker ?? null);
  const isLoading = useSelector((state) => !!state?.trading?.isLoadingTicker);
  const error = useSelector((state) => state?.trading?.tickerError ?? null);

  if (error) {
    return (
      <div className="ticker-root">
        <div className="ticker-state ticker-error">
          Failed to load ticker: <span>{String(error)}</span>
        </div>
      </div>
    );
  }

  if (isLoading && !ticker) {
    return (
      <div className="ticker-root">
        <div className="ticker-state ticker-loading">Loading ticker…</div>
      </div>
    );
  }

  if (!ticker) {
    return (
      <div className="ticker-root">
        <div className="ticker-state ticker-empty">No ticker data yet.</div>
      </div>
    );
  }

  const symbol = ticker?.symbol ?? 'SYMBOL';
  const lastPrice = ticker?.lastPrice ?? 0;
  const highPrice = ticker?.highPrice ?? 0;
  const lowPrice = ticker?.lowPrice ?? 0;
  const volume = ticker?.volume ?? 0;
  const priceChange = toNumber(ticker?.priceChange ?? 0, 0);
  const priceChangePercent = toNumber(ticker?.priceChangePercent ?? 0, 0);

  const isUp = priceChange > 0;
  const isDown = priceChange < 0;

  const changeClass = ['ticker-change', isUp ? 'ticker-up' : '', isDown ? 'ticker-down' : '']
    .filter(Boolean)
    .join(' ');

  const lastPriceClass = ['ticker-last-price', isUp ? 'ticker-up' : '', isDown ? 'ticker-down' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ticker-root" role="region" aria-label="Price ticker">
      <div className="ticker-main">
        <div className="ticker-symbol">{symbol}</div>

        <div className="ticker-price-row">
          <div className={lastPriceClass}>{fmt(lastPrice, 4)}</div>

          <div className={changeClass} aria-label="Price change">
            <span>
              {isUp ? '+' : ''}
              {fmt(priceChange, 4)}
            </span>
            <span style={{ opacity: 0.9 }}>
              (
              {isUp ? '+' : ''}
              {fmt(priceChangePercent, 2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="ticker-stats" aria-label="Ticker stats">
        <div className="ticker-stat">
          <span className="ticker-stat-label">High</span>
          <span className="ticker-stat-value">{fmt(highPrice, 4)}</span>
        </div>
        <div className="ticker-stat">
          <span className="ticker-stat-label">Low</span>
          <span className="ticker-stat-value">{fmt(lowPrice, 4)}</span>
        </div>
        <div className="ticker-stat">
          <span className="ticker-stat-label">Volume</span>
          <span className="ticker-stat-value">{fmt(volume, 3)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
