// frontend/src/services/OrderBookAnalyzer.js
/**
 * OrderBookAnalyzer
 * محلّل دفتر الأوامر (Order Book) — آمن ومتوافق مع أكثر من نمط استخدام.
 *
 * يدعم:
 * - instance methods: new OrderBookAnalyzer().analyzeOrderBook(...)
 * - static methods:  OrderBookAnalyzer.analyzeOrderBook(...)
 * - shared instance: orderBookAnalyzer.analyzeOrderBook(...)
 */

const toNumber = (v, fallback = 0) => {
  const n =
    typeof v === 'string'
      ? Number(v.replace(/,/g, '').trim())
      : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const safeArray = (v) => (Array.isArray(v) ? v : []);

const normalizeLevel = (lvl) => {
  // supports:
  // [price, qty] | { price, quantity } | { p, q } | { price, size } | { rate, amount }
  if (Array.isArray(lvl)) {
    return { price: toNumber(lvl[0], 0), quantity: toNumber(lvl[1], 0) };
  }
  if (lvl && typeof lvl === 'object') {
    const price = toNumber(lvl.price ?? lvl.p ?? lvl.rate ?? lvl.r ?? lvl[0], 0);
    const quantity = toNumber(
      lvl.quantity ?? lvl.q ?? lvl.size ?? lvl.amount ?? lvl.a ?? lvl[1],
      0
    );
    return { price, quantity };
  }
  return { price: 0, quantity: 0 };
};

const normalizeOrderBook = (orderBook) => {
  const ob = orderBook && typeof orderBook === 'object' ? orderBook : {};
  const bids = safeArray(ob.bids).map(normalizeLevel).filter((x) => x.price > 0);
  const asks = safeArray(ob.asks).map(normalizeLevel).filter((x) => x.price > 0);

  // bids desc, asks asc
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  return { bids, asks };
};

const sumQty = (levels) => levels.reduce((acc, x) => acc + toNumber(x.quantity, 0), 0);

const pickTopLevelsByQty = (levels, count = 3) => {
  // pick biggest quantities (support/resistance proxy)
  const copy = safeArray(levels).slice();
  copy.sort((a, b) => toNumber(b.quantity, 0) - toNumber(a.quantity, 0));
  return copy.slice(0, Math.max(0, count));
};

export class OrderBookAnalyzer {
  constructor(options = {}) {
    this.options = {
      levelsForLiquidity: options.levelsForLiquidity ?? 20,
      topLevels: options.topLevels ?? 3,
      spreadBadPct: options.spreadBadPct ?? 0.25, // 0.25%
      ...options,
    };
  }

  analyze(orderBook, opts = {}) {
    const options = { ...this.options, ...opts };
    const { bids, asks } = normalizeOrderBook(orderBook);

    const bestBid = bids[0]?.price ?? null;
    const bestAsk = asks[0]?.price ?? null;

    const spread = bestBid != null && bestAsk != null ? Math.max(0, bestAsk - bestBid) : null;
    const mid = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;
    const spreadPercent = mid ? (spread / mid) * 100 : 0;

    const bidVolume = sumQty(bids.slice(0, options.levelsForLiquidity));
    const askVolume = sumQty(asks.slice(0, options.levelsForLiquidity));

    const total = bidVolume + askVolume;
    const imbalance = total > 0 ? (bidVolume - askVolume) / total : 0; // [-1..1]

    const supportLevels = pickTopLevelsByQty(bids, options.topLevels);
    const resistanceLevels = pickTopLevelsByQty(asks, options.topLevels);

    const buyPressure = total > 0 ? (bidVolume / total) * 100 : 0;
    const sellPressure = total > 0 ? (askVolume / total) * 100 : 0;

    // liquidity score (0..100): better if tight spread + higher depth
    const depthScore = Math.min(60, Math.log10(1 + total) * 15); // 0..~60
    const spreadPenalty = Math.min(40, (spreadPercent / options.spreadBadPct) * 40); // 0..40
    const liquidityScore = Math.max(0, Math.min(100, Math.round(depthScore + (40 - spreadPenalty))));

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
      _meta: {
        levelsForLiquidity: options.levelsForLiquidity,
        topLevels: options.topLevels,
      },
    };
  }

  // ✅ الاسم الذي كانت الواجهة تناديه
  analyzeOrderBook(orderBook, opts) {
    return this.analyze(orderBook, opts);
  }

  // aliases (احتياطي)
  analyzeDepth(orderBook, opts) {
    return this.analyze(orderBook, opts);
  }

  // ✅ static لتغطية حالة: استخدام class مباشرة بدون new
  static analyze(orderBook, opts) {
    return orderBookAnalyzer.analyze(orderBook, opts);
  }

  static analyzeOrderBook(orderBook, opts) {
    return orderBookAnalyzer.analyzeOrderBook(orderBook, opts);
  }

  static analyzeDepth(orderBook, opts) {
    return orderBookAnalyzer.analyzeDepth(orderBook, opts);
  }
}

// ✅ instance مشترك (بدون كسر أي استعمال سابق)
export const orderBookAnalyzer = new OrderBookAnalyzer();

// (نُبقي default = class لعدم كسر أي imports تتوقع constructor)
export default OrderBookAnalyzer;
