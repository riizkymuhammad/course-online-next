import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type InfoCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
};

export default function InfoCard({ label, value, icon, compact, className }: InfoCardProps) {
  return (
    <div className={cn("flex rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]", icon ? "items-center gap-3" : "flex-col", compact ? "p-3" : "p-4", className)}>
      {icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">{icon}</span>
      ) : null}
      <div className="min-w-0">
        <p className={cn("text-xs text-gray-400", !compact && "font-medium uppercase tracking-[0.18em]")}>{label}</p>
        <p className={cn("truncate text-sm font-semibold text-gray-800 dark:text-white/90", compact ? "mt-1" : "mt-2")}>{value}</p>
      </div>
    </div>
  );
}
