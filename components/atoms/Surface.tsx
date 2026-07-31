import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
  padded?: boolean;
};

export default function Surface({ as: Component = "section", children, className, padded = true, ...props }: SurfaceProps) {
  return (
    <Component
      {...props}
      className={cn(
        "rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]",
        padded && "p-5 sm:p-6",
        className
      )}
    >
      {children}
    </Component>
  );
}
