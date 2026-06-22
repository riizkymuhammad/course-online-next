import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { buildLearningPathOptionLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";

type Course = {
  id: string;
  title: string;
  learning_path_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  learning_path_title: string;
  description: string | null;
  thumbnail: string | null;
  material_file_name: string | null;
  section_count: number;
  module_count: number;
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
  title: "Course Management Dashboard",
  description: "Manajemen course untuk dashboard admin.",
};

const statusStyles: Record<Course["status"], string> = {
  published:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  draft:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  archived:
    "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
};

function buildCategoryPath(category: string | null, subCategory: string | null) {
  return [category, subCategory]
    .map((item) => item?.trim() ?? "")
    .filter(Boolean)
    .join(" > ");
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CourseManagementPage({
  searchParams,
}: PageProps<"/dashboard/course-management">) {
  const supabase = await createClient();
  const params = await searchParams;
  const [{ data: courseRows }, { data: learningPathRows }, { data: categoryRows }, { data: subCategoryRows }] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          "id, title, learning_path_id, category_id, sub_category_id, description, thumbnail, material_file_name, section_count, module_count, status, updated_at"
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
  const courses: Course[] =
    courseRows?.map((item) => {
      const category = item.category_id ? categoryMap.get(item.category_id) ?? null : null;
      const subCategory = item.sub_category_id
        ? subCategoryMap.get(item.sub_category_id) ?? null
        : null;
      const categoryPath = buildCategoryPath(category, subCategory);

      return {
        id: item.id,
        title: item.title,
        learning_path_id: item.learning_path_id,
        category_id: item.category_id,
        sub_category_id: item.sub_category_id,
        learning_path_title:
          (item.learning_path_id ? learningPathMap.get(item.learning_path_id) : null) ??
          categoryPath ??
          "Unassigned",
        description: item.description ?? null,
        thumbnail: item.thumbnail ?? null,
        material_file_name: item.material_file_name ?? null,
        section_count: item.section_count ?? 0,
        module_count: item.module_count ?? 0,
        status: (item.status ?? "draft") as Course["status"],
        updated_at: item.updated_at ?? "",
      };
    }) ?? [];

  const publishedCount = courses.filter((item) => item.status === "published").length;
  const draftCount = courses.filter((item) => item.status === "draft").length;
  const materialCount = courses.filter((item) => Boolean(item.material_file_name)).length;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Course Management" },
        ]}
        title="Course Management"
      />

      {getSearchParamValue(params.created) ? (
        <StatusAlert
          variant="success"
          title="Course Berhasil Dibuat"
          message="Course dan outline hasil analisis PDF berhasil disimpan ke database."
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <SummaryCard label="Total Course" value={String(courses.length)} note="Semua data course" />
        <SummaryCard label="Published" value={String(publishedCount)} note="Siap ditampilkan ke siswa" />
        <SummaryCard label="Draft" value={String(draftCount)} note="Belum dipublikasikan" />
        <SummaryCard label="PDF Materi" value={String(materialCount)} note="Memiliki file sumber" />
      </section>

      <section>
        <DataTable
          title="Course Records"
          description="Daftar course yang dibuat dari materi PDF."
          searchPlaceholder="Cari course..."
          action={
            <Link
              href="/dashboard/course-management/create"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Course
            </Link>
          }
          columns={[
            {
              key: "title",
              label: "Nama Course",
              sortable: true,
              type: "imageText",
              imageKey: "thumbnail",
              subtitleKey: "description",
            },
            { key: "learning_path_title", label: "Learning Path/Kategori", sortable: true },
            { key: "material_file_name", label: "PDF Materi", sortable: true },
            { key: "section_count", label: "Section", sortable: true },
            { key: "module_count", label: "Modul", sortable: true },
            {
              key: "status",
              label: "Status",
              sortable: true,
              type: "badge",
              badgeToneMap: statusStyles,
            },
          ]}
          data={courses.map((item) => ({
            ...item,
            description: item.description || "Belum ada ringkasan course.",
            material_file_name: item.material_file_name || "Belum ada file",
            section_count: `${item.section_count} Section`,
            module_count: `${item.module_count} Modul`,
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
