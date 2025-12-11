// frontend/src/components/trading/RiskMonitor.jsx

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import './RiskMonitor.css';

/**
 * RiskMonitor
 *
 * يعرض:
 * - إجمالي الـ exposure التقريبي من الصفقات الحالية (من بيانات trades).
 * - تقدير بسيط للـ leverage بناءً على حجم التداول مقابل سعر السوق.
 * - تقدير لحالة الـ drawdown (مبدئي).
 *
 * هذا الكومبوننت مصمم ليكون مستقل، ويمكن لاحقاً ربطه مع خدمة مخاطر حقيقية.
 */

const RiskMonitor = () => {
  const trades = useSelector((state) => state.trading.trades);
  const ticker = useSelector((state) => state.trading.ticker);

  const { exposure, leverage, drawdown, riskLevel } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        exposure: 0,
        leverage: 1,
        drawdown: 0,
        riskLevel: 'ok',
      };
    }

    let netPosition = 0; // كمية صافية
    let notional = 0; // القيمة الاسمية (تقريبية)

    trades.forEach((t) => {
      const side = (t.side || '').toLowerCase();
      const qty = Number(t.quantity ?? 0);
      const price = Number(t.price ?? ticker?.lastPrice ?? 0);

      if (!qty || !price) return;

      const signedQty = side === 'sell' ? -qty : qty;
      netPosition += signedQty;
      notional += qty * price;
    });

    const lastPrice = Number(ticker?.lastPrice ?? 0) || 0;
    const exposure = lastPrice ? netPosition * lastPrice : 0;

    // Leverage تقديري: notional / (|exposure| أو رقم ثابت صغير)
    const baseCapital = Math.max(Math.abs(exposure), notional * 0.2, 1);
    const leverage = notional / baseCapital;

    // Drawdown تقديري بسيط (يمكن استبداله ببيانات حقيقية لاحقاً)
    const priceChangePercent = Number(
      ticker?.priceChangePercent ?? 0,
    );
    const drawdown = priceChangePercent < 0 ? -priceChangePercent : 0;

    let riskLevel = 'ok';
    if (leverage > 6 || drawdown > 15) {
      riskLevel = 'danger';
    } else if (leverage > 3 || drawdown > 7) {
      riskLevel = 'warning';
    }

    return { exposure, leverage, drawdown, riskLevel };
  }, [trades, ticker]);

  const riskLabel =
    riskLevel === 'danger'
      ? 'High Risk'
      : riskLevel === 'warning'
      ? 'Elevated Risk'
      : 'Healthy';

  const riskClass =
    riskLevel === 'danger'
      ? 'risk-danger'
      : riskLevel === 'warning'
      ? 'risk-warning'
      : 'risk-ok';

  const meterScale =
    riskLevel === 'danger'
      ? 0.95
      : riskLevel === 'warning'
      ? 0.65
      : 0.35;

  return (
    <div className="risk-monitor-container">
      <div className="risk-header">
        <div>
          <div className="risk-title">Risk Monitor</div>
          <div className="risk-subtitle">
            Live snapshot of exposure, leverage and drawdown.
          </div>
        </div>
        <div className={`chip-pill ${riskClass}`}>{riskLabel}</div>
      </div>

      <div className="risk-grid">
        <div className="risk-card">
          <div className="risk-label">Net Exposure</div>
          <div className={`risk-value ${exposure >= 0 ? 'text-up' : 'text-down'}`}>
            {exposure ? exposure.toFixed(2) : '0.00'}
          </div>
          <div className="risk-tag">Estimated notional position</div>
        </div>

        <div className="risk-card">
          <div className="risk-label">Leverage (approx.)</div>
          <div className="risk-value">{leverage.toFixed(2)}×</div>
          <div className="risk-tag">
            Higher than 3× starts raising flags.
          </div>
        </div>

        <div className="risk-card">
          <div className="risk-label">Drawdown (est.)</div>
          <div className={`risk-value ${drawdown > 0 ? 'text-down' : ''}`}>
            {drawdown ? `${drawdown.toFixed(2)}%` : '0.00%'}
          </div>
          <div className="risk-tag">
            Based on recent price move vs. entry.
          </div>
        </div>
      </div>

      <div className="risk-meter">
        <div
          className="risk-meter-fill"
          style={{ transform: `scaleX(${meterScale})` }}
        />
      </div>
    </div>
  );
};

export default RiskMonitor;
