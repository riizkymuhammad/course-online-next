import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ButtonSize, ButtonVariant } from "@/components/atoms/Button";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary: "border border-brand-200 text-brand-600 hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/10",
  outline: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/[0.03]",
  ghost: "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.05]",
  danger: "bg-error-500 text-white hover:bg-error-600",
  filter: "border border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:text-brand-600 dark:border-gray-800 dark:bg-transparent dark:text-gray-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 rounded-md px-4 text-xs",
  md: "h-10 rounded-lg px-4 text-sm",
  lg: "h-11 rounded-lg px-5 text-sm",
  icon: "h-10 w-10 rounded-lg",
};

type ActionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export default function ActionLink({
  children,
  variant = "primary",
  size = "lg",
  className,
  ...props
}: ActionLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
