// frontend/src/components/common/LoadingState.jsx
import React, { useEffect } from 'react';

/**
 * مكوّن حالة تحميل عام يستخدم في:
 * - LiveCharts (type="chart")
 * - OrderBook (type="orderbook")
 * - PositionManager (type="positions")
 */

const LOADING_STATE_STYLES_ID = 'qa-loading-state-styles';

const LOADING_STATE_STYLES = `
.qa-loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
}

.qa-loading-state-card {
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background:
    radial-gradient(circle at top left, rgba(0, 229, 255, 0.15), transparent 55%),
    radial-gradient(circle at bottom right, rgba(74, 222, 128, 0.12), transparent 55%),
    rgba(15, 23, 42, 0.96);
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(15, 23, 42, 0.9);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.qa-loading-state-icon {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
}

.qa-loading-state-main {
  flex: 1;
  min-width: 0;
}

.qa-loading-state-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--qa-text-main, #e5f4ff);
  margin-bottom: 2px;
}

.qa-loading-state-desc {
  font-size: 11px;
  color: var(--qa-text-muted, #7b8ca8);
}

.qa-loading-state-skeleton {
  width: 60px;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(30, 64, 175, 0.6),
    rgba(37, 99, 235, 0.9),
    rgba(30, 64, 175, 0.6)
  );
  background-size: 200% 100%;
  animation: qa-loading-skeleton 1.2s ease-in-out infinite;
}

@keyframes qa-loading-skeleton {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: -200% 50%;
  }
}

@media (max-width: 640px) {
  .qa-loading-state-card {
    max-width: 100%;
  }
}
`;

const ensureLoadingStateStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(LOADING_STATE_STYLES_ID)) return;

  const style = document.createElement('style');
  style.id = LOADING_STATE_STYLES_ID;
  style.innerHTML = LOADING_STATE_STYLES;
  document.head.appendChild(style);
};

const TYPE_CONFIG = {
  chart: {
    title: 'جاري تحميل بيانات المخطط...',
    description: 'نقوم بجلب بيانات الشموع والمؤشرات الفنية من الخادم.',
    icon: '📊',
    defaultHeight: 260,
  },
  orderbook: {
    title: 'جاري تحميل دفتر الأوامر...',
    description: 'يتم تحديث أوامر الشراء والبيع من السوق الحي.',
    icon: '📗',
    defaultHeight: 220,
  },
  positions: {
    title: 'جاري تحميل المراكز المفتوحة...',
    description: 'نقوم بجلب مراكزك الحالية وتحليل المخاطر المرتبطة بها.',
    icon: '📂',
    defaultHeight: 220,
  },
  default: {
    title: 'جاري التحميل...',
    description: 'يرجى الانتظار لحظات حتى يكتمل تحميل البيانات.',
    icon: '⏳',
    defaultHeight: 200,
  },
};

const LoadingState = ({ type = 'default', message, height }) => {
  useEffect(() => {
    ensureLoadingStateStyles();
  }, []);

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
  const usedHeight = height ?? config.defaultHeight;

  return (
    <div
      className="qa-loading-state"
      style={{ minHeight: usedHeight }}
    >
      <div className="qa-loading-state-card">
        <div className="qa-loading-state-icon">
          {config.icon || '📡'}
        </div>

        <div className="qa-loading-state-main">
          <div className="qa-loading-state-title">
            {message || config.title}
          </div>
          <div className="qa-loading-state-desc">
            {config.description}
          </div>
        </div>

        <div className="qa-loading-state-skeleton" />
      </div>
    </div>
  );
};

export default LoadingState;
