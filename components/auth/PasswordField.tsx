"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import FormControl, { fieldControlClassName } from "@/components/molecules/form/FormControl";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { cn } from "@/lib/cn";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type"> & {
  label: string;
  name: string;
  inputClassName?: string;
};

export default function PasswordField({
  label,
  name,
  required,
  inputClassName,
  ...props
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormControl label={label} name={name} required={required}>
      <div className="relative">
        <input
          {...props}
          id={name}
          name={name}
          type={isVisible ? "text" : "password"}
          required={required}
          className={cn(fieldControlClassName, "pr-11", inputClassName)}
        />
        <button
          type="button"
          aria-label={isVisible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-400 transition hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-gray-500 dark:hover:text-brand-400"
        >
          {isVisible ? <EyeCloseIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      </div>
    </FormControl>
  );
}

