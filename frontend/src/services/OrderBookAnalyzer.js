// frontend/src/services/OrderBookAnalyzer.js
/**
 * OrderBookAnalyzer
 * محلّل لدفتر الأوامر (Order Book) لحساب مؤشرات السيولة والضغط والسبريد...
 * ✅ ملاحظة: OrderBook.jsx يستعمل analyzeOrderBook() لذلك نوفر alias رسمي بدون كسر.
 */

class OrderBookAnalyzer {
  constructor(options = {}) {
    this.options = {
      depthLevels: Number.isFinite(options.depthLevels) ? options.depthLevels : 20,
      supportResistanceLevels: Number.isFinite(options.supportResistanceLevels)
        ? options.supportResistanceLevels
        : 5,
    };
  }

  // ✅ Alias للتوافق مع OrderBook.jsx (يمنع الكراش نهائياً)
  analyzeOrderBook(orderBook) {
    return this.analyze(orderBook);
  }

  analyze(orderBook) {
    const bids = this._normalizeSide(orderBook?.bids, 'bid');
    const asks = this._normalizeSide(orderBook?.asks, 'ask');

    if (!bids.length || !asks.length) {
      return {
        bestBid: null,
        bestAsk: null,
        spread: 0,
        spreadPercent: 0,
        bidVolume: 0,
        askVolume: 0,
        imbalance: 0,
        supportLevels: [],
        resistanceLevels: [],
        buyPressure: 50,
        sellPressure: 50,
        liquidityScore: 0,
        levels: { bids: [], asks: [] },
      };
    }

    const bestBid = bids[0]?.price ?? null; // bids مرتبة تنازلياً
    const bestAsk = asks[0]?.price ?? null; // asks مرتبة تصاعدياً

    const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : 0;
    const mid = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : 0;
    const spreadPercent = mid > 0 ? (spread / mid) * 100 : 0;

    const depthN = this.options.depthLevels;
    const topBids = bids.slice(0, depthN);
    const topAsks = asks.slice(0, depthN);

    const bidVolume = topBids.reduce((acc, l) => acc + (l.quantity || 0), 0);
    const askVolume = topAsks.reduce((acc, l) => acc + (l.quantity || 0), 0);

    const imbalance = this._calculateImbalance(topBids, topAsks);

    const supportLevels = this._findSupportLevels(topBids);
    const resistanceLevels = this._findResistanceLevels(topAsks);

    const total = bidVolume + askVolume;
    const buyPressure = total > 0 ? (bidVolume / total) * 100 : 50;
    const sellPressure = total > 0 ? (askVolume / total) * 100 : 50;

    const liquidityScore = this._calculateLiquidityScore({
      bidVolume,
      askVolume,
      spreadPercent,
      bids: topBids,
      asks: topAsks,
    });

    return {
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      bidVolume,
      askVolume,
      imbalance,
      supportLevels,
      resistanceLevels,
      buyPressure,
      sellPressure,
      liquidityScore,
      levels: { bids: topBids, asks: topAsks },
    };
  }

  _normalizeSide(sideData, side) {
    if (!Array.isArray(sideData)) return [];

    const normalized = sideData
      .map((level) => {
        // [price, qty]
        if (Array.isArray(level)) {
          const price = this._toNumber(level[0]);
          const quantity = this._toNumber(level[1]);
          if (!Number.isFinite(price) || !Number.isFinite(quantity)) return null;
          return { price, quantity };
        }

        // { price, quantity } أو { p, q } أو { size }
        if (level && typeof level === 'object') {
          const price = this._toNumber(level.price ?? level.p);
          const quantity = this._toNumber(level.quantity ?? level.q ?? level.size);
          if (!Number.isFinite(price) || !Number.isFinite(quantity)) return null;
          return { price, quantity };
        }

        return null;
      })
      .filter(Boolean);

    // ✅ bids: أعلى سعر أولاً | asks: أقل سعر أولاً (هذا مهم جداً لصحة bestAsk والـ spread)
    normalized.sort((a, b) => {
      if (side === 'ask') return a.price - b.price; // ascending
      return b.price - a.price; // bid descending
    });

    return normalized;
  }

  _calculateImbalance(bids, asks) {
    const bidVolume = bids.reduce((sum, bid) => sum + (bid.quantity || 0), 0);
    const askVolume = asks.reduce((sum, ask) => sum + (ask.quantity || 0), 0);

    const total = bidVolume + askVolume;
    if (total <= 0) return 0;

    // (-1 .. +1) : موجب = ضغط شراء أكبر
    return (bidVolume - askVolume) / total;
  }

  _findSupportLevels(bids) {
    if (!bids.length) return [];
    // دعم = مستويات bid ذات كميات أعلى ضمن العمق
    const sortedByQty = [...bids].sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    const levels = sortedByQty.slice(0, this.options.supportResistanceLevels).map((l) => ({
      price: l.price,
      volume: l.quantity,
    }));
    // ترتيب سعر تصاعدي للعرض
    return levels.sort((a, b) => a.price - b.price);
  }

  _findResistanceLevels(asks) {
    if (!asks.length) return [];
    // مقاومة = مستويات ask ذات كميات أعلى ضمن العمق
    const sortedByQty = [...asks].sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    const levels = sortedByQty.slice(0, this.options.supportResistanceLevels).map((l) => ({
      price: l.price,
      volume: l.quantity,
    }));
    // ترتيب سعر تصاعدي للعرض
    return levels.sort((a, b) => a.price - b.price);
  }

  _calculateLiquidityScore({ bidVolume, askVolume, spreadPercent, bids, asks }) {
    const depth = bidVolume + askVolume;

    // عامل العمق (0..1)
    const depthFactor = Math.min(1, depth / 1000);

    // عامل السبريد: كلما كبر السبريد قلّت السيولة
    const spreadFactor = spreadPercent <= 0 ? 1 : Math.max(0, 1 - spreadPercent / 2);

    // عامل توازن جانبي: الأفضل يكون قريب من 0 (متعادل)
    const imbalance = this._calculateImbalance(bids, asks);
    const balanceFactor = 1 - Math.min(1, Math.abs(imbalance));

    const score = (depthFactor * 0.45 + spreadFactor * 0.35 + balanceFactor * 0.20) * 100;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  _toNumber(v, fallback = NaN) {
    const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
}

export default OrderBookAnalyzer;
