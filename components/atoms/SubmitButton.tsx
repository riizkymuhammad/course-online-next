"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/components/atoms/Button";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & {
  pendingLabel?: string;
};

export default function SubmitButton({
  children,
  disabled,
  pendingLabel = "Menyimpan...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={disabled || pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
