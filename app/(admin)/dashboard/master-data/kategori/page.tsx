import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { createClient } from "@/lib/supabase/server";

type CategoryRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type SubCategoryRow = {
  id: string;
  category_id: string;
};

export const metadata: Metadata = {
  title: "Master Data Kategori",
  description: "Manajemen master data kategori untuk dashboard admin.",
};

export default async function CategoryPage({
  searchParams,
}: PageProps<"/dashboard/master-data/kategori">) {
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data: categoryRows, error: categoryError }, { data: subCategoryRows }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase.from("sub_categories").select("id, category_id"),
    ]);

  const subCategoryCountMap = new Map<string, number>();

  ((subCategoryRows ?? []) as SubCategoryRow[]).forEach((item) => {
    subCategoryCountMap.set(
      item.category_id,
      (subCategoryCountMap.get(item.category_id) ?? 0) + 1
    );
  });

  const categories = ((categoryRows ?? []) as CategoryRow[]).map((item) => ({
    ...item,
    sub_category_count: subCategoryCountMap.get(item.id) ?? 0,
  }));
  const usedCategoryCount = categories.filter((item) => item.sub_category_count > 0).length;
  const totalSubCategories = Array.from(subCategoryCountMap.values()).reduce(
    (sum, value) => sum + value,
    0
  );

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Master Data" },
          { label: "Kategori" },
        ]}
        title="Master Data Kategori"
      />

      {params.categoryCreated ? (
        <StatusAlert
          variant="success"
          title="Kategori Berhasil Ditambahkan"
          message="Data kategori berhasil disimpan ke database Supabase."
        />
      ) : null}
      {params.subCategoryCreated ? (
        <StatusAlert
          variant="success"
          title="Sub Kategori Berhasil Ditambahkan"
          message="Data sub kategori berhasil disimpan ke database Supabase."
        />
      ) : null}
      {categoryError ? (
        <StatusAlert
          variant="error"
          title="Gagal Memuat Kategori"
          message="Pastikan migrasi tabel master data sudah dijalankan di Supabase."
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <SummaryCard label="Total Kategori" value={String(categories.length)} note="Semua kategori" />
        <SummaryCard
          label="Total Sub Kategori"
          value={String(totalSubCategories)}
          note="Terhubung ke kategori"
        />
        <SummaryCard
          label="Kategori Terisi"
          value={String(usedCategoryCount)}
          note="Memiliki sub kategori"
        />
      </section>

      <section>
        <DataTable
          title="Kategori Records"
          description="Data kategori dan jumlah sub kategori."
          searchPlaceholder="Search kategori..."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/master-data/kategori/create"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
              >
                Tambah Kategori
              </Link>
              <Link
                href="/dashboard/master-data/kategori/sub-kategori/create"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
              >
                Tambah Sub Kategori
              </Link>
            </div>
          }
          columns={[
            {
              key: "id",
              label: "ID",
              sortable: true,
              className: "min-w-[260px] font-mono text-xs",
            },
            { key: "name", label: "Kategori", sortable: true },
            { key: "sub_category_label", label: "Jumlah Sub Kategori", sortable: true },
          ]}
          data={categories.map((item) => ({
            ...item,
            sub_category_label: `${item.sub_category_count} Sub Kategori`,
          }))}
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
