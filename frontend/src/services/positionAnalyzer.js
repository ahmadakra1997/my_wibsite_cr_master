// frontend/src/services/positionAnalyzer.js
/**
 * PositionAnalyzer
 * يحلل أداء المراكز (PNL / ROI / Risk) من جهة الواجهة فقط.
 * ✅ تحسينات: aliases للتوافق + تطبيع أقوى للأرقام بدون كسر وظائف موجودة.
 */

class PositionAnalyzer {
  constructor(options = {}) {
    this.options = {
      riskFreeRate: Number.isFinite(options.riskFreeRate) ? options.riskFreeRate : 0.02,
      maxPositionsForMetrics: Number.isFinite(options.maxPositionsForMetrics)
        ? options.maxPositionsForMetrics
        : 200,
    };
  }

  // ✅ Alias شائع (بعض الملفات تستعمل analyzePosition بدل analyzeSinglePosition)
  analyzePosition(position, marketData = {}) {
    return this.analyzeSinglePosition(position, marketData);
  }

  analyzePositions(positions, marketData = {}) {
    const list = Array.isArray(positions) ? positions : [];
    const limited = list.slice(0, this.options.maxPositionsForMetrics);

    const analyzed = limited.map((p) => this.analyzeSinglePosition(p, marketData));
    const portfolio = this._analyzePortfolio(analyzed);

    return { positions: analyzed, portfolio };
  }

  analyzeSinglePosition(position, marketData = {}) {
    if (!position) return this._emptyPositionAnalysis();

    const symbol = position.symbol || position.pair || 'UNKNOWN';
    const side = String(position.side || position.positionSide || 'long').toLowerCase();

    const entryPrice = this._toNumber(position.entryPrice ?? position.entry ?? position.openPrice, 0);
    const size =
      this._toNumber(position.size ?? position.quantity ?? position.amount ?? position.qty, 0) || 0;

    const leverage = Math.max(1, this._toNumber(position.leverage ?? 1, 1));
    const currentPrice = this._getCurrentPrice(symbol, marketData, entryPrice);

    const pnl = this._calculatePnL({ side, entryPrice, currentPrice, size, leverage });
    const roi = entryPrice > 0 ? (pnl / (entryPrice * size)) * 100 : 0;

    const riskMetrics = this._calculateRiskMetrics({ entryPrice, currentPrice, leverage, side });

    return {
      symbol,
      side,
      entryPrice,
      currentPrice,
      size,
      leverage,
      pnl,
      roi,
      ...riskMetrics,
      raw: position,
    };
  }

  _emptyPositionAnalysis() {
    return {
      symbol: 'UNKNOWN',
      side: 'long',
      entryPrice: 0,
      currentPrice: 0,
      size: 0,
      leverage: 1,
      pnl: 0,
      roi: 0,
      liquidationPrice: null,
      drawdownPct: 0,
      raw: null,
    };
  }

  _getCurrentPrice(symbol, marketData, fallback = 0) {
    const md = marketData?.[symbol];
    if (md == null) return fallback;

    if (typeof md === 'number') return this._toNumber(md, fallback);
    if (typeof md === 'object') return this._toNumber(md.price ?? md.last ?? md.close, fallback);

    return fallback;
  }

  _calculatePnL({ side, entryPrice, currentPrice, size, leverage }) {
    if (!entryPrice || !currentPrice || !size) return 0;

    const delta = side === 'short' ? entryPrice - currentPrice : currentPrice - entryPrice;
    const pnl = delta * size * (leverage || 1);

    return Number.isFinite(pnl) ? pnl : 0;
  }

  _calculateRiskMetrics({ entryPrice, currentPrice, leverage, side }) {
    const lev = leverage || 1;
    const price = entryPrice || 0;

    let liquidationPrice = null;
    if (price > 0 && lev > 1) {
      const liq = side === 'short' ? price * (1 + 1 / lev) : price * (1 - 1 / lev);
      liquidationPrice = Number.isFinite(liq) ? Math.max(0, liq) : null;
    }

    const drawdownPct =
      entryPrice > 0
        ? side === 'short'
          ? ((currentPrice - entryPrice) / entryPrice) * 100
          : ((entryPrice - currentPrice) / entryPrice) * 100
        : 0;

    return {
      liquidationPrice,
      drawdownPct: Number.isFinite(drawdownPct) ? drawdownPct : 0,
    };
  }

  _analyzePortfolio(analyzedPositions) {
    const list = Array.isArray(analyzedPositions) ? analyzedPositions : [];
    const totalPnL = list.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const avgRoi = list.length ? list.reduce((s, p) => s + (p.roi || 0), 0) / list.length : 0;

    const winners = list.filter((p) => (p.pnl || 0) > 0).length;
    const losers = list.filter((p) => (p.pnl || 0) < 0).length;

    return {
      totalPnL,
      avgRoi,
      winners,
      losers,
      count: list.length,
    };
  }

  _toNumber(v, fallback = 0) {
    const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
}

export default new PositionAnalyzer();
export { PositionAnalyzer };
