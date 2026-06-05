import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { buildLearningPathCategoryPath } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";

type LearningPath = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  sub_category: string | null;
  sub_sub_category: string | null;
  material_count: number | string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

export const metadata: Metadata = {
  title: "Learning Path Dashboard",
  description: "Manajemen learning path untuk dashboard admin.",
};

const statusStyles: Record<LearningPath["status"], string> = {
  published:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  draft:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  archived:
    "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
};

export default async function LearningPathPage({
  searchParams,
}: PageProps<"/dashboard/learning-path">) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data } = await supabase
    .from("learning_paths")
    .select("id, title, slug, description, category, sub_category, sub_sub_category, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  const learningPaths: LearningPath[] =
    data?.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description ?? "",
      category: item.category ?? null,
      sub_category: item.sub_category ?? null,
      sub_sub_category: item.sub_sub_category ?? null,
      material_count: 0,
      status: (item.status ?? "draft") as LearningPath["status"],
      created_at: item.created_at ?? "",
      updated_at: item.updated_at ?? "",
    })) ?? [];

  const publishedCount = learningPaths.filter((item) => item.status === "published").length;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Learning Path" },
        ]}
        title="Learning Path Management"
      />

      {params.created ? (
        <StatusAlert
          variant="success"
          title="Learning Path Berhasil Ditambahkan"
          message="Data learning path berhasil disimpan ke database Supabase."
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <SummaryCard
          label="Total Learning Path"
          value={String(learningPaths.length)}
          note="Semua status"
        />
        <SummaryCard label="Published" value={String(publishedCount)} note="Siap tampil ke user" />
        <SummaryCard
          label="Draft & Archived"
          value={String(learningPaths.length - publishedCount)}
          note="Perlu review internal"
        />
      </section>

      <section>
        <DataTable
          title="Learning Path Records"
          description="DataTable learning path dengan pencarian, sorting, dan pagination."
          searchPlaceholder="Search learning paths..."
          action={
            <Link
              href="/dashboard/learning-path/create"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Learning Path
            </Link>
          }
          columns={[
            {
              key: "title",
              label: "Judul",
              sortable: true,
            },
            {
              key: "category_path",
              label: "Kategori",
              sortable: true,
            },
            { key: "material_count", label: "Jumlah Materi", sortable: true },
            {
              key: "status",
              label: "Status",
              sortable: true,
              type: "badge",
              badgeToneMap: statusStyles,
            },
            {
              key: "actions",
              label: "Aksi",
              type: "actions",
              searchable: false,
              className: "w-[160px]",
              actions: [
                { label: "Edit", tone: "secondary" },
                { label: "Detail", tone: "primary" },
              ],
            },
          ]}
          data={learningPaths.map((item) => ({
            ...item,
            category_path: buildLearningPathCategoryPath(item) || "Tanpa Kategori",
            material_count: `${item.material_count} Materi`,
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
