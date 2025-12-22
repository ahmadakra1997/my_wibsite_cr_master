// frontend/src/components/trading/LiveCharts.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import ChartControls from './ChartControls';
import ChartIndicators from './ChartIndicators';

import ChartDataService from '../../services/chartDataService';
import TechnicalAnalysis from '../../utils/technicalAnalysis';
import websocketService from '../../services/websocketService';

import { setChartData, setError, clearError } from '../../store/tradingSlice';

const toNumber = (v, fallback = null) => {
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeCandle = (c) => {
  // expected: { time, open, high, low, close, volume }
  if (!c || typeof c !== 'object') return null;
  const time = toNumber(c.time ?? c.t ?? null, null);
  const open = toNumber(c.open ?? c.o ?? null, null);
  const high = toNumber(c.high ?? c.h ?? null, null);
  const low = toNumber(c.low ?? c.l ?? null, null);
  const close = toNumber(c.close ?? c.c ?? null, null);
  const volume = toNumber(c.volume ?? c.v ?? 0, 0);

  if (!time || open == null || high == null || low == null || close == null) return null;

  return {
    time: time > 1e12 ? Math.floor(time / 1000) : Math.floor(time),
    open,
    high,
    low,
    close,
    volume,
  };
};

const LiveCharts = ({
  symbol,
  timeframe,
  height = 420,
  showControls = true,
  showIndicators = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const globalError = useSelector((s) => s?.trading?.errors?.general ?? null);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const dataServiceRef = useRef(null);
  const taRef = useRef(null);

  const [currentSymbol, setCurrentSymbol] = useState(symbol || 'BTCUSDT');
  const [currentInterval, setCurrentInterval] = useState(timeframe || '1h');

  const [chartTheme, setChartTheme] = useState('dark');

  const [isChartReady, setIsChartReady] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [lastPrice, setLastPrice] = useState(null);
  const [crosshairData, setCrosshairData] = useState(null);

  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false,
  });
  const [indicatorValues, setIndicatorValues] = useState(null);

  const timeframes = useMemo(() => ['1m', '5m', '15m', '1h', '4h', '1d'], []);

  const availableSymbols = useMemo(
    () => ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'],
    [],
  );

  const initializeServices = useCallback(() => {
    if (!dataServiceRef.current) dataServiceRef.current = new ChartDataService();
    if (!taRef.current) taRef.current = new TechnicalAnalysis();
  }, []);

  const chartOptions = useMemo(() => {
    const isDark = chartTheme === 'dark';
    return {
      layout: {
        background: { color: isDark ? '#0b1220' : '#f8fafc' },
        textColor: isDark ? '#e5e7eb' : '#0f172a',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(148,163,184,0.10)' : 'rgba(15,23,42,0.08)' },
        horzLines: { color: isDark ? 'rgba(148,163,184,0.10)' : 'rgba(15,23,42,0.08)' },
      },
      rightPriceScale: { borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.18)' },
      timeScale: { borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.18)' },
      crosshair: { mode: 1 },
      height,
      handleScroll: true,
      handleScale: true,
    };
  }, [chartTheme, height]);

  const destroyChart = useCallback(() => {
    try {
      chartRef.current?.remove?.();
    } catch {
      // ignore
    }
    chartRef.current = null;
    candleSeriesRef.current = null;
    volumeSeriesRef.current = null;
    setIsChartReady(false);
  }, []);

  const createNewChart = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    destroyChart();

    const chart = createChart(container, chartOptions);
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00ff88',
      downColor: '#ff3b5c',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff3b5c',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3b5c',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    chart.subscribeCrosshairMove((param) => {
      try {
        if (!param || !param.time || !param.seriesPrices) {
          setCrosshairData(null);
          return;
        }
        const raw = param.seriesPrices.get(candleSeries);
        const price =
          typeof raw === 'number'
            ? raw
            : raw && typeof raw === 'object'
              ? raw.close ?? raw.value ?? null
              : null;

        if (price == null) {
          setCrosshairData(null);
          return;
        }
        setCrosshairData({ time: param.time, price });
      } catch {
        setCrosshairData(null);
      }
    });

    setIsChartReady(true);
  }, [chartOptions, destroyChart]);

  const computeIndicators = useCallback((candles) => {
    try {
      const enabled = indicators || {};
      const closes = Array.isArray(candles) ? candles.map((c) => toNumber(c?.close, null)).filter((x) => x != null) : [];
      if (!closes.length) {
        setIndicatorValues(null);
        return;
      }

      const ta = taRef.current;
      if (!ta) {
        setIndicatorValues(null);
        return;
      }

      const next = {};
      if (enabled.sma) next.sma = ta.sma?.(closes, 14);
      if (enabled.ema) next.ema = ta.ema?.(closes, 14);
      if (enabled.rsi) next.rsi = ta.rsi?.(closes, 14);
      if (enabled.macd) next.macd = ta.macd?.(closes, 12, 26, 9);
      if (enabled.bollinger) next.bollinger = ta.bollingerBands?.(closes, 20, 2);

      setIndicatorValues(next);
    } catch {
      setIndicatorValues(null);
    }
  }, [indicators]);

  const applyDataToChart = useCallback((normalizedCandles) => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;

    if (!candleSeries || !volumeSeries) return;
    if (!Array.isArray(normalizedCandles) || normalizedCandles.length === 0) return;

    candleSeries.setData(
      normalizedCandles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    volumeSeries.setData(
      normalizedCandles.map((c) => ({
        time: c.time,
        value: c.volume ?? 0,
        color: (c.close ?? 0) >= (c.open ?? 0) ? 'rgba(0,255,136,0.35)' : 'rgba(255,59,92,0.35)',
      })),
    );

    const last = normalizedCandles[normalizedCandles.length - 1];
    if (last?.close != null) setLastPrice(last.close);

    computeIndicators(normalizedCandles);
  }, [computeIndicators]);

  const fetchAndRender = useCallback(async () => {
    initializeServices();
    dispatch(clearError());

    setLocalError(null);
    setLocalLoading(true);

    try {
      const svc = dataServiceRef.current;
      const res = await svc.getChartData(currentSymbol, currentInterval);

      const rawCandles = Array.isArray(res?.candles) ? res.candles : [];
      const normalized = rawCandles.map(normalizeCandle).filter(Boolean);

      dispatch(setChartData(res ?? null)); // لا يغير منطق التداول، فقط تخزين snapshot للشارت

      if (!isChartReady) createNewChart();
      applyDataToChart(normalized);
    } catch (e) {
      const msg = e?.message || 'Chart load failed';
      setLocalError(String(msg));
      dispatch(setError({ key: 'general', error: String(msg) }));
    } finally {
      setLocalLoading(false);
    }
  }, [
    applyDataToChart,
    createNewChart,
    currentInterval,
    currentSymbol,
    dispatch,
    initializeServices,
    isChartReady,
  ]);

  useEffect(() => {
    // init chart + load once
    createNewChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartTheme, height]);

  useEffect(() => {
    setCurrentSymbol(symbol || 'BTCUSDT');
  }, [symbol]);

  useEffect(() => {
    setCurrentInterval(timeframe || '1h');
  }, [timeframe]);

  useEffect(() => {
    fetchAndRender();
  }, [fetchAndRender, currentSymbol, currentInterval]);

  useEffect(() => {
    // realtime updates (safe subscribe)
    websocketService.connect?.();

    const unsubscribe = websocketService.subscribe?.('chart', (payload) => {
      try {
        // expected payload: { symbol, timeframe, candle }
        if (!payload) return;
        const pSymbol = payload.symbol || payload.s;
        const pTf = payload.timeframe || payload.tf;

        // لا نطبق بيانات من رمز/فريم مختلف
        if (pSymbol && String(pSymbol).toUpperCase() !== String(currentSymbol).toUpperCase()) return;
        if (pTf && String(pTf) !== String(currentInterval)) return;

        const candle = normalizeCandle(payload.candle || payload.data || payload);
        if (!candle || !candleSeriesRef.current) return;

        candleSeriesRef.current.update({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: candle.time,
            value: candle.volume ?? 0,
            color: (candle.close ?? 0) >= (candle.open ?? 0) ? 'rgba(0,255,136,0.35)' : 'rgba(255,59,92,0.35)',
          });
        }

        setLastPrice(candle.close);
      } catch {
        // ignore realtime parsing errors
      }
    });

    // ask backend (optional, safe)
    try {
      websocketService.send?.({
        action: 'subscribe',
        channel: 'chart',
        symbol: currentSymbol,
        timeframe: currentInterval,
      });
    } catch {
      // ignore
    }

    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [currentInterval, currentSymbol]);

  const handleSymbolChange = (sym) => {
    if (!sym) return;
    setCurrentSymbol(String(sym).toUpperCase());
  };

  const handleTimeframeChange = (tf) => {
    if (!tf) return;
    setCurrentInterval(String(tf));
  };

  const handleThemeChange = (th) => {
    setChartTheme(th === 'light' ? 'light' : 'dark');
  };

  const showLoadingOverlay = localLoading || !isChartReady;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {showControls ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <ChartControls
            symbols={availableSymbols}
            currentSymbol={currentSymbol}
            onSymbolChange={handleSymbolChange}
            theme={chartTheme}
            onThemeChange={handleThemeChange}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12, fontWeight: 900 }}>
              {t('charts.timeframe', 'الإطار الزمني')}
            </div>
            {timeframes.map((tf) => {
              const active = tf === currentInterval;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleTimeframeChange(tf)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: active ? '1px solid rgba(56,189,248,0.95)' : '1px solid rgba(30,64,175,0.7)',
                    background: active
                      ? 'linear-gradient(135deg, rgba(34,211,238,0.95), rgba(56,189,248,0.95))'
                      : 'rgba(15,23,42,0.98)',
                    fontSize: 11,
                    fontWeight: 900,
                    color: active ? '#020617' : 'rgba(226,232,240,0.95)',
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                  aria-label={`Timeframe ${tf}`}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          border: '1px solid rgba(148,163,184,0.18)',
          background: 'rgba(2,6,23,0.55)',
          overflow: 'hidden',
        }}
      >
        {showLoadingOverlay ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(2,6,23,0.65)',
              zIndex: 2,
              color: 'rgba(226,232,240,0.95)',
              fontWeight: 900,
              letterSpacing: '0.06em',
            }}
          >
            {t('charts.loading', 'جاري تحميل بيانات المخطط...')}
          </div>
        ) : null}

        <div ref={chartContainerRef} style={{ width: '100%', height }} />
      </div>

      {/* Status row */}
      {lastPrice != null ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'rgba(148,163,184,0.92)',
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>
            {currentSymbol} • {Number(lastPrice).toFixed(2)} USDT
          </div>
          {crosshairData ? (
            <div style={{ fontWeight: 900 }}>
              {t('charts.crosshair', 'عند المؤشر')} • {Number(crosshairData.price).toFixed(2)}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Indicators panel */}
      {showIndicators ? (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.55)',
            padding: 12,
          }}
        >
          <ChartIndicators indicators={indicators} onIndicatorsChange={setIndicators} indicatorData={indicatorValues} />
        </div>
      ) : null}

      {/* Error banner */}
      {localError || globalError ? (
        <div
          style={{
            borderRadius: 14,
            border: '1px solid rgba(255,59,92,0.35)',
            background: 'rgba(255,59,92,0.10)',
            color: 'rgba(226,232,240,0.95)',
            padding: '10px 12px',
            fontWeight: 900,
          }}
        >
          {String(localError || globalError)}
        </div>
      ) : null}
    </div>
  );
};

// Compact variants for dashboard/cards (keep compatibility)
LiveCharts.Compact = (props) => <LiveCharts {...props} height={260} showControls={false} showIndicators={false} />;
LiveCharts.MiniView = (props) => <LiveCharts {...props} height={180} showControls={false} showIndicators={false} />;

export default React.memo(LiveCharts);
