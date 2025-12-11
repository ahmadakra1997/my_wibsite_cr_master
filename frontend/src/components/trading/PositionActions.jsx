// frontend/src/components/trading/PositionActions.jsx

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PositionActions
 * لوحة إجراءات للمركز المحدد أسفل قائمة المراكز:
 * - تعديل مستويات وقف الخسارة / جني الأرباح (اختياري)
 * - زر إغلاق المركز الآن
 * - زر العودة لقائمة المراكز
 *
 * لا تغيّر منطق التداول في PositionManager، فقط تستدعي:
 * onClose(positionId, closeData?)
 * onModify(positionId, modificationData?)
 * onDeselect()
 */
const PositionActions = ({
  position,
  onClose,
  onModify,
  onDeselect,
  theme = 'dark',
}) => {
  const { t } = useTranslation();

  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const hasActions = typeof onClose === 'function' || typeof onModify === 'function';

  if (!position || !hasActions) return null;

  const {
    id,
    symbol,
    side,
    size,
    quantity,
    entryPrice,
    leverage,
    status,
    calculatedFields,
  } = position;

  const isClosed = status === 'closed';

  const currentPrice = useMemo(() => {
    if (calculatedFields?.currentPrice != null) return calculatedFields.currentPrice;
    if (typeof position.marketPrice === 'number') return position.marketPrice;
    return Number(entryPrice) || 0;
  }, [calculatedFields, position.marketPrice, entryPrice]);

  const unrealizedPnl = calculatedFields?.unrealizedPnl ?? 0;
  const pnlPercentage = calculatedFields?.pnlPercentage ?? 0;

  const isLong = side === 'long';

  const containerClasses =
    theme === 'dark'
      ? 'bg-slate-900/90 border border-slate-700 shadow-2xl'
      : 'bg-slate-50 border border-slate-200 shadow-lg';

  const handleCloseNow = () => {
    if (!onClose || !id || isClosed) return;

    const confirmed = window.confirm(
      t(
        'positions.confirmClose',
        'هل أنت متأكد من إغلاق هذا المركز فوراً بسعر السوق الحالي؟',
      ),
    );

    if (!confirmed) return;

    // نرسل نوع الإغلاق على شكل بيانات اختيارية
    onClose(id, { type: 'market' });
  };

  const handleApplyChanges = () => {
    if (!onModify || !id || isClosed) return;

    const modificationData = {};

    if (stopLoss && !Number.isNaN(Number(stopLoss))) {
      modificationData.stopLoss = Number(stopLoss);
    }

    if (takeProfit && !Number.isNaN(Number(takeProfit))) {
      modificationData.takeProfit = Number(takeProfit);
    }

    if (Object.keys(modificationData).length === 0) return;

    onModify(id, modificationData);
  };

  const handleReset = () => {
    setStopLoss('');
    setTakeProfit('');
  };

  const handleDeselectClick = () => {
    if (onDeselect) onDeselect();
  };

  return (
    <div
      className={`rounded-2xl px-3.5 py-3 mt-3 ${containerClasses}`}
      data-testid="position-actions"
    >
      {/* رأس اللوحة: معلومات سريعة عن المركز */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-100">
              {symbol}
            </span>
            <span
              className={`text-[0.7rem] px-2 py-0.5 rounded-full border ${
                isLong
                  ? 'border-emerald-400/60 text-emerald-300 bg-emerald-900/40'
                  : 'border-rose-400/60 text-rose-300 bg-rose-900/40'
              }`}
            >
              {isLong
                ? t('positions.long', 'شراء (Long)')
                : t('positions.short', 'بيع (Short)')}
            </span>
            {leverage && (
              <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-600 text-slate-300">
                {leverage}x
              </span>
            )}
          </div>

          <div className="text-[0.7rem] text-slate-400">
            {t('positions.size', 'الحجم')}:{' '}
            <span className="text-slate-200">
              {formatNumber(size || quantity, 4)} {symbol}
            </span>
          </div>

          <div className="text-[0.7rem] text-slate-400">
            {t('positions.entryPrice', 'سعر الدخول')}:{' '}
            <span className="text-slate-200">
              {formatNumber(entryPrice, 4)}
            </span>
          </div>
        </div>

        <div className="text-right space-y-1 text-[0.7rem]">
          <div className="text-slate-400">
            {t('positions.currentPrice', 'السعر الحالي')}:{' '}
            <span className="text-slate-200">
              {formatNumber(currentPrice, 4)}
            </span>
          </div>
          <div className="text-slate-400">
            {t('positions.unrealizedPnl', 'الربح/الخسارة الحالية')}:{' '}
            <span
              className={`font-semibold ${
                unrealizedPnl > 0
                  ? 'text-emerald-300'
                  : unrealizedPnl < 0
                    ? 'text-rose-300'
                    : 'text-slate-200'
              }`}
            >
              {formatNumber(unrealizedPnl, 2)} USDT
              <span className="ml-1">
                ({formatNumber(pnlPercentage, 2)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* نموذج SL / TP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-[0.75rem]">
        <div>
          <label className="block mb-1 text-slate-300">
            {t('positions.stopLoss', 'وقف الخسارة')}
          </label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder={t(
              'positions.stopLossPlaceholder',
              'مثال: 24850.5',
            )}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
          />
        </div>

        <div>
          <label className="block mb-1 text-slate-300">
            {t('positions.takeProfit', 'جني الأرباح')}
          </label>
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder={t(
              'positions.takeProfitPlaceholder',
              'مثال: 27600.0',
            )}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
          />
        </div>
      </div>

      {/* الأزرار */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.72rem]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleApplyChanges}
            disabled={isClosed}
            className={`px-3 py-1.5 rounded-full text-[0.72rem] font-semibold text-slate-950 shadow-lg bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition ${
              isClosed ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            💾 {t('positions.applyChanges', 'حفظ التعديلات')}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-full border border-slate-600 text-slate-200 hover:bg-slate-800/80 transition"
          >
            ♻ {t('positions.reset', 'إعادة التعيين')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCloseNow}
            disabled={isClosed}
            className={`px-3 py-1.5 rounded-full text-[0.72rem] font-semibold text-slate-50 bg-rose-600/90 hover:bg-rose-500 shadow-lg transition ${
              isClosed ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            ✖ {t('positions.closeNow', 'إغلاق المركز الآن')}
          </button>

          <button
            type="button"
            onClick={handleDeselectClick}
            className="px-3 py-1.5 rounded-full text-[0.72rem] border border-slate-600 text-slate-300 hover:bg-slate-800/80 transition"
          >
            ⬅ {t('positions.backToList', 'العودة لقائمة المراكز')}
          </button>
        </div>
      </div>
    </div>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PositionActions;
