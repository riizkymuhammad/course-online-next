import Link from "next/link";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import { createSubCategory } from "../actions";

export type CategoryOption = {
  id: string;
  name: string;
};

export default function SubCategoryForm({
  categories,
  error,
  cancelHref,
  redirectTo,
  currentPath,
}: {
  categories: CategoryOption[];
  error?: string | string[];
  cancelHref: string;
  redirectTo: string;
  currentPath: string;
}) {
  const disabled = categories.length === 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Form Sub Kategori
        </h2>
      </div>

      <form action={createSubCategory} className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="current_path" value={currentPath} />

        {error ? (
          <StatusAlert
            variant="error"
            title="Gagal Menyimpan Sub Kategori"
            message={getMasterDataErrorMessage(error)}
          />
        ) : null}

        {disabled ? (
          <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
            Tambahkan kategori terlebih dahulu sebelum membuat sub kategori.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="category_id"
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Kategori
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              disabled={disabled}
              defaultValue=""
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="Sub Kategori"
            name="name"
            placeholder="Contoh: SKD, SKB, Grammar"
            required
            disabled={disabled}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href={cancelHref}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            Save Sub Kategori
          </button>
        </div>
      </form>
    </section>
  );
}

export function TextField({
  label,
  name,
  placeholder,
  required = false,
  disabled = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
    </div>
  );
}

export function getMasterDataErrorMessage(error: string | string[] | undefined) {
  const value = Array.isArray(error) ? error[0] : error;

  switch (value) {
    case "category-required":
      return "Kategori wajib dipilih.";
    case "name-required":
      return "Nama wajib diisi.";
    case "23505":
      return "Data dengan nama yang sama sudah ada.";
    default:
      return "Gagal menyimpan data ke database Supabase.";
  }
}
