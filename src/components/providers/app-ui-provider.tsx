"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type AppUiContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const AppUiContext = createContext<AppUiContextValue | null>(null);

const TOAST_MS = 3200;

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const titleId = useId();
  const descId = useId();

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      window.setTimeout(() => dismissToast(id), TOAST_MS);
    },
    [dismissToast],
  );

  const success = useCallback(
    (message: string) => toast(message, "success"),
    [toast],
  );
  const error = useCallback(
    (message: string) => toast(message, "error"),
    [toast],
  );
  const info = useCallback(
    (message: string) => toast(message, "info"),
    [toast],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    setConfirmState((prev) => {
      prev?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmState, closeConfirm]);

  return (
    <AppUiContext.Provider value={{ toast, success, error, info, confirm }}>
      {children}

      {/* Toast */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:right-4 sm:top-4 sm:items-end"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "toast-enter pointer-events-auto max-w-sm rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ring-1 backdrop-blur-md",
              t.variant === "success" &&
                "bg-emerald-900/95 text-white ring-emerald-700/50",
              t.variant === "error" &&
                "bg-red-900/95 text-white ring-red-700/50",
              t.variant === "info" &&
                "bg-slate-900/95 text-white ring-slate-700/50",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
          onClick={() => closeConfirm(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={confirmState.description ? descId : undefined}
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={titleId}
              className="text-base font-semibold text-slate-900"
            >
              {confirmState.title}
            </h2>
            {confirmState.description && (
              <p
                id={descId}
                className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600"
              >
                {confirmState.description}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 flex-1"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.cancelLabel ?? "取消"}
              </Button>
              <Button
                type="button"
                variant={
                  confirmState.variant === "danger" ? "danger" : "default"
                }
                className={cn(
                  "min-h-11 flex-1",
                  confirmState.variant === "danger" &&
                    "border border-red-200 bg-red-600 text-white hover:bg-red-700",
                )}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel ?? "確定"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppUiContext.Provider>
  );
}

export function useAppUi() {
  const ctx = useContext(AppUiContext);
  if (!ctx) {
    throw new Error("useAppUi must be used within AppUiProvider");
  }
  return ctx;
}
