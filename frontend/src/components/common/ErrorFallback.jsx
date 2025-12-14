// frontend/src/components/common/ErrorFallback.jsx
import React from 'react';

/**
 * مكوّن مخصص ليكون FallbackComponent لـ react-error-boundary
 * يعرض رسالة خطأ ودية مع إمكانية إعادة المحاولة أو إعادة تحميل التطبيق.
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const handleRetry = () => {
    if (typeof resetErrorBoundary === 'function') {
      resetErrorBoundary();
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background:
          'radial-gradient(circle at top, #020617, #020617 40%, #020617 70%)',
        color: '#e5e7eb',
        direction: 'rtl',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '18px',
          border: '1px solid rgba(148,163,184,0.5)',
          background:
            'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at bottom right, rgba(74,222,128,0.16), transparent 55%), rgba(15,23,42,0.98)',
          boxShadow:
            '0 24px 80px rgba(15,23,42,0.95), 0 0 0 1px rgba(15,23,42,0.9)',
          padding: '18px 18px 14px',
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
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              background: 'rgba(15,23,42,0.96)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 0 20px rgba(251,113,133,0.7)',
            }}
          >
            ⚠️
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                background:
                  'linear-gradient(90deg,#f97373,#fb7185,#fb923c)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              حدث خطأ غير متوقع في النظام
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: '#9ca3af',
              }}
            >
              لا تقلق، تم تسجيل الخطأ في نظام المراقبة. يمكنك إعادة
              المحاولة أو تحديث التطبيق بالكامل.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: '10px',
              marginBottom: '8px',
              padding: '8px 10px',
              borderRadius: '12px',
              background: 'rgba(15,23,42,0.96)',
              border: '1px solid rgba(148,163,184,0.7)',
              fontSize: '11px',
              color: '#e5e7eb',
              direction: 'ltr',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: '11px',
                marginBottom: '4px',
                color: '#cbd5f5',
              }}
            >
              التفاصيل التقنية:
            </div>
            <code
              style={{
                display: 'block',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#e5e7eb',
              }}
            >
              {error.message || String(error)}
            </code>
          </div>
        )}

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={handleRetry}
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(148,163,184,0.8)',
              padding: '6px 14px',
              fontSize: '12px',
              background: 'rgba(15,23,42,0.95)',
              color: '#e5e7eb',
              cursor: 'pointer',
            }}
          >
            إعادة المحاولة
          </button>
          <button
            type="button"
            onClick={handleReload}
            style={{
              borderRadius: '999px',
              border: 'none',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              background:
                'linear-gradient(90deg,#22d3ee,#38bdf8,#4ade80)',
              color: '#020617',
              cursor: 'pointer',
            }}
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
