// frontend/src/components/common/LoadingState.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * مكوّن حالة تحميل عام يستخدم في:
 * - LiveCharts (type="chart")
 * - OrderBook (type="orderbook")
 * - PositionManager (type="positions")
 */
const TYPE_CONFIG = {
  chart: {
    title: 'جاري تحميل بيانات المخطط...',
    description: 'نقوم بجلب بيانات الشموع والمؤشرات الفنية من الخادم.',
    icon: '📈',
    defaultHeight: 260,
  },
  orderbook: {
    title: 'جاري تحميل دفتر الأوامر...',
    description: 'يتم تحديث أوامر الشراء والبيع من السوق الحي.',
    icon: '📊',
    defaultHeight: 220,
  },
  positions: {
    title: 'جاري تحميل المراكز المفتوحة...',
    description: 'نقوم بجلب مراكزك الحالية وتحليل المخاطر المرتبطة بها.',
    icon: '📦',
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
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
  const usedHeight = height ?? config.defaultHeight;

  return (
    <div
      className={`loading-state loading-state-${type}`}
      style={{
        minHeight: typeof usedHeight === 'number' ? `${usedHeight}px` : usedHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        gap: '0.75rem',
        direction: 'rtl',
        textAlign: 'center',
      }}
    >
      <div
        className="loading-state-icon"
        style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}
      >
        {config.icon}
      </div>

      <div className="loading-state-text">
        <div
          className="loading-state-title"
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#e5e7eb',
          }}
        >
          {message || config.title}
        </div>
        <div
          className="loading-state-description"
          style={{
            marginTop: '0.25rem',
            fontSize: '0.8rem',
            color: 'rgba(148,163,184,0.95)',
          }}
        >
          {config.description}
        </div>
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <LoadingSpinner type={type === 'chart' ? 'trading' : 'default'} />
      </div>
    </div>
  );
};

export default LoadingState;
