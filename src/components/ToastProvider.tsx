'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
}

interface ToastCtx {
  showToast: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, tone: 'info' | 'success' | 'error' = 'info') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map((t) => {
          const toneCls =
            t.tone === 'error'
              ? 'bg-red-900 border-red-700 text-white'
              : t.tone === 'success'
              ? 'bg-forest-900 border-forest-700 text-cream'
              : 'bg-stone-900 border-stone-700 text-white';
          return (
            <div
              key={t.id}
              className={`pointer-events-auto border text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg ${toneCls}`}
            >
              {t.message}
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast harus di dalam ToastProvider');
  return ctx;
}
