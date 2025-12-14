// frontend/src/components/trading/PositionStats.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PositionStats
 * ملخص سريع لإحصائيات المحفظة:
 * - إجمالي وعدد المراكز المفتوحة/المغلقة
 * - صافي الربح، الربح الإجمالي، الخسارة الإجمالية
 * - نسبة الفوز، أقصى تراجع، مستوى المخاطرة
 *
 * يعتمد على كائن stats القادم من PositionAnalyzer.calculatePositionStats().
 */
const PositionStats = ({ stats, compact = false }) => {
  const { t } = useTranslation();

  if (!stats) return null;

  const {
    totalPositions = 0,
    openPositions = 0,
    closedPositions = 0,
    netProfit = 0,
    grossProfit = 0,
    grossLoss = 0,
    winRate = 0,
    maxDrawdown = 0,
    riskLevel = 'low',
  } = stats;

  const profitClassColor =
    netProfit > 0
      ? '#4ade80'
      : netProfit < 0
      ? '#fca5a5'
      : '#e5e7eb';

  const drawdownColor =
    maxDrawdown > 0 ? '#facc15' : 'var(--qa-text-soft)';

  const containerStyle = {
    borderRadius: compact ? 16 : 20,
    padding: compact ? '8px 10px' : '10px 11px',
    border: '1px solid rgba(30,64,175,0.55)',
    background:
      'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: compact
      ? 'repeat(2, minmax(0, 1fr))'
      : 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 6,
    marginTop: 4,
  };

  return (
    <div className="position-stats" style={containerStyle}>
      {/* العنوان */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#e5e7eb',
            }}
          >
            {t('positions.overview', 'ملخص المراكز')}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft)',
            }}
          >
            {t(
              'positions.totalPositions',
              'إجمالي المراكز',
            )}
            : {totalPositions} ·{' '}
            {t('positions.openPositions', 'المفتوحة')}:{' '}
            {openPositions} ·{' '}
            {t('positions.closedPositions', 'المغلقة')}:{' '}
            {closedPositions}
          </div>
        </div>

        <RiskChip riskLevel={riskLevel} />
      </div>

      {/* شبكة الأرقام */}
      <div style={gridStyle}>
        <StatItem
          label={t('positions.netProfit', 'صافي الربح')}
          value={`${formatNumber(netProfit, 2)} USDT`}
          valueClass={{ color: profitClassColor }}
        />
        <StatItem
          label={t('positions.grossProfit', 'الربح الإجمالي')}
          value={`${formatNumber(grossProfit, 2)} USDT`}
        />
        <StatItem
          label={t('positions.grossLoss', 'الخسارة الإجمالية')}
          value={`${formatNumber(grossLoss, 2)} USDT`}
        />
        <StatItem
          label={t('positions.winRate', 'نسبة الفوز')}
          value={`${formatNumber(winRate, 2)}%`}
        />
        <StatItem
          label={t('positions.maxDrawdown', 'أقصى تراجع')}
          value={`${formatNumber(maxDrawdown, 2)} USDT`}
          valueClass={{ color: drawdownColor }}
        />
      </div>
    </div>
  );
};

const StatItem = ({ label, value, valueClass }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      fontSize: 11,
    }}
  >
    <div
      style={{
        color: 'var(--qa-text-soft)',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: '#e5e7eb',
        ...(valueClass || {}),
      }}
    >
      {value}
    </div>
  </div>
);

const RiskChip = ({ riskLevel }) => {
  let label = 'منخفض';
  let klass = {
    background: 'rgba(22,163,74,0.18)',
    color: '#bbf7d0',
    border: '1px solid rgba(22,163,74,0.9)',
  };

  if (riskLevel === 'medium') {
    label = 'متوسط';
    klass = {
      background: 'rgba(245,158,11,0.18)',
      color: '#fed7aa',
      border: '1px solid rgba(245,158,11,0.9)',
    };
  } else if (riskLevel === 'high') {
    label = 'عالٍ';
    klass = {
      background: 'rgba(249,115,22,0.18)',
      color: '#fed7aa',
      border: '1px solid rgba(249,115,22,0.9)',
    };
  } else if (riskLevel === 'critical') {
    label = 'حرِج';
    klass = {
      background: 'rgba(248,113,113,0.18)',
      color: '#fecaca',
      border: '1px solid rgba(248,113,113,0.9)',
    };
  }

  return (
    <span
      style={{
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 999,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        ...klass,
      }}
    >
      {label}
    </span>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PositionStats;
