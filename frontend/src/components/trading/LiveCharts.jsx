/**
 * المخططات الحية المتقدمة - Quantum AI Trader
 * مخططات تداول متطورة مع تحليلات فنية فورية وهوية بصرية احترافية.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

// مكتبة Lightweight Charts
import {
  createChart,
  CrosshairMode,
  PriceScaleMode,
} from 'lightweight-charts';

// تحليلات فنية
import { TechnicalAnalysis } from '../../utils/technicalAnalysis';

// الخدمات
import WebSocketService from '../../services/websocketService';
import ChartDataService from '../../services/chartDataService';

// أكشنات التداول من الـ Redux (سيتم تعريفها في tradingSlice)
import {
  setChartLoading,
  updateChartData,
  setTradingError,
} from '../../store/tradingSlice';

// مكونات التحكم والعرض
import ChartControls from './ChartControls';
import TimeframeSelector from './TimeframeSelector';
import ChartLegend from './ChartLegend';
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

  // ==================== حالة Redux ====================
  const { chartLoading, globalError } = useSelector((state) => {
    const trading = state?.trading || {};
    return {
      chartLoading: trading.chartLoading || false,
      globalError: trading.error || null,
    };
  });

  // ==================== مراجع أساسية ====================
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // سلاسل المؤشرات
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const upperBandSeriesRef = useRef(null);
  const lowerBandSeriesRef = useRef(null);

  const wsServiceRef = useRef(null);
  const chartDataServiceRef = useRef(new ChartDataService());
  const taRef = useRef(new TechnicalAnalysis());

  // ==================== الحالة المحلية ====================
  const [currentSymbol, setCurrentSymbol] = useState(defaultSymbol);
  const [currentInterval, setCurrentInterval] = useState(interval || '1h');
  const [isChartReady, setIsChartReady] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [crosshairData, setCrosshairData] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [indicatorValues, setIndicatorValues] = useState({});
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false,
  });

  // ==================== اشتقاقات ====================
  const latestCandle = useMemo(
    () => (chartData.length ? chartData[chartData.length - 1] : null),
    [chartData],
  );

  const lastPrice = latestCandle ? latestCandle.close : null;

  // ==================== تهيئة المخطط ====================
  const initializeChart = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // تنظيف أي مخطط سابق
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (_) {
        /* ignore */
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

    const isDark = theme === 'dark';

    const chart = createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        background: {
          type: 'solid',
          color: isDark ? '#020617' : '#f8fafc',
        },
        textColor: isDark ? '#e5e7eb' : '#020617',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
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
          color: isDark ? 'rgba(30,64,175,0.35)' : 'rgba(148,163,184,0.35)',
          style: 1,
        },
        horzLines: {
          color: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(226,232,240,0.85)',
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

    // تحديث العرض عند تغيير حجم النافذة
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      chart.applyOptions({ width: newRect.width || chartWidth });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // crosshair
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
      } catch (_) {
        /* ignore */
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
  }, [theme, height]);

  useEffect(() => {
    const cleanup = initializeChart();
    return cleanup;
  }, [initializeChart]);

  // ==================== دوال مساعدة ====================
  const normalizeCandles = useCallback((rawCandles = []) => {
    return rawCandles
      .map((candle) => {
        if (!candle) return null;

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

        const time =
          candle.time ??
          candle.t ??
          candle.timestamp ??
          candle[0] ??
          null;

        const open =
          candle.open ?? candle.o ?? candle[1] ?? candle.close ?? candle.c;
        const high = candle.high ?? candle.h ?? candle[2] ?? open;
        const low = candle.low ?? candle.l ?? candle[3] ?? open;
        const close =
          candle.close ?? candle.c ?? candle[4] ?? candle.price ?? open;
        const volume =
          candle.volume ?? candle.v ?? candle[5] ?? candle.qty ?? 0;

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
      color: c.close >= c.open
        ? 'rgba(34,197,94,0.65)'
        : 'rgba(248,113,113,0.65)',
    }));

    volumeSeriesRef.current.setData(volumeData);

    // ضبط نطاق الوقت تلقائياً
    chartRef.current.timeScale().fitContent();
  }, []);

  const updateIndicatorSeries = useCallback(
    (candles, indicatorState) => {
      if (!chartRef.current || !candlestickSeriesRef.current) return;

      const ta = taRef.current;
      const hasData = candles && candles.length > 0;
      const lastIndex = hasData ? candles.length - 1 : -1;

      let lastSma = null;
      let lastEma = null;
      let lastRsi = null;
      let lastMacd = null;
      let lastUpper = null;
      let lastLower = null;

      // ===================== SMA =====================
      if (indicatorState.sma && hasData) {
        const smaValues = ta.calculateSMA
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
        lastSma = smaValues[lastIndex] ?? null;
      } else if (smaSeriesRef.current) {
        chartRef.current.removeSeries(smaSeriesRef.current);
        smaSeriesRef.current = null;
      }

      // ===================== EMA =====================
      if (indicatorState.ema && hasData) {
        const emaValues = ta.calculateEMA
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
        lastEma = emaValues[lastIndex] ?? null;
      } else if (emaSeriesRef.current) {
        chartRef.current.removeSeries(emaSeriesRef.current);
        emaSeriesRef.current = null;
      }

      // ===================== Bollinger Bands =====================
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
            upperBandSeriesRef.current = chartRef.current.addLineSeries({
              color: 'rgba(148,163,184,0.6)',
              lineWidth: 1,
            });
          }
          if (!lowerBandSeriesRef.current) {
            lowerBandSeriesRef.current = chartRef.current.addLineSeries({
              color: 'rgba(148,163,184,0.6)',
              lineWidth: 1,
            });
          }

          upperBandSeriesRef.current.setData(upperData);
          lowerBandSeriesRef.current.setData(lowerData);

          lastUpper =
            bands.upper[lastIndex] != null ? bands.upper[lastIndex] : null;
          lastLower =
            bands.lower[lastIndex] != null ? bands.lower[lastIndex] : null;
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

      // ===================== RSI =====================
      if (indicatorState.rsi && hasData && ta.calculateRSI) {
        const rsiValues = ta.calculateRSI(candles, 14);
        lastRsi = rsiValues[lastIndex] ?? null;
      }

      // ===================== MACD =====================
      if (indicatorState.macd && hasData && ta.calculateMACD) {
        const macd = ta.calculateMACD(candles);
        if (macd && Array.isArray(macd.histogram)) {
          lastMacd = macd.histogram[lastIndex] ?? null;
        }
      }

      setIndicatorValues({
        sma: lastSma,
        ema: lastEma,
        rsi: lastRsi,
        macd: lastMacd,
        bollinger: {
          upper: lastUpper,
          lower: lastLower,
        },
      });
    },
    [],
  );

  // إعادة حساب المؤشرات عند تغيّر البيانات أو الحالة
  useEffect(() => {
    if (!isChartReady || !chartData.length) return;
    updateIndicatorSeries(chartData, indicators);
  }, [chartData, indicators, isChartReady, updateIndicatorSeries]);

  // ==================== تحميل البيانات الأساسية ====================
  const loadChartData = useCallback(
    async (symbol, timeframe) => {
      if (!symbol) return;

      setLocalError(null);
      dispatch(setTradingError(null));
      dispatch(setChartLoading(true));

      try {
        const data = await chartDataServiceRef.current.getChartData(
          symbol,
          timeframe,
        );

        const normalizedCandles = normalizeCandles(data?.candles || []);

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
        console.error('[LiveCharts] Error loading chart data:', error);
        const msg =
          error?.message ||
          t('charts.errors.loadFailed', 'فشل تحميل بيانات المخطط.');
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

  // تحميل أولي عند جاهزية المخطط أو تغيّر الرمز/الإطار
  useEffect(() => {
    if (!isChartReady || !currentSymbol || !currentInterval) return;
    loadChartData(currentSymbol, currentInterval);
  }, [isChartReady, currentSymbol, currentInterval, loadChartData]);

  // ==================== تحديثات WebSocket ====================
  const handleRealtimeMessage = useCallback(
    (message) => {
      if (!message) return;

      let payload = message;
      if (typeof message === 'string') {
        try {
          payload = JSON.parse(message);
        } catch (_) {
          // تجاهل
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
          // إذا كان التحديث أقدم من آخر شمعة، نتجاهله
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
          console.warn('[LiveCharts] WebSocket error:', error);
        },
      });
    } catch (err) {
      console.warn('[LiveCharts] Failed to initialize WebSocket:', err);
    }

    return () => {
      if (wsServiceRef.current) {
        try {
          wsServiceRef.current.disconnect();
        } catch (_) {
          /* ignore */
        }
        wsServiceRef.current = null;
      }
    };
  }, [currentSymbol, currentInterval, isChartReady, handleRealtimeMessage]);

  // ==================== معالجات التفاعل ====================
  const handleSymbolChange = useCallback((symbol) => {
    setCurrentSymbol(symbol);
  }, []);

  const handleTimeframeChange = useCallback((tf) => {
    setCurrentInterval(tf);
  }, []);

  const handleToggleIndicator = useCallback((key) => {
    setIndicators((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // ==================== العرض ====================
  const showLoadingOverlay = chartLoading && !chartData.length;

  return (
    <div
      className="live-charts flex flex-col gap-2.5"
      style={{ direction: 'rtl' }}
      data-testid="live-charts"
    >
      {/* شريط التحكم العلوي */}
      {showControls && (
        <div className="flex flex-col gap-1.5 mb-1">
          <ChartControls
            symbols={symbols}
            currentSymbol={currentSymbol}
            onSymbolChange={handleSymbolChange}
            theme={theme}
            // يمكن مستقبلاً السماح بتغيير سمة المخطط من هنا
            onThemeChange={() => {}}
          />
          <TimeframeSelector
            currentTimeframe={currentInterval}
            onTimeframeChange={handleTimeframeChange}
          />
        </div>
      )}

      {/* منطقة المخطط */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden shadow-[0_20px_45px_rgba(15,23,42,0.95)]">
        {showLoadingOverlay && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-xs text-slate-300">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
            {t('charts.loading', 'جاري تحميل بيانات المخطط...')}
          </div>
        )}

        {lastPrice != null && (
          <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full bg-slate-950/90 border border-slate-700/80 text-[0.7rem] text-slate-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span className="font-mono">{currentSymbol}</span>
            <span className="text-slate-500">·</span>
            <span className="font-semibold">
              {Number(lastPrice).toFixed(2)} USDT
            </span>
          </div>
        )}

        <div
          ref={chartContainerRef}
          style={{
            width: '100%',
            height,
          }}
        />
      </div>

      {/* وسيلة الإيضاح والمؤشرات */}
      {showIndicators && (
        <div className="flex flex-col gap-2 mt-1.5">
          <ChartLegend
            crosshairData={crosshairData}
            currentSymbol={currentSymbol}
            theme={theme}
          />
          <ChartIndicators
            indicators={indicators}
            onToggle={handleToggleIndicator}
            values={indicatorValues}
          />
        </div>
      )}

      {/* الأخطاء (عند الحاجة) */}
      {(localError || globalError) && (
        <div className="mt-1 text-[0.72rem] text-rose-300 bg-rose-950/70 border border-rose-500/70 rounded-xl px-3 py-2">
          {localError || globalError}
        </div>
      )}
    </div>
  );
};

// نسخة مصغّرة للمخططات يمكن استخدامها في الـ Dashboard
LiveCharts.Compact = (props) => (
  <LiveCharts showControls={false} showIndicators={false} height={300} {...props} />
);

// نسخة للمخططات المصغرة في البطاقات
LiveCharts.MiniView = (props) => (
  <LiveCharts showControls={false} showIndicators={false} height={220} {...props} />
);

export default React.memo(LiveCharts);
