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
    ...indicators,
  };

  const latestValues = useMemo(() => {
    if (!indicatorData) return {};

    const getLastFromArray = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      for (let i = arr.length - 1; i >= 0; i -= 1) {
        const v = arr[i];
        if (v == null) continue;
        if (typeof v === 'number') return v;
        if (typeof v === 'object' && v !== null && typeof v.value === 'number') {
          return v.value;
        }
      }
      return null;
    };

    const result = {};

    if (indicatorData.sma) {
      result.sma = getLastFromArray(indicatorData.sma);
    }

    if (indicatorData.ema) {
      result.ema = getLastFromArray(indicatorData.ema);
    }

    if (indicatorData.rsi) {
      result.rsi = getLastFromArray(indicatorData.rsi);
    }

    if (indicatorData.macd) {
      const { macdLine, signalLine, histogram } = indicatorData.macd;
      result.macd = {
        macd: getLastFromArray(macdLine),
        signal: getLastFromArray(signalLine),
        histogram: getLastFromArray(histogram),
      };
    }

    if (indicatorData.bollinger) {
      const { upperBand, middleBand, lowerBand } = indicatorData.bollinger;
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
    const next = {
      ...mergedIndicators,
      [key]: !mergedIndicators[key],
    };
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
        return key.toUpperCase();
    }
  };

  return (
    <div
      className="chart-indicators"
      style={{
        marginTop: '0.6rem',
        padding: '0.55rem 0.75rem',
        borderRadius: '12px',
        border: '1px solid rgba(30,64,175,0.7)',
        background:
          'radial-gradient(circle at top, rgba(15,23,42,0.96), rgba(15,23,42,1))',
        direction: 'rtl',
        fontSize: '0.8rem',
      }}
    >
      <div
        className="chart-indicators-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.4rem',
        }}
      >
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#e5e7eb',
          }}
        >
          {t('charts.indicators.title', 'المؤشرات الفنية')}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'rgba(148,163,184,0.96)',
          }}
        >
          {t(
            'charts.indicators.subtitle',
            'قم بتفعيل أو إلغاء تفعيل المؤشرات لعرض المزيد من التفاصيل على المخطط.',
          )}
        </div>
      </div>

      <div
        className="chart-indicators-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.5rem',
        }}
      >
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
                padding: '0.45rem 0.6rem',
                borderRadius: '10px',
                border: enabled
                  ? '1px solid rgba(59,130,246,0.9)'
                  : '1px solid rgba(30,64,175,0.7)',
                background: enabled
                  ? 'linear-gradient(135deg, rgba(30,64,175,0.95), rgba(37,99,235,0.95))'
                  : 'rgba(15,23,42,0.98)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span
                  style={{
                    width: '0.9rem',
                    height: '0.9rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(148,163,184,0.8)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    background: enabled
                      ? 'rgba(15,23,42,0.95)'
                      : 'transparent',
                  }}
                >
                  {enabled ? '✓' : ''}
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: '#e5e7eb',
                  }}
                >
                  {getLabel(key)}
                </span>
              </div>

              {/* عرض القيم الأخيرة لكل مؤشر إن وجدت */}
              {key === 'macd' && value && (
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'rgba(226,232,240,0.95)',
                    lineHeight: 1.5,
                  }}
                >
                  <div>MACD: {formatNumber(value.macd)}</div>
                  <div>
                    {t('charts.indicators.signal', 'إشارة')}:{' '}
                    {formatNumber(value.signal)}
                  </div>
                  <div>
                    {t('charts.indicators.histogram', 'هيستوغرام')}:{' '}
                    {formatNumber(value.histogram)}
                  </div>
                </div>
              )}

              {key === 'bollinger' && value && (
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'rgba(226,232,240,0.95)',
                    lineHeight: 1.5,
                  }}
                >
                  <div>
                    {t('charts.indicators.upper', 'الحد العلوي')}:{' '}
                    {formatNumber(value.upper)}
                  </div>
                  <div>
                    {t('charts.indicators.middle', 'الخط الأوسط')}:{' '}
                    {formatNumber(value.middle)}
                  </div>
                  <div>
                    {t('charts.indicators.lower', 'الحد السفلي')}:{' '}
                    {formatNumber(value.lower)}
                  </div>
                </div>
              )}

              {key !== 'macd' && key !== 'bollinger' && value != null && (
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'rgba(226,232,240,0.95)',
                  }}
                >
                  {t('charts.indicators.lastValue', 'آخر قيمة')}:{' '}
                  {formatNumber(value)}
                </div>
              )}

              {value == null && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'rgba(148,163,184,0.9)',
                  }}
                >
                  {t(
                    'charts.indicators.waiting',
                    'جارٍ انتظار بيانات كافية لحساب هذا المؤشر...',
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChartIndicators;
