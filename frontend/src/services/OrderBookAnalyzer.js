// frontend/src/services/orderBookAnalyzer.js

/**
 * OrderBookAnalyzer
 * خدمة لتحليل دفتر الطلبات وإنتاج إحصائيات مفيدة لواجهة التداول فقط (Frontend).
 *
 * متوقَّع أن تستقبل بيانات بالصورة:
 * {
 *   symbol: 'BTCUSDT',
 *   bids: [[price, quantity], ...] أو [{ price, quantity }, ...],
 *   asks: [[price, quantity], ...] أو [{ price, quantity }, ...]
 * }
 */
class OrderBookAnalyzer {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 50;
    this.minVolumeThreshold = options.minVolumeThreshold || 0;
  }

  /**
   * الدالة الرئيسية لتحليل دفتر الأوامر
   * @param {Object} orderBookData
   * @returns {Object|null}
   */
  analyzeOrderBook(orderBookData) {
    if (!orderBookData || !orderBookData.bids || !orderBookData.asks) {
      return null;
    }

    const bids = this._normalizeSide(orderBookData.bids, true).slice(
      0,
      this.maxDepth,
    );
    const asks = this._normalizeSide(orderBookData.asks, false).slice(
      0,
      this.maxDepth,
    );

    if (!bids.length || !asks.length) {
      return null;
    }

    const bestBid = bids.length ? bids[0].price : null;
    const bestAsk = asks.length ? asks[0].price : null;

    const midPrice =
      bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;

    const {
      spreadValue,
      spreadPercent,
    } = this._calculateSpread(bestBid, bestAsk, midPrice);

    const {
      totalVolume: totalBidVolume,
      cumulative: bidCumulative,
    } = this._calculateCumulativeVolume(bids);

    const {
      totalVolume: totalAskVolume,
      cumulative: askCumulative,
    } = this._calculateCumulativeVolume(asks);

    const volumeImbalance = this._calculateImbalance(
      totalBidVolume,
      totalAskVolume,
    );

    const volumeProfile = this._calculateVolumeProfile(bids, asks);

    const largeOrders = this._detectLargeOrders(bids, asks);

    const depthMetrics = this._calculateDepthMetrics(
      bids,
      asks,
      midPrice,
      spreadValue,
    );

    // يمكن إضافة مزيد من المؤشرات لاحقًا بسهولة
    return {
      symbol: orderBookData.symbol || null,

      bestBid: bestBid != null ? this._formatPrice(bestBid) : null,
      bestAsk: bestAsk != null ? this._formatPrice(bestAsk) : null,
      midPrice: midPrice != null ? this._formatPrice(midPrice) : null,

      rawMidPrice: midPrice,

      spread: spreadValue != null ? this._formatPrice(spreadValue) : null,
      spreadValue,
      spreadPercent,
      spreadText:
        spreadValue != null && spreadPercent != null
          ? `${this._formatPrice(spreadValue)} (${spreadPercent.toFixed(3)}%)`
          : null,

      totalBidVolume,
      totalAskVolume,
      volumeImbalance,
      imbalanceLabel: this._getImbalanceLabel(volumeImbalance),

      bidCumulative,
      askCumulative,

      volumeProfile,
      largeOrders,
      depthMetrics,
    };
  }

  /**
   * توحيد شكل بيانات جانب (bids أو asks)
   * @param {Array} side
   * @param {boolean} isBid
   * @returns {Array<{price:number, quantity:number}>}
   */
  _normalizeSide(side, isBid = true) {
    if (!Array.isArray(side)) return [];

    const normalized = side
      .map((level) => {
        if (Array.isArray(level)) {
          const [price, quantity] = level;
          return {
            price: Number(price),
            quantity: Number(quantity),
          };
        }

        if (level && typeof level === 'object') {
          return {
            price: Number(level.price),
            quantity: Number(level.quantity),
          };
        }

        return null;
      })
      .filter(
        (l) =>
          l &&
          Number.isFinite(l.price) &&
          Number.isFinite(l.quantity) &&
          l.quantity >= this.minVolumeThreshold,
      );

    // bids: من الأعلى إلى الأدنى – asks: من الأدنى إلى الأعلى
    normalized.sort((a, b) =>
      isBid ? b.price - a.price : a.price - b.price,
    );

    return normalized;
  }

  /**
   * حساب السبريد (Spread) والقيمة النسبية
   */
  _calculateSpread(bestBid, bestAsk, midPrice) {
    if (bestBid == null || bestAsk == null) {
      return { spreadValue: null, spreadPercent: null };
    }

    const spreadValue = bestAsk - bestBid;
    const spreadPercent =
      midPrice && midPrice !== 0 ? (spreadValue / midPrice) * 100 : null;

    return { spreadValue, spreadPercent };
  }

  /**
   * حساب الحجم التراكمي لكل مستوى
   */
  _calculateCumulativeVolume(levels) {
    let totalVolume = 0;
    const cumulative = [];

    levels.forEach((level, index) => {
      totalVolume += level.quantity;
      cumulative.push({
        index,
        price: level.price,
        quantity: level.quantity,
        cumulativeVolume: totalVolume,
      });
    });

    return { totalVolume, cumulative };
  }

  /**
   * حساب عدم توازن الحجم بين جانب الشراء والبيع
   */
  _calculateImbalance(totalBidVolume, totalAskVolume) {
    const total = totalBidVolume + totalAskVolume;
    if (!total) return 0;
    return (totalBidVolume - totalAskVolume) / total;
  }

  /**
   * تصنيف عدم التوازن
   */
  _getImbalanceLabel(imbalance) {
    if (imbalance > 0.3) return 'strong-bullish';
    if (imbalance > 0.1) return 'bullish';
    if (imbalance < -0.3) return 'strong-bearish';
    if (imbalance < -0.1) return 'bearish';
    return 'neutral';
  }

  /**
   * حساب بروفايل الحجم عبر مستويات الأسعار
   */
  _calculateVolumeProfile(bids, asks) {
    const profile = [];

    bids.forEach((level) => {
      profile.push({
        side: 'bid',
        price: level.price,
        quantity: level.quantity,
      });
    });

    asks.forEach((level) => {
      profile.push({
        side: 'ask',
        price: level.price,
        quantity: level.quantity,
      });
    });

    // يمكن لاحقًا تجميع الأسعار في "bins" إن لزم
    return profile;
  }

  /**
   * كشف الأوامر الكبيرة (Walls)
   */
  _detectLargeOrders(bids, asks) {
    const allLevels = [...bids, ...asks];
    if (!allLevels.length) return [];

    const volumes = allLevels.map((l) => l.quantity);
    const avgVolume =
      volumes.reduce((sum, v) => sum + v, 0) / volumes.length || 0;

    const threshold = avgVolume * 2; // أمر كبير = ضعف المتوسط أو أكثر

    const largeOrders = [];

    bids.forEach((level) => {
      if (level.quantity >= threshold) {
        largeOrders.push({
          side: 'bid',
          price: level.price,
          quantity: level.quantity,
          type: 'support-wall',
        });
      }
    });

    asks.forEach((level) => {
      if (level.quantity >= threshold) {
        largeOrders.push({
          side: 'ask',
          price: level.price,
          quantity: level.quantity,
          type: 'resistance-wall',
        });
      }
    });

    return largeOrders;
  }

  /**
   * حساب مؤشرات عمق السوق
   */
  _calculateDepthMetrics(bids, asks, midPrice, spreadValue) {
    const bidDepthNear = this._sumDepthInRange(
      bids,
      midPrice,
      -0.002,
      0,
    );
    const askDepthNear = this._sumDepthInRange(
      asks,
      midPrice,
      0,
      0.002,
    );

    const bidDepthFar = this._sumDepthInRange(
      bids,
      midPrice,
      -0.01,
      -0.002,
    );
    const askDepthFar = this._sumDepthInRange(
      asks,
      midPrice,
      0.002,
      0.01,
    );

    return {
      bidDepthNear,
      askDepthNear,
      bidDepthFar,
      askDepthFar,
      spreadValue,
    };
  }

  /**
   * تجميع العمق في نطاق سعري نسبي من الـ midPrice
   */
  _sumDepthInRange(levels, midPrice, fromPercent, toPercent) {
    if (!midPrice || !levels.length) return 0;

    const fromPrice = midPrice * (1 + fromPercent);
    const toPrice = midPrice * (1 + toPercent);

    let sum = 0;
    levels.forEach((level) => {
      const p = level.price;
      if (
        (fromPercent <= toPercent &&
          p >= fromPrice &&
          p <= toPrice) ||
        (fromPercent > toPercent && p <= fromPrice && p >= toPrice)
      ) {
        sum += level.quantity;
      }
    });

    return sum;
  }

  /**
   * تنسيق الأسعار للعرض
   */
  _formatPrice(value, decimals = 4) {
    if (!Number.isFinite(value)) return null;
    const abs = Math.abs(value);
    if (abs >= 1000) return value.toFixed(2);
    if (abs >= 1) return value.toFixed(4);
    return value.toFixed(decimals);
  }
}

export default OrderBookAnalyzer;
