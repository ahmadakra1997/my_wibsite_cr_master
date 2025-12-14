// frontend/src/components/trading/RiskIndicator.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RiskIndicator
 *
 * يمكن استدعاؤه بطريقتين:
 * 1) <RiskIndicator riskLevel="high" message="..." suggestions={[...]} />
 * 2) <RiskIndicator stats={positionStats} />  // من PositionAnalyzer
 */
const RiskIndicator = ({
  stats,
  riskLevel = 'low',
  message,
  suggestions = [],
  theme = 'dark',
}) => {
  const { t } = useTranslation();

  const effectiveLevel =
    stats?.riskLevel || riskLevel || 'low';

  const config = getRiskConfig(effectiveLevel, theme);

  const hasSuggestions =
    Array.isArray(suggestions) && suggestions.length > 0;

  // توليد رسالة افتراضية ذكية
  const defaultMessage =
    message ||
    (effectiveLevel === 'low'
      ? t(
          'risk.defaultLow',
          'مستوى المخاطر على المحفظة منخفض، استمر بالالتزام بخطة إدارة رأس المال.',
        )
      : t(
          'risk.defaultGeneric',
          'تحليل المخاطر يشير إلى نقاط يمكن تحسينها في إدارة المراكز.',
        ));

  // لو لدينا stats وما في suggestions ممرّرة، نولّد اقتراحات بسيطة
  const autoSuggestions =
    !hasSuggestions && stats
      ? buildSuggestionsFromStats(stats, t)
      : suggestions;

  return (
    <section
      className="risk-indicator"
      style={{
        borderRadius: 18,
        padding: 10,
        border: `1px solid ${config.borderColor}`,
        background: config.background,
        boxShadow: config.shadow,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      {/* الأيقونة الجانبية */}
      <div
        style={{
          minWidth: 32,
          height: 32,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${config.iconBorder}`,
          background: config.iconBackground,
          color: config.iconColor,
          fontSize: 18,
        }}
      >
        {config.icon}
      </div>

      {/* النصوص */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#e5e7eb',
            }}
          >
            {t('risk.title', 'تحليل مستوى المخاطر')}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 999,
              border: `1px solid ${config.chipBorder}`,
              background: config.chipBackground,
              color: config.chipColor,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {config.label}
          </span>
        </div>

        <p
          style={{
            fontSize: 11,
            color: 'var(--qa-text-muted)',
            marginTop: 2,
          }}
        >
          {defaultMessage}
        </p>

        {autoSuggestions &&
          autoSuggestions.length > 0 && (
            <ul
              style={{
                marginTop: 4,
                paddingInlineStart: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                fontSize: 11,
                color: 'var(--qa-text-soft)',
              }}
            >
              {autoSuggestions.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          )}
      </div>
    </section>
  );
};

const getRiskConfig = (level, theme) => {
  const isDark = theme === 'dark';

  switch (level) {
    case 'critical':
      return {
        label: 'مخاطر حرجة',
        icon: '⛔',
        borderColor: 'rgba(248,113,113,0.85)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(127,29,29,0.95), rgba(15,23,42,0.98))'
          : 'linear-gradient(135deg, #fee2e2, #fecaca)',
        shadow:
          '0 0 0 1px rgba(248,113,113,0.4), 0 14px 30px rgba(127,29,29,0.9)',
        iconBackground: 'rgba(127,29,29,0.95)',
        iconBorder: 'rgba(248,113,113,0.85)',
        iconColor: '#fee2e2',
        chipBackground: 'rgba(127,29,29,0.9)',
        chipBorder: 'rgba(248,113,113,0.9)',
        chipColor: '#fee2e2',
      };
    case 'high':
      return {
        label: 'مخاطر عالية',
        icon: '⚠️',
        borderColor: 'rgba(249,115,22,0.85)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(124,45,18,0.95), rgba(15,23,42,0.98))'
          : 'linear-gradient(135deg, #fed7aa, #fed7aa)',
        shadow:
          '0 0 0 1px rgba(249,115,22,0.4), 0 14px 30px rgba(124,45,18,0.9)',
        iconBackground: 'rgba(124,45,18,0.95)',
        iconBorder: 'rgba(249,115,22,0.85)',
        iconColor: '#ffedd5',
        chipBackground: 'rgba(124,45,18,0.9)',
        chipBorder: 'rgba(249,115,22,0.9)',
        chipColor: '#ffedd5',
      };
    case 'medium':
      return {
        label: 'مخاطر متوسطة',
        icon: '⚡',
        borderColor: 'rgba(245,158,11,0.85)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(120,53,15,0.95), rgba(15,23,42,0.98))'
          : 'linear-gradient(135deg, #fef3c7, #fde68a)',
        shadow:
          '0 0 0 1px rgba(245,158,11,0.3), 0 14px 30px rgba(120,53,15,0.9)',
        iconBackground: 'rgba(120,53,15,0.95)',
        iconBorder: 'rgba(245,158,11,0.9)',
        iconColor: '#fef3c7',
        chipBackground: 'rgba(120,53,15,0.9)',
        chipBorder: 'rgba(245,158,11,0.9)',
        chipColor: '#fef3c7',
      };
    case 'low':
    default:
      return {
        label: 'مخاطر منخفضة',
        icon: '✅',
        borderColor: 'rgba(16,185,129,0.85)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(6,78,59,0.95), rgba(15,23,42,0.98))'
          : 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
        shadow:
          '0 0 0 1px rgba(16,185,129,0.4), 0 14px 30px rgba(6,78,59,0.9)',
        iconBackground: 'rgba(6,78,59,0.95)',
        iconBorder: 'rgba(16,185,129,0.9)',
        iconColor: '#bbf7d0',
        chipBackground: 'rgba(6,78,59,0.9)',
        chipBorder: 'rgba(16,185,129,0.9)',
        chipColor: '#bbf7d0',
      };
  }
};

const buildSuggestionsFromStats = (stats, t) => {
  const s = stats || {};
  const suggestions = [];

  if (s.leverage && s.leverage > 5) {
    suggestions.push(
      t(
        'risk.suggestionLowerLeverage',
        'خفّض الرافعة المالية أو حجم المراكز المفتوحة لتقليل حساسية المحفظة لتقلبات السوق.',
      ),
    );
  }

  if (s.openPositions && s.openPositions > 5) {
    suggestions.push(
      t(
        'risk.suggestionConcentrate',
        'قلّل عدد المراكز المفتوحة وركّز على أفضل الفرص بدل تشتيت رأس المال.',
      ),
    );
  }

  if (s.maxDrawdown && s.maxDrawdown > 10) {
    suggestions.push(
      t(
        'risk.suggestionDrawdown',
        'ضع حدودًا واضحة للخسارة اليومية/الأسبوعية لتجنّب التراجع الكبير في رصيد الحساب.',
      ),
    );
  }

  if (!suggestions.length) {
    suggestions.push(
      t(
        'risk.suggestionGeneric',
        'استمر بمراجعة أداء الصفقات وتحديث خطة إدارة المخاطر بشكل دوري.',
      ),
    );
  }

  return suggestions;
};

export default RiskIndicator;
