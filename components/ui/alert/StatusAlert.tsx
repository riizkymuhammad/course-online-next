"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type StatusAlertProps = {
  variant: "success" | "error";
  title: string;
  message: string;
  durationMs?: number;
};

const styles: Record<StatusAlertProps["variant"], string> = {
  success:
    "border-success-500 bg-success-500 text-white shadow-lg shadow-success-500/30",
  error:
    "border-error-500 bg-error-500 text-white shadow-lg shadow-error-500/30",
};

export default function StatusAlert({
  variant,
  title,
  message,
  durationMs = 4000,
}: StatusAlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => window.clearTimeout(timeout);
  }, [durationMs]);

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed left-1/2 top-20 z-[120] w-full max-w-xl -translate-x-1/2 px-4 sm:top-24 sm:px-6">
      <div
        className={`pointer-events-auto rounded-2xl border px-4 py-4 sm:px-5 ${styles[variant]}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
            {variant === "success" ? "!" : "x"}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-white/90">{message}</p>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white/90 transition hover:bg-white/20 hover:text-white"
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
