// frontend/src/components/common/ErrorBoundary.jsx
import React from 'react';
import ErrorFallback from './ErrorFallback';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    // تفعيل واجهة الخطأ
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // لوج مفصّل في الكونسول (يبقى كما هو أو تربطه لاحقًا بنظام مراقبة)
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    // لو المكوّن الأب وفّر onReset نستخدمه
    if (typeof this.props.onReset === 'function') {
      this.setState({ hasError: false, error: null }, () => {
        this.props.onReset();
      });
      return;
    }

    // وإلا نعيد تحميل التطبيق بالكامل (كما في النسخة الأصلية)
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // ✅ يسمح بتخصيص fallback إن وجد بدون كسر (اختياري)
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ error: this.state.error, reset: this.handleReset });
      }

      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
