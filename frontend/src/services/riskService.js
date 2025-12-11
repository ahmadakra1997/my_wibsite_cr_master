// frontend/src/services/riskService.js

/**
 * RiskService
 * خدمة لتحليل مخاطر المراكز بناءً على بيانات السعر والرافعة وحجم الصفقة.
 * لا تعتمد على الـ Backend، بل تحسب القيم في الواجهة الأمامية فقط.
 */

class RiskService {
  constructor(options = {}) {
    this.maxScore = 100;
    this.options = {
      highLeverageThreshold: options.highLeverageThreshold || 10,
      criticalLeverageThreshold: options.criticalLeverageThreshold || 25,
      maxSinglePositionExposureRatio:
        options.maxSinglePositionExposureRatio || 0.35, // نسبة من رأس المال
      defaultAccountEquity: options.defaultAccountEquity || 10000, // قيمة افتراضية عند غياب بيانات الحساب
    };
  }

  /**
   * تحليل مخاطر مركز واحد
   * @param {object} position - بيانات المركز
   * @param {object} marketData - بيانات السوق الحالية (symbol -> { price })
   */
  analyzePositionRisk(position, marketData = {}) {
    if (!position || !position.symbol) {
      return this._emptyRisk();
    }

    const leverage = parseFloat(position.leverage || 1);
    const entryPrice = parseFloat(position.entryPrice || 0);
    const size = parseFloat(position.size || position.quantity || 0);
    const side = position.side || position.positionSide || 'long';

    const symbolPrice =
      marketData[position.symbol]?.price || entryPrice || 0;

    const notionalExposure = size * symbolPrice;
    const equity =
      position.accountEquity || this.options.defaultAccountEquity;

    const exposureRatio =
      equity > 0 ? notionalExposure / equity : 0;

    // تقدير سعر التصفية بشكل تقريبي
    const liquidationPrice = this._calculateLiquidationPrice(
      entryPrice,
      leverage,
      side
    );

    const liquidationDistance =
      symbolPrice > 0
        ? side.toLowerCase() === 'long'
          ? ((symbolPrice - liquidationPrice) / symbolPrice) * 100
          : ((liquidationPrice - symbolPrice) / symbolPrice) * 100
        : 0;

    // درجة المخاطرة (0 – 100)
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

  _calculateLiquidationPrice(entryPrice, leverage, side) {
    const lev = leverage || 1;
    const price = entryPrice || 0;

    if (!price || !lev || lev <= 1) {
      return price;
    }

    if (side.toLowerCase() === 'long') {
      return price * (1 - 1 / lev);
    } else {
      return price * (1 + 1 / lev);
    }
  }

  _calculateRiskScore({ leverage, exposureRatio, liquidationDistance }) {
    let score = 0;

    // الرافعة: كلما زادت، زادت المخاطرة
    if (leverage <= 3) score += 10;
    else if (leverage <= 5) score += 25;
    else if (leverage <= 10) score += 45;
    else if (leverage <= 20) score += 65;
    else score += 80;

    // حجم التعرض (Exposure)
    if (exposureRatio <= 0.05) score += 5;
    else if (exposureRatio <= 0.15) score += 15;
    else if (exposureRatio <= 0.3) score += 25;
    else score += 35;

    // مسافة التصفية: كلما كانت قريبة زاد الخطر
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

  _buildRecommendations({
    riskLevel,
    leverage,
    exposureRatio,
    liquidationDistance,
  }) {
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
      suggestions.push(
        'مستوى المخاطر منخفض – استمر في الالتزام بخطة إدارة رأس المال الحالية.'
      );
    }

    if (exposureRatio > this.options.maxSinglePositionExposureRatio) {
      suggestions.push(
        'حجم هذا المركز كبير مقارنة بحجم الحساب – يفضّل توزيع المخاطرة على أكثر من أصل.'
      );
    }

    if (liquidationDistance < 10) {
      suggestions.push(
        'سعر التصفية قريب جداً – زيادة الهامش أو تخفيض الرافعة قد يكون ضرورياً.'
      );
    }

    return suggestions;
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
}

export default RiskService;
