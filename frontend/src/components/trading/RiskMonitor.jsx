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
  const trades = useSelector((state) => state?.trading?.trades ?? []);
  const ticker = useSelector((state) => state?.trading?.ticker ?? null);

  const { exposure, leverage, drawdown, riskLevel } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { exposure: 0, leverage: 1, drawdown: 0, riskLevel: 'ok' };
    }

    let netPosition = 0; // الكمية الصافية
    let notional = 0; // القيمة الاسمية التقريبية

    trades.forEach((t) => {
      const side = String(t?.side || '').toLowerCase();
      const qty = Number(t?.quantity ?? 0);
      const price = Number(t?.price ?? ticker?.lastPrice ?? 0);
      if (!qty || !price) return;

      const signedQty = side === 'sell' ? -qty : qty;
      netPosition += signedQty;
      notional += qty * price;
    });

    const lastPrice = Number(ticker?.lastPrice ?? 0) || 0;
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
    riskLevel === 'danger' ? 0.95 : riskLevel === 'warning' ? 0.65 : 0.35;

  const exposureClass = exposure >= 0 ? 'text-up' : 'text-down';
  const drawdownClass = drawdown > 0 ? 'text-down' : '';

  return (
    <div className={`risk-root ${riskClass}`} role="region" aria-label="Risk monitor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <div style={{ fontWeight: 800, color: '#e5f4ff' }}>Risk Monitor</div>
        <div
          style={{
            borderRadius: 999,
            padding: '4px 10px',
            border:
              riskLevel === 'danger'
                ? '1px solid rgba(251,59,127,0.35)'
                : riskLevel === 'warning'
                ? '1px solid rgba(250,204,21,0.35)'
                : '1px solid rgba(0,245,155,0.30)',
            background:
              riskLevel === 'danger'
                ? 'rgba(251,59,127,0.08)'
                : riskLevel === 'warning'
                ? 'rgba(250,204,21,0.07)'
                : 'rgba(0,245,155,0.06)',
            fontSize: 11,
            color: '#e5f4ff',
            whiteSpace: 'nowrap',
          }}
        >
          {riskLabel}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--qa-text-muted, #7b8ca8)', marginTop: 4 }}>
        Live snapshot of exposure, leverage and drawdown.
      </div>

      {/* Meter */}
      <div
        style={{
          marginTop: 10,
          height: 10,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            transformOrigin: 'left center',
            transform: `scaleX(${meterScale})`,
            background:
              'linear-gradient(90deg, rgba(0,229,255,0.55), rgba(0,245,155,0.55), rgba(251,59,127,0.55))',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 10 }}>
        <div style={{ borderRadius: 12, padding: 10, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)' }}>Net Exposure</div>
          <div className={exposureClass} style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
            {exposure ? exposure.toFixed(2) : '0.00'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--qa-text-muted, #7b8ca8)', marginTop: 4 }}>
            Estimated notional exposure.
          </div>
        </div>

        <div style={{ borderRadius: 12, padding: 10, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)' }}>Leverage (approx.)</div>
          <div style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginTop: 4, color: '#e5f4ff' }}>
            {Number.isFinite(leverage) ? leverage.toFixed(2) : '0.00'}×
          </div>
          <div style={{ fontSize: 11, color: 'var(--qa-text-muted, #7b8ca8)', marginTop: 4 }}>
            Above 3× starts raising flags.
          </div>
        </div>

        <div style={{ borderRadius: 12, padding: 10, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 11, color: 'var(--qa-text-soft, #93a4be)' }}>Drawdown (est.)</div>
          <div className={drawdownClass} style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginTop: 4, color: '#e5f4ff' }}>
            {drawdown ? `${drawdown.toFixed(2)}%` : '0.00%'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--qa-text-muted, #7b8ca8)', marginTop: 4 }}>
            Based on recent price move.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMonitor;
