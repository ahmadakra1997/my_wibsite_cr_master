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
      return {
        value: String(item),
        label: String(item),
      };
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
      className="chart-controls"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      {/* Symbol picker */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            opacity: 0.8,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#cbd5f5',
          }}
        >
          {t('charts.symbol', 'الرمز')}
        </span>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {normalizedSymbols.map((sym) => {
            const active = sym.value === currentSymbol;
            return (
              <button
                key={sym.value}
                type="button"
                onClick={() => handleSymbolClick(sym.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: active
                    ? '1px solid rgba(56,189,248,0.95)'
                    : '1px solid rgba(30,64,175,0.7)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.95), rgba(56,189,248,0.95))'
                    : 'rgba(15,23,42,0.98)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: active ? '#020617' : '#e5e7eb',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sym.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme toggle */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          alignItems: 'flex-end',
        }}
      >
        <span
          style={{
            fontSize: 11,
            opacity: 0.8,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#cbd5f5',
          }}
        >
          {t('charts.theme', 'سمة المخطط')}
        </span>

        <div
          style={{
            display: 'flex',
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={() => handleThemeToggle('dark')}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border:
                theme === 'dark'
                  ? '1px solid rgba(30,64,175,0.9)'
                  : '1px solid rgba(30,64,175,0.7)',
              background:
                theme === 'dark'
                  ? 'rgba(15,23,42,0.98)'
                  : 'rgba(15,23,42,0.9)',
              color:
                theme === 'dark' ? '#e5e7eb' : 'rgba(148,163,184,0.9)',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            🌙 {t('charts.themeDark', 'ليلي')}
          </button>

          <button
            type="button"
            onClick={() => handleThemeToggle('light')}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border:
                theme === 'light'
                  ? '1px solid rgba(34,197,235,0.95)'
                  : '1px solid rgba(148,163,184,0.7)',
              background:
                theme === 'light'
                  ? '#f9fafb'
                  : 'rgba(15,23,42,0.9)',
              color: theme === 'light' ? '#020617' : '#e5e7eb',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            ☀️ {t('charts.themeLight', 'نهاري')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartControls;
