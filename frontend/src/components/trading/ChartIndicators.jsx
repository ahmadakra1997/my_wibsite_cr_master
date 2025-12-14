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
        if (
          typeof v === 'object' &&
          v !== null &&
          typeof v.value === 'number'
        ) {
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
        return t(
          'charts.indicators.macd',
          'MACD (تقارب/تباعد المتوسطات)',
        );
      case 'bollinger':
        return t(
          'charts.indicators.bollinger',
          'Bollinger Bands',
        );
      default:
        return key.toUpperCase();
    }
  };

  return (
    <section
      className="chart-indicators"
      style={{
        borderRadius: 16,
        border: '1px solid rgba(30,64,175,0.55)',
        background:
          'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,1))',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        className="chart-indicators-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <h4
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#e5e7eb',
          }}
        >
          {t('charts.indicators.title', 'المؤشرات الفنية')}
        </h4>
        <p
          style={{
            fontSize: 11,
            color: 'rgba(148,163,184,0.9)',
          }}
        >
          {t(
            'charts.indicators.subtitle',
            'قم بتفعيل أو إلغاء تفعيل المؤشرات لعرض المزيد من التفاصيل على المخطط.',
          )}
        </p>
      </div>

      <div
        className="chart-indicators-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
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
                borderRadius: 10,
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
                color: '#e5e7eb',
                fontSize: 11,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    opacity: enabled ? 1 : 0.5,
                  }}
                >
                  {getLabel(key)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    opacity: enabled ? 1 : 0.6,
                  }}
                >
                  {enabled ? '✓' : ''}
                </span>
              </div>

              {/* Latest values */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  width: '100%',
                }}
              >
                {key === 'macd' && value && (
                  <>
                    <div>
                      <strong>MACD:</strong>{' '}
                      {formatNumber(value.macd)}
                    </div>
                    <div>
                      <strong>
                        {t('charts.indicators.signal', 'إشارة')}:
                      </strong>{' '}
                      {formatNumber(value.signal)}
                    </div>
                    <div>
                      <strong>
                        {t(
                          'charts.indicators.histogram',
                          'هيستوغرام',
                        )}
                        :
                      </strong>{' '}
                      {formatNumber(value.histogram)}
                    </div>
                  </>
                )}

                {key === 'bollinger' && value && (
                  <>
                    <div>
                      <strong>
                        {t(
                          'charts.indicators.upper',
                          'الحد العلوي',
                        )}
                        :
                      </strong>{' '}
                      {formatNumber(value.upper)}
                    </div>
                    <div>
                      <strong>
                        {t(
                          'charts.indicators.middle',
                          'الخط الأوسط',
                        )}
                        :
                      </strong>{' '}
                      {formatNumber(value.middle)}
                    </div>
                    <div>
                      <strong>
                        {t(
                          'charts.indicators.lower',
                          'الحد السفلي',
                        )}
                        :
                      </strong>{' '}
                      {formatNumber(value.lower)}
                    </div>
                  </>
                )}

                {key !== 'macd' &&
                  key !== 'bollinger' &&
                  value != null && (
                    <div>
                      <strong>
                        {t(
                          'charts.indicators.lastValue',
                          'آخر قيمة',
                        )}
                        :
                      </strong>{' '}
                      {formatNumber(value)}
                    </div>
                  )}

                {value == null && (
                  <div
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    {t(
                      'charts.indicators.waiting',
                      'جارٍ انتظار بيانات كافية لحساب هذا المؤشر...',
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ChartIndicators;
