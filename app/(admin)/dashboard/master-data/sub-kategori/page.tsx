import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { createClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
};

type SubCategoryRow = {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export const metadata: Metadata = {
  title: "Master Data Sub Kategori",
  description: "Manajemen master data sub kategori untuk dashboard admin.",
};

export default async function SubCategoryPage({
  searchParams,
}: PageProps<"/dashboard/master-data/sub-kategori">) {
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data: categoryRows }, { data: subCategoryRows, error: subCategoryError }] =
    await Promise.all([
      supabase.from("categories").select("id, name"),
      supabase
        .from("sub_categories")
        .select("id, category_id, name, created_at, updated_at")
        .order("created_at", { ascending: false }),
    ]);

  const categoryNameMap = new Map(
    ((categoryRows ?? []) as CategoryRow[]).map((item) => [item.id, item.name])
  );
  const subCategories = ((subCategoryRows ?? []) as SubCategoryRow[]).map((item) => ({
    ...item,
    category_name: categoryNameMap.get(item.category_id) ?? "Tanpa Kategori",
  }));
  const totalCategories = categoryNameMap.size;
  const usedCategoryCount = new Set(subCategories.map((item) => item.category_id)).size;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Master Data" },
          { label: "Sub Kategori" },
        ]}
        title="Master Data Sub Kategori"
      />

      {params.subCategoryCreated ? (
        <StatusAlert
          variant="success"
          title="Sub Kategori Berhasil Ditambahkan"
          message="Data sub kategori berhasil disimpan ke database Supabase."
        />
      ) : null}
      {subCategoryError ? (
        <StatusAlert
          variant="error"
          title="Gagal Memuat Sub Kategori"
          message="Pastikan migrasi tabel master data sudah dijalankan di Supabase."
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <SummaryCard
          label="Total Sub Kategori"
          value={String(subCategories.length)}
          note="Semua sub kategori"
        />
        <SummaryCard
          label="Total Kategori"
          value={String(totalCategories)}
          note="Kategori tersedia"
        />
        <SummaryCard
          label="Kategori Terpakai"
          value={String(usedCategoryCount)}
          note="Dipakai sub kategori"
        />
      </section>

      <section>
        <DataTable
          title="Sub Kategori Records"
          description="Data sub kategori dan relasi kategorinya."
          searchPlaceholder="Search sub kategori..."
          action={
            <Link
              href="/dashboard/master-data/sub-kategori/create"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Tambah Sub Kategori
            </Link>
          }
          columns={[
            {
              key: "id",
              label: "ID",
              sortable: true,
              className: "min-w-[260px] font-mono text-xs",
            },
            { key: "category_name", label: "Kategori", sortable: true },
            { key: "name", label: "Sub Kategori", sortable: true },
          ]}
          data={subCategories}
        />
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-800 dark:text-white/90">{value}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>
    </div>
  );
}
