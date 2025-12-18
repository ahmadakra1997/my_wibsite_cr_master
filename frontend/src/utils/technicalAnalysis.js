// frontend/src/utils/technicalAnalysis.js
/**
 * TechnicalAnalysis
 * يدعم:
 * - SMA / EMA / RSI / MACD / Bollinger
 * - ATR / Volatility / TrendStrength
 * - Support & Resistance (pivot)
 * - Volume analysis
 * - Trading signals (خفيف وعملي للواجهة)
 */
export class TechnicalAnalysis {
  _isNum(n) {
    return typeof n === 'number' && Number.isFinite(n);
  }

  _extractClosePrices(candles = []) {
    if (!Array.isArray(candles)) return [];
    return candles
      .map((c) => {
        if (this._isNum(c)) return c;
        if (Array.isArray(c)) return this._isNum(c[4]) ? c[4] : this._isNum(c[1]) ? c[1] : null;
        if (c && typeof c === 'object') return this._isNum(c.close) ? c.close : this._isNum(c.c) ? c.c : null;
        return null;
      })
      .filter((v) => this._isNum(v));
  }

  _extractHighs(candles = []) {
    if (!Array.isArray(candles)) return [];
    return candles
      .map((c) => {
        if (Array.isArray(c)) return this._isNum(c[2]) ? c[2] : null;
        if (c && typeof c === 'object') return this._isNum(c.high) ? c.high : this._isNum(c.h) ? c.h : null;
        return null;
      })
      .filter((v) => this._isNum(v));
  }

  _extractLows(candles = []) {
    if (!Array.isArray(candles)) return [];
    return candles
      .map((c) => {
        if (Array.isArray(c)) return this._isNum(c[3]) ? c[3] : null;
        if (c && typeof c === 'object') return this._isNum(c.low) ? c.low : this._isNum(c.l) ? c.l : null;
        return null;
      })
      .filter((v) => this._isNum(v));
  }

  _extractVolumes(candles = []) {
    if (!Array.isArray(candles)) return [];
    return candles
      .map((c) => {
        if (Array.isArray(c)) return this._isNum(c[5]) ? c[5] : 0;
        if (c && typeof c === 'object') return this._isNum(c.volume) ? c.volume : this._isNum(c.v) ? c.v : 0;
        return 0;
      })
      .map((v) => (this._isNum(v) ? v : 0));
  }

  // ===== SMA =====
  calculateSMA(candles, period = 14) {
    const closes = this._extractClosePrices(candles);
    const out = new Array(closes.length).fill(null);
    if (closes.length < period) return out;

    let sum = 0;
    for (let i = 0; i < closes.length; i++) {
      sum += closes[i];
      if (i >= period) sum -= closes[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }

  // ===== EMA =====
  calculateEMA(candlesOrSeries, period = 14) {
    // يقبل candles أو series أرقام
    const series = Array.isArray(candlesOrSeries) && typeof candlesOrSeries[0] === 'number'
      ? candlesOrSeries
      : this._extractClosePrices(candlesOrSeries);

    const out = new Array(series.length).fill(null);
    if (series.length < period) return out;

    const k = 2 / (period + 1);
    let emaPrev = null;

    for (let i = 0; i < series.length; i++) {
      const price = series[i];

      if (i < period - 1) continue;

      if (i === period - 1) {
        const slice = series.slice(0, period);
        emaPrev = slice.reduce((a, b) => a + b, 0) / period;
        out[i] = emaPrev;
      } else {
        emaPrev = price * k + emaPrev * (1 - k);
        out[i] = emaPrev;
      }
    }

    return out;
  }

  // ===== RSI =====
  calculateRSI(candles, period = 14) {
    const closes = this._extractClosePrices(candles);
    const out = new Array(closes.length).fill(null);
    if (closes.length <= period) return out;

    const gains = [];
    const losses = [];
    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }

    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      out[i + 1] = 100 - 100 / (1 + rs);
    }

    return out;
  }

  // ===== MACD =====
  calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const closes = this._extractClosePrices(candles);
    const fast = this.calculateEMA(closes, fastPeriod);
    const slow = this.calculateEMA(closes, slowPeriod);

    const macdLine = closes.map((_, i) => (fast[i] == null || slow[i] == null ? null : fast[i] - slow[i]));
    const compactMacd = macdLine.filter((v) => v != null);

    const signalCompact = this.calculateEMA(compactMacd, signalPeriod);

    const signalLine = new Array(macdLine.length).fill(null);
    let k = 0;
    for (let i = 0; i < macdLine.length; i++) {
      if (macdLine[i] == null) continue;
      signalLine[i] = signalCompact[k++] ?? null;
    }

    const histogram = macdLine.map((v, i) => (v == null || signalLine[i] == null ? null : v - signalLine[i]));
    return { macdLine, signalLine, histogram };
  }

  // ===== Bollinger =====
  calculateBollingerBands(candles, period = 20, multiplier = 2) {
    const closes = this._extractClosePrices(candles);
    const middleBand = this.calculateSMA(candles, period);
    const upperBand = new Array(closes.length).fill(null);
    const lowerBand = new Array(closes.length).fill(null);

    if (closes.length < period) return { upperBand, middleBand, lowerBand };

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = middleBand[i];
      const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
      const std = Math.sqrt(variance);

      upperBand[i] = mean + multiplier * std;
      lowerBand[i] = mean - multiplier * std;
    }

    return { upperBand, middleBand, lowerBand };
  }

  // ===== ATR =====
  calculateATR(candles, period = 14) {
    const highs = this._extractHighs(candles);
    const lows = this._extractLows(candles);
    const closes = this._extractClosePrices(candles);

    const len = Math.min(highs.length, lows.length, closes.length);
    const tr = new Array(len).fill(null);

    for (let i = 0; i < len; i++) {
      if (i === 0) {
        tr[i] = highs[i] - lows[i];
      } else {
        const hl = highs[i] - lows[i];
        const hc = Math.abs(highs[i] - closes[i - 1]);
        const lc = Math.abs(lows[i] - closes[i - 1]);
        tr[i] = Math.max(hl, hc, lc);
      }
    }

    // ATR = SMA(TR)
    const out = new Array(len).fill(null);
    if (len < period) return out;

    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += tr[i] ?? 0;
      if (i >= period) sum -= tr[i - period] ?? 0;
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }

  // ===== Volatility (std of returns %) =====
  calculateVolatility(candles, period = 20) {
    const closes = this._extractClosePrices(candles);
    const out = new Array(closes.length).fill(null);
    if (closes.length < period + 1) return out;

    const returns = closes.map((c, i) => (i === 0 ? null : (c - closes[i - 1]) / closes[i - 1]));
    for (let i = period; i < closes.length; i++) {
      const slice = returns.slice(i - period + 1, i + 1).filter((v) => v != null);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / slice.length;
      out[i] = Math.sqrt(variance) * 100;
    }
    return out;
  }

  // ===== Trend Strength (مبسطة) =====
  calculateTrendStrength(candles, period = 30) {
    const closes = this._extractClosePrices(candles);
    const out = new Array(closes.length).fill(null);
    if (closes.length < period) return out;

    for (let i = period - 1; i < closes.length; i++) {
      const y = closes.slice(i - period + 1, i + 1);
      const x = y.map((_, k) => k + 1);

      const xMean = (period + 1) / 2;
      const yMean = y.reduce((a, b) => a + b, 0) / period;

      let num = 0;
      let den = 0;
      for (let k = 0; k < period; k++) {
        num += (x[k] - xMean) * (y[k] - yMean);
        den += Math.pow(x[k] - xMean, 2);
      }
      const slope = den ? num / den : 0;

      // normalize by price
      out[i] = yMean ? (slope / yMean) * 100 : 0;
    }

    return out;
  }

  // ===== Support/Resistance (pivot) =====
  identifySupportResistance(candles, window = 5, maxLevels = 6) {
    const highs = this._extractHighs(candles);
    const lows = this._extractLows(candles);

    const pivotsHigh = [];
    const pivotsLow = [];

    for (let i = window; i < highs.length - window; i++) {
      const hi = highs[i];
      const lo = lows[i];

      const leftHigh = highs.slice(i - window, i);
      const rightHigh = highs.slice(i + 1, i + window + 1);
      const leftLow = lows.slice(i - window, i);
      const rightLow = lows.slice(i + 1, i + window + 1);

      if (leftHigh.every((v) => hi >= v) && rightHigh.every((v) => hi >= v)) pivotsHigh.push(hi);
      if (leftLow.every((v) => lo <= v) && rightLow.every((v) => lo <= v)) pivotsLow.push(lo);
    }

    const uniqSorted = (arr, desc = false) => {
      const u = Array.from(new Set(arr.map((v) => Number(v.toFixed(4)))));
      u.sort((a, b) => (desc ? b - a : a - b));
      return u.slice(0, maxLevels);
    };

    return {
      resistance: uniqSorted(pivotsHigh, true),
      support: uniqSorted(pivotsLow, false),
    };
  }

  // ===== Volume analysis =====
  analyzeVolume(candles, period = 20) {
    const volumes = this._extractVolumes(candles);
    const out = {
      volumeMA: new Array(volumes.length).fill(null),
      spikes: [],
    };

    if (volumes.length < period) return out;

    let sum = 0;
    for (let i = 0; i < volumes.length; i++) {
      sum += volumes[i];
      if (i >= period) sum -= volumes[i - period];
      if (i >= period - 1) {
        const ma = sum / period;
        out.volumeMA[i] = ma;
        if (ma > 0 && volumes[i] / ma >= 2.5) out.spikes.push({ index: i, value: volumes[i], ratio: volumes[i] / ma });
      }
    }

    return out;
  }

  // ===== Signals (خفيف للواجهة) =====
  generateTradingSignals(candles) {
    const closes = this._extractClosePrices(candles);
    if (closes.length < 30) return [];

    const rsi = this.calculateRSI(candles, 14);
    const macd = this.calculateMACD(candles, 12, 26, 9);
    const bb = this.calculateBollingerBands(candles, 20, 2);

    const i = closes.length - 1;

    const signals = [];

    const rsiNow = rsi[i];
    if (rsiNow != null) {
      if (rsiNow <= 30) signals.push({ type: 'RSI', side: 'buy', strength: 'high', message: 'RSI Oversold' });
      if (rsiNow >= 70) signals.push({ type: 'RSI', side: 'sell', strength: 'high', message: 'RSI Overbought' });
    }

    const macdNow = macd.macdLine[i];
    const sigNow = macd.signalLine[i];
    const macdPrev = macd.macdLine[i - 1];
    const sigPrev = macd.signalLine[i - 1];
    if ([macdNow, sigNow, macdPrev, sigPrev].every((v) => v != null)) {
      const crossUp = macdPrev <= sigPrev && macdNow > sigNow;
      const crossDn = macdPrev >= sigPrev && macdNow < sigNow;
      if (crossUp) signals.push({ type: 'MACD', side: 'buy', strength: 'medium', message: 'MACD Bullish Cross' });
      if (crossDn) signals.push({ type: 'MACD', side: 'sell', strength: 'medium', message: 'MACD Bearish Cross' });
    }

    const upper = bb.upperBand[i];
    const lower = bb.lowerBand[i];
    if (upper != null && closes[i] > upper) signals.push({ type: 'BB', side: 'sell', strength: 'low', message: 'Bollinger Upper Break' });
    if (lower != null && closes[i] < lower) signals.push({ type: 'BB', side: 'buy', strength: 'low', message: 'Bollinger Lower Break' });

    return signals;
  }
}

export default TechnicalAnalysis;
