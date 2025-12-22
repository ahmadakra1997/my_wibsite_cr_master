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
    return symbols
      .map((item) => {
        if (typeof item === 'string') return { value: item, label: item };
        if (item && typeof item === 'object') {
          return {
            value: item.value || item.symbol || item.code || '',
            label: item.label || item.name || item.symbol || item.code || item.value || '',
          };
        }
        return { value: String(item), label: String(item) };
      })
      .filter((x) => x.value);
  }, [symbols]);

  const handleSymbolClick = (value) => {
    if (!onSymbolChange || !value || value === currentSymbol) return;
    onSymbolChange(value);
  };

  const handleThemeToggle = (nextTheme) => {
    if (!onThemeChange) return;
    const safe = nextTheme === 'light' ? 'light' : 'dark';
    if (safe === theme) return;
    onThemeChange(safe);
  };

  const isDark = theme !== 'light';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {/* Symbol picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12, fontWeight: 900 }}>
          {t('charts.symbol', 'الرمز')}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {normalizedSymbols.map((sym) => {
            const active = sym.value === currentSymbol;
            return (
              <button
                key={sym.value}
                type="button"
                onClick={() => handleSymbolClick(sym.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: active ? '1px solid rgba(56,189,248,0.95)' : '1px solid rgba(30,64,175,0.7)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.95), rgba(56,189,248,0.95))'
                    : 'rgba(15,23,42,0.98)',
                  fontSize: 11,
                  fontWeight: 900,
                  color: active ? '#020617' : 'rgba(226,232,240,0.95)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.05em',
                }}
                aria-label={`Symbol ${sym.value}`}
              >
                {sym.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ color: 'rgba(148,163,184,0.92)', fontSize: 12, fontWeight: 900 }}>
          {t('charts.theme', 'سمة المخطط')}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => handleThemeToggle('dark')}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: isDark ? '1px solid rgba(30,64,175,0.9)' : '1px solid rgba(148,163,184,0.35)',
              background: isDark ? 'rgba(15,23,42,0.98)' : 'rgba(15,23,42,0.65)',
              color: isDark ? '#e5e7eb' : 'rgba(148,163,184,0.9)',
              fontSize: 11,
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
            aria-label="Theme dark"
          >
            🌙 {t('charts.themeDark', 'ليلي')}
          </button>

          <button
            type="button"
            onClick={() => handleThemeToggle('light')}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: !isDark ? '1px solid rgba(34,197,235,0.95)' : '1px solid rgba(148,163,184,0.35)',
              background: !isDark ? '#f9fafb' : 'rgba(15,23,42,0.65)',
              color: !isDark ? '#020617' : '#e5e7eb',
              fontSize: 11,
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
            aria-label="Theme light"
          >
            ☀️ {t('charts.themeLight', 'نهاري')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartControls;
