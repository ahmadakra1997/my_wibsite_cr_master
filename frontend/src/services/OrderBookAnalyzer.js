// frontend/src/services/OrderBookAnalyzer.js
/**
 * OrderBookAnalyzer
 * خدمة لتحليل دفتر الأوامر (Order Book) واستخراج مؤشرات متقدمة.
 * يستخدم لتحليل السيولة، اكتشاف الجدران، قياس عدم التوازن، وتوليد إشارات تداول.
 */

class OrderBookAnalyzer {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 50; // العمق الأقصى للتحليل
    this.wallThreshold = options.wallThreshold || 100000; // عتبة اكتشاف جدار السيولة
    this.imbalanceThreshold = options.imbalanceThreshold || 0.7; // عتبة عدم التوازن
    this.minVolumeThreshold = options.minVolumeThreshold || 1000; // الحد الأدنى لحجم التداول
  }

  _toNumber(value, fallback = NaN) {
    if (value == null) return fallback;
    const n = Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * تحليل دفتر الأوامر واستخراج المؤشرات الرئيسية
   * @param {Object} orderBook - بيانات دفتر الأوامر
   * @returns {Object} - نتائج التحليل
   */
  analyze(orderBook) {
    if (!orderBook || (!orderBook.bids && !orderBook.asks)) {
      return this._getEmptyAnalysis();
    }

    const bids = this._normalizeSide(orderBook.bids || orderBook.buy || []);
    const asks = this._normalizeSide(orderBook.asks || orderBook.sell || []);

    if (bids.length === 0 || asks.length === 0) {
      return this._getEmptyAnalysis();
    }

    const bestBid = bids[0];
    const bestAsk = asks[0];

    const spread = bestAsk.price - bestBid.price;
    const spreadPercentage = (spread / bestAsk.price) * 100;

    const bidVolume = this._calculateTotalVolume(bids);
    const askVolume = this._calculateTotalVolume(asks);
    const totalVolume = bidVolume + askVolume;

    const imbalance = bidVolume / totalVolume;

    const bidWalls = this._detectWalls(bids, 'bid');
    const askWalls = this._detectWalls(asks, 'ask');

    const supportLevels = this._findSupportLevels(bids);
    const resistanceLevels = this._findResistanceLevels(asks);

    const midPrice = (bestBid.price + bestAsk.price) / 2;
    const pressure = this._calculatePressure(bids, asks, midPrice);

    const signals = this._generateSignals({
      spreadPercentage,
      imbalance,
      bidWalls,
      askWalls,
      pressure,
      supportLevels,
      resistanceLevels,
      midPrice,
    });

    return {
      timestamp: new Date().toISOString(),
      spread,
      spreadPercentage: Number(spreadPercentage.toFixed(4)),
      midPrice: Number(midPrice.toFixed(4)),
      volume: {
        bid: bidVolume,
        ask: askVolume,
        total: totalVolume,
      },
      imbalance: {
        value: Number(imbalance.toFixed(4)),
        direction: imbalance > 0.5 ? 'bullish' : 'bearish',
        strength: this._getImbalanceStrength(imbalance),
      },
      walls: {
        bids: bidWalls,
        asks: askWalls,
      },
      levels: {
        support: supportLevels,
        resistance: resistanceLevels,
      },
      pressure,
      signals,
      summary: this._generateSummary(signals, spreadPercentage, imbalance, pressure),
    };
  }

  /**
   * تطبيع بيانات جانب من دفتر الأوامر
   * @param {Array} sideData - بيانات الجانب (bids أو asks)
   * @returns {Array} - بيانات مطبعة
   */
  _normalizeSide(sideData) {
    if (!Array.isArray(sideData)) {
      return [];
    }

    return sideData
      .slice(0, this.maxDepth)
      .map((level, index) => {
        const price = this._toNumber(Array.isArray(level) ? level[0] : level.price);
        const quantity = this._toNumber(
          Array.isArray(level)
            ? level[1]
            : level.quantity ?? level.size ?? level.amount,
        );

        return {
          price,
          quantity,
          total: price * quantity,
          index,
        };
      })
      .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.quantity) && level.quantity > 0)
      .sort((a, b) => b.price - a.price);
  }

  /**
   * حساب الحجم الإجمالي
   * @param {Array} levels - مستويات دفتر الأوامر
   * @returns {Number} - الحجم الإجمالي
   */
  _calculateTotalVolume(levels) {
    return levels.reduce((sum, level) => sum + level.total, 0);
  }

  /**
   * اكتشاف جدران السيولة
   * @param {Array} levels - مستويات دفتر الأوامر
   * @param {String} side - جانب الجدار (bid أو ask)
   * @returns {Array} - الجدران المكتشفة
   */
  _detectWalls(levels, side) {
    const walls = [];

    levels.forEach((level) => {
      if (level.total >= this.wallThreshold) {
        walls.push({
          side,
          price: level.price,
          quantity: level.quantity,
          value: level.total,
          strength: this._calculateWallStrength(level.total),
          distance: null, // سيتم حسابها لاحقاً
        });
      }
    });

    return walls.sort((a, b) => b.value - a.value).slice(0, 5);
  }

  /**
   * حساب قوة جدار السيولة
   * @param {Number} wallValue - قيمة الجدار
   * @returns {String} - مستوى القوة
   */
  _calculateWallStrength(wallValue) {
    if (wallValue >= this.wallThreshold * 5) return 'very_strong';
    if (wallValue >= this.wallThreshold * 3) return 'strong';
    if (wallValue >= this.wallThreshold * 2) return 'medium';
    return 'weak';
  }

  /**
   * العثور على مستويات الدعم
   * @param {Array} bids - عروض الشراء
   * @returns {Array} - مستويات الدعم
   */
  _findSupportLevels(bids) {
    const supportLevels = [];
    const avgVolume = this._calculateAverageVolume(bids);

    bids.forEach((bid) => {
      if (bid.total > avgVolume * 1.5) {
        supportLevels.push({
          price: bid.price,
          strength: bid.total / avgVolume,
          volume: bid.total,
        });
      }
    });

    return supportLevels.sort((a, b) => b.strength - a.strength).slice(0, 3);
  }

  /**
   * العثور على مستويات المقاومة
   * @param {Array} asks - عروض البيع
   * @returns {Array} - مستويات المقاومة
   */
  _findResistanceLevels(asks) {
    const resistanceLevels = [];
    const avgVolume = this._calculateAverageVolume(asks);

    asks.forEach((ask) => {
      if (ask.total > avgVolume * 1.5) {
        resistanceLevels.push({
          price: ask.price,
          strength: ask.total / avgVolume,
          volume: ask.total,
        });
      }
    });

    return resistanceLevels.sort((a, b) => b.strength - a.strength).slice(0, 3);
  }

  /**
   * حساب متوسط الحجم
   * @param {Array} levels - مستويات دفتر الأوامر
   * @returns {Number} - متوسط الحجم
   */
  _calculateAverageVolume(levels) {
    if (levels.length === 0) return 0;
    const total = this._calculateTotalVolume(levels);
    return total / levels.length;
  }

  /**
   * حساب ضغط السوق (شراء أو بيع)
   * @param {Array} bids - عروض الشراء
   * @param {Array} asks - عروض البيع
   * @param {Number} midPrice - السعر المتوسط
   * @returns {Object} - بيانات الضغط
   */
  _calculatePressure(bids, asks, midPrice) {
    const nearBids = bids.filter((bid) => (midPrice - bid.price) / midPrice < 0.01);
    const nearAsks = asks.filter((ask) => (ask.price - midPrice) / midPrice < 0.01);

    const bidPressure = this._calculateTotalVolume(nearBids);
    const askPressure = this._calculateTotalVolume(nearAsks);

    const totalPressure = bidPressure + askPressure;
    const pressureRatio = totalPressure > 0 ? bidPressure / totalPressure : 0.5;

    return {
      bid: bidPressure,
      ask: askPressure,
      ratio: Number(pressureRatio.toFixed(4)),
      direction: pressureRatio > 0.55 ? 'buying' : pressureRatio < 0.45 ? 'selling' : 'neutral',
      strength: this._getPressureStrength(pressureRatio),
    };
  }

  /**
   * تحديد قوة الضغط
   * @param {Number} ratio - نسبة الضغط
   * @returns {String} - مستوى القوة
   */
  _getPressureStrength(ratio) {
    const deviation = Math.abs(ratio - 0.5);
    if (deviation > 0.25) return 'very_strong';
    if (deviation > 0.15) return 'strong';
    if (deviation > 0.08) return 'medium';
    return 'weak';
  }

  /**
   * توليد إشارات التداول بناءً على التحليل
   * @param {Object} data - بيانات التحليل
   * @returns {Array} - إشارات التداول
   */
  _generateSignals(data) {
    const signals = [];

    // إشارة عدم التوازن
    if (data.imbalance > this.imbalanceThreshold) {
      signals.push({
        type: 'imbalance',
        direction: 'buy',
        strength: this._getSignalStrength(data.imbalance),
        message: 'عدم توازن قوي في جانب الشراء',
      });
    } else if (data.imbalance < 1 - this.imbalanceThreshold) {
      signals.push({
        type: 'imbalance',
        direction: 'sell',
        strength: this._getSignalStrength(1 - data.imbalance),
        message: 'عدم توازن قوي في جانب البيع',
      });
    }

    // إشارة السبريد
    if (data.spreadPercentage > 0.5) {
      signals.push({
        type: 'spread',
        direction: 'caution',
        strength: 'medium',
        message: 'السبريد مرتفع - احذر من الانزلاق السعري',
      });
    }

    // إشارة الجدران
    if (data.bidWalls.length > 0 && data.askWalls.length > 0) {
      const strongestBidWall = data.bidWalls[0];
      const strongestAskWall = data.askWalls[0];

      if (strongestBidWall.value > strongestAskWall.value * 1.5) {
        signals.push({
          type: 'wall',
          direction: 'buy',
          strength: strongestBidWall.strength,
          message: 'جدار شراء قوي قد يدعم السعر',
          level: strongestBidWall.price,
        });
      } else if (strongestAskWall.value > strongestBidWall.value * 1.5) {
        signals.push({
          type: 'wall',
          direction: 'sell',
          strength: strongestAskWall.strength,
          message: 'جدار بيع قوي قد يقاوم الارتفاع',
          level: strongestAskWall.price,
        });
      }
    }

    // إشارة الضغط
    if (data.pressure.direction === 'buying' && data.pressure.strength !== 'weak') {
      signals.push({
        type: 'pressure',
        direction: 'buy',
        strength: data.pressure.strength,
        message: 'ضغط شراء قوي في المستويات القريبة',
      });
    } else if (data.pressure.direction === 'selling' && data.pressure.strength !== 'weak') {
      signals.push({
        type: 'pressure',
        direction: 'sell',
        strength: data.pressure.strength,
        message: 'ضغط بيع قوي في المستويات القريبة',
      });
    }

    return signals;
  }

  /**
   * تحديد قوة الإشارة
   * @param {Number} value - قيمة المؤشر
   * @returns {String} - مستوى القوة
   */
  _getSignalStrength(value) {
    if (value > 0.9) return 'very_strong';
    if (value > 0.8) return 'strong';
    if (value > 0.7) return 'medium';
    return 'weak';
  }

  /**
   * تحديد قوة عدم التوازن
   * @param {Number} imbalance - نسبة عدم التوازن
   * @returns {String} - مستوى القوة
   */
  _getImbalanceStrength(imbalance) {
    const deviation = Math.abs(imbalance - 0.5);
    if (deviation > 0.3) return 'very_strong';
    if (deviation > 0.2) return 'strong';
    if (deviation > 0.1) return 'medium';
    return 'weak';
  }

  /**
   * توليد ملخص التحليل
   * @param {Array} signals - إشارات التداول
   * @param {Number} spreadPercentage - نسبة السبريد
   * @param {Number} imbalance - عدم التوازن
   * @param {Object} pressure - بيانات الضغط
   * @returns {String} - ملخص التحليل
   */
  _generateSummary(signals, spreadPercentage, imbalance, pressure) {
    const primarySignal = signals.find((s) => s.direction === 'buy' || s.direction === 'sell');

    if (primarySignal) {
      return `${primarySignal.message} (${primarySignal.direction})`;
    }

    if (pressure.direction !== 'neutral') {
      return `ضغط ${pressure.direction === 'buying' ? 'شراء' : 'بيع'} ${pressure.strength}`;
    }

    return `السوق متوازن - سبريد: ${spreadPercentage.toFixed(2)}% - عدم توازن: ${(imbalance * 100).toFixed(1)}%`;
  }

  /**
   * إرجاع تحليل فارغ
   * @returns {Object} - تحليل فارغ
   */
  _getEmptyAnalysis() {
    return {
      timestamp: new Date().toISOString(),
      spread: 0,
      spreadPercentage: 0,
      midPrice: 0,
      volume: { bid: 0, ask: 0, total: 0 },
      imbalance: { value: 0.5, direction: 'neutral', strength: 'weak' },
      walls: { bids: [], asks: [] },
      levels: { support: [], resistance: [] },
      pressure: { bid: 0, ask: 0, ratio: 0.5, direction: 'neutral', strength: 'weak' },
      signals: [],
      summary: 'لا توجد بيانات كافية للتحليل',
    };
  }

  /**
   * تنسيق الأرقام في واجهة العرض
   */
  _formatPrice(value, decimals = 4) {
    if (!Number.isFinite(value)) return '—';
    return Number(value).toFixed(decimals);
  }
}

export default OrderBookAnalyzer;
