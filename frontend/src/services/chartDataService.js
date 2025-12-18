// frontend/src/services/chartDataService.js
/**
 * ChartDataService
 * - يجلب بيانات الشموع للرسوم البيانية
 * - يحاول من API، وإذا فشل يرجع Mock
 * - يطبّع (normalize) أشكال البيانات المختلفة
 */
import api from './api';

class ChartDataService {
  constructor(options = {}) {
    this.options = {
      defaultLimit: options.defaultLimit ?? 200,
      mockSeed: options.mockSeed ?? 42,
    };
  }

  async getChartData(symbol, timeframe = '1m', limit = this.options.defaultLimit) {
    try {
      const res = await api.get('/market/candles', { params: { symbol, timeframe, limit } });
      const normalized = this._normalizeResponse(res?.data);
      if (normalized?.candles?.length) return normalized;
      // fallback لو API رجّع شكل غير متوقع
      return this._generateMockData(symbol, timeframe, limit);
    } catch (e) {
      return this._generateMockData(symbol, timeframe, limit);
    }
  }

  _normalizeResponse(payload) {
    // يقبل:
    // { success, data: { candles } } أو { candles } أو candles مباشرة
    const data = payload?.data ?? payload;
    const candlesRaw = data?.candles ?? data?.items ?? data ?? [];
    const candles = this._normalizeCandles(candlesRaw);
    const volume = this._extractVolume(candlesRaw, candles);

    return { candles, volume };
  }

  _normalizeCandles(candlesRaw) {
    const arr = Array.isArray(candlesRaw) ? candlesRaw : [];
    return arr
      .map((c) => {
        // [t,o,h,l,c,v]
        if (Array.isArray(c)) {
          const t = this._toUnix(c[0]);
          const o = Number(c[1]);
          const h = Number(c[2]);
          const l = Number(c[3]);
          const cl = Number(c[4]);
          const v = Number(c[5] ?? 0);
          if ([t, o, h, l, cl].every(Number.isFinite)) return { time: t, open: o, high: h, low: l, close: cl, volume: Number.isFinite(v) ? v : 0 };
          return null;
        }

        // { time/open/high/low/close/volume } أو { t,o,h,l,c,v }
        if (c && typeof c === 'object') {
          const t = this._toUnix(c.time ?? c.t);
          const o = Number(c.open ?? c.o);
          const h = Number(c.high ?? c.h);
          const l = Number(c.low ?? c.l);
          const cl = Number(c.close ?? c.c);
          const v = Number(c.volume ?? c.v ?? 0);
          if ([t, o, h, l, cl].every(Number.isFinite)) return { time: t, open: o, high: h, low: l, close: cl, volume: Number.isFinite(v) ? v : 0 };
          return null;
        }

        return null;
      })
      .filter(Boolean);
  }

  _extractVolume(candlesRaw, normalizedCandles) {
    // لو normalized فيها volume خلاص
    if (normalizedCandles?.length && normalizedCandles.some((c) => typeof c.volume === 'number')) {
      return normalizedCandles.map((c) => ({ time: c.time, value: c.volume ?? 0 }));
    }

    // محاولة من raw لو كان شكل مختلف
    if (Array.isArray(candlesRaw)) {
      return candlesRaw
        .map((c, i) => {
          if (Array.isArray(c)) return { time: this._toUnix(c[0]), value: Number(c[5] ?? 0) || 0 };
          if (c && typeof c === 'object') return { time: this._toUnix(c.time ?? c.t ?? normalizedCandles?.[i]?.time), value: Number(c.volume ?? c.v ?? 0) || 0 };
          return null;
        })
        .filter(Boolean);
    }

    return [];
  }

  _toUnix(t) {
    if (t == null) return NaN;
    if (typeof t === 'number') return t > 10_000_000_000 ? Math.floor(t / 1000) : t; // ms -> s
    const d = new Date(t);
    const n = d.getTime();
    return Number.isFinite(n) ? Math.floor(n / 1000) : NaN;
  }

  _generateMockData(symbol, timeframe, limit) {
    // Mock شموع منطقية (بدون اعتماد على backend)
    const now = Math.floor(Date.now() / 1000);
    const step = this._timeframeToSeconds(timeframe);
    const candles = [];

    let price = 100 + (symbol?.length ?? 0) * 3;
    for (let i = limit - 1; i >= 0; i--) {
      const time = now - i * step;
      const drift = (Math.sin((time / step) * 0.15) + Math.cos((time / step) * 0.07)) * 0.2;
      const shock = (Math.random() - 0.5) * 0.8;

      const open = price;
      price = Math.max(1, price + drift + shock);
      const close = price;

      const high = Math.max(open, close) + Math.random() * 0.6;
      const low = Math.min(open, close) - Math.random() * 0.6;

      const volume = Math.max(0, 50 + Math.random() * 200);

      candles.push({ time, open, high, low, close, volume });
    }

    const volumeSeries = candles.map((c) => ({ time: c.time, value: c.volume }));
    return { candles, volume: volumeSeries, mock: true };
  }

  _timeframeToSeconds(tf) {
    const m = String(tf || '1m').trim().match(/^(\d+)\s*([smhdw])$/i);
    if (!m) return 60;
    const n = Number(m[1]);
    const u = m[2].toLowerCase();
    const mul = u === 's' ? 1 : u === 'm' ? 60 : u === 'h' ? 3600 : u === 'd' ? 86400 : 604800;
    return Math.max(1, n * mul);
  }
}

export default new ChartDataService();
export { ChartDataService };
