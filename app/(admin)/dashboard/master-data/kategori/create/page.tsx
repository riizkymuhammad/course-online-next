import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import {
  TextField,
  getMasterDataErrorMessage,
} from "../../_components/SubCategoryForm";
import { createCategory } from "../../actions";

export const metadata: Metadata = {
  title: "Tambah Kategori",
  description: "Tambah master data kategori dari dashboard admin.",
};

export default async function CreateCategoryPage({
  searchParams,
}: PageProps<"/dashboard/master-data/kategori/create">) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Master Data" },
          { label: "Kategori", href: "/dashboard/master-data/kategori" },
          { label: "Tambah Kategori" },
        ]}
        title="Tambah Kategori"
      />

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Form Kategori
          </h2>
        </div>

        <form action={createCategory} className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
          <input type="hidden" name="redirect_to" value="/dashboard/master-data/kategori" />
          <input
            type="hidden"
            name="current_path"
            value="/dashboard/master-data/kategori/create"
          />

          {error ? (
            <StatusAlert
              variant="error"
              title="Gagal Menyimpan Kategori"
              message={getMasterDataErrorMessage(error)}
            />
          ) : null}

          <div className="max-w-xl">
            <TextField
              label="Kategori"
              name="name"
              placeholder="Contoh: CPNS, Bahasa Inggris, Informatika"
              required
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/dashboard/master-data/kategori"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Save Kategori
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
