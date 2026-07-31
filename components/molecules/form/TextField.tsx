import type { InputHTMLAttributes } from "react";
import FormControl, { fieldControlClassName } from "@/components/molecules/form/FormControl";
import { cn } from "@/lib/cn";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name"> & {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  inputClassName?: string;
};

export default function TextField({ label, name, hint, error, required, inputClassName, ...props }: TextFieldProps) {
  return (
    <FormControl label={label} name={name} required={required} hint={hint} error={error}>
      <input {...props} id={name} name={name} required={required} className={cn(fieldControlClassName, inputClassName)} />
    </FormControl>
  );
}
