// frontend/src/components/common/LoadingSpinner.jsx
import React from 'react';

/**
 * سبينر بسيط قابل لإعادة الاستخدام.
 * يُستخدم في App.js كـ fallback في React.Suspense.
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
      className="loading-spinner-container"
      style={{
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '0.75rem',
        direction: 'rtl',
        textAlign: 'center',
      }}
    >
      <div
        className="loading-spinner"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '999px',
          border: '4px solid rgba(255, 255, 255, 0.12)',
          borderTopColor: '#0ea5e9',
          animation: 'qa-spinner-rotate 0.75s linear infinite',
        }}
      />

      <div
        className="loading-spinner-text"
        style={{
          fontSize: '0.9rem',
          opacity: 0.85,
          color: '#e5e7eb',
        }}
      >
        {text}
      </div>

      <style>
        {`
          @keyframes qa-spinner-rotate {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
