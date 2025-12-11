// frontend/src/services/positionAnalyzer.js

/**
 * PositionAnalyzer
 * خدمة لتحليل قائمة المراكز وإنتاج إحصائيات ورؤية تجميعية.
 */

class PositionAnalyzer {
  /**
   * حساب إحصائيات عامة لقائمة المراكز
   * @param {Array<object>} positions
   */
  calculatePositionStats(positions = []) {
    if (!Array.isArray(positions) || positions.length === 0) {
      return this._emptyStats();
    }

    const totalPositions = positions.length;
    const openPositions = positions.filter((p) => p.status === 'open');
    const closedPositions = positions.filter((p) => p.status === 'closed');

    // تجميع قيم الربح/الخسارة إن توفرت
    const sumField = (fieldName) =>
      positions.reduce((sum, p) => {
        const val = parseFloat(p[fieldName] ?? 0);
        return sum + (Number.isFinite(val) ? val : 0);
      }, 0);

    const grossProfit = sumField('grossProfit');
    const grossLoss = sumField('grossLoss');
    const realizedPnl = sumField('realizedPnl');
    const unrealizedPnl = sumField('unrealizedPnl');

    const netProfit = realizedPnl + unrealizedPnl;

    const winningClosed = closedPositions.filter(
      (p) => parseFloat(p.realizedPnl || 0) > 0
    );
    const losingClosed = closedPositions.filter(
      (p) => parseFloat(p.realizedPnl || 0) < 0
    );

    const winRate =
      closedPositions.length > 0
        ? (winningClosed.length / closedPositions.length) * 100
        : 0;

    // تقدير بسيط للـ Drawdown من أسوأ مركز مغلق
    const worstLoss = losingClosed.reduce((min, p) => {
      const val = parseFloat(p.realizedPnl || 0);
      if (!Number.isFinite(val)) return min;
      return val < min ? val : min;
    }, 0);

    const maxDrawdown = Math.abs(worstLoss);

    // تقييم مستوى المخاطرة الإجمالي
    const { riskLevel, riskMessage, riskSuggestions } =
      this._evaluateGlobalRisk({
        netProfit,
        winRate,
        maxDrawdown,
        openCount: openPositions.length,
        totalCount: totalPositions,
      });

    return {
      totalPositions,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      netProfit,
      grossProfit,
      grossLoss,
      realizedPnl,
      unrealizedPnl,
      winRate: Number.isFinite(winRate) ? Math.round(winRate * 100) / 100 : 0,
      maxDrawdown,
      bestTrade: this._findBestTrade(positions),
      worstTrade: this._findWorstTrade(positions),
      riskLevel,
      riskMessage,
      riskSuggestions,
    };
  }

  _findBestTrade(positions) {
    let best = null;
    positions.forEach((p) => {
      const realized = parseFloat(p.realizedPnl || 0);
      if (!Number.isFinite(realized) || realized <= 0) return;
      if (!best || realized > best.realizedPnl) {
        best = { ...p, realizedPnl: realized };
      }
    });
    return best;
  }

  _findWorstTrade(positions) {
    let worst = null;
    positions.forEach((p) => {
      const realized = parseFloat(p.realizedPnl || 0);
      if (!Number.isFinite(realized) || realized >= 0) return;
      if (!worst || realized < worst.realizedPnl) {
        worst = { ...p, realizedPnl: realized };
      }
    });
    return worst;
  }

  _evaluateGlobalRisk({
    netProfit,
    winRate,
    maxDrawdown,
    openCount,
    totalCount,
  }) {
    let riskLevel = 'low';
    let riskMessage = 'مستوى المخاطر على المحفظة حالياً منخفض.';
    const riskSuggestions = [];

    if (totalCount === 0) {
      riskMessage = 'لا توجد مراكز حالياً – لا يوجد تعرض للمخاطر.';
      return { riskLevel, riskMessage, riskSuggestions };
    }

    if (netProfit < 0 || maxDrawdown > 0) {
      if (maxDrawdown > Math.abs(netProfit) * 1.5) {
        riskLevel = 'high';
        riskMessage =
          'تم تسجيل تراجع كبير في المحفظة مقارنة بالأرباح، مما يشير إلى تقلب عالي في النتائج.';
      } else {
        riskLevel = 'medium';
        riskMessage =
          'المحفظة في وضع تذبذب متوسط مع بعض فترات التراجع. يمكن تحسين إدارة رأس المال.';
      }
    }

    if (winRate < 40 && totalCount > 10) {
      riskLevel = riskLevel === 'high' ? 'critical' : 'high';
      riskSuggestions.push(
        'نسبة الصفقات الرابحة منخفضة – راجع استراتيجية الدخول والخروج بدقة.'
      );
    }

    if (openCount > totalCount * 0.6 && totalCount > 5) {
      riskSuggestions.push(
        'عدد المراكز المفتوحة كبير مقارنة بعدد المراكز الكلي – يفضّل تقليل التعرّض المتزامن.'
      );
    }

    if (maxDrawdown > 0 && maxDrawdown > Math.abs(netProfit)) {
      riskSuggestions.push(
        'التراجع الأقصى أعلى من صافي الربح – جرّب تقليل حجم الصفقات أو تشديد وقف الخسارة.'
      );
    }

    if (riskSuggestions.length === 0) {
      riskSuggestions.push(
        'استمر في الالتزام بنفس قواعد إدارة رأس المال، وراقب النتائج على المدى المتوسط.'
      );
    }

    return { riskLevel, riskMessage, riskSuggestions };
  }

  _emptyStats() {
    return {
      totalPositions: 0,
      openPositions: 0,
      closedPositions: 0,
      netProfit: 0,
      grossProfit: 0,
      grossLoss: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      winRate: 0,
      maxDrawdown: 0,
      bestTrade: null,
      worstTrade: null,
      riskLevel: 'low',
      riskMessage: 'لا توجد بيانات مراكز كافية لتحليل المخاطر.',
      riskSuggestions: [],
    };
  }
}

export default PositionAnalyzer;
