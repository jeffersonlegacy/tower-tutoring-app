import { useEffect, useState } from 'react';
import { subscribeEvent } from '../services/eventBus';

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeEvent('ui-toast', (detail) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, ...detail }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, detail.durationMs || 3000);
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md text-sm max-w-sm pointer-events-auto ${
            toast.level === 'success'
              ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100'
              : toast.level === 'warning'
                ? 'bg-amber-900/80 border-amber-500/50 text-amber-100'
                : toast.level === 'error'
                  ? 'bg-rose-900/80 border-rose-500/50 text-rose-100'
                  : 'bg-slate-900/90 border-cyan-500/40 text-cyan-100'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
