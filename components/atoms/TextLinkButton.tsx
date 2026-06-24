import Link from "next/link";
import type { ReactNode } from "react";

export default function TextLinkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md border border-brand-200 text-brand-600 transition hover:bg-brand-50 ${className}`}
    >
      {children}
    </Link>
  );
}
