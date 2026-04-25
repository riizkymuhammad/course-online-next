import Link from "next/link";

export default function LoginForm() {
  return (
    <form className="space-y-6">
      <div className="grid gap-5">
        <Field label="Email" name="email" type="email" placeholder="admin@courseonline.com" required />
        <Field label="Password" name="password" type="password" placeholder="Masukkan password" required />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
          Remember me
        </label>
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Lupa password?
        </Link>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Login
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
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
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
    </div>
  );
}
