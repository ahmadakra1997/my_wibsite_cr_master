// frontend/src/components/trading/ChartIndicators.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ChartIndicators
 * لوحة تحكم في المؤشرات الفنية + عرض آخر القيم المحسوبة منها.
 *
 * props:
 * - indicators: كائن حالة (مثل { sma: true, ema: false, ... })
 * - onIndicatorsChange(newIndicators)
 * - indicatorData: القيم المحسوبة من TechnicalAnalysis (قد تكون undefined)
 */
const INDICATOR_KEYS = ['sma', 'ema', 'rsi', 'macd', 'bollinger'];

const ChartIndicators = ({ indicators = {}, onIndicatorsChange, indicatorData }) => {
  const { t } = useTranslation();

  const mergedIndicators = {
    sma: false,
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false,
    ...(indicators || {}),
  };

  const latestValues = useMemo(() => {
    if (!indicatorData) return {};

    const getLastFromArray = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      for (let i = arr.length - 1; i >= 0; i -= 1) {
        const v = arr[i];
        if (v == null) continue;
        if (typeof v === 'number') return v;
        if (typeof v === 'object' && v !== null && typeof v.value === 'number') return v.value;
      }
      return null;
    };

    const result = {};
    if (indicatorData.sma) result.sma = getLastFromArray(indicatorData.sma);
    if (indicatorData.ema) result.ema = getLastFromArray(indicatorData.ema);
    if (indicatorData.rsi) result.rsi = getLastFromArray(indicatorData.rsi);

    if (indicatorData.macd) {
      const { macdLine, signalLine, histogram } = indicatorData.macd || {};
      result.macd = {
        macd: getLastFromArray(macdLine),
        signal: getLastFromArray(signalLine),
        histogram: getLastFromArray(histogram),
      };
    }

    if (indicatorData.bollinger) {
      const { upperBand, middleBand, lowerBand } = indicatorData.bollinger || {};
      result.bollinger = {
        upper: getLastFromArray(upperBand),
        middle: getLastFromArray(middleBand),
        lower: getLastFromArray(lowerBand),
      };
    }

    return result;
  }, [indicatorData]);

  const handleToggle = (key) => {
    if (!onIndicatorsChange) return;
    const next = { ...mergedIndicators, [key]: !mergedIndicators[key] };
    onIndicatorsChange(next);
  };

  const formatNumber = (value, digits = 2) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '--';
    return num.toFixed(digits);
  };

  const getLabel = (key) => {
    switch (key) {
      case 'sma':
        return t('charts.indicators.sma', 'SMA (متوسط بسيط)');
      case 'ema':
        return t('charts.indicators.ema', 'EMA (متوسط أسي)');
      case 'rsi':
        return t('charts.indicators.rsi', 'RSI (مؤشر القوة النسبية)');
      case 'macd':
        return t('charts.indicators.macd', 'MACD (تقارب/تباعد المتوسطات)');
      case 'bollinger':
        return t('charts.indicators.bollinger', 'Bollinger Bands');
      default:
        return String(key || '').toUpperCase();
    }
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div>
        <div style={{ fontWeight: 900, color: '#e5e7eb', letterSpacing: '0.04em' }}>
          {t('charts.indicators.title', 'المؤشرات الفنية')}
        </div>
        <div style={{ marginTop: 4, color: 'rgba(148,163,184,0.92)', fontSize: 12, lineHeight: 1.45 }}>
          {t(
            'charts.indicators.subtitle',
            'قم بتفعيل أو إلغاء تفعيل المؤشرات لعرض المزيد من التفاصيل على المخطط.',
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {INDICATOR_KEYS.map((key) => {
          const enabled = !!mergedIndicators[key];
          const value = latestValues[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              style={{
                textAlign: 'right',
                padding: '10px 12px',
                borderRadius: 14,
                border: enabled ? '1px solid rgba(56,189,248,0.9)' : '1px solid rgba(148,163,184,0.18)',
                background: enabled
                  ? 'linear-gradient(135deg, rgba(56,189,248,0.16), rgba(0,255,136,0.12))'
                  : 'rgba(2,6,23,0.45)',
                cursor: 'pointer',
                display: 'grid',
                gap: 6,
                color: '#e5e7eb',
              }}
              aria-label={`Toggle ${key}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 12 }}>{getLabel(key)}</div>
                <div style={{ fontWeight: 900, fontSize: 12, opacity: enabled ? 1 : 0.7 }}>{enabled ? '✓' : ''}</div>
              </div>

              {/* Latest values */}
              <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12, lineHeight: 1.4 }}>
                {key === 'macd' && value ? (
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div>MACD: {formatNumber(value.macd)}</div>
                    <div>{t('charts.indicators.signal', 'إشارة')}: {formatNumber(value.signal)}</div>
                    <div>{t('charts.indicators.histogram', 'هيستوغرام')}: {formatNumber(value.histogram)}</div>
                  </div>
                ) : null}

                {key === 'bollinger' && value ? (
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div>{t('charts.indicators.upper', 'الحد العلوي')}: {formatNumber(value.upper)}</div>
                    <div>{t('charts.indicators.middle', 'الخط الأوسط')}: {formatNumber(value.middle)}</div>
                    <div>{t('charts.indicators.lower', 'الحد السفلي')}: {formatNumber(value.lower)}</div>
                  </div>
                ) : null}

                {key !== 'macd' && key !== 'bollinger' && value != null ? (
                  <div>
                    {t('charts.indicators.lastValue', 'آخر قيمة')}: {formatNumber(value)}
                  </div>
                ) : null}

                {value == null ? (
                  <div style={{ opacity: 0.9 }}>
                    {t('charts.indicators.waiting', 'جارٍ انتظار بيانات كافية لحساب هذا المؤشر...')}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChartIndicators;
