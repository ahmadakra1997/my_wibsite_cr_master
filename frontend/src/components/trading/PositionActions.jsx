// frontend/src/components/trading/PositionActions.jsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PositionActions
 * لوحة إجراءات للمركز المحدد أسفل قائمة المراكز:
 * - تعديل SL / TP
 * - إغلاق المركز الآن بسعر السوق
 * - العودة لقائمة المراكز
 *
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

  const hasActions =
    typeof onClose === 'function' ||
    typeof onModify === 'function';

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
  const isLong = side === 'long';

  const currentPrice = useMemo(() => {
    if (calculatedFields?.currentPrice != null) {
      return calculatedFields.currentPrice;
    }
    if (typeof position.marketPrice === 'number') {
      return position.marketPrice;
    }
    return Number(entryPrice) || 0;
  }, [calculatedFields, position.marketPrice, entryPrice]);

  const unrealizedPnl =
    calculatedFields?.unrealizedPnl ?? 0;
  const pnlPercentage =
    calculatedFields?.pnlPercentage ?? 0;

  const pnlPositive = unrealizedPnl > 0;

  const containerBg =
    theme === 'dark'
      ? 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.98))'
      : 'linear-gradient(135deg, #f9fafb, #e0f2fe)';

  const containerBorder =
    theme === 'dark'
      ? '1px solid rgba(30,64,175,0.7)'
      : '1px solid rgba(148,163,184,0.6)';

  const handleCloseNow = () => {
    if (!onClose || !id || isClosed) return;

    const confirmed = window.confirm(
      t(
        'positions.confirmClose',
        'هل أنت متأكد من إغلاق هذا المركز فوراً بسعر السوق الحالي؟',
      ),
    );
    if (!confirmed) return;

    onClose(id, { type: 'market' });
  };

  const handleApplyChanges = () => {
    if (!onModify || !id || isClosed) return;

    const modificationData = {};

    if (stopLoss && !Number.isNaN(Number(stopLoss))) {
      modificationData.stopLoss = Number(stopLoss);
    }

    if (
      takeProfit &&
      !Number.isNaN(Number(takeProfit))
    ) {
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
    <section
      className="position-actions-panel"
      style={{
        borderRadius: 20,
        padding: 10,
        border: containerBorder,
        background: containerBg,
        boxShadow:
          '0 18px 35px rgba(15,23,42,0.88)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
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
            {t('positions.actionsTitle', 'إجراءات المركز')}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft)',
            }}
          >
            {symbol}{' '}
            ·{' '}
            {isLong
              ? t('positions.long', 'شراء (Long)')
              : t('positions.short', 'بيع (Short)')}{' '}
            {leverage && `· ${leverage}x`}
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--qa-text-soft)',
            textAlign: 'end',
          }}
        >
          <div>
            {t('positions.size', 'الحجم')}:{' '}
            <strong style={{ color: '#e5e7eb' }}>
              {formatNumber(size || quantity, 4)} {symbol}
            </strong>
          </div>
          <div>
            {t('positions.entryPrice', 'سعر الدخول')}:{' '}
            <strong style={{ color: '#e5e7eb' }}>
              {formatNumber(entryPrice, 4)}
            </strong>
          </div>
          <div>
            {t('positions.currentPrice', 'السعر الحالي')}:{' '}
            <strong style={{ color: '#e5e7eb' }}>
              {formatNumber(currentPrice, 4)}
            </strong>
          </div>
        </div>
      </header>

      {/* PnL الحالي */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
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
            'الربح/الخسارة الحالية',
          )}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: pnlPositive ? '#4ade80' : '#fca5a5',
          }}
        >
          {formatNumber(unrealizedPnl, 2)} USDT{' '}
          <span
            style={{
              fontSize: 11,
              opacity: 0.8,
            }}
          >
            ({formatNumber(pnlPercentage, 2)}%)
          </span>
        </div>
      </div>

      {/* نموذج SL / TP */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 8,
          marginTop: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <label
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft)',
            }}
          >
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
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid rgba(51,65,85,0.9)',
              background: 'rgba(15,23,42,0.95)',
              padding: '6px 9px',
              fontSize: 11,
              color: '#e5e7eb',
              outline: 'none',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <label
            style={{
              fontSize: 11,
              color: 'var(--qa-text-soft)',
            }}
          >
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
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid rgba(51,65,85,0.9)',
              background: 'rgba(15,23,42,0.95)',
              padding: '6px 9px',
              fontSize: 11,
              color: '#e5e7eb',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* الأزرار */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 10,
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {onModify && !isClosed && (
            <button
              type="button"
              onClick={handleApplyChanges}
              style={{
                fontSize: 11,
                padding: '5px 11px',
                borderRadius: 999,
                border:
                  '1px solid rgba(56,189,248,0.95)',
                background:
                  'linear-gradient(135deg, rgba(8,47,73,0.95), rgba(30,64,175,0.98))',
                color: '#e0f2fe',
                cursor: 'pointer',
              }}
            >
              {t('positions.applyChanges', 'حفظ التعديلات')}
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            style={{
              fontSize: 11,
              padding: '5px 11px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.7)',
              background: 'rgba(15,23,42,0.98)',
              color: '#e5e7eb',
              cursor: 'pointer',
            }}
          >
            ♻ {t('positions.reset', 'إعادة التعيين')}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {onClose && !isClosed && (
            <button
              type="button"
              onClick={handleCloseNow}
              style={{
                fontSize: 11,
                padding: '5px 11px',
                borderRadius: 999,
                border:
                  '1px solid rgba(248,113,113,0.95)',
                background:
                  'linear-gradient(135deg, rgba(127,29,29,0.95), rgba(153,27,27,0.98))',
                color: '#fee2e2',
                cursor: 'pointer',
              }}
            >
              ✖{' '}
              {t(
                'positions.closeNow',
                'إغلاق المركز الآن',
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDeselectClick}
            style={{
              fontSize: 11,
              padding: '5px 11px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.7)',
              background: 'rgba(15,23,42,0.98)',
              color: '#e5e7eb',
              cursor: 'pointer',
            }}
          >
            ⬅{' '}
            {t(
              'positions.backToList',
              'العودة لقائمة المراكز',
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

const formatNumber = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(digits));
};

export default PositionActions;
