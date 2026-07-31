import type { SelectHTMLAttributes } from "react";
import FormControl, { fieldControlClassName } from "@/components/molecules/form/FormControl";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "onChange"> & {
  label: string;
  name: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
  onChange?: (value: string) => void;
};

export default function SelectField({ label, name, options, hint, error, required, className, onChange, ...props }: SelectFieldProps) {
  return (
    <FormControl label={label} name={name} required={required} hint={hint} error={error}>
      <select
        {...props}
        id={name}
        name={name}
        required={required}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={cn(fieldControlClassName, className)}
      >
        {options.map((option) => <option key={`${name}-${option.value}`} value={option.value}>{option.label}</option>)}
      </select>
    </FormControl>
  );
}
