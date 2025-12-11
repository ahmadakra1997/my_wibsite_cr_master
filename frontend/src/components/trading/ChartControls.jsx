// frontend/src/components/trading/ChartControls.jsx

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ChartControls
 * شريط تحكم علوي للمخطط:
 * - اختيار الرمز (BTCUSDT / ETHUSDT / ...)
 * - تبديل سمة المخطط (داكن / فاتح)
 *
 * props:
 * - symbols: قائمة الرموز المتاحة
 * - currentSymbol
 * - onSymbolChange(symbol)
 * - theme: 'dark' | 'light'
 * - onThemeChange(theme)
 */
const ChartControls = ({
  symbols = [],
  currentSymbol,
  onSymbolChange,
  theme = 'dark',
  onThemeChange,
}) => {
  const { t } = useTranslation();

  const normalizedSymbols = useMemo(() => {
    if (!Array.isArray(symbols) || symbols.length === 0) return [];

    return symbols.map((item) => {
      if (typeof item === 'string') {
        return { value: item, label: item };
      }
      if (item && typeof item === 'object') {
        return {
          value: item.value || item.symbol || item.code || '',
          label:
            item.label ||
            item.name ||
            item.symbol ||
            item.code ||
            item.value ||
            '',
        };
      }
      return { value: String(item), label: String(item) };
    });
  }, [symbols]);

  const handleSymbolClick = (value) => {
    if (!onSymbolChange || value === currentSymbol) return;
    onSymbolChange(value);
  };

  const handleThemeToggle = (nextTheme) => {
    if (!onThemeChange || nextTheme === theme) return;
    onThemeChange(nextTheme);
  };

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 mb-2"
      data-testid="chart-controls"
    >
      {/* اختيار الرمز */}
      <div className="flex flex-wrap items-center gap-2 text-[0.78rem]">
        <span className="text-slate-400">
          {t('charts.symbol', 'الرمز')}
        </span>
        <div className="inline-flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-full px-1 py-0.5">
          {normalizedSymbols.map((sym) => {
            const active = sym.value === currentSymbol;
            return (
              <button
                key={sym.value}
                type="button"
                onClick={() => handleSymbolClick(sym.value)}
                className={`px-2.5 py-1 rounded-full text-[0.75rem] font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow'
                    : 'text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {sym.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* تبديل سمة المخطط */}
      <div className="flex items-center gap-2 text-[0.78rem]">
        <span className="text-slate-400">
          {t('charts.theme', 'سمة المخطط')}
        </span>
        <div className="inline-flex items-center gap-0.5 bg-slate-900/90 border border-slate-700/80 rounded-full px-1 py-0.5">
          <button
            type="button"
            onClick={() => handleThemeToggle('dark')}
            className={`px-2 py-1 rounded-full flex items-center gap-1 text-[0.75rem] ${
              theme === 'dark'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <span>🌙</span>
            <span>{t('charts.themeDark', 'ليلي')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeToggle('light')}
            className={`px-2 py-1 rounded-full flex items-center gap-1 text-[0.75rem] ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-400 hover:bg-slate-800/80'
            }`}
          >
            <span>☀️</span>
            <span>{t('charts.themeLight', 'نهاري')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartControls;
