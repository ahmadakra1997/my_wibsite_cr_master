// frontend/src/components/common/LoadingSpinner.jsx
import React from 'react';

/**
 * سبينر بسيط قابل لإعادة الاستخدام.
 * يُستخدم كـ fallback في Suspense أو داخل صفحات التحميل.
 */
const typeLabels = {
  trading: 'جاري تحميل واجهة التداول المتقدمة...',
  dashboard: 'جاري تحميل لوحة التحكم...',
  bot: 'جاري تحميل لوحة البوت...',
  default: 'جاري التحميل...',
};

const LoadingSpinner = ({ type = 'default', label }) => {
  const text = label || typeLabels[type] || typeLabels.default;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
      }}
    >
      {/* CSS داخلي لتجنب إضافة ملف جديد */}
      <style>
        {`
          @keyframes qa_spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: '999px',
          border: '3px solid rgba(255,255,255,0.10)',
          borderTopColor: 'rgba(0,229,255,0.85)',
          borderRightColor: 'rgba(0,245,155,0.70)',
          animation: 'qa_spin 0.9s linear infinite',
          boxShadow: '0 0 24px rgba(0,229,255,0.18)',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          marginTop: 10,
          color: 'var(--qa-text-muted, #7b8ca8)',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default LoadingSpinner;
