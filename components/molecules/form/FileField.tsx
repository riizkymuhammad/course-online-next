import type { InputHTMLAttributes } from "react";
import FormControl from "@/components/molecules/form/FormControl";
import { cn } from "@/lib/cn";

type FileFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type"> & {
  label: string;
  name: string;
  hint?: string;
  error?: string;
};

export default function FileField({ label, name, hint, error, required, className, ...props }: FileFieldProps) {
  return (
    <FormControl label={label} name={name} required={required} hint={hint} error={error}>
      <input
        {...props}
        id={name}
        name={name}
        type="file"
        required={required}
        className={cn("block w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-600 file:mr-4 file:border-0 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:file:bg-white/[0.05] dark:file:text-gray-200", className)}
      />
    </FormControl>
  );
}
