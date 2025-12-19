import React from 'react';
import { createPortal } from 'react-dom';

const ToastContext = React.createContext(null);

function genId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    ({ type = 'info', title = '', message = '', duration = 2600 } = {}) => {
      const id = genId();
      const toast = { id, type, title, message, duration };
      setToasts((prev) => [toast, ...prev].slice(0, 5));

      if (duration && duration > 0) {
        window.setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const value = React.useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
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
            maxWidth: 360,
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              style={{
                borderRadius: 16,
                padding: '10px 12px',
                background: 'rgba(2,6,23,0.88)',
                border: '1px solid rgba(148,163,184,0.22)',
                boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
                color: 'rgba(226,232,240,0.92)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ fontSize: 16, marginTop: 1 }}>
                  {t.type === 'success' ? '✅' : t.type === 'error' ? '⛔' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div style={{ flex: 1 }}>
                  {!!t.title && (
                    <div style={{ fontWeight: 800, marginBottom: 2, color: 'rgba(226,232,240,0.95)' }}>
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
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext) || {};
}
