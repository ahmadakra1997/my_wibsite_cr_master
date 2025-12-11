// frontend/src/components/trading/RiskIndicator.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RiskIndicator
 * مكوّن رسالة تحذير/تنبيه لمستوى مخاطر المحفظة:
 * - يعرض مستوى المخاطر (low / medium / high / critical)
 * - رسالة نصية رئيسية
 * - قائمة مقترحات لإدارة المخاطر (riskSuggestions)
 *
 * يُستخدم في:
 * - PositionManager (على مستوى المحفظة)
 * - يمكن إعادة استخدامه في RiskMonitor لاحقاً.
 */
const RiskIndicator = ({ riskLevel = 'low', message, suggestions = [] }) => {
  const { t } = useTranslation();

  const config = getRiskConfig(riskLevel);
  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

  const defaultMessage =
    message ||
    (riskLevel === 'low'
      ? t(
          'risk.defaultLow',
          'مستوى المخاطر على المحفظة منخفض، استمر بالالتزام بخطة إدارة رأس المال.',
        )
      : t(
          'risk.defaultGeneric',
          'تحليل المخاطر يشير إلى نقاط يمكن تحسينها في إدارة المراكز.',
        ));

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 mb-3 flex gap-3 items-start bg-slate-900/90 ${config.border} ${config.bg}`}
      data-testid="risk-indicator"
    >
      {/* الأيقونة الجانبية */}
      <div
        className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border text-sm ${config.iconBg} ${config.iconBorder} ${config.iconText}`}
      >
        {config.icon}
      </div>

      {/* النصوص */}
      <div className="flex-1 space-y-1.5 text-[0.75rem]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-100">
            {t('risk.title', 'تحليل مستوى المخاطر')}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[0.65rem] ${config.chipBg} ${config.chipText} ${config.chipBorder}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
            {config.label}
          </span>
        </div>

        <p className="text-slate-200 leading-relaxed">{defaultMessage}</p>

        {hasSuggestions && (
          <ul className="list-disc mr-4 space-y-0.5 text-slate-300">
            {suggestions.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const getRiskConfig = (level) => {
  switch (level) {
    case 'critical':
      return {
        label: 'مخاطر حرجة',
        icon: '⛔',
        border: 'border-rose-600/70',
        bg: 'shadow-[0_0_0_1px_rgba(248,113,113,0.45)] shadow-rose-900/40',
        iconBg: 'bg-rose-900/80',
        iconBorder: 'border-rose-500/70',
        iconText: 'text-rose-200',
        chipBg: 'bg-rose-900/80',
        chipText: 'text-rose-100',
        chipBorder: 'border-rose-500/70',
      };
    case 'high':
      return {
        label: 'مخاطر عالية',
        icon: '⚠️',
        border: 'border-orange-500/70',
        bg: 'shadow-[0_0_0_1px_rgba(249,115,22,0.45)] shadow-orange-900/40',
        iconBg: 'bg-orange-900/80',
        iconBorder: 'border-orange-500/70',
        iconText: 'text-orange-200',
        chipBg: 'bg-orange-900/80',
        chipText: 'text-orange-100',
        chipBorder: 'border-orange-500/70',
      };
    case 'medium':
      return {
        label: 'مخاطر متوسطة',
        icon: '⚡',
        border: 'border-amber-500/70',
        bg: 'shadow-[0_0_0_1px_rgba(245,158,11,0.35)] shadow-amber-900/40',
        iconBg: 'bg-amber-900/80',
        iconBorder: 'border-amber-500/70',
        iconText: 'text-amber-100',
        chipBg: 'bg-amber-900/80',
        chipText: 'text-amber-100',
        chipBorder: 'border-amber-500/70',
      };
    case 'low':
    default:
      return {
        label: 'مخاطر منخفضة',
        icon: '✅',
        border: 'border-emerald-500/60',
        bg: 'shadow-[0_0_0_1px_rgba(16,185,129,0.35)] shadow-emerald-900/40',
        iconBg: 'bg-emerald-900/80',
        iconBorder: 'border-emerald-500/70',
        iconText: 'text-emerald-100',
        chipBg: 'bg-emerald-900/80',
        chipText: 'text-emerald-100',
        chipBorder: 'border-emerald-500/70',
      };
  }
};

export default RiskIndicator;
