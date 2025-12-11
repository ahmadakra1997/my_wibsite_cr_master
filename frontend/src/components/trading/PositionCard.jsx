// frontend/src/components/trading/PositionCard.jsx

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PositionCard
 * بطاقة تعرض تفاصيل مركز واحد:
 * - الرمز، الاتجاه (Long/Short)، الرافعة
 * - حجم المركز، سعر الدخول، السعر الحالي
 * - الربح/الخسارة غير المحققة ونسبتها
 * - ملخص سريع عن المخاطر (riskScore / riskLevel)
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

    // fallback بسيط جداً في حال لم تُمرّر calculatedFields لأي سبب
    const mktPrice = marketData?.[symbol]?.price || Number(entryPrice) || 0;
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
  }, [calculatedFields, marketData, symbol, size, quantity, entryPrice, leverage, side]);

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
    [size, quantity, entryPrice, currentPrice, unrealizedPnl, pnlPercentage, positionValue, marginUsed, liquidationDistance],
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

  const cardBorder =
    theme === 'dark' ? 'border-slate-700' : 'border-slate-300';
  const selectedRing =
    theme === 'dark' ? 'ring-emerald-400/70' : 'ring-emerald-500/80';

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={`relative w-full text-left rounded-xl border ${cardBorder} bg-slate-900/80 hover:bg-slate-900/95 transition shadow-lg ${
        isSelected ? `ring-2 ${selectedRing}` : ''
      }`}
      data-testid={`position-card-${id}`}
    >
      {/* شريط جانبي يوضح الاتجاه */}
      <div
        className={`absolute inset-y-0 right-0 w-1.5 rounded-r-xl ${
          isLong ? 'bg-emerald-400' : 'bg-rose-400'
        }`}
      />

      <div className="px-3.5 py-3 space-y-2.5 pr-4">
        {/* السطر الأول: الرمز + الحالة + الرافعة */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              {symbol}
            </span>
            <span
              className={`text-[0.7rem] px-2 py-0.5 rounded-full border ${
                isLong
                  ? 'border-emerald-400/60 text-emerald-300'
                  : 'border-rose-400/60 text-rose-300'
              }`}
            >
              {isLong ? t('positions.long', 'شراء (Long)') : t('positions.short', 'بيع (Short)')}
            </span>
            {leverage && (
              <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-600 text-slate-300">
                {leverage}x
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[0.7rem]">
            <RiskBadge riskLevel={riskLevel} riskScore={riskScore} />
            <span
              className={`px-2 py-0.5 rounded-full border text-[0.68rem] ${
                isClosed
                  ? 'border-slate-600 text-slate-300'
                  : 'border-sky-500/60 text-sky-300'
              }`}
            >
              {isClosed ? t('positions.closed', 'مغلق') : t('positions.open', 'مفتوح')}
            </span>
          </div>
        </div>

        {/* السطر الثاني: الأسعار */}
        <div className="grid grid-cols-2 gap-3 text-[0.72rem]">
          <InfoItem
            label={t('positions.entryPrice', 'سعر الدخول')}
            value={formatted.entryPrice}
          />
          <InfoItem
            label={t('positions.currentPrice', 'السعر الحالي')}
            value={formatted.currentPrice}
          />
          <InfoItem
            label={t('positions.positionSize', 'حجم المركز')}
            value={formatted.size}
          />
          <InfoItem
            label={t('positions.positionValue', 'قيمة المركز')}
            value={`${formatted.positionValue} USDT`}
          />
        </div>

        {/* السطر الثالث: الربح/الخسارة + مسافة التصفية */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[0.72rem]">
          <div>
            <div className="text-slate-400">
              {t('positions.unrealizedPnl', 'ربح/خسارة غير محققة')}
            </div>
            <div
              className={`font-semibold ${
                pnlPositive
                  ? 'text-emerald-300'
                  : unrealizedPnl < 0
                    ? 'text-rose-300'
                    : 'text-slate-200'
              }`}
            >
              {formatted.unrealizedPnl} USDT
              <span className="ml-1">
                ({formatted.pnlPercentage}
                %)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {formatted.liquidationDistance != null && (
              <>
                <span className="text-slate-400">
                  {t('positions.liquidationDistance', 'المسافة عن التصفية')}
                </span>
                <span className="text-xs text-slate-200">
                  {formatted.liquidationDistance}%{' '}
                  {t('positions.liquidationDistanceSuffix', 'عن سعر التصفية التقريبي')}
                </span>
              </>
            )}
            {marginUsed > 0 && (
              <span className="text-[0.68rem] text-slate-400">
                {t('positions.marginUsed', 'الهامش المستخدم')}: {formatted.marginUsed} USDT
              </span>
            )}
          </div>
        </div>

        {/* الأزرار السريعة */}
        {!isClosed && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleModifyClick}
              className="text-[0.7rem] px-2.5 py-1 rounded-full border border-slate-600 text-slate-200 hover:bg-slate-800/80 transition"
            >
              {t('positions.modify', 'تعديل')}
            </button>
            <button
              type="button"
              onClick={handleCloseClick}
              className="text-[0.7rem] px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-500 text-slate-50 font-semibold transition"
            >
              {t('positions.close', 'إغلاق')}
            </button>
          </div>
        )}
      </div>
    </button>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <div className="text-slate-400 text-[0.7rem] mb-0.5">{label}</div>
    <div className="text-slate-100 text-xs font-medium">{value}</div>
  </div>
);

const RiskBadge = ({ riskLevel, riskScore }) => {
  let label = 'منخفض';
  let color = 'bg-emerald-900/70 text-emerald-300 border-emerald-500/60';

  if (riskLevel === 'medium') {
    label = 'متوسط';
    color = 'bg-amber-900/70 text-amber-200 border-amber-500/60';
  } else if (riskLevel === 'high') {
    label = 'عالٍ';
    color = 'bg-orange-900/70 text-orange-200 border-orange-500/60';
  } else if (riskLevel === 'critical') {
    label = 'حرِج';
    color = 'bg-rose-900/70 text-rose-200 border-rose-500/60';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[0.68rem] ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{label}</span>
      <span className="opacity-80">· {Math.round(riskScore || 0)}</span>
    </span>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PositionCard;
