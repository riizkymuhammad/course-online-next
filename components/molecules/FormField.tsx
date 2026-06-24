export default function FormField({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
  inputClassName = "rounded-lg",
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  inputClassName?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
        {required ? <span className="ml-1 text-error-500">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className={`h-11 w-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 ${inputClassName}`}
      />
    </div>
  );
}
