import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const fieldControlClassName =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:disabled:bg-white/[0.02] dark:disabled:text-gray-500";

type FormControlProps = {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export default function FormControl({ label, name, required, hint, error, children, className }: FormControlProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
        {required ? <span className="ml-1 text-error-500">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-error-600 dark:text-error-400">{error}</p> : null}
      {!error && hint ? <p className="text-xs leading-5 text-gray-400">{hint}</p> : null}
    </div>
  );
}
