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

  // إزالة تلقائية بعد مدة لكل Toast
  useEffect(() => {
    if (!toasts.length) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), toast.duration || 4000),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  const value = useMemo(
    () => ({
      addToast,
      removeToast,
    }),
    [addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.title && <div className="toast-title">{toast.title}</div>}
            {toast.description && (
              <div className="toast-description">{toast.description}</div>
            )}
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
