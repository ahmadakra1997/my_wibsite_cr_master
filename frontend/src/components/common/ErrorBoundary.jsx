// frontend/src/components/common/ErrorBoundary.jsx
import React from 'react';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
    };
  }

  static getDerivedStateFromError(error) {
    // تفعيل واجهة الخطأ
    return { hasError: true, error: error || null };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, info);

    // ✅ Guard: callback خارجي لو موجود (بدون كسر)
    if (typeof this.props?.onError === 'function') {
      try {
        this.props.onError(error, info);
      } catch {
        // ignore
      }
    }

    // نحتفظ بالـ info إن احتجناه لاحقاً
    this.setState({ info: info || null });
  }

  handleReset = () => {
    // Reset state أولاً (تحسين UX)
    this.setState({ hasError: false, error: null, info: null }, () => {
      // لو الأب وفّر onReset نستخدمه
      if (typeof this.props?.onReset === 'function') {
        try {
          this.props.onReset();
          return;
        } catch {
          // ignore
        }
      }

      // fallback: إعادة تحميل التطبيق بالكامل
      if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
        window.location.reload();
      }
    });
  };

  render() {
    if (this.state.hasError) {
      // ✅ يسمح بتخصيص fallback إن وجد بدون كسر
      // 1) fallback function: ({ error, info, reset }) => ReactNode
      if (typeof this.props?.fallback === 'function') {
        return this.props.fallback({ error: this.state.error, info: this.state.info, reset: this.handleReset });
      }

      // 2) fallback element: <MyFallback />
      if (React.isValidElement(this.props?.fallback)) {
        return this.props.fallback;
      }

      // default
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
