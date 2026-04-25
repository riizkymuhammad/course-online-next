import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";

export const metadata: Metadata = {
  title: "Add Learning Path",
  description: "Tambah learning path baru dari dashboard admin.",
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export default function CreateLearningPathPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Learning Path", href: "/dashboard/learning-path" },
          { label: "Add Learning Path" },
        ]}
        title="Add Learning Path"
      />

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Learning Path Form
          </h2>
        </div>

        <form className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <FormField
                label="Title"
                name="title"
                placeholder="Contoh: SQL Fundamentals for Data Analysis"
                required
              />

              <TextAreaField
                label="Description"
                name="description"
                placeholder="Tulis ringkasan learning path untuk admin dan pengguna."
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/dashboard/learning-path"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Save Learning Path
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormField({
  label,
  name,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
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
        className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={8}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
    </div>
  );
}
