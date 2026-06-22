import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { buildLearningPathOptionLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";

type Tryout = {
  id: string;
  title: string;
  learning_path_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  learning_path_title: string;
  category: string | null;
  sub_category: string | null;
  material_file_name: string | null;
  thumbnail_url: string | null;
  total_questions: number;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

type SubCategoryRow = {
  id: string;
  category_id: string;
  name: string;
};

export const metadata: Metadata = {
  title: "Tryout Management Dashboard",
  description: "Manajemen tryout untuk dashboard admin.",
};

const statusStyles: Record<Tryout["status"], string> = {
  published:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  draft:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  archived:
    "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getMaterialLabel(value: string | null) {
  if (!value) return "Belum ada file";
  const parts = value.split(/[\\/]/);
  return parts[parts.length - 1] || value;
}

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildTryoutCategoryLabel(category: string | null, subCategory: string | null) {
  const categoryPath = [category, subCategory]
    .map((item) => item?.trim() ?? "")
    .filter(Boolean)
    .join(" > ");

  return categoryPath || null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default async function TryoutManagementPage({
  searchParams,
}: PageProps<"/dashboard/tryout-management">) {
  const supabase = await createClient();
  const params = await searchParams;
  const createdQuestionCount = getSearchParamValue(params.questions);

  const [{ data: tryoutRows }, { data: learningPathRows }, { data: categoryRows }, { data: subCategoryRows }] = await Promise.all([
    supabase
      .from("tryouts")
      .select(
        "id, title, learning_path_id, category_id, sub_category_id, total_questions, material_file_name, thumbnail_url, status, updated_at"
      )
      .order("updated_at", { ascending: false }),
    supabase.from("learning_paths").select("id, title, category, sub_category, sub_sub_category"),
    supabase.from("categories").select("id, name"),
    supabase.from("sub_categories").select("id, category_id, name"),
  ]);

  const learningPathMap = new Map(
    (learningPathRows ?? []).map((item) => [item.id, buildLearningPathOptionLabel(item)])
  );
  const categoryMap = new Map(
    ((categoryRows ?? []) as CategoryRow[]).map((item) => [item.id, item.name])
  );
  const subCategoryMap = new Map(
    ((subCategoryRows ?? []) as SubCategoryRow[]).map((item) => [item.id, item.name])
  );

  const tryouts: Tryout[] =
    tryoutRows?.map((item) => {
      const category = item.category_id ? categoryMap.get(item.category_id) ?? null : null;
      const subCategory = item.sub_category_id
        ? subCategoryMap.get(item.sub_category_id) ?? null
        : null;
      const categoryLabel = buildTryoutCategoryLabel(category, subCategory);

      return {
        id: item.id,
        title: item.title,
        learning_path_id: item.learning_path_id,
        category_id: item.category_id,
        sub_category_id: item.sub_category_id,
        learning_path_title:
          (item.learning_path_id ? learningPathMap.get(item.learning_path_id) : null) ??
          categoryLabel ??
          "Unassigned",
        category,
        sub_category: subCategory,
        material_file_name: item.material_file_name,
        thumbnail_url: item.thumbnail_url ?? null,
        total_questions: item.total_questions ?? 0,
        status: (item.status ?? "draft") as Tryout["status"],
        updated_at: item.updated_at ?? "",
      };
    }) ?? [];

  const publishedCount = tryouts.filter((item) => item.status === "published").length;
  const totalQuestions = tryouts.reduce((sum, item) => sum + (item.total_questions || 0), 0);
  const materialsCount = tryouts.filter((item) => Boolean(item.material_file_name)).length;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tryout Management" },
        ]}
        title="Tryout Management"
      />

      {params.created ? (
        <StatusAlert
          variant="success"
          title="Tryout Berhasil Disimpan"
          message={
            createdQuestionCount
              ? `Tryout berhasil di-generate. ${createdQuestionCount} soal berhasil disimpan ke database.`
              : "Tryout berhasil di-generate dan disimpan ke database."
          }
        />
      ) : null}
      {params.updated ? (
        <StatusAlert
          variant="success"
          title="Tryout Berhasil Diperbarui"
          message="Perubahan data tryout berhasil disimpan ke database."
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <SummaryCard
          label="Total Tryout"
          value={String(tryouts.length)}
          note="Semua data dari database"
        />
        <SummaryCard
          label="Published"
          value={String(publishedCount)}
          note="Sudah tersedia untuk peserta"
        />
        <SummaryCard
          label="Jumlah Soal"
          value={String(totalQuestions)}
          note="Akumulasi soal dari seluruh tryout"
        />
        <SummaryCard
          label="Materials"
          value={String(materialsCount)}
          note="Tryout yang sudah memiliki file materi"
        />
      </section>

      <section>
        <DataTable
          title="Tryout Records"
          description="DataTable tryout dengan pencarian, sorting, dan pagination."
          searchPlaceholder="Search tryouts..."
          action={
            <Link
              href="/dashboard/tryout-management/create"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Tryout
            </Link>
          }
          columns={[
            {
              key: "title",
              label: "Judul Tryout",
              sortable: true,
              type: "imageText",
              imageKey: "thumbnail_url",
              subtitleKey: "learning_path_title",
            },
            { key: "learning_path_title", label: "Learning Path/Kategori", sortable: true },
            { key: "material_label", label: "Materi", sortable: true },
            { key: "total_questions", label: "Jumlah Soal", sortable: true },
            {
              key: "status",
              label: "Status",
              sortable: true,
              type: "badge",
              badgeToneMap: statusStyles,
            },
            { key: "updated_at", label: "Updated", sortable: true },
            {
              key: "actions",
              label: "Aksi",
              type: "actions",
              searchable: false,
              className: "w-[240px]",
              actions: [
                { label: "Edit", tone: "secondary", hrefKey: "edit_url" },
                { label: "Detail", tone: "primary" },
                { label: "Kerjakan", tone: "primary", hrefKey: "public_url" },
              ],
            },
          ]}
          data={tryouts.map((item) => ({
            ...item,
            material_label: getMaterialLabel(item.material_file_name),
            total_questions: `${item.total_questions} Soal`,
            edit_url: `/dashboard/tryout-management/${item.id}/edit`,
            public_url: `/tryout/${item.id}/${slugify(item.title)}`,
            updated_at: formatDate(item.updated_at),
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
