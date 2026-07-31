import type { ReactNode } from "react";
import ActionLink from "@/components/atoms/ActionLink";

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
    <ActionLink
      href={href}
      variant="secondary"
      className={className}
    >
      {children}
    </ActionLink>
  );
}
