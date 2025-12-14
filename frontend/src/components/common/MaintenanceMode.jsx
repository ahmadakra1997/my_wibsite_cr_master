// frontend/src/components/common/MaintenanceMode.jsx
import React from 'react';

/**
 * صفحة وضع الصيانة (Maintenance Mode)
 * تُعرض عندما يكون REACT_APP_MAINTENANCE_MODE = 'true'
 */
const MaintenanceMode = () => {
  const message =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.REACT_APP_MAINTENANCE_MESSAGE) ||
    'نقوم حالياً بإجراء تحديثات جوهرية على نظام QA TRADER لتحسين الأداء وإضافة مزايا جديدة.';

  const eta =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.REACT_APP_MAINTENANCE_ETA) ||
    'العودة المتوقعة: قريباً جدًا خلال الساعات القادمة.';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background:
          'radial-gradient(circle at top, rgba(34,211,238,0.28), transparent 55%), radial-gradient(circle at bottom, rgba(74,222,128,0.22), transparent 55%), #020617',
        color: '#e5e7eb',
        direction: 'rtl',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: '20px',
          border: '1px solid rgba(148,163,184,0.6)',
          background:
            'radial-gradient(circle at top left, rgba(56,189,248,0.22), transparent 55%), radial-gradient(circle at bottom right, rgba(45,212,191,0.18), transparent 55%), rgba(15,23,42,0.98)',
          boxShadow:
            '0 28px 80px rgba(15,23,42,0.95), 0 0 0 1px rgba(15,23,42,0.9)',
          padding: '20px 20px 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              background: 'rgba(15,23,42,0.96)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 0 22px rgba(56,189,248,0.7)',
            }}
          >
            🛠️
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                background:
                  'linear-gradient(90deg,#22d3ee,#38bdf8,#4ade80)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              نظام QA TRADER في وضع الصيانة
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: '#9ca3af',
              }}
            >
              نعمل على تجهيز نسخة أكثر استقراراً وذكاءً من منصة التداول
              الكمية.
            </p>
          </div>
        </div>

        <p
          style={{
            margin: '10px 0 6px',
            fontSize: '13px',
            color: '#e5e7eb',
          }}
        >
          {message}
        </p>

        <p
          style={{
            margin: '0 0 8px',
            fontSize: '12px',
            color: '#a5f3fc',
          }}
        >
          {eta}
        </p>

        <p
          style={{
            margin: 0,
            fontSize: '11px',
            color: '#9ca3af',
          }}
        >
          في هذه الفترة لن يعمل التداول الآلي ولا واجهة السوق الحيّة بشكل
          كامل.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceMode;
