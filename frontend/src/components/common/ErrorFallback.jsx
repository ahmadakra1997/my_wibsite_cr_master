// frontend/src/components/common/ErrorFallback.jsx
import React from 'react';

/**
 * مكوّن مخصص ليكون FallbackComponent
 * يعرض رسالة خطأ ودية مع إمكانية إعادة المحاولة أو إعادة تحميل التطبيق.
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const canRetry = typeof resetErrorBoundary === 'function';

  const handleRetry = () => {
    if (!canRetry) return;
    try {
      resetErrorBoundary();
    } catch {
      // ignore
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
  };

  const message = error?.message || (error ? String(error) : '');

  return (
    <div
      role="alert"
      style={{
        borderRadius: 18,
        padding: 14,
        border: '1px solid rgba(255,159,28,0.45)',
        background: 'linear-gradient(135deg, rgba(2,6,23,0.92), rgba(255,159,28,0.08))',
        boxShadow: '0 18px 46px rgba(2,6,23,0.65)',
        color: 'rgba(226,232,240,0.95)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontSize: 20, lineHeight: 1 }}>⚠️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, letterSpacing: '0.04em' }}>حدث خطأ غير متوقع في النظام</div>
          <div style={{ marginTop: 6, color: 'rgba(148,163,184,0.92)', fontSize: 13, lineHeight: 1.5 }}>
            لا تقلق، تم تسجيل الخطأ في نظام المراقبة. يمكنك إعادة المحاولة أو تحديث التطبيق بالكامل.
          </div>
        </div>
      </div>

      {message ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ color: 'rgba(148,163,184,0.95)', fontSize: 12, marginBottom: 6 }}>التفاصيل التقنية:</div>
          <pre
            style={{
              margin: 0,
              padding: 10,
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.65)',
              color: 'rgba(226,232,240,0.92)',
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message}
          </pre>
        </div>
      ) : null}

      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleRetry}
          disabled={!canRetry}
          style={{
            opacity: canRetry ? 1 : 0.6,
            borderRadius: 14,
            padding: '10px 12px',
            border: '1px solid rgba(56,189,248,0.40)',
            background: 'rgba(56,189,248,0.10)',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 900,
            cursor: canRetry ? 'pointer' : 'not-allowed',
          }}
        >
          إعادة المحاولة
        </button>

        <button
          type="button"
          onClick={handleReload}
          style={{
            borderRadius: 14,
            padding: '10px 12px',
            border: '1px solid rgba(255,59,92,0.40)',
            background: 'rgba(255,59,92,0.10)',
            color: 'rgba(226,232,240,0.95)',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          إعادة تحميل التطبيق
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;
