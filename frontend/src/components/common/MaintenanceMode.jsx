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
      className="maintenance-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background:
          'radial-gradient(circle at top, #0f172a 0%, #020617 45%, #000000 100%)',
        color: '#e5e7eb',
        direction: 'rtl',
        textAlign: 'center',
      }}
    >
      <div
        className="maintenance-card"
        style={{
          maxWidth: '640px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.92)',
          borderRadius: '18px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          padding: '2rem 2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div
          className="maintenance-icon"
          style={{
            fontSize: '2.3rem',
            marginBottom: '0.75rem',
          }}
        >
          🛠️
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            margin: 0,
            marginBottom: '0.5rem',
          }}
        >
          نظام QA TRADER في وضع الصيانة
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            margin: 0,
            marginBottom: '0.75rem',
            color: 'rgba(209,213,219,0.9)',
          }}
        >
          {message}
        </p>

        <p
          style={{
            fontSize: '0.85rem',
            margin: 0,
            marginBottom: '1.5rem',
            color: 'rgba(148,163,184,0.95)',
          }}
        >
          {eta}
        </p>

        <div
          className="maintenance-notice"
          style={{
            fontSize: '0.8rem',
            color: 'rgba(148,163,184,0.9)',
            borderRadius: '999px',
            border: '1px dashed rgba(148,163,184,0.5)',
            padding: '0.5rem 1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>💡</span>
          <span>في هذه الفترة لن يعمل التداول الآلي ولا واجهة السوق الحيّة بشكل كامل.</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
