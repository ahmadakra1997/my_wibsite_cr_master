// frontend/src/services/riskService.js
/**
 * RiskService
 * خدمة لتحليل مخاطر المراكز بناءً على السعر/الرافعة/حجم الصفقة.
 * (Front-end only) — لا تغيّر منطق التداول.
 */
class RiskService {
  constructor(options = {}) {
    this.maxScore = 100;
    this.options = {
      highLeverageThreshold: options.highLeverageThreshold || 10,
      criticalLeverageThreshold: options.criticalLeverageThreshold || 25,
      maxSinglePositionExposureRatio: options.maxSinglePositionExposureRatio || 0.35,
      defaultAccountEquity: options.defaultAccountEquity || 10000,
    };
  }

  _toNumber(v, fallback = 0) {
    const n = typeof v === 'string' ? Number(v.replace(/,/g, '').trim()) : Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  _getSymbolPrice(symbol, marketData, fallback = 0) {
    if (!symbol) return fallback;
    const md = marketData?.[symbol];
    if (md == null) return fallback;

    // object: {price/last/close}
    if (typeof md === 'object') return this._toNumber(md.price ?? md.last ?? md.close, fallback);

    // direct number/string
    return this._toNumber(md, fallback);
  }

  _emptyRisk() {
    return {
      riskScore: 0,
      riskLevel: 'low',
      notionalExposure: 0,
      exposureRatio: 0,
      leverage: 1,
      liquidationPrice: null,
      liquidationDistance: 0,
      accountEquity: this.options.defaultAccountEquity,
      recommendations: [],
    };
  }

  /**
   * تحليل مخاطر مركز واحد
   * @param {object} position - بيانات المركز
   * @param {object} marketData - بيانات السوق الحالية (مثل marketData[symbol] = {price})
   */
  analyzePositionRisk(position, marketData = {}) {
    if (!position || !position.symbol) return this._emptyRisk();

    const symbol = position.symbol;

    const leverage = Math.max(1, this._toNumber(position.leverage ?? 1, 1));
    const entryPrice = this._toNumber(position.entryPrice ?? 0, 0);

    const size =
      this._toNumber(position.size ?? null, NaN) ||
      this._toNumber(position.quantity ?? null, NaN) ||
      this._toNumber(position.amount ?? null, NaN) ||
      0;

    const side = String(position.side || position.positionSide || 'long').toLowerCase();
    const symbolPrice = this._getSymbolPrice(symbol, marketData, entryPrice || 0);

    const notionalExposure = size * symbolPrice;
    const equity = this._toNumber(position.accountEquity ?? this.options.defaultAccountEquity, this.options.defaultAccountEquity);
    const exposureRatio = equity > 0 ? notionalExposure / equity : 0;

    const liquidationPrice = this._calculateLiquidationPrice(entryPrice, leverage, side);

    const liquidationDistance =
      symbolPrice > 0 && liquidationPrice != null
        ? side === 'long'
          ? ((symbolPrice - liquidationPrice) / symbolPrice) * 100
          : ((liquidationPrice - symbolPrice) / symbolPrice) * 100
        : 0;

    const riskScore = this._calculateRiskScore({
      leverage,
      exposureRatio,
      liquidationDistance,
    });

    const riskLevel = this._getRiskLevel(riskScore);
    const recommendations = this._buildRecommendations({
      riskLevel,
      leverage,
      exposureRatio,
      liquidationDistance,
    });

    return {
      riskScore,
      riskLevel,
      notionalExposure,
      exposureRatio,
      leverage,
      liquidationPrice,
      liquidationDistance,
      accountEquity: equity,
      recommendations,
    };
  }

  // ✅ alias للحفاظ على أي استدعاءات قديمة
  analyzeRisk(position, marketData = {}) {
    return this.analyzePositionRisk(position, marketData);
  }

  _calculateLiquidationPrice(entryPrice, leverage, side) {
    const lev = leverage || 1;
    const price = entryPrice || 0;

    if (!price || !lev || lev <= 1) return price;

    const liq = side === 'long' ? price * (1 - 1 / lev) : price * (1 + 1 / lev);
    return Number.isFinite(liq) ? Math.max(0, liq) : price;
  }

  _calculateRiskScore({ leverage, exposureRatio, liquidationDistance }) {
    let score = 0;

    // leverage
    if (leverage <= 3) score += 10;
    else if (leverage <= 5) score += 25;
    else if (leverage <= 10) score += 45;
    else if (leverage <= 20) score += 65;
    else score += 80;

    // exposure
    if (exposureRatio <= 0.05) score += 5;
    else if (exposureRatio <= 0.15) score += 15;
    else if (exposureRatio <= 0.3) score += 25;
    else score += 35;

    // liquidation distance
    if (liquidationDistance >= 40) score += 5;
    else if (liquidationDistance >= 25) score += 15;
    else if (liquidationDistance >= 15) score += 25;
    else score += 35;

    return Math.min(this.maxScore, Math.round(score));
  }

  _getRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  _buildRecommendations({ riskLevel, leverage, exposureRatio, liquidationDistance }) {
    const suggestions = [];

    if (riskLevel === 'critical') {
      suggestions.push(
        'قم فوراً بتخفيض الرافعة وتقليل حجم المركز لتفادي التصفية السريعة.',
        'فكر في إغلاق جزء من المركز لتقليل التعرض الكلي.',
        'تأكد من وجود وقف خسارة واضح ومناسب لحجم الحساب.'
      );
    } else if (riskLevel === 'high') {
      suggestions.push(
        'يفضّل تخفيض الرافعة المالية أو حجم المركز لتحسين هامش الأمان.',
        'أضف وقف خسارة إذا لم يكن موجوداً، أو قربه قليلاً من السعر الحالي.'
      );
    } else if (riskLevel === 'medium') {
      suggestions.push(
        'مستوى المخاطرة متوسط – تأكد من أن الخطة متوافقة مع استراتيجية إدارة رأس المال.',
        'تابع المركز بشكل دوري خاصة في أوقات تقلبات السوق.'
      );
    } else {
      suggestions.push('مستوى المخاطر منخفض – استمر في الالتزام بخطة إدارة رأس المال الحالية.');
    }

    if (exposureRatio > this.options.maxSinglePositionExposureRatio) {
      suggestions.push('حجم هذا المركز كبير مقارنة بحجم الحساب – يفضّل توزيع المخاطرة على أكثر من أصل.');
    }

    if (liquidationDistance < 10) {
      suggestions.push('سعر التصفية قريب جداً – زيادة الهامش أو تخفيض الرافعة قد يكون ضرورياً.');
    }

    if (leverage >= this.options.criticalLeverageThreshold) {
      suggestions.push('رافعة عالية جداً — راقب الانزلاق السعري والتمويل (Funding) إن وُجد.');
    }

    return suggestions;
  }
}

export default RiskService;
