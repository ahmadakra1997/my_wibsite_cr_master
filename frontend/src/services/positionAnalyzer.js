// frontend/src/services/positionAnalyzer.js
/**
 * PositionAnalyzer
 * تحليل المراكز المفتوحة/المغلقة + الأداء + توصيات بدون الاعتماد على الـ Backend
 * ✅ تم الحفاظ على نفس أسماء الدوال والواجهات العامة — مع تحسين التحمّل للبيانات المختلفة.
 */
class PositionAnalyzer {
  constructor(options = {}) {
    this.options = {
      riskThresholds: {
        low: options.lowRiskThreshold || 30,
        medium: options.mediumRiskThreshold || 60,
        high: options.highRiskThreshold || 80,
      },
      maxLeverage: options.maxLeverage || 20,
      ...options,
    };
  }

  _toNumber(v, fallback = 0) {
    if (v == null) return fallback;
    if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
    const s = String(v).replace(/,/g, '').trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  }

  _isClosed(position) {
    const status = String(position?.status ?? '').toLowerCase();
    return Boolean(position?.isClosed || position?.closed || status === 'closed' || status === 'close');
  }

  analyzePositions(positions = [], marketData = {}) {
    const safePositions = Array.isArray(positions) ? positions : [];

    const openPositions = safePositions.filter((p) => !this._isClosed(p));
    const closedPositions = safePositions.filter((p) => this._isClosed(p));

    const analysis = {
      totalPositions: safePositions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalExposure: 0,
      totalPnL: 0,
      openPnL: 0,
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      performance: {},
      recommendations: [],
    };

    // تحليل المخاطر للمراكز المفتوحة
    analysis.riskLevels = this.analyzeRiskLevels(openPositions, marketData);

    // تحديث توزيع المخاطر
    analysis.riskLevels.forEach((risk) => {
      analysis.riskDistribution[risk.level] = (analysis.riskDistribution[risk.level] || 0) + 1;
    });

    // تحليل الأداء
    analysis.performance = this.analyzePerformance(safePositions);

    // حساب التعرض الإجمالي والربح/الخسارة
    safePositions.forEach((position) => {
      const size = this._toNumber(position.size ?? position.quantity ?? position.amount, 0);
      const entry = this._toNumber(position.entryPrice, 0);
      const current = this._toNumber(position.currentPrice ?? marketData?.[position.symbol]?.price ?? entry, entry);

      analysis.totalExposure += size * current;

      const pnl = this._toNumber(position.pnl ?? position.profit ?? position.unrealizedPnl ?? 0, 0);
      analysis.totalPnL += pnl;

      if (!this._isClosed(position)) analysis.openPnL += pnl;
    });

    // توليد التوصيات
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  analyzeRiskLevels(openPositions = [], marketData = {}) {
    const safePositions = Array.isArray(openPositions) ? openPositions : [];

    return safePositions.map((position) => {
      const riskScore = this._calculatePositionRisk(position, marketData);
      const riskLevel = this._calculateRiskLevel(riskScore);

      return {
        positionId: position.id || position._id || `${position.symbol || 'unknown'}-${Math.random().toString(16).slice(2)}`,
        symbol: position.symbol,
        score: riskScore,
        level: riskLevel,
        factors: {
          leverage: position.leverage || 1,
          size: position.size || position.quantity || 0,
          stopLoss: position.stopLoss,
          takeProfit: position.takeProfit,
        },
      };
    });
  }

  analyzePerformance(positions = []) {
    const safePositions = Array.isArray(positions) ? positions : [];

    const closedPositions = safePositions.filter((p) => this._isClosed(p));
    const winningTrades = closedPositions.filter((p) => this._toNumber(p.realizedPnl ?? p.pnl ?? p.profit, 0) > 0);
    const losingTrades = closedPositions.filter((p) => this._toNumber(p.realizedPnl ?? p.pnl ?? p.profit, 0) < 0);

    const totalTrades = closedPositions.length;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const totalProfit = winningTrades.reduce((sum, p) => sum + this._toNumber(p.realizedPnl ?? p.pnl ?? p.profit, 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, p) => sum + this._toNumber(p.realizedPnl ?? p.pnl ?? p.profit, 0), 0));

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    const bestTrade = closedPositions.reduce((best, p) => {
      const pnl = this._toNumber(p.realizedPnl ?? p.pnl ?? p.profit, 0);
      if (!best) return p;
      const bestPnl = this._toNumber(best.realizedPnl ?? best.pnl ?? best.profit, 0);
      return pnl > bestPnl ? p : best;
    }, null);

    const worstTrade = closedPositions.reduce((worst, p) => {
      const pnl = this._toNumber(p.realizedPnl ?? p.pnl ?? p.profit, 0);
      if (!worst) return p;
      const worstPnl = this._toNumber(worst.realizedPnl ?? worst.pnl ?? worst.profit, 0);
      return pnl < worstPnl ? p : worst;
    }, null);

    // drawdown تقديري مبسّط (ليس backtest)
    const maxDrawdown = totalLoss;

    return {
      totalTrades,
      winRate,
      profitFactor,
      totalProfit,
      totalLoss,
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
      maxDrawdown,
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    const criticalCount = analysis.riskDistribution.critical || 0;
    const highCount = analysis.riskDistribution.high || 0;

    if (criticalCount > 0) {
      recommendations.push({
        type: 'critical',
        message: `لديك ${criticalCount} مراكز بمخاطر حرجة. يُنصح بإغلاق أو تقليل هذه المراكز فوراً.`,
        action: 'reduce_exposure',
      });
    }

    if (highCount > 2) {
      recommendations.push({
        type: 'warning',
        message: `عدد المراكز عالية المخاطر (${highCount}) مرتفع. فكّر في تنويع المحفظة وتقليل الرافعة.`,
        action: 'diversify',
      });
    }

    if (analysis.performance.winRate < 40 && analysis.performance.totalTrades > 10) {
      recommendations.push({
        type: 'performance',
        message: 'معدل الفوز منخفض. قد تحتاج إلى مراجعة الاستراتيجية أو تحسين نقاط الدخول والخروج.',
        action: 'review_strategy',
      });
    }

    if (analysis.performance.profitFactor < 1 && analysis.performance.totalTrades > 5) {
      recommendations.push({
        type: 'performance',
        message: 'معامل الربح أقل من 1. ركّز على تحسين نسبة العائد إلى المخاطرة.',
        action: 'improve_risk_reward',
      });
    }

    return recommendations;
  }

  _calculateRiskLevel(score) {
    if (score >= this.options.riskThresholds.high) return 'critical';
    if (score >= this.options.riskThresholds.medium) return 'high';
    if (score >= this.options.riskThresholds.low) return 'medium';
    return 'low';
  }

  _calculatePositionRisk(position, marketData = {}) {
    let riskScore = 0;

    // leverage risk
    const leverage = this._toNumber(position.leverage, 1);
    riskScore += (leverage / this.options.maxLeverage) * 40;

    // position size risk
    const size = this._toNumber(position.size ?? position.quantity ?? position.amount, 0);
    const currentPrice =
      this._toNumber(position.currentPrice, NaN) ||
      this._toNumber(marketData?.[position.symbol]?.price, NaN) ||
      this._toNumber(position.entryPrice, 0);

    const positionValue = size * currentPrice;
    const accountBalance = this._toNumber(position.accountBalance, 10000);
    const exposureRatio = accountBalance > 0 ? positionValue / accountBalance : 0;
    riskScore += exposureRatio * 30;

    // stop loss risk
    const hasStopLoss = position.stopLoss != null;
    if (!hasStopLoss) riskScore += 20;

    // liquidation risk
    const liquidationPrice = this._calculateLiquidationPrice(position);
    if (liquidationPrice) {
      const distanceToLiquidation = Math.abs((currentPrice - liquidationPrice) / currentPrice);
      if (distanceToLiquidation < 0.05) riskScore += 20;
      else if (distanceToLiquidation < 0.1) riskScore += 10;
    }

    return Math.min(100, Math.max(0, Math.round(riskScore)));
  }

  _calculateLiquidationPrice(position) {
    const entryPrice = this._toNumber(position.entryPrice, 0);
    const leverage = this._toNumber(position.leverage, 1);
    const isLong = String(position.side || 'long').toLowerCase() === 'long';

    if (!entryPrice || leverage <= 1) return null;

    // simplified liquidation price calculation
    const maintenanceMargin = 1 / leverage;
    return isLong ? entryPrice * (1 - maintenanceMargin) : entryPrice * (1 + maintenanceMargin);
  }
}

export default new PositionAnalyzer();
