import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function SectionLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn("text-xs font-semibold uppercase tracking-[0.18em] text-brand-500", className)}
    />
  );
}
