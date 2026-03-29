import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";
import AppIcon from "./AppIcon";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
      }, 300);
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    if (timers.current[id]) clearTimeout(timers.current[id]);
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error", 6000),
      info: (msg) => addToast(msg, "info"),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`toast toast-${t.type} ${t.exiting ? "toast-exit" : ""}`}
            onClick={() => removeToast(t.id)}
          >
            <span className="toast-icon">
              {t.type === "success" ? (
                <AppIcon name="check-mark" size={22} />
              ) : t.type === "error" ? (
                <AppIcon name="cross-mark" size={22} />
              ) : (
                <AppIcon name="information" size={22} />
              )}
            </span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
