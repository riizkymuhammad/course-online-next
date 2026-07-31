import type { TextareaHTMLAttributes } from "react";
import FormControl, { fieldControlClassName } from "@/components/molecules/form/FormControl";
import { cn } from "@/lib/cn";

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> & {
  label: string;
  name: string;
  hint?: string;
  error?: string;
};

export default function TextAreaField({ label, name, hint, error, required, className, rows = 5, ...props }: TextAreaFieldProps) {
  return (
    <FormControl label={label} name={name} required={required} hint={hint} error={error}>
      <textarea {...props} id={name} name={name} rows={rows} required={required} className={cn(fieldControlClassName, "h-auto min-h-28 py-3", className)} />
    </FormControl>
  );
}
