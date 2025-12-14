// frontend/src/components/trading/TimeframeSelector.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * TimeframeSelector
 *
 * مكوّن لاختيار الفريم الزمني للمخطط أو بيانات التداول.
 *
 * props:
 * - value: الفريم الحالي (مثلاً: '1m', '5m', '15m', '1h', '4h', '1d', '1w')
 * - onChange: دالة يتم استدعاؤها عند تغيير الفريم (timeframe => ...)
 * - options: مصفوفة فريمات مخصّصة (اختياري)
 * - theme: 'dark' | 'light'
 * - size: 'sm' | 'md'
 */
const TimeframeSelector = ({
  value,
  onChange,
  options,
  theme = 'dark',
  size = 'md',
}) => {
  const { t } = useTranslation();

  const timeframes =
    options && Array.isArray(options) && options.length > 0
      ? options
      : ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

  const isDark = theme === 'dark';

  const handleClick = (tf) => {
    if (onChange) {
      onChange(tf);
    }
  };

  const containerStyle = {
    borderRadius: 999,
    padding: size === 'sm' ? '4px 5px' : '5px 6px',
    border: isDark
      ? '1px solid rgba(30,64,175,0.8)'
      : '1px solid rgba(148,163,184,0.8)',
    background: isDark
      ? 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(8,47,73,0.96))'
      : 'linear-gradient(135deg, #f9fafb, #e0f2fe)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };

  const labelStyle = {
    fontSize: 10,
    color: 'var(--qa-text-soft, #9ca3af)',
    marginInlineEnd: 4,
    paddingInlineStart: 2,
  };

  return (
    <div className="timeframe-selector" style={containerStyle}>
      <span style={labelStyle}>
        {t('charts.timeframe', 'الفريم الزمني')}
      </span>
      {timeframes.map((tf) => {
        const isActive = tf === value;
        return (
          <button
            key={tf}
            type="button"
            onClick={() => handleClick(tf)}
            style={{
              border: isActive
                ? '1px solid rgba(56,189,248,0.95)'
                : '1px solid transparent',
              borderRadius: 999,
              padding:
                size === 'sm'
                  ? '2px 7px'
                  : '3px 9px',
              fontSize: size === 'sm' ? 10 : 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              background: isActive
                ? 'linear-gradient(135deg, rgba(34,211,238,0.96), rgba(56,189,248,0.96))'
                : 'transparent',
              color: isActive
                ? '#020617'
                : isDark
                ? '#e5e7eb'
                : '#111827',
              boxShadow: isActive
                ? '0 0 0 1px rgba(8,47,73,0.7)'
                : 'none',
              transition:
                'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {tf.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};

export default TimeframeSelector;
