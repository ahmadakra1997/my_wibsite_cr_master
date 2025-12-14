// frontend/src/components/common/ToastProvider.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import './Toast.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, type = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const toast = {
        id,
        title: title || '',
        description: description || '',
        type,
        duration,
      };

      setToasts((prev) => [...prev, toast]);
    },
    [],
  );

  // إزالة التوست تلقائياً بعد المدة المحدّدة
  useEffect(() => {
    if (!toasts.length) return;

    const timers = toasts.map((toast) =>
      setTimeout(
        () => removeToast(toast.id),
        toast.duration || 4000,
      ),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  const contextValue = useMemo(
    () => ({
      addToast,
      removeToast,
    }),
    [addToast, removeToast],
  );

  const getIconForType = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div
        className="toast-container"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="alert"
            onClick={() => removeToast(toast.id)}
          >
            <div className="toast-accent" />

            <div className="toast-main">
              <div className="toast-icon">
                {getIconForType(toast.type)}
              </div>

              <div className="toast-content">
                {toast.title && (
                  <div className="toast-title">
                    {toast.title}
                  </div>
                )}

                {toast.description && (
                  <div className="toast-description">
                    {toast.description}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="toast-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                aria-label="إغلاق التنبيه"
              >
                ×
              </button>
            </div>

            <div
              className="toast-progress"
              style={{
                animationDuration: `${toast.duration || 4000}ms`,
              }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
