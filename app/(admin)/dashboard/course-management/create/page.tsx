import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";

export const metadata: Metadata = {
  title: "Add Materi",
  description: "Tambah materi baru dari dashboard admin.",
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

const learningPathOptions = [
  "SQL Fundamentals for Data Analysis",
  "Backend API with PostgreSQL",
  "Database Design for Web Apps",
] as const;

export default function CreateCourseMaterialPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Course Management", href: "/dashboard/course-management" },
          { label: "Add Materi" },
        ]}
        title="Add Materi"
      />

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Materi Form</h2>
        </div>

        <form className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <FormField
                label="Judul Materi"
                name="title"
                placeholder="Contoh: SQL Select, Filter, and Order By"
                required
              />

              <TextAreaField
                label="Deskripsi"
                name="description"
                placeholder="Tulis ringkasan materi untuk admin dan siswa."
              />

              <FormField
                label="Pemateri"
                name="presenter"
                placeholder="Contoh: Rizky Pratama"
                required
              />

              <FormField
                label="Source File"
                name="source_file"
                placeholder="Contoh: storage/courses/sql-select-filter-order-by.mp4"
              />
            </div>

            <div className="space-y-6">
              <SelectField
                label="Learning Path"
                name="learning_path"
                defaultValue=""
                options={[
                  { value: "", label: "Pilih learning path" },
                  ...learningPathOptions.map((item) => ({ value: item, label: item })),
                ]}
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  label="Section"
                  name="section_count"
                  placeholder="Contoh: 4"
                  required
                />
                <FormField
                  label="Modul"
                  name="module_count"
                  placeholder="Contoh: 12"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  label="Price"
                  name="price"
                  placeholder="Contoh: 149000"
                />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue="draft"
                  options={statusOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>

              <SelectField
                label="Tipe Akses"
                name="is_free"
                defaultValue="true"
                options={[
                  { value: "true", label: "Free" },
                  { value: "false", label: "Paid" },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/dashboard/course-management"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Save Materi
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
        rows={7}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
