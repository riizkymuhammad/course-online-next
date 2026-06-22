import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import CreateCourseForm from "@/components/course/CreateCourseForm";
import { buildLearningPathOptionLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tambah Course",
  description: "Buat course baru dari materi PDF dengan bantuan AI.",
};

const statusOptions = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
] as const;

type CategoryRow = {
  id: string;
  name: string;
};

type SubCategoryRow = {
  id: string;
  category_id: string;
  name: string;
};

export default async function CreateCourseMaterialPage() {
  const supabase = await createClient();
  const [{ data: learningPathRows }, { data: categoryRows }, { data: subCategoryRows }] =
    await Promise.all([
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
          { label: "Tambah Course" },
        ]}
        title="Tambah Course"
        description="Unggah PDF materi untuk membuat outline section dan modul dengan bantuan AI."
      />

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Course Form</h2>
        </div>

        <CreateCourseForm
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
