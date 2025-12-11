// frontend/src/components/common/ErrorBoundary.jsx

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    // إعادة تحميل بسيطة للتطبيق
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: '100%',
              borderRadius: 20,
              padding: 18,
              border: '1px solid rgba(251,59,127,0.8)',
              background:
                'radial-gradient(circle at top, rgba(251,59,127,0.18), transparent 55%), #020617',
              boxShadow: '0 18px 50px rgba(0,0,0,0.9)',
              color: '#e5f4ff',
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 18,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              The trading interface hit an unexpected error. Please reload the
              app. If the issue persists, check your latest changes or backend
              status.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                borderRadius: 999,
                border: 'none',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background:
                  'linear-gradient(120deg, rgba(0,229,255,0.9), rgba(0,245,155,0.9))',
                color: '#020617',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
