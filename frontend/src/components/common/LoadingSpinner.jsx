// frontend/src/components/common/LoadingSpinner.jsx
import React, { useEffect } from 'react';

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

const LOADING_SPINNER_STYLES_ID = 'qa-loading-spinner-styles';

const LOADING_SPINNER_STYLES = `
.qa-loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  min-height: 90px;
  color: var(--qa-text-muted, #9ca3af);
  font-size: 13px;
  text-align: center;
}

.qa-loading-orb {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 3px solid rgba(148, 163, 184, 0.5);
  border-top-color: var(--qa-primary, #22d3ee);
  border-right-color: rgba(56, 189, 248, 0.85);
  border-left-color: rgba(45, 212, 191, 0.7);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
  animation: qa-loading-spin 0.7s linear infinite;
}

.qa-loading-text {
  font-size: 12px;
  max-width: 260px;
}

@keyframes qa-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
`;

const ensureSpinnerStyles = () => {
  if (typeof document === 'undefined') return;

  if (document.getElementById(LOADING_SPINNER_STYLES_ID)) return;

  const style = document.createElement('style');
  style.id = LOADING_SPINNER_STYLES_ID;
  style.innerHTML = LOADING_SPINNER_STYLES;
  document.head.appendChild(style);
};

const LoadingSpinner = ({ type = 'default', label }) => {
  useEffect(() => {
    ensureSpinnerStyles();
  }, []);

  const text = label || typeLabels[type] || typeLabels.default;

  return (
    <div className="qa-loading-spinner" role="status" aria-live="polite">
      <div className="qa-loading-orb" />
      <div className="qa-loading-text">{text}</div>
    </div>
  );
};

export default LoadingSpinner;
