"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Check, AlertCircle, X } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  exiting?: boolean;
}

const ToastContext = createContext<{
  toast: (message: string, type?: "success" | "error" | "info") => void;
}>({ toast: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 200);
      }, 3000);
    },
    []
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const icons = {
    success: <Check size={14} className="text-green-400" />,
    error: <AlertCircle size={14} className="text-red-400" />,
    info: <AlertCircle size={14} className="text-blue-400" />,
  };

  const borders = {
    success: "border-green-500/30",
    error: "border-red-500/30",
    info: "border-blue-500/30",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium max-w-sm
              bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${borders[t.type]}
              ${t.exiting ? "toast-exit" : "toast-enter"}`}
          >
            {icons[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
