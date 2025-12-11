// frontend/src/utils/technicalAnalysis.js

/**
 * كلاس تحليلات فنية بسيط يدعم:
 * - SMA
 * - EMA
 * - RSI
 * - MACD
 * - Bollinger Bands
 *
 * مصمم ليعمل مع بيانات شموع بأشكال مختلفة:
 * - [{ close: 123 }, ...]
 * - [[time, open, high, low, close, volume], ...]
 * - [123, 124, 125, ...] (قيم إغلاق فقط)
 */
export class TechnicalAnalysis {
  // استخراج أسعار الإغلاق من مصفوفة الشموع
  _extractClosePrices(candles = []) {
    if (!Array.isArray(candles)) return [];

    return candles.map((candle) => {
      if (typeof candle === 'number') return candle;

      if (Array.isArray(candle)) {
        // [time, open, high, low, close, volume]
        return typeof candle[4] === 'number'
          ? candle[4]
          : typeof candle[1] === 'number'
          ? candle[1]
          : null;
      }

      if (typeof candle === 'object' && candle !== null) {
        if (typeof candle.close === 'number') return candle.close;
        if (typeof candle.c === 'number') return candle.c;
      }

      return null;
    }).filter((v) => typeof v === 'number' && !Number.isNaN(v));
  }

  // SMA
  calculateSMA(candles, period = 14) {
    const closes = this._extractClosePrices(candles);
    const result = new Array(closes.length).fill(null);

    if (closes.length < period) {
      return result;
    }

    let sum = 0;
    for (let i = 0; i < closes.length; i++) {
      sum += closes[i];
      if (i >= period) {
        sum -= closes[i - period];
      }
      if (i >= period - 1) {
        result[i] = sum / period;
      }
    }

    return result;
  }

  // EMA
  calculateEMA(candles, period = 14) {
    const closes = this._extractClosePrices(candles);
    const result = new Array(closes.length).fill(null);

    if (closes.length < period) {
      return result;
    }

    const k = 2 / (period + 1);
    let emaPrev = null;

    for (let i = 0; i < closes.length; i++) {
      const price = closes[i];

      if (i < period - 1) {
        // لا يكفي بيانات لحساب EMA بعد
        continue;
      }

      if (i === period - 1) {
        // أول EMA = SMA
        const slice = closes.slice(0, period);
        emaPrev = slice.reduce((a, b) => a + b, 0) / period;
        result[i] = emaPrev;
      } else {
        emaPrev = price * k + emaPrev * (1 - k);
        result[i] = emaPrev;
      }
    }

    return result;
  }

  // RSI
  calculateRSI(candles, period = 14) {
    const closes = this._extractClosePrices(candles);
    const result = new Array(closes.length).fill(null);

    if (closes.length <= period) return result;

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

    const rsiStartIndex = period;

    for (let i = rsiStartIndex; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result[i + 1] = rsi;
    }

    return result;
  }

  // MACD (12, 26, 9 بشكل افتراضي)
  calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(candles, fastPeriod);
    const slowEMA = this.calculateEMA(candles, slowPeriod);

    const macdLine = fastEMA.map((val, i) => {
      if (val == null || slowEMA[i] == null) return null;
      return val - slowEMA[i];
    });

    const signalLine = this.calculateEMA(
      macdLine.filter((v) => v !== null),
      signalPeriod
    );

    // موازاة signalLine مع طول macdLine
    const fullSignal = new Array(macdLine.length).fill(null);
    let idx = 0;
    for (let i = 0; i < macdLine.length; i++) {
      if (macdLine[i] == null) continue;
      if (idx < signalLine.length) {
        fullSignal[i] = signalLine[idx++];
      }
    }

    const histogram = macdLine.map((val, i) => {
      if (val == null || fullSignal[i] == null) return null;
      return val - fullSignal[i];
    });

    return {
      macdLine,
      signalLine: fullSignal,
      histogram,
    };
  }

  // Bollinger Bands
  calculateBollingerBands(candles, period = 20, multiplier = 2) {
    const closes = this._extractClosePrices(candles);
    const middleBand = this.calculateSMA(candles, period);
    const upperBand = new Array(closes.length).fill(null);
    const lowerBand = new Array(closes.length).fill(null);

    if (closes.length < period) {
      return {
        upperBand,
        middleBand,
        lowerBand,
      };
    }

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = middleBand[i];
      const variance =
        slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        period;
      const stdDev = Math.sqrt(variance);

      upperBand[i] = mean + multiplier * stdDev;
      lowerBand[i] = mean - multiplier * stdDev;
    }

    return {
      upperBand,
      middleBand,
      lowerBand,
    };
  }
}
