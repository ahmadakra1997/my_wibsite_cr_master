// frontend/src/services/chartDataService.js
import axios from 'axios';

let BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const BINANCE_API_URL = 'https://api.binance.com/api/v3';

export const setBackendConfig = (config) => {
  if (config?.backendUrl) {
    BACKEND_API_URL = config.backendUrl.replace(/\/+$/, '');
  }
};

const safeArray = (v) => (Array.isArray(v) ? v : []);

const normalizeCandle = (c) => {
  // يدعم:
  // [t,o,h,l,c,v] أو {timestamp/open/high/low/close/volume} أو {time, open, ...}
  if (Array.isArray(c)) {
    const [t, o, h, l, cl, v] = c;
    return {
      time: Number(t),
      open: Number(o),
      high: Number(h),
      low: Number(l),
      close: Number(cl),
      volume: Number(v ?? 0),
    };
  }

  if (c && typeof c === 'object') {
    const t = c.time ?? c.timestamp ?? c.t;
    return {
      time: Number(t),
      open: Number(c.open ?? c.o),
      high: Number(c.high ?? c.h),
      low: Number(c.low ?? c.l),
      close: Number(c.close ?? c.c),
      volume: Number(c.volume ?? c.v ?? 0),
    };
  }

  return null;
};

export const getChartData = async (symbol, interval = '1m', limit = 100) => {
  // 1) Try backend
  try {
    const url = `${BACKEND_API_URL}/api/trading/chart/${symbol}?interval=${interval}&limit=${limit}`;
    const res = await axios.get(url);
    const data = res?.data?.data ?? res?.data;

    const candles = safeArray(data).map(normalizeCandle).filter(Boolean);
    if (candles.length) return candles;
  } catch (error) {
    // ignore and fallback
  }

  // 2) Fallback to Binance
  try {
    const symbolFormatted = String(symbol || '').replace('/', '');
    const url = `${BINANCE_API_URL}/klines?symbol=${symbolFormatted}&interval=${interval}&limit=${limit}`;
    const response = await axios.get(url);

    const candles = safeArray(response.data).map((k) => normalizeCandle(k)).filter(Boolean);
    return candles;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return [];
  }
};

export default {
  getChartData,
  setBackendConfig,
};
