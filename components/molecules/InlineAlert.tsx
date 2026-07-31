import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "success" | "error" | "warning" | "info";

const toneClasses: Record<AlertTone, string> = {
  success: "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400",
  error: "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400",
  warning: "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400",
  info: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400",
};

export default function InlineAlert({ children, tone = "info", className }: { children: ReactNode; tone?: AlertTone; className?: string }) {
  return <div role="alert" className={cn("rounded-xl border px-4 py-3 text-sm", toneClasses[tone], className)}>{children}</div>;
}
