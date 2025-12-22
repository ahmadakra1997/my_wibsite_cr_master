// frontend/src/components/common/ToastProvider.jsx
import React from 'react';
import { createPortal } from 'react-dom';

const ToastContext = React.createContext(null);

function genId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// ✅ توافق: يسمح باستدعاء addToast بصيغ متعددة بدون كسر أي مكوّن
function normalizeToastArgs(args) {
  // 1) addToast({ type, title, message, description, duration })
  if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    const o = args[0] || {};
    const type = o.type ?? 'info';
    const title = o.title ?? '';
    // دعم message/description/text
    const message = o.message ?? o.description ?? o.text ?? '';
    const duration = typeof o.duration === 'number' ? o.duration : 2600;
    return { type, title, message, duration };
  }

  // 2) addToast(type, message, title?, duration?)
  if (typeof args[0] === 'string') {
    const type = args[0] || 'info';
    const message = typeof args[1] === 'string' ? args[1] : String(args[1] ?? '');
    const title = typeof args[2] === 'string' ? args[2] : '';
    const duration = typeof args[3] === 'number' ? args[3] : 2600;
    return { type, title, message, duration };
  }

  // 3) fallback
  return { type: 'info', title: '', message: '', duration: 2600 };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (...args) => {
      const { type = 'info', title = '', message = '', duration = 2600 } = normalizeToastArgs(args);

      const id = genId();
      const toast = { id, type, title, message, duration };

      setToasts((prev) => [toast, ...(Array.isArray(prev) ? prev : [])].slice(0, 5));

      // Guards: لا نكسر SSR / بيئات بدون window
      if (duration && duration > 0 && typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
        window.setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [removeToast]
  );

  const value = React.useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  const canPortal = typeof document !== 'undefined' && !!document.body;

  return (
    <ToastContext.Provider value={value}>
      {children}

      {canPortal
        ? createPortal(
            <div
              aria-live="polite"
              aria-relevant="additions"
              style={{
                position: 'fixed',
                bottom: 16,
                left: 16,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxWidth: 380,
              }}
            >
              {toasts.map((t) => (
                <div
                  key={t.id}
                  role="status"
                  style={{
                    borderRadius: 16,
                    padding: '10px 12px',
                    background:
                      'linear-gradient(135deg, rgba(2,6,23,0.92), rgba(8,47,73,0.55))',
                    border: '1px solid rgba(56,189,248,0.22)',
                    boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
                    color: 'rgba(226,232,240,0.92)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontSize: 16, marginTop: 1 }}>
                      {t.type === 'success'
                        ? '✅'
                        : t.type === 'error'
                          ? '⛔'
                          : t.type === 'warning'
                            ? '⚠️'
                            : 'ℹ️'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {!!t.title && (
                        <div style={{ fontWeight: 900, marginBottom: 2, color: 'rgba(226,232,240,0.95)' }}>
                          {t.title}
                        </div>
                      )}
                      {!!t.message && (
                        <div style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(148,163,184,0.95)' }}>
                          {t.message}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeToast(t.id)}
                      aria-label="Close"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'rgba(148,163,184,0.9)',
                        cursor: 'pointer',
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext) || {};
}
