'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'info' | 'error' | 'default';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

let addToast: ((message: string, type: ToastType) => void) | null = null;

export const toast = {
  success: (message: string) => addToast?.(message, 'success'),
  info: (message: string) => addToast?.(message, 'info'),
  error: (message: string) => addToast?.(message, 'error'),
  default: (message: string) => addToast?.(message, 'default'),
};

const styles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  default: 'bg-zinc-900 border-zinc-800 text-white',
};

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  default: <Info className="w-5 h-5 text-white" />,
};

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToast = (message, type) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    return () => {
      addToast = null;
    };
  }, []);

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-[5rem] right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-xl border shadow-lg ${styles[t.type]}`}
        >
          {icons[t.type]}
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button type="button" onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
