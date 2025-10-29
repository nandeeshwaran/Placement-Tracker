import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, ...toast }]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="toast-portal" style={{position:'fixed', right:16, top:16, zIndex:1400}}>
        {toasts.map((t) => (
          <Toast key={t.id} id={t.id} {...t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');

  return {
    show: (msg, opts = {}) => ctx.push({ message: msg, type: opts.type || 'info', duration: opts.duration || 3000 }),
    success: (msg, opts = {}) => ctx.push({ message: msg, type: 'success', duration: opts.duration || 3000 }),
    error: (msg, opts = {}) => ctx.push({ message: msg, type: 'error', duration: opts.duration || 4000 }),
    info: (msg, opts = {}) => ctx.push({ message: msg, type: 'info', duration: opts.duration || 3000 }),
  };
}

function Toast({ id, message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  // Use blue shades for all toast types to follow the blue color scheme
  const bg = 'linear-gradient(90deg,var(--color-blue-500,var(--color-blue-500)),var(--color-blue-600,var(--color-blue-600)))';

  return (
    <div role="status" aria-live="polite" style={{marginBottom:10}}>
      <div style={{padding:'10px 14px', borderRadius:10, color:'#fff', background:bg, boxShadow:'0 6px 20px rgba(2,6,23,0.12)', minWidth:200}}>
        {message}
      </div>
    </div>
  );
}

export default ToastProvider;
