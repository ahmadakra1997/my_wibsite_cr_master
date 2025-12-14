// frontend/src/components/trading/PriceTicker.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import './PriceTicker.css';

const PriceTicker = () => {
  const ticker = useSelector((state) => state.trading.ticker);
  const isLoading = useSelector(
    (state) => state.trading.isLoadingTicker
  );
  const error = useSelector(
    (state) => state.trading.tickerError
  );

  // حالات الخطأ / التحميل / لا توجد بيانات
  if (error) {
    return (
      <div className="ticker-container ticker-error">
        Failed to load ticker: {String(error)}
      </div>
    );
  }

  if (isLoading && !ticker) {
    return (
      <div className="ticker-container ticker-loading">
        Loading ticker…
      </div>
    );
  }

  if (!ticker) {
    return (
      <div className="ticker-container ticker-empty">
        No ticker data yet.
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

  const changeClass = [
    'ticker-change',
    isUp ? 'ticker-up' : '',
    isDown ? 'ticker-down' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const lastPriceClass = [
    'ticker-last-price',
    isUp ? 'ticker-up' : '',
    isDown ? 'ticker-down' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ticker-container">
      {/* الرمز */}
      <div className="ticker-symbol">
        <span>{symbol || 'SYMBOL'}</span>
      </div>

      {/* السعر + التغيير */}
      <div className="ticker-main">
        <div className={lastPriceClass}>
          {Number(lastPrice ?? 0).toFixed(4)}
        </div>

        <div className={changeClass}>
          {isUp ? '+' : ''}
          {Number(priceChange ?? 0).toFixed(4)} (
          {isUp ? '+' : ''}
          {Number(priceChangePercent ?? 0).toFixed(2)}%)
        </div>
      </div>

      {/* high / low / volume */}
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
