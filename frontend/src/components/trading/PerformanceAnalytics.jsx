// frontend/src/components/trading/PerformanceAnalytics.jsx

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PositionAnalyzer from '../../services/positionAnalyzer';

/**
 * PerformanceAnalytics
 * لوحة تحليلات الأداء مبنية على المراكز في trading.positions
 * باستخدام PositionAnalyzer في الفرونت.
 */
const PerformanceAnalytics = () => {
  const { t } = useTranslation();

  const { positions = [], isLoading } = useSelector((state) => {
    const trading = state?.trading || {};
    return {
      positions: trading.positions || [],
      isLoading: trading.isLoading || false,
    };
  });

  const analyzer = useMemo(() => new PositionAnalyzer(), []);

  const stats = useMemo(
    () =>
      analyzer.calculatePositionStats(
        Array.isArray(positions) ? positions : [],
      ),
    [positions, analyzer],
  );

  const {
    totalPositions = 0,
    openPositions = 0,
    closedPositions = 0,
    netProfit = 0,
    grossProfit = 0,
    grossLoss = 0,
    winRate = 0,
    maxDrawdown = 0,
    bestTrade,
    worstTrade,
  } = stats || {};

  const netProfitColor =
    netProfit > 0
      ? '#4ade80'
      : netProfit < 0
      ? '#fca5a5'
      : '#e5e7eb';

  const ddColor =
    maxDrawdown > 0 ? '#facc15' : 'var(--qa-text-soft)';

  const metrics = [
    {
      key: 'netProfit',
      label: t('analytics.netProfit', 'صافي الربح'),
      value: formatNumber(netProfit, 2),
      suffix: 'USDT',
      accentColor: netProfitColor,
    },
    {
      key: 'winRate',
      label: t('analytics.winRate', 'نسبة الصفقات الرابحة'),
      value: formatNumber(winRate, 2),
      suffix: '%',
    },
    {
      key: 'totalPositions',
      label: t('analytics.totalPositions', 'إجمالي المراكز'),
      value: totalPositions,
      suffix: '',
    },
    {
      key: 'openPositions',
      label: t('analytics.openPositions', 'مفتوحة الآن'),
      value: openPositions,
      suffix: '',
    },
    {
      key: 'closedPositions',
      label: t('analytics.closedPositions', 'مغلقة'),
      value: closedPositions,
      suffix: '',
    },
    {
      key: 'maxDrawdown',
      label: t('analytics.maxDrawdown', 'أقصى تراجع'),
      value: formatNumber(maxDrawdown, 2),
      suffix: 'USDT',
      accentColor: ddColor,
    },
  ];

  const containerStyle = {
    borderRadius: 22,
    padding: 12,
    border: '1px solid rgba(30,64,175,0.6)',
    background:
      'radial-gradient(circle at top, rgba(45,212,191,0.1), rgba(15,23,42,0.98))',
    boxShadow: '0 16px 36px rgba(15,23,42,0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };

  return (
    <section className="performance-analytics" style={containerStyle}>
      {/* رأس اللوحة */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#e5e7eb',
            }}
          >
            {t('analytics.title', 'تحليلات الأداء')}
          </h3>
          <p
            style={{
              fontSize: 11,
              color: 'var(--qa-text-muted)',
              maxWidth: 420,
            }}
          >
            {t(
              'analytics.subtitle',
              'نظرة شاملة على نتائج تداولاتك: الربحية، نسبة الفوز، وأقصى تراجع في الحساب.',
            )}
          </p>
        </div>

        <div
          style={{
            textAlign: 'end',
            fontSize: 11,
            color: 'var(--qa-text-soft)',
          }}
        >
          {isLoading && (
            <div
              style={{
                marginBottom: 4,
              }}
            >
              {t(
                'analytics.loading',
                'جاري تحديث بيانات الأداء...',
              )}
            </div>
          )}
          <div>
            {t(
              'analytics.totalTradesLabel',
              'إجمالي المراكز المسجّلة',
            )}
            :{' '}
            <strong style={{ color: '#e5e7eb' }}>
              {totalPositions}
            </strong>
          </div>
        </div>
      </header>

      {/* شبكة المقاييس الأساسية */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          marginTop: 6,
        }}
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </div>

      {/* أفضل / أسوأ صفقة */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 8,
          marginTop: 10,
        }}
      >
        <TradeHighlight
          type="best"
          title={t('analytics.bestTrade', 'أفضل صفقة')}
          icon="🏆"
          trade={bestTrade}
        />
        <TradeHighlight
          type="worst"
          title={t('analytics.worstTrade', 'أسوأ صفقة')}
          icon="⚠️"
          trade={worstTrade}
        />
      </div>
    </section>
  );
};

const MetricCard = ({ metric }) => {
  const { label, value, suffix, accentColor } = metric;

  const cardStyle = {
    borderRadius: 14,
    padding: '8px 9px',
    border: '1px solid rgba(30,64,175,0.55)',
    background:
      'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,1))',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  return (
    <div style={cardStyle}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--qa-text-soft)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: accentColor || '#e5e7eb',
        }}
      >
        {value}{' '}
        {suffix && (
          <span
            style={{
              fontSize: 11,
              opacity: 0.8,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const TradeHighlight = ({ trade, type, title, icon }) => {
  const { t } = useTranslation();

  if (!trade) {
    return (
      <div
        style={{
          borderRadius: 14,
          padding: '8px 9px',
          border: '1px dashed rgba(148,163,184,0.6)',
          background: 'rgba(15,23,42,0.98)',
          fontSize: 11,
          color: 'var(--qa-text-soft)',
        }}
      >
        {type === 'best'
          ? t(
              'analytics.noBestTrade',
              'لم يتم تسجيل صفقة رابحة بعد.',
            )
          : t(
              'analytics.noWorstTrade',
              'لم يتم تسجيل صفقة خاسرة بعد.',
            )}
      </div>
    );
  }

  const pnl = Number(trade.realizedPnl || trade.pnl || 0);

  const pnlColor =
    pnl > 0 ? '#4ade80' : pnl < 0 ? '#fca5a5' : '#e5e7eb';

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      const d = value instanceof Date ? value : new Date(value);
      return d.toLocaleString();
    } catch {
      return String(value);
    }
  };

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '8px 9px',
        border: '1px solid rgba(30,64,175,0.7)',
        background:
          'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,1))',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 11,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#e5e7eb',
        }}
      >
        <span>{icon}</span>
        <span>{title}</span>
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: pnlColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pnl.toFixed(2)} USDT
      </div>

      <div
        style={{
          color: 'var(--qa-text-soft)',
        }}
      >
        {t('analytics.symbol', 'الرمز')}: {trade.symbol || '—'}
      </div>

      <div
        style={{
          color: 'var(--qa-text-soft)',
        }}
      >
        {t('analytics.side', 'الاتجاه')}:{' '}
        {trade.side === 'long'
          ? t('positions.long', 'شراء (Long)')
          : trade.side === 'short'
          ? t('positions.short', 'بيع (Short)')
          : '—'}
      </div>

      <div
        style={{
          color: 'var(--qa-text-soft)',
        }}
      >
        {t('analytics.closedAt', 'تاريخ الإغلاق')}:{' '}
        {formatDate(trade.closedAt)}
      </div>
    </div>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PerformanceAnalytics;
