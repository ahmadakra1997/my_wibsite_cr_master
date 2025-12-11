// frontend/src/components/common/ErrorFallback.jsx
import React from 'react';

/**
 * مكوّن مخصص ليكون FallbackComponent لـ react-error-boundary
 * يعرض رسالة خطأ ودية مع إمكانية إعادة المحاولة.
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const handleReload = () => {
    // إمّا نستخدم resetErrorBoundary أو نعيد تحميل الصفحة بالكامل
    if (typeof resetErrorBoundary === 'function') {
      resetErrorBoundary();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      className="error-fallback-container"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        direction: 'rtl',
      }}
    >
      <div
        className="error-fallback-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(10, 16, 30, 0.92)',
          borderRadius: '16px',
          border: '1px solid rgba(0, 163, 255, 0.35)',
          padding: '1.75rem 2rem',
          boxShadow: '0 18px 45px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          className="error-fallback-header"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              background:
                'radial-gradient(circle at 30% 30%, #ff6b6b, #a1002b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.25rem',
            }}
          >
            ⚠️
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.2rem',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              حدث خطأ غير متوقع في النظام
            </h2>
            <p
              style={{
                margin: 0,
                marginTop: '0.25rem',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.65)',
              }}
            >
              لا تقلق، يمكننا المحاولة من جديد. تم تسجيل الخطأ في نظام
              المراقبة لتحليله.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="error-fallback-details"
            style={{
              marginTop: '1.25rem',
              padding: '0.75rem 0.85rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.8)',
              maxHeight: '120px',
              overflow: 'auto',
              direction: 'ltr',
              textAlign: 'left',
            }}
          >
            {error.message || String(error)}
          </div>
        )}

        <div
          className="error-fallback-actions"
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={handleReload}
            style={{
              borderRadius: '999px',
              border: 'none',
              padding: '0.5rem 1.3rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              background:
                'linear-gradient(135deg, #00A3FF 0%, #38bdf8 50%, #22c55e 100%)',
              color: '#0b1120',
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
