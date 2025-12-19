// frontend/src/components/common/ErrorFallback.jsx
import React from 'react';

/**
 * ErrorFallback
 * مكوّن ودّي لعرض رسالة خطأ مع زر إعادة المحاولة.
 * props:
 * - error?: Error | any
 * - resetErrorBoundary?: () => void
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const message = error?.message || (error ? String(error) : 'Unknown error');

  const handleReload = () => {
    // إمّا نستخدم resetErrorBoundary أو نعيد تحميل الصفحة بالكامل
    if (typeof resetErrorBoundary === 'function') {
      try {
        resetErrorBoundary();
        return;
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      style={{
        padding: 16,
        borderRadius: 18,
        border: '1px solid rgba(251,59,127,0.30)',
        background: 'rgba(251,59,127,0.08)',
        color: 'var(--qa-text-main, #e5f4ff)',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(251,59,127,0.12)',
            border: '1px solid rgba(251,59,127,0.35)',
          }}
        >
          ⚠️
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>حدث خطأ غير متوقع في النظام</div>
          <div style={{ color: 'var(--qa-text-muted, #7b8ca8)', fontSize: 12 }}>
            لا تقلق، يمكننا المحاولة من جديد. تم تسجيل الخطأ للمراجعة.
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 10,
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(2,6,23,0.55)',
          fontSize: 12,
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        {message}
      </div>

      <button
        type="button"
        onClick={handleReload}
        style={{
          marginTop: 12,
          borderRadius: 14,
          padding: '10px 14px',
          cursor: 'pointer',
          border: '1px solid rgba(0,229,255,0.45)',
          background: 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(0,245,155,0.12))',
          color: 'var(--qa-text-main, #e5f4ff)',
          fontWeight: 700,
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
};

export default ErrorFallback;
