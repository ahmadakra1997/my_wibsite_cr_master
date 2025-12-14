// frontend/src/components/trading/PositionCard.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PositionCard
 * بطاقة تعرض تفاصيل مركز واحد:
 * - الرمز، الاتجاه، الرافعة
 * - الحجم، سعر الدخول، السعر الحالي
 * - الربح/الخسارة غير المحققة ونسبتها
 * - ملخص المخاطر (riskLevel / riskScore)
 *
 * لا تغيّر أي منطق في PositionManager، فقط تعرض البيانات التي يمررها.
 */
const PositionCard = ({
  position,
  marketData,
  isSelected = false,
  onSelect,
  onClose,
  onModify,
  theme = 'dark',
}) => {
  const { t } = useTranslation();

  if (!position) return null;

  const {
    id,
    symbol,
    side,
    size,
    quantity,
    entryPrice,
    leverage,
    status,
    riskAnalysis,
    calculatedFields,
  } = position;

  // القيم المحسوبة (تأتي من PositionManager عبر calculatedFields)
  const {
    currentPrice,
    unrealizedPnl,
    pnlPercentage,
    liquidationDistance,
    positionValue,
    marginUsed,
  } = useMemo(() => {
    if (calculatedFields) return calculatedFields;

    // fallback بسيط جداً في حال لم تُمرّر calculatedFields
    const mktPrice =
      marketData?.[symbol]?.price || Number(entryPrice) || 0;
    const s = Number(size || quantity || 0);
    const e = Number(entryPrice || 0);
    const lev = Number(leverage || 1);
    const diff = mktPrice - e;
    const uPnl = side === 'long' ? diff * s : -diff * s;
    const pct = s && e ? (uPnl / (s * e)) * 100 : 0;

    return {
      currentPrice: mktPrice,
      unrealizedPnl: uPnl,
      pnlPercentage: pct,
      liquidationDistance: null,
      positionValue: s * mktPrice,
      marginUsed: s && lev ? (s * e) / lev : 0,
    };
  }, [
    calculatedFields,
    marketData,
    symbol,
    size,
    quantity,
    entryPrice,
    leverage,
    side,
  ]);

  const formatted = useMemo(
    () => ({
      size: formatNumber(size || quantity, 4),
      entryPrice: formatNumber(entryPrice, 4),
      currentPrice: formatNumber(currentPrice, 4),
      unrealizedPnl: formatNumber(unrealizedPnl, 2),
      pnlPercentage: formatNumber(pnlPercentage, 2),
      positionValue: formatNumber(positionValue, 2),
      marginUsed: formatNumber(marginUsed, 2),
      liquidationDistance:
        liquidationDistance != null
          ? formatNumber(liquidationDistance, 2)
          : null,
    }),
    [
      size,
      quantity,
      entryPrice,
      currentPrice,
      unrealizedPnl,
      pnlPercentage,
      positionValue,
      marginUsed,
      liquidationDistance,
    ],
  );

  const handleSelect = () => {
    if (onSelect) onSelect(position);
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    if (onClose) onClose(id, { type: 'market' });
  };

  const handleModifyClick = (e) => {
    e.stopPropagation();
    if (onModify) onModify(position);
  };

  const isLong = side === 'long';
  const isClosed = status === 'closed';
  const pnlPositive = unrealizedPnl > 0;

  const riskLevel = riskAnalysis?.riskLevel ?? 'low';
  const riskScore = riskAnalysis?.riskScore ?? 0;

  const borderColor = isSelected
    ? 'rgba(45,212,191,0.9)'
    : isLong
    ? 'rgba(34,197,94,0.8)'
    : 'rgba(248,113,113,0.8)';

  const sideStripe = isLong
    ? 'linear-gradient(180deg, #22c55e, #4ade80)'
    : 'linear-gradient(180deg, #fb7185, #f97373)';

  const cardBackground =
    theme === 'dark'
      ? 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.96))'
      : 'linear-gradient(135deg, #f9fafb, #e0f2fe)';

  return (
    <article
      className="position-card"
      onClick={handleSelect}
      role="button"
      style={{
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 18,
        border: `1px solid ${borderColor}`,
        background: cardBackground,
        boxShadow: isSelected
          ? '0 0 0 1px rgba(45,212,191,0.5), 0 18px 35px rgba(15,23,42,0.9)'
          : '0 14px 30px rgba(15,23,42,0.85)',
        cursor: 'pointer',
        overflow: 'hidden',
        minHeight: 92,
      }}
    >
      {/* شريط جانبي يوضح الاتجاه */}
      <div
        style={{
          width: 4,
          background: sideStripe,
        }}
      />

      {/* محتوى الكارت */}
      <div
        style={{
          flex: 1,
          padding: '8px 10px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 2fr)',
          gap: 8,
        }}
      >
        {/* العمود الأيسر: معلومات أساسية */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* السطر الأول: الرمز + الحالة + الرافعة */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#e5e7eb',
              }}
            >
              {symbol || '—'}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--qa-text-soft)',
              }}
            >
              {isLong
                ? t('positions.long', 'شراء (Long)')
                : t('positions.short', 'بيع (Short)')}
            </span>
            {leverage && (
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 7px',
                  borderRadius: 999,
                  border: '1px solid rgba(56,189,248,0.7)',
                  color: '#7dd3fc',
                }}
              >
                {leverage}x
              </span>
            )}
            <span
              style={{
                marginInlineStart: 'auto',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.6)',
                color: isClosed ? '#e5e7eb' : '#bbf7d0',
                background: isClosed
                  ? 'rgba(15,23,42,0.9)'
                  : 'rgba(22,163,74,0.25)',
              }}
            >
              {isClosed
                ? t('positions.closed', 'مغلق')
                : t('positions.open', 'مفتوح')}
            </span>
          </div>

          {/* السطر الثاني: الأسعار */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 6,
              marginTop: 2,
            }}
          >
            <InfoItem
              label={t('positions.size', 'الحجم')}
              value={`${formatted.size || 0} ${
                symbol || ''
              }`}
            />
            <InfoItem
              label={t('positions.entryPrice', 'سعر الدخول')}
              value={formatted.entryPrice}
            />
            <InfoItem
              label={t('positions.currentPrice', 'السعر الحالي')}
              value={formatted.currentPrice}
            />
          </div>

          {/* السطر الثالث: القيمة / الهامش */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 6,
            }}
          >
            <InfoItem
              label={t(
                'positions.positionValue',
                'القيمة الحالية للمركز',
              )}
              value={`${formatted.positionValue} USDT`}
            />
            {marginUsed > 0 && (
              <InfoItem
                label={t(
                  'positions.marginUsed',
                  'الهامش المستخدم',
                )}
                value={`${formatted.marginUsed} USDT`}
              />
            )}
          </div>
        </div>

        {/* العمود الأيمن: PnL + مخاطر + أزرار */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'flex-end',
          }}
        >
          {/* الربح / الخسارة */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 2,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--qa-text-soft)',
              }}
            >
              {t(
                'positions.unrealizedPnl',
                'ربح/خسارة غير محققة',
              )}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: pnlPositive ? '#4ade80' : '#fca5a5',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatted.unrealizedPnl} USDT{' '}
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                }}
              >
                ({formatted.pnlPercentage}%)
              </span>
            </div>

            {formatted.liquidationDistance != null && (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  color: 'var(--qa-text-soft)',
                  textAlign: 'right',
                }}
              >
                {t(
                  'positions.liquidationDistance',
                  'المسافة عن التصفية',
                )}{' '}
                {formatted.liquidationDistance}
                %{' '}
                {t(
                  'positions.liquidationDistanceSuffix',
                  'عن سعر التصفية التقريبي',
                )}
              </div>
            )}
          </div>

          {/* شارة المخاطر */}
          <RiskBadge
            riskLevel={riskLevel}
            riskScore={riskScore}
          />

          {/* الأزرار السريعة */}
          {!isClosed && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {onModify && (
                <button
                  type="button"
                  onClick={handleModifyClick}
                  style={{
                    fontSize: 11,
                    padding: '4px 9px',
                    borderRadius: 999,
                    border:
                      '1px solid rgba(56,189,248,0.9)',
                    background:
                      'linear-gradient(135deg, rgba(8,47,73,0.95), rgba(30,64,175,0.98))',
                    color: '#e0f2fe',
                    cursor: 'pointer',
                  }}
                >
                  {t('positions.modify', 'تعديل')}
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={handleCloseClick}
                  style={{
                    fontSize: 11,
                    padding: '4px 9px',
                    borderRadius: 999,
                    border:
                      '1px solid rgba(248,113,113,0.85)',
                    background:
                      'linear-gradient(135deg, rgba(127,29,29,0.95), rgba(153,27,27,0.98))',
                    color: '#fee2e2',
                    cursor: 'pointer',
                  }}
                >
                  {t('positions.close', 'إغلاق')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const InfoItem = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      fontSize: 11,
    }}
  >
    <span
      style={{
        color: 'var(--qa-text-soft)',
      }}
    >
      {label}
    </span>
    <span
      style={{
        color: '#e5e7eb',
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
  </div>
);

const RiskBadge = ({ riskLevel, riskScore }) => {
  let label = 'منخفض';
  let bg = 'rgba(22,163,74,0.18)';
  let border = 'rgba(22,163,74,0.9)';
  let color = '#bbf7d0';

  if (riskLevel === 'medium') {
    label = 'متوسط';
    bg = 'rgba(245,158,11,0.2)';
    border = 'rgba(245,158,11,0.9)';
    color = '#fed7aa';
  } else if (riskLevel === 'high') {
    label = 'عالٍ';
    bg = 'rgba(249,115,22,0.18)';
    border = 'rgba(249,115,22,0.9)';
    color = '#fed7aa';
  } else if (riskLevel === 'critical') {
    label = 'حرِج';
    bg = 'rgba(248,113,113,0.18)';
    border = 'rgba(248,113,113,0.9)';
    color = '#fecaca';
  }

  return (
    <span
      style={{
        alignSelf: 'flex-end',
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 999,
        background: bg,
        border: `1px solid ${border}`,
        color,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {label} · {Math.round(riskScore || 0)}
    </span>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PositionCard;
