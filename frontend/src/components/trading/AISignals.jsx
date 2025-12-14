// frontend/src/components/trading/AISignals.jsx

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import {
  aiSignalsLoading,
  aiSignalsUpdated,
  aiSignalsError,
} from '../../store/tradingSlice';

/**
 * AISignals
 * لوحة عرض إشارات الذكاء الاصطناعي (دخول / خروج / مراقبة).
 *
 * - تتكامل مع الباكيند عبر /trading/ai-signals
 * - وتقرأ الحالة من Redux (aiSignals, isLoadingAiSignals, aiSignalsError)
 *
 * props (اختيارية):
 * - signals, isLoading: لو حابب تمرّر بيانات يدويًا من مكوّن أب
 * - autoFetch: تفعيل / تعطيل الجلب الآلي من الـ API
 * - symbol, timeframe: لفلترة الإشارات من الباكيند
 */
const AISignals = ({
  signals: signalsProp,
  isLoading: isLoadingProp,
  autoFetch = true,
  symbol,
  timeframe = '1h',
  onSelectSignal,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const {
    aiSignals,
    isLoadingAiSignals,
    aiSignalsError: storeError,
  } = useSelector((state) => state.trading || {});

  const signals = signalsProp ?? aiSignals ?? [];
  const isLoading = isLoadingProp ?? isLoadingAiSignals;

  // جلب الإشارات من الباكيند
  useEffect(() => {
    if (!autoFetch) return;

    let cancelled = false;

    const fetchSignals = async () => {
      try {
        dispatch(aiSignalsLoading());

        const params = new URLSearchParams();
        if (symbol) params.append('symbol', symbol);
        if (timeframe) params.append('timeframe', timeframe);
        params.append('limit', '20');

        const response = await api.get(
          `/trading/ai-signals?${params.toString()}`,
        );

        const raw = response?.data ?? response;

        const payload =
          raw?.signals ||
          raw?.result?.signals ||
          (Array.isArray(raw) ? raw : []);

        const normalized = Array.isArray(payload)
          ? payload
          : [];

        if (!cancelled) {
          dispatch(aiSignalsUpdated(normalized));
        }
      } catch (error) {
        if (cancelled) return;

        // eslint-disable-next-line no-console
        console.error(
          '[AISignals] Failed to fetch AI signals:',
          error,
        );

        const msg =
          error?.message ||
          t(
            'trading.aiSignals.error',
            'فشل تحميل إشارات الذكاء الاصطناعي.',
          );
        dispatch(aiSignalsError(msg));
      }
    };

    fetchSignals();

    return () => {
      cancelled = true;
    };
  }, [autoFetch, symbol, timeframe, dispatch, t]);

  const hasSignals = Array.isArray(signals) && signals.length > 0;

  const sortedSignals = useMemo(() => {
    if (!hasSignals) return [];
    return [...signals].sort(
      (a, b) => (b.confidence || 0) - (a.confidence || 0),
    );
  }, [signals, hasSignals]);

  const handleSelect = (signal) => {
    if (onSelectSignal) {
      onSelectSignal(signal);
    }
  };

  const containerStyle = {
    borderRadius: 22,
    padding: 12,
    border: '1px solid rgba(30,64,175,0.55)',
    background:
      'radial-gradient(circle at top, rgba(56,189,248,0.16), rgba(15,23,42,0.98))',
    boxShadow: '0 16px 36px rgba(15,23,42,0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };

  const headerRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  };

  const statusChipStyle = {
    borderRadius: 999,
    padding: '3px 8px',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: '1px solid rgba(34,197,235,0.9)',
    color: '#e0f2fe',
    background:
      'linear-gradient(135deg, rgba(8,47,73,0.9), rgba(22,101,52,0.95))',
  };

  return (
    <section className="ai-signals-panel" style={containerStyle}>
      <header style={headerRowStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#e5e7eb',
            }}
          >
            {t('trading.aiSignals.title', 'إشارات الذكاء الاصطناعي')}
          </h3>
          <p
            style={{
              fontSize: 11,
              color: 'var(--qa-text-muted)',
              maxWidth: 420,
            }}
          >
            {t(
              'trading.aiSignals.subtitle',
              'رصد فرص الدخول والخروج اعتماداً على خوارزميات تحليل السوق.',
            )}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={statusChipStyle}>
            {t(
              'trading.aiSignals.status',
              'الوحدة التجريبية مفعّلة',
            )}
          </span>
          {hasSignals && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--qa-text-soft)',
                textAlign: 'end',
              }}
            >
              {t(
                'trading.aiSignals.count',
                'عدد الإشارات الحالية',
              )}
              :{' '}
              <strong style={{ color: '#e5e7eb' }}>
                {sortedSignals.length}
              </strong>
            </span>
          )}
        </div>
      </header>

      {isLoading && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--qa-text-muted)',
            padding: '6px 4px',
          }}
        >
          {t(
            'trading.aiSignals.loading',
            'جاري تحليل السوق وإعداد الإشارات...',
          )}
        </div>
      )}

      {!isLoading && !hasSignals && (
        <div
          style={{
            borderRadius: 16,
            border: '1px dashed rgba(148,163,184,0.6)',
            padding: '10px 9px',
            fontSize: 11,
            color: 'var(--qa-text-soft)',
            background:
              'radial-gradient(circle at top, rgba(56,189,248,0.08), rgba(15,23,42,0.95))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>✨</span>
            <span>
              {t(
                'trading.aiSignals.empty',
                'سيتم قريباً تفعيل نظام إشارات ذكاء اصطناعي متقدم، لاقتراح صفقات دخول وخروج وفق استراتيجيات مدروسة.',
              )}
            </span>
          </div>
          <ul
            style={{
              paddingInlineStart: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <li>
              {t(
                'trading.aiSignals.benefit1',
                'تحليل تلقائي لعشرات الأزواج السوقية في نفس الوقت.',
              )}
            </li>
            <li>
              {t(
                'trading.aiSignals.benefit2',
                'تقييم قوة الإشارة بناءً على السيولة والتذبذب والتوقيت.',
              )}
            </li>
            <li>
              {t(
                'trading.aiSignals.benefit3',
                'دمج الإشارات مع إدارة مخاطرك الحالية في المنصة.',
              )}
            </li>
          </ul>
        </div>
      )}

      {storeError && (
        <div
          style={{
            marginTop: 4,
            padding: '6px 8px',
            borderRadius: 10,
            fontSize: 11,
            color: '#fecaca',
            background:
              'linear-gradient(135deg, rgba(127,29,29,0.9), rgba(153,27,27,0.95))',
            border: '1px solid rgba(248,113,113,0.85)',
          }}
        >
          {storeError}
        </div>
      )}

      {hasSignals && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 4,
          }}
        >
          {sortedSignals.map((signal) => (
            <SignalRow
              // eslint-disable-next-line no-underscore-dangle
              key={signal.id || `${signal.symbol}-${signal.time}`}
              signal={signal}
              onClick={handleSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const SignalRow = ({ signal, onClick }) => {
  const { t } = useTranslation();

  const {
    symbol,
    type,
    direction,
    confidence,
    timeframe,
    strategy,
    time,
  } = signal;

  const isEntry = type === 'entry';
  const isExit = type === 'exit';
  const isLong = direction === 'long';
  const isShort = direction === 'short';

  const labelType = isEntry
    ? t('trading.aiSignals.type.entry', 'دخول')
    : isExit
    ? t('trading.aiSignals.type.exit', 'خروج')
    : t('trading.aiSignals.type.watch', 'مراقبة');

  const conf = Number(confidence) || 0;
  const isStrong = conf >= 80;

  const formattedTime = (() => {
    if (!time) return '—';
    try {
      const d = time instanceof Date ? time : new Date(time);
      return d.toLocaleString();
    } catch {
      return String(time);
    }
  })();

  const handleClick = () => {
    if (onClick) {
      onClick(signal);
    }
  };

  const baseBg =
    direction === 'long'
      ? 'rgba(34,197,94,0.08)'
      : direction === 'short'
      ? 'rgba(248,113,113,0.08)'
      : 'rgba(56,189,248,0.06)';

  const borderColor =
    direction === 'long'
      ? 'rgba(34,197,94,0.7)'
      : direction === 'short'
      ? 'rgba(248,113,113,0.7)'
      : 'rgba(56,189,248,0.7)';

  const accentColor =
    direction === 'long'
      ? '#22c55e'
      : direction === 'short'
      ? '#fb7185'
      : '#38bdf8';

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        textAlign: 'right',
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        background: `linear-gradient(135deg, ${baseBg}, rgba(15,23,42,0.98))`,
        padding: '8px 9px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      {/* اليسار: الرمز / الإطار الزمني / الإستراتيجية */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          alignItems: 'flex-start',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#e5e7eb',
            }}
          >
            {symbol || '—'}
          </span>
          {timeframe && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--qa-text-soft)',
              }}
            >
              {timeframe}
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 999,
              border: `1px solid ${borderColor}`,
              color: accentColor,
            }}
          >
            {labelType}
          </span>
        </div>

        {strategy && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--qa-text-muted)',
            }}
          >
            {t('trading.aiSignals.strategy', 'الإستراتيجية')}:{' '}
            <span style={{ color: '#e5e7eb' }}>{strategy}</span>
          </div>
        )}

        <div
          style={{
            fontSize: 10,
            color: 'var(--qa-text-soft)',
          }}
        >
          {formattedTime}
        </div>
      </div>

      {/* اليمين: الاتجاه + الثقة */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            fontSize: 11,
            color: accentColor,
          }}
        >
          <span>{isLong ? '⬆' : isShort ? '⬇' : '⟷'}</span>
          <span>
            {isLong
              ? t(
                  'trading.aiSignals.direction.long',
                  'اتجاه: شراء',
                )
              : isShort
              ? t(
                  'trading.aiSignals.direction.short',
                  'اتجاه: بيع',
                )
              : t(
                  'trading.aiSignals.direction.neutral',
                  'اتجاه: محايد',
                )}
          </span>
        </div>

        <div
          style={{
            fontSize: 11,
            color: '#e5e7eb',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {conf.toFixed(0)}%
        </div>

        {isStrong && (
          <div
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 999,
              border: '1px solid rgba(250,250,250,0.9)',
              color: '#fefce8',
              background:
                'linear-gradient(135deg, rgba(250,204,21,0.3), rgba(30,64,175,0.98))',
            }}
          >
            {t('trading.aiSignals.strong', 'إشارة قوية')}
          </div>
        )}
      </div>
    </button>
  );
};

export default AISignals;
