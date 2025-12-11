// frontend/src/components/trading/PriceTicker.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import './PriceTicker.css'; // اختياري

const PriceTicker = () => {
  const ticker = useSelector((state) => state.trading.ticker);
  const isLoading = useSelector((state) => state.trading.isLoadingTicker);
  const error = useSelector((state) => state.trading.tickerError);

  if (error) {
    return (
      <div className="ticker-container ticker-error">
        <span>Failed to load ticker: {String(error)}</span>
      </div>
    );
  }

  if (isLoading && !ticker) {
    return (
      <div className="ticker-container ticker-loading">
        <span>Loading ticker…</span>
      </div>
    );
  }

  if (!ticker) {
    return (
      <div className="ticker-container ticker-empty">
        <span>No ticker data yet.</span>
      </div>
    );
  }

  const {
    symbol,
    lastPrice,
    highPrice,
    lowPrice,
    volume,
    priceChange,
    priceChangePercent,
  } = ticker;

  const isUp = priceChange > 0;
  const isDown = priceChange < 0;

  return (
    <div className="ticker-container">
      <div className="ticker-symbol">
        <span>{symbol || 'SYMBOL'}</span>
      </div>

      <div className="ticker-main">
        <span
          className={`ticker-last-price ${
            isUp ? 'ticker-up' : isDown ? 'ticker-down' : ''
          }`}
        >
          {Number(lastPrice ?? 0).toFixed(4)}
        </span>
        <span
          className={`ticker-change ${
            isUp ? 'ticker-up' : isDown ? 'ticker-down' : ''
          }`}
        >
          {isUp ? '+' : ''}
          {Number(priceChange ?? 0).toFixed(4)} (
          {isUp ? '+' : ''}
          {Number(priceChangePercent ?? 0).toFixed(2)}%)
        </span>
      </div>

      <div className="ticker-extra">
        <div className="ticker-extra-item">
          <span className="ticker-label">High</span>
          <span className="ticker-value">
            {Number(highPrice ?? 0).toFixed(4)}
          </span>
        </div>
        <div className="ticker-extra-item">
          <span className="ticker-label">Low</span>
          <span className="ticker-value">
            {Number(lowPrice ?? 0).toFixed(4)}
          </span>
        </div>
        <div className="ticker-extra-item">
          <span className="ticker-label">Volume</span>
          <span className="ticker-value">
            {Number(volume ?? 0).toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
