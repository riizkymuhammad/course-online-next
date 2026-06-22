import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import EditCourseForm from "@/components/course/EditCourseForm";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import { buildLearningPathOptionLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit Course",
  description: "Edit metadata course dari dashboard admin.",
};

const statusOptions = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
] as const;

type CategoryRow = { id: string; name: string };
type SubCategoryRow = { id: string; category_id: string; name: string };

function getErrorMessage(error: string) {
  switch (error) {
    case "required-fields":
      return "Nama course dan status wajib diisi.";
    case "category-required":
      return "Pilih kategori terlebih dahulu sebelum memilih sub kategori.";
    case "category-not-found":
      return "Kategori yang dipilih tidak ditemukan.";
    case "sub-category-not-found":
      return "Sub kategori tidak ditemukan untuk kategori yang dipilih.";
    case "unauthorized":
      return "Hanya admin yang dapat memperbarui course.";
    case "server-configuration":
      return "SUPABASE_SERVICE_ROLE_KEY belum tersedia pada server.";
    default:
      return "Gagal memperbarui course. Silakan coba lagi.";
  }
}

export default async function EditCoursePage({
  params,
  searchParams,
}: PageProps<"/dashboard/course-management/[id]/edit">) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: courseRow }, { data: learningPathRows }, { data: categoryRows }, { data: subCategoryRows }] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          "id, title, learning_path_id, category_id, sub_category_id, description, status, material_file_name"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("learning_paths")
        .select("id, title, category, sub_category, sub_sub_category")
        .order("category", { ascending: true })
        .order("sub_category", { ascending: true })
        .order("sub_sub_category", { ascending: true })
        .order("title", { ascending: true }),
      supabase.from("categories").select("id, name").order("name", { ascending: true }),
      supabase
        .from("sub_categories")
        .select("id, category_id, name")
        .order("name", { ascending: true }),
    ]);

  if (!courseRow) {
    redirect("/dashboard/course-management?error=course-not-found");
  }

  const learningPathOptions =
    learningPathRows?.map((item) => ({
      value: item.id,
      label: buildLearningPathOptionLabel(item),
    })) ?? [];
  const categoryOptions = ((categoryRows ?? []) as CategoryRow[]).map((item) => ({
    id: item.id,
    name: item.name,
  }));
  const subCategoryOptions = ((subCategoryRows ?? []) as SubCategoryRow[]).map((item) => ({
    id: item.id,
    categoryId: item.category_id,
    name: item.name,
  }));

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Course Management", href: "/dashboard/course-management" },
          { label: "Edit Course" },
        ]}
        title="Edit Course"
        description="Perbarui metadata course tanpa meng-generate ulang section, modul, dan materi."
      />

      {query.error ? (
        <StatusAlert
          variant="error"
          title="Gagal Memperbarui Course"
          message={getErrorMessage(String(query.error))}
        />
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit Course Form</h2>
        </div>

        <EditCourseForm
          values={{
            id: courseRow.id,
            title: courseRow.title ?? "",
            learningPathId: courseRow.learning_path_id ?? "",
            categoryId: courseRow.category_id ?? "",
            subCategoryId: courseRow.sub_category_id ?? "",
            description: courseRow.description ?? "",
            status: courseRow.status ?? "published",
            materialFileName: courseRow.material_file_name ?? null,
          }}
          learningPathOptions={learningPathOptions}
          categoryOptions={categoryOptions}
          subCategoryOptions={subCategoryOptions}
          statusOptions={statusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </section>
    </div>
  );
}
