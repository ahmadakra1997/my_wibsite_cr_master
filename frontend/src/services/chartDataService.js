// frontend/src/services/chartDataService.js
import api from './api';

/**
 * ChartDataService
 * خدمة مسؤولة عن جلب بيانات الشموع من الـ backend
 * مع إمكانية توليد بيانات تجريبية (fallback) في حال فشل الاتصال.
 */
class ChartDataService {
  constructor(options = {}) {
    // ملاحظة: غالبًا ما يكون baseURL في api هو '/api/v1'
    // لذلك المسار النهائي يكون '/api/v1/trading/chart'
    this.basePath = options.basePath || '/trading';
    this.maxCandles = options.maxCandles || 300;
  }

  /**
   * جلب بيانات الشارت لرمز معين وإطار زمني
   * تتوقع LiveCharts كائن فيه:
   * { symbol, timeframe, candles, volume, metadata }
   */
  async getChartData(symbol, timeframe = '1h', options = {}) {
    const safeSymbol = symbol || 'BTCUSDT';
    const limit = options.limit || this.maxCandles;

    try {
      const query = `?symbol=${encodeURIComponent(
        safeSymbol,
      )}&timeframe=${encodeURIComponent(timeframe)}&limit=${encodeURIComponent(
        limit,
      )}`;

      const response = await api.get(`${this.basePath}/chart${query}`);

      // axios يعيد data داخل response.data افتراضيًا
      const raw = response?.data ?? response;

      // في حال عاد الـ backend بالشكل:
      // { status: 'ok', result: {...} }
      const payload =
        raw && raw.result && !raw.candles && !Array.isArray(raw)
          ? raw.result
          : raw;

      return this._normalizeResponse(payload, {
        symbol: safeSymbol,
        timeframe,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        '[ChartDataService] فشل جلب بيانات الشارت من الـ API، سيتم استخدام بيانات تجريبية:',
        error,
      );

      return this._generateMockData(safeSymbol, timeframe);
    }
  }

  _normalizeResponse(raw, { symbol, timeframe }) {
    if (raw && raw.candles && Array.isArray(raw.candles)) {
      return {
        symbol,
        timeframe,
        candles: this._normalizeCandles(raw.candles),
        volume: Array.isArray(raw.volume)
          ? raw.volume
          : this._extractVolume(raw.candles),
        metadata: raw.metadata || {},
      };
    }

    if (Array.isArray(raw)) {
      return {
        symbol,
        timeframe,
        candles: this._normalizeCandles(raw),
        volume: this._extractVolume(raw),
        metadata: {},
      };
    }

    return this._generateMockData(symbol, timeframe);
  }

  _normalizeCandles(candles) {
    return candles.map((candle) => {
      // صيغ مختلفة محتملة:
      // [time, open, high, low, close, volume]
      if (Array.isArray(candle)) {
        const [time, open, high, low, close, volume] = candle;
        return {
          time: this._toUnix(time),
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
          volume: Number(volume ?? 0),
        };
      }

      // كائن
      if (typeof candle === 'object' && candle !== null) {
        const {
          time,
          t,
          open,
          o,
          high,
          h,
          low,
          l,
          close,
          c,
          volume,
          v,
        } = candle;

        return {
          time: this._toUnix(time ?? t),
          open: Number(open ?? o ?? 0),
          high: Number(high ?? h ?? 0),
          low: Number(low ?? l ?? 0),
          close: Number(close ?? c ?? 0),
          volume: Number(volume ?? v ?? 0),
        };
      }

      // قيمة إغلاق فقط
      return {
        time: Math.floor(Date.now() / 1000),
        open: Number(candle),
        high: Number(candle),
        low: Number(candle),
        close: Number(candle),
        volume: 0,
      };
    });
  }

  _extractVolume(candles) {
    return this._normalizeCandles(candles).map((c) => c.volume ?? 0);
  }

  _toUnix(value) {
    if (!value) return Math.floor(Date.now() / 1000);

    if (typeof value === 'number') {
      // لو كان أقل من 10^12 نفترض أنه بالثواني
      return value > 1e12
        ? Math.floor(value / 1000)
        : Math.floor(value);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return Math.floor(Date.now() / 1000);
    }

    return Math.floor(date.getTime() / 1000);
  }

  /**
   * بيانات تجريبية في حال عدم توفر الـ backend
   */
  _generateMockData(symbol, timeframe) {
    const now = Math.floor(Date.now() / 1000);
    const candles = [];
    let basePrice = 30000;

    for (let i = this.maxCandles - 1; i >= 0; i -= 1) {
      const step =
        timeframe === '1m'
          ? 60
          : timeframe === '5m'
          ? 300
          : timeframe === '1h'
          ? 3600
          : 86400;

      const time = now - i * step;
      const drift = (Math.random() - 0.5) * 80;

      basePrice = Math.max(100, basePrice + drift);

      const open = basePrice + (Math.random() - 0.5) * 30;
      const close = basePrice + (Math.random() - 0.5) * 30;
      const high = Math.max(open, close) + Math.random() * 25;
      const low = Math.min(open, close) - Math.random() * 25;
      const volume = Math.random() * 15;

      candles.push({
        time,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Number(volume.toFixed(3)),
      });
    }

    return {
      symbol,
      timeframe,
      candles,
      volume: candles.map((c) => c.volume),
      metadata: {
        mock: true,
      },
    };
  }
}

export default ChartDataService;
