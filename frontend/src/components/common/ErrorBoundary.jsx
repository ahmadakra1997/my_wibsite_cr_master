// frontend/src/components/common/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error || null };
  }

  componentDidCatch(error, info) {
    // مسموح في eslintConfig: console.error
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, info);

    // Guard: لو في callback خارجي
    if (typeof this.props?.onError === 'function') {
      try {
        this.props.onError(error, info);
      } catch {
        // ignore
      }
    }
  }

  handleReset = () => {
    // إعادة تحميل بسيطة للتطبيق (مع Guard)
    if (typeof this.props?.onReset === 'function') {
      try {
        this.props.onReset();
      } catch {
        // ignore
      }
    }

    // نحاول Reset state أولاً (تحسين UX)
    this.setState({ hasError: false, error: null });

    // إن لم تنجح أو لو تحتاج Reload فعلي
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message ||
        (this.state.error ? String(this.state.error) : 'Unknown error');

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background:
              'radial-gradient(circle at top, rgba(0,229,255,0.10), transparent 55%), #020617',
            color: 'var(--qa-text-main, #e5f4ff)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 760,
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
              padding: 18,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                aria-hidden="true"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 16,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(251,59,127,0.12)',
                  border: '1px solid rgba(251,59,127,0.35)',
                }}
              >
                ⚠️
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                  حدث خطأ غير متوقع
                </div>
                <div style={{ color: 'var(--qa-text-muted, #7b8ca8)', fontSize: 13 }}>
                  قد يكون السبب تغييرات واجهة، أو تعارض بيانات قادمة من الخادم. سنحافظ على الوظائف كما هي—ونعالج الخطأ بأقل تغيير.
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 16,
                border: '1px solid rgba(0,229,255,0.18)',
                background: 'rgba(0,229,255,0.06)',
                color: 'var(--qa-text-main, #e5f4ff)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {errorMessage}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  borderRadius: 14,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  border: '1px solid rgba(0,229,255,0.45)',
                  background:
                    'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(0,245,155,0.12))',
                  color: 'var(--qa-text-main, #e5f4ff)',
                  fontWeight: 700,
                }}
              >
                إعادة تحميل التطبيق
              </button>

              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  borderRadius: 14,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--qa-text-main, #e5f4ff)',
                  fontWeight: 600,
                }}
              >
                محاولة متابعة بدون إعادة تحميل
              </button>
            </div>

            <div style={{ marginTop: 10, color: 'var(--qa-text-muted, #7b8ca8)', fontSize: 12 }}>
              ملاحظة: هذه الشاشة لا تغيّر أي منطق تداول/باكيند—فقط تمنع الكراش وتعرض معلومات مفيدة.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
