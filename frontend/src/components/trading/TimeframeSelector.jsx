// frontend/src/components/trading/TimeframeSelector.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * TimeframeSelector
 * اختيار الإطار الزمني للمخطط (1m, 5m, 1h, 4h, 1d...)
 *
 * props:
 * - currentTimeframe
 * - onTimeframeChange(tf)
 * - timeframes?: قائمة مخصصة للإطارات
 */
const DEFAULT_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const TimeframeSelector = ({
  currentTimeframe = '1h',
  onTimeframeChange,
  timeframes = DEFAULT_TIMEFRAMES,
}) => {
  const { t } = useTranslation();

  const handleClick = (tf) => {
    if (!onTimeframeChange || tf === currentTimeframe) return;
    onTimeframeChange(tf);
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 mb-2 text-[0.78rem]"
      data-testid="timeframe-selector"
    >
      <span className="text-slate-400">
        {t('charts.timeframe', 'الإطار الزمني')}
      </span>
      <div className="inline-flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-full px-1 py-0.5">
        {timeframes.map((tf) => {
          const active = tf === currentTimeframe;
          return (
            <button
              key={tf}
              type="button"
              onClick={() => handleClick(tf)}
              className={`px-2.5 py-1 rounded-full text-[0.75rem] transition ${
                active
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {tf}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeframeSelector;
