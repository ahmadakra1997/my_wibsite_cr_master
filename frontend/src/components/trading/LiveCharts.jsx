// frontend/src/components/trading/LiveCharts.jsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

// Lightweight Charts
import {
  createChart,
  CrosshairMode,
  PriceScaleMode,
} from 'lightweight-charts';

// Technical analysis helpers
import { TechnicalAnalysis } from '../../utils/technicalAnalysis';

// Services
import WebSocketService from '../../services/websocketService';
import ChartDataService from '../../services/chartDataService';

// Redux actions
import {
  setChartLoading,
  updateChartData,
  setTradingError,
} from '../../store/tradingSlice';

// UI pieces
import ChartControls from './ChartControls';
import ChartIndicators from './ChartIndicators';

const LiveCharts = ({
  defaultSymbol = 'BTCUSDT',
  symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
  interval = '1h',
  height = 420,
  showControls = true,
  showIndicators = true,
  theme = 'dark',
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // ==================== Redux state ====================
  const { chartLoading, globalError } = useSelector((state) => {
    const trading = state?.trading || {};
    return {
      chartLoading: trading.chartLoading || false,
      globalError: trading.error || null,
    };
  });

  // ==================== Refs ====================
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Indicator series
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const upperBandSeriesRef = useRef(null);
  const lowerBandSeriesRef = useRef(null);

  const wsServiceRef = useRef(null);
  const chartDataServiceRef = useRef(new ChartDataService());
  const taRef = useRef(new TechnicalAnalysis());

  // ==================== Local state ====================
  const [currentSymbol, setCurrentSymbol] = useState(defaultSymbol);
  const [currentInterval, setCurrentInterval] = useState(interval || '1h');
  const [chartTheme, setChartTheme] = useState(theme || 'dark');

  const [isChartReady, setIsChartReady] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [crosshairData, setCrosshairData] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Indicator toggles + raw indicator series data
  const [indicatorValues, setIndicatorValues] = useState({});
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false,
  });

  // ==================== Derived ====================
  const latestCandle = useMemo(
    () => (chartData.length ? chartData[chartData.length - 1] : null),
    [chartData],
  );
  const lastPrice = latestCandle ? latestCandle.close : null;

  // ==================== Chart init ====================
  const initializeChart = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container) return undefined;

    // Clean any existing chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // ignore
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      smaSeriesRef.current = null;
      emaSeriesRef.current = null;
      upperBandSeriesRef.current = null;
      lowerBandSeriesRef.current = null;
    }

    const rect = container.getBoundingClientRect();
    const chartWidth = rect.width || 600;
    const chartHeight = height || 420;
    const isDark = chartTheme === 'dark';

    const chart = createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        background: {
          type: 'solid',
          color: isDark ? '#020617' : '#f8fafc',
        },
        textColor: isDark ? '#e5e7eb' : '#020617',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      },
      rightPriceScale: {
        mode: PriceScaleMode.Normal,
        borderColor: isDark ? 'rgba(30,64,175,0.9)' : '#cbd5f5',
      },
      timeScale: {
        borderColor: isDark ? 'rgba(30,64,175,0.9)' : '#cbd5f5',
        rightOffset: 8,
        barSpacing: 6,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: false,
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        vertLines: {
          color: isDark
            ? 'rgba(30,64,175,0.35)'
            : 'rgba(148,163,184,0.35)',
          style: 1,
        },
        horzLines: {
          color: isDark
            ? 'rgba(15,23,42,0.85)'
            : 'rgba(226,232,240,0.85)',
          style: 1,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize handling
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      chart.applyOptions({
        width: newRect.width || chartWidth,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Crosshair
    const handleCrosshairMove = (param) => {
      if (!param || !param.time || !param.seriesPrices) {
        setCrosshairData(null);
        return;
      }
      const price = param.seriesPrices.get(candleSeries);
      if (!price) {
        setCrosshairData(null);
        return;
      }
      setCrosshairData({
        time: param.time,
        price,
      });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    setIsChartReady(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      try {
        chart.remove();
      } catch {
        // ignore
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      smaSeriesRef.current = null;
      emaSeriesRef.current = null;
      upperBandSeriesRef.current = null;
      lowerBandSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, [chartTheme, height]);

  useEffect(() => {
    const cleanup = initializeChart();
    return cleanup;
  }, [initializeChart]);

  // ==================== Helpers ====================
  const normalizeCandles = useCallback((rawCandles = []) => {
    return rawCandles
      .map((candle) => {
        if (!candle) return null;

        // Array format: [time, open, high, low, close, volume]
        if (Array.isArray(candle)) {
          const [time, open, high, low, close, volume] = candle;
          return {
            time,
            open,
            high,
            low,
            close,
            volume: volume ?? 0,
          };
        }

        // Object formats
        const time =
          candle.time ??
          candle.t ??
          candle.timestamp ??
          candle[0] ??
          null;

        const open =
          candle.open ??
          candle.o ??
          candle[1] ??
          candle.close ??
          candle.c;

        const high =
          candle.high ?? candle.h ?? candle[2] ?? open;

        const low =
          candle.low ?? candle.l ?? candle[3] ?? open;

        const close =
          candle.close ??
          candle.c ??
          candle[4] ??
          candle.price ??
          open;

        const volume =
          candle.volume ??
          candle.v ??
          candle[5] ??
          candle.qty ??
          0;

        if (
          !Number.isFinite(open) ||
          !Number.isFinite(high) ||
          !Number.isFinite(low) ||
          !Number.isFinite(close)
        ) {
          return null;
        }

        return {
          time,
          open,
          high,
          low,
          close,
          volume: Number(volume) || 0,
        };
      })
      .filter(Boolean);
  }, []);

  const applyCandlesToChart = useCallback((candles) => {
    if (
      !chartRef.current ||
      !candlestickSeriesRef.current ||
      !volumeSeriesRef.current
    ) {
      return;
    }

    const dataForSeries = candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candlestickSeriesRef.current.setData(dataForSeries);

    const volumeData = candles.map((c) => ({
      time: c.time,
      value: c.volume || 0,
      color:
        c.close >= c.open
          ? 'rgba(34,197,94,0.65)'
          : 'rgba(248,113,113,0.65)',
    }));
    volumeSeriesRef.current.setData(volumeData);

    // Fit time scale
    chartRef.current.timeScale().fitContent();
  }, []);

  const updateIndicatorSeries = useCallback(
    (candles, indicatorState) => {
      if (!chartRef.current || !candlestickSeriesRef.current) return;

      const ta = taRef.current;
      const hasData = candles && candles.length > 0;

      let smaValues = null;
      let emaValues = null;
      let rsiValues = null;
      let macdData = null;
      let bollingerData = null;

      // ========== SMA ==========
      if (indicatorState.sma && hasData) {
        smaValues = ta.calculateSMA
          ? ta.calculateSMA(candles, 20)
          : new Array(candles.length).fill(null);

        const seriesData = [];
        smaValues.forEach((val, idx) => {
          if (val != null) {
            seriesData.push({
              time: candles[idx].time,
              value: val,
            });
          }
        });

        if (!smaSeriesRef.current) {
          smaSeriesRef.current = chartRef.current.addLineSeries({
            color: '#00E5F5',
            lineWidth: 2,
          });
        }
        smaSeriesRef.current.setData(seriesData);
      } else if (smaSeriesRef.current) {
        chartRef.current.removeSeries(smaSeriesRef.current);
        smaSeriesRef.current = null;
      }

      // ========== EMA ==========
      if (indicatorState.ema && hasData) {
        emaValues = ta.calculateEMA
          ? ta.calculateEMA(candles, 50)
          : new Array(candles.length).fill(null);

        const seriesData = [];
        emaValues.forEach((val, idx) => {
          if (val != null) {
            seriesData.push({
              time: candles[idx].time,
              value: val,
            });
          }
        });

        if (!emaSeriesRef.current) {
          emaSeriesRef.current = chartRef.current.addLineSeries({
            color: '#22c55e',
            lineWidth: 1.8,
          });
        }
        emaSeriesRef.current.setData(seriesData);
      } else if (emaSeriesRef.current) {
        chartRef.current.removeSeries(emaSeriesRef.current);
        emaSeriesRef.current = null;
      }

      // ========== Bollinger Bands ==========
      if (indicatorState.bollinger && hasData) {
        const bands = ta.calculateBollingerBands
          ? ta.calculateBollingerBands(candles, 20, 2)
          : null;

        if (bands && bands.upper && bands.lower) {
          const upperData = [];
          const lowerData = [];

          bands.upper.forEach((val, idx) => {
            if (val != null) {
              upperData.push({
                time: candles[idx].time,
                value: val,
              });
            }
          });

          bands.lower.forEach((val, idx) => {
            if (val != null) {
              lowerData.push({
                time: candles[idx].time,
                value: val,
              });
            }
          });

          if (!upperBandSeriesRef.current) {
            upperBandSeriesRef.current =
              chartRef.current.addLineSeries({
                color: 'rgba(148,163,184,0.6)',
                lineWidth: 1,
              });
          }
          if (!lowerBandSeriesRef.current) {
            lowerBandSeriesRef.current =
              chartRef.current.addLineSeries({
                color: 'rgba(148,163,184,0.6)',
                lineWidth: 1,
              });
          }

          upperBandSeriesRef.current.setData(upperData);
          lowerBandSeriesRef.current.setData(lowerData);

          bollingerData = {
            upperBand: bands.upper,
            middleBand: bands.middle || [],
            lowerBand: bands.lower,
          };
        }
      } else {
        if (upperBandSeriesRef.current) {
          chartRef.current.removeSeries(upperBandSeriesRef.current);
          upperBandSeriesRef.current = null;
        }
        if (lowerBandSeriesRef.current) {
          chartRef.current.removeSeries(lowerBandSeriesRef.current);
          lowerBandSeriesRef.current = null;
        }
      }

      // ========== RSI ==========
      if (indicatorState.rsi && hasData && ta.calculateRSI) {
        rsiValues = ta.calculateRSI(candles, 14);
      }

      // ========== MACD ==========
      if (indicatorState.macd && hasData && ta.calculateMACD) {
        macdData = ta.calculateMACD(candles);
      }

      setIndicatorValues({
        sma: smaValues,
        ema: emaValues,
        rsi: rsiValues,
        macd: macdData,
        bollinger: bollingerData,
      });
    },
    [],
  );

  // Recalculate indicators whenever data/toggles change
  useEffect(() => {
    if (!isChartReady || !chartData.length) return;
    updateIndicatorSeries(chartData, indicators);
  }, [chartData, indicators, isChartReady, updateIndicatorSeries]);

  // ==================== Data loading ====================
  const loadChartData = useCallback(
    async (symbol, timeframe) => {
      if (!symbol) return;

      setLocalError(null);
      dispatch(setTradingError(null));
      dispatch(setChartLoading(true));

      try {
        const data =
          await chartDataServiceRef.current.getChartData(
            symbol,
            timeframe,
          );

        const normalizedCandles = normalizeCandles(
          data?.candles || [],
        );

        setChartData(normalizedCandles);
        applyCandlesToChart(normalizedCandles);
        updateIndicatorSeries(normalizedCandles, indicators);

        dispatch(
          updateChartData({
            symbol,
            timeframe,
            candles: normalizedCandles,
            volume: normalizedCandles.map((c) => c.volume),
            metadata: data?.metadata || {},
          }),
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          '[LiveCharts] Error loading chart data:',
          error,
        );
        const msg =
          error?.message ||
          t(
            'charts.errors.loadFailed',
            'فشل تحميل بيانات المخطط.',
          );
        setLocalError(msg);
        dispatch(setTradingError(msg));
      } finally {
        dispatch(setChartLoading(false));
      }
    },
    [
      dispatch,
      t,
      normalizeCandles,
      applyCandlesToChart,
      updateIndicatorSeries,
      indicators,
    ],
  );

  // initial + whenever symbol/interval changes
  useEffect(() => {
    if (!isChartReady || !currentSymbol || !currentInterval) return;
    loadChartData(currentSymbol, currentInterval);
  }, [isChartReady, currentSymbol, currentInterval, loadChartData]);

  // ==================== Realtime via WebSocket ====================
  const handleRealtimeMessage = useCallback(
    (message) => {
      if (!message) return;

      let payload = message;
      if (typeof message === 'string') {
        try {
          payload = JSON.parse(message);
        } catch {
          // ignore
        }
      }

      const candle =
        payload.candle ||
        payload.data ||
        payload.kline ||
        payload.k ||
        payload;

      const normalized = normalizeCandles([candle]);
      if (!normalized.length) return;

      setChartData((prev) => {
        if (!prev.length) {
          const next = normalized;
          applyCandlesToChart(next);
          updateIndicatorSeries(next, indicators);
          return next;
        }

        const last = prev[prev.length - 1];
        const incoming = normalized[0];
        let updated;

        if (incoming.time === last.time) {
          updated = [...prev.slice(0, -1), incoming];
        } else if (incoming.time > last.time) {
          updated = [...prev, incoming];
        } else {
          // ignore out-of-date update
          return prev;
        }

        applyCandlesToChart(updated);
        updateIndicatorSeries(updated, indicators);
        return updated;
      });
    },
    [normalizeCandles, applyCandlesToChart, updateIndicatorSeries, indicators],
  );

  useEffect(() => {
    if (!isChartReady) return;

    const ws = new WebSocketService();
    wsServiceRef.current = ws;

    try {
      ws.connect({
        channel: 'candles',
        symbol: currentSymbol,
        timeframe: currentInterval,
        onMessage: handleRealtimeMessage,
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.warn('[LiveCharts] WebSocket error:', error);
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[LiveCharts] Failed to initialize WebSocket:',
        err,
      );
    }

    return () => {
      if (wsServiceRef.current) {
        try {
          wsServiceRef.current.disconnect();
        } catch {
          // ignore
        }
        wsServiceRef.current = null;
      }
    };
  }, [currentSymbol, currentInterval, isChartReady, handleRealtimeMessage]);

  // ==================== Interaction handlers ====================
  const handleSymbolChange = useCallback((symbol) => {
    setCurrentSymbol(symbol);
  }, []);

  const handleTimeframeChange = useCallback((tf) => {
    setCurrentInterval(tf);
  }, []);

  const handleThemeChange = useCallback((nextTheme) => {
    setChartTheme(nextTheme === 'light' ? 'light' : 'dark');
  }, []);

  // ==================== Render ====================
  const showLoadingOverlay = chartLoading && !chartData.length;

  const containerStyle = {
    borderRadius: 22,
    padding: 12,
    border: '1px solid rgba(148,163,184,0.32)',
    background:
      'radial-gradient(circle at top, rgba(34,211,238,0.12), rgba(15,23,42,0.98))',
    boxShadow: '0 18px 40px rgba(15,23,42,0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };

  const chartShellStyle = {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    background: chartTheme === 'dark' ? '#020617' : '#f8fafc',
  };

  const headerRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <section className="live-charts-wrapper" style={containerStyle}>
      {/* Top controls */}
      {showControls && (
        <div className="live-charts-header" style={headerRowStyle}>
          <ChartControls
            symbols={symbols}
            currentSymbol={currentSymbol}
            onSymbolChange={handleSymbolChange}
            theme={chartTheme}
            onThemeChange={handleThemeChange}
          />

          <div
            className="live-charts-timeframes"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {timeframes.map((tf) => {
              const active = tf === currentInterval;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleTimeframeChange(tf)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: active
                      ? '1px solid rgba(56,189,248,0.95)'
                      : '1px solid rgba(30,64,175,0.7)',
                    background: active
                      ? 'linear-gradient(135deg, rgba(34,211,238,0.95), rgba(56,189,248,0.95))'
                      : 'rgba(15,23,42,0.98)',
                    fontSize: 11,
                    fontWeight: 500,
                    color: active ? '#020617' : '#e5e7eb',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {tf}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart area */}
      <div className="live-charts-main" style={chartShellStyle}>
        <div
          ref={chartContainerRef}
          className="live-charts-canvas"
          style={{
            width: '100%',
            height,
          }}
        />

        {showLoadingOverlay && (
          <div
            className="live-charts-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: '#e5e7eb',
              background: 'rgba(15,23,42,0.75)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {t(
              'charts.loading',
              'جاري تحميل بيانات المخطط...',
            )}
          </div>
        )}
      </div>

      {/* Status row */}
      {lastPrice != null && (
        <div
          className="live-charts-status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#e5e7eb',
            marginTop: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.9,
              }}
            >
              {currentSymbol}
            </span>
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
              }}
            >
              {Number(lastPrice).toFixed(2)} USDT
            </span>
          </div>

          {crosshairData && (
            <div
              style={{
                fontSize: 11,
                opacity: 0.85,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t('charts.crosshair', 'عند المؤشر')} ·{' '}
              {Number(crosshairData.price).toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Indicators panel */}
      {showIndicators && (
        <div
          className="live-charts-indicators"
          style={{ marginTop: 6 }}
        >
          <ChartIndicators
            indicators={indicators}
            onIndicatorsChange={setIndicators}
            indicatorData={indicatorValues}
          />
        </div>
      )}

      {/* Error banner */}
      {(localError || globalError) && (
        <div
          className="live-charts-error"
          style={{
            marginTop: 8,
            padding: '8px 10px',
            borderRadius: 10,
            fontSize: 11,
            color: '#fecaca',
            background:
              'linear-gradient(135deg, rgba(127,29,29,0.9), rgba(153,27,27,0.95))',
            border: '1px solid rgba(248,113,113,0.85)',
          }}
        >
          {localError || globalError}
        </div>
      )}
    </section>
  );
};

// Compact variants for dashboard/cards
LiveCharts.Compact = (props) => (
  <LiveCharts
    {...props}
    showControls={false}
    showIndicators={false}
    height={260}
  />
);

LiveCharts.MiniView = (props) => (
  <LiveCharts
    {...props}
    showControls={false}
    showIndicators={false}
    height={180}
  />
);

export default React.memo(LiveCharts);
