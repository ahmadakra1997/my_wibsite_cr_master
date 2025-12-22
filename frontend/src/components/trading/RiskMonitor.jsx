// frontend/src/components/trading/RiskMonitor.jsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import './RiskMonitor.css';

/**
 * RiskMonitor
 * يعرض:
 * - Net exposure (صافي التعرض)
 * - Leverage تقديري
 * - Drawdown تقديري مبني على تغير السعر
 */
const RiskMonitor = () => {
  // ✅ FIX: trades في slice موجودة داخل tradeHistory.trades :contentReference[oaicite:23]{index=23}
  const trades = useSelector((state) => state?.trading?.tradeHistory?.trades ?? state?.trading?.trades ?? []);
  const ticker = useSelector((state) => state?.trading?.ticker ?? null);

  const { exposure, leverage, drawdown, riskLevel } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { exposure: 0, leverage: 1, drawdown: 0, riskLevel: 'ok' };
    }

    let netPosition = 0; // الكمية الصافية
    let notional = 0; // القيمة الاسمية التقريبية

    trades.forEach((t) => {
      const side = String(t?.side || '').toLowerCase();
      const qty = Number(t?.quantity ?? t?.amount ?? 0);
      const price = Number(t?.price ?? ticker?.lastPrice ?? ticker?.price ?? 0);

      if (!qty || !price) return;

      const signedQty = side === 'sell' ? -qty : qty;
      netPosition += signedQty;
      notional += qty * price;
    });

    const lastPrice = Number(ticker?.lastPrice ?? ticker?.price ?? 0) || 0;
    const exposure = lastPrice ? netPosition * lastPrice : 0;

    // Leverage تقديري
    const baseCapital = Math.max(Math.abs(exposure), notional * 0.2, 1);
    const leverage = notional / baseCapital;

    // Drawdown تقديري بسيط من تغير السعر 24h
    const priceChangePercent = Number(ticker?.priceChangePercent ?? 0);
    const drawdown = priceChangePercent < 0 ? -priceChangePercent : 0;

    let riskLevel = 'ok';
    if (leverage > 6 || drawdown > 15) riskLevel = 'danger';
    else if (leverage > 3 || drawdown > 7) riskLevel = 'warning';

    return { exposure, leverage, drawdown, riskLevel };
  }, [trades, ticker]);

  const riskLabel = riskLevel === 'danger' ? 'High Risk' : riskLevel === 'warning' ? 'Elevated Risk' : 'Healthy';
  const riskClass = riskLevel === 'danger' ? 'risk-danger' : riskLevel === 'warning' ? 'risk-warning' : 'risk-ok';

  const meterScale = riskLevel === 'danger' ? 0.95 : riskLevel === 'warning' ? 0.65 : 0.35;
  const exposureClass = exposure >= 0 ? 'text-up' : 'text-down';
  const drawdownClass = drawdown > 0 ? 'text-down' : '';

  return (
    <div className={`risk-monitor ${riskClass}`} style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>Risk Monitor</div>
          <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.92)', fontSize: 12 }}>
            Live snapshot of exposure, leverage and drawdown.
          </div>
        </div>

        <div style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(148,163,184,0.08)', color: 'rgba(226,232,240,0.92)', fontWeight: 900, fontSize: 12 }}>
          {riskLabel}
        </div>
      </div>

      {/* Meter */}
      <div style={{ height: 10, borderRadius: 999, background: 'rgba(148,163,184,0.14)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(meterScale * 100)}%`, background: 'linear-gradient(90deg, rgba(56,189,248,0.55), rgba(0,255,136,0.55), rgba(255,59,92,0.45))' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
        <div style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
          <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Net Exposure</div>
          <div className={exposureClass} style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>
            {exposure ? exposure.toFixed(2) : '0.00'}
          </div>
          <div style={{ color: 'rgba(148,163,184,0.86)', fontSize: 12, marginTop: 4 }}>Estimated notional exposure.</div>
        </div>

        <div style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
          <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Leverage (approx.)</div>
          <div style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>
            {Number.isFinite(leverage) ? leverage.toFixed(2) : '0.00'}×
          </div>
          <div style={{ color: 'rgba(148,163,184,0.86)', fontSize: 12, marginTop: 4 }}>Above 3× starts raising flags.</div>
        </div>

        <div style={{ padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(15,23,42,0.55)' }}>
          <div style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Drawdown (est.)</div>
          <div className={drawdownClass} style={{ fontWeight: 900, color: 'rgba(226,232,240,0.95)' }}>
            {drawdown ? `${drawdown.toFixed(2)}%` : '0.00%'}
          </div>
          <div style={{ color: 'rgba(148,163,184,0.86)', fontSize: 12, marginTop: 4 }}>Based on recent price move.</div>
        </div>
      </div>
    </div>
  );
};

export default RiskMonitor;
