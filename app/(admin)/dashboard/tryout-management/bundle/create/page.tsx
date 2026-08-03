import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import CreateBundleTryoutForm from "@/components/tryout/CreateBundleTryoutForm";
import { buildLearningPathOptionLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add Bundle Tryout",
  description: "Buat beberapa tryout per bab dari satu PDF.",
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function CreateBundleTryoutPage() {
  const supabase = await createClient();
  const [{ data: learningPaths }, { data: categories }, { data: subCategories }] =
    await Promise.all([
      supabase.from("learning_paths").select("id, title").order("title"),
      supabase.from("categories").select("id, name").order("name"),
      supabase
        .from("sub_categories")
        .select("id, category_id, name")
        .order("name"),
    ]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tryout Management", href: "/dashboard/tryout-management" },
          { label: "Add Bundle Tryout" },
        ]}
        title="Add Bundle Tryout"
      />

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Bundle Tryout Form
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Satu PDF akan diekstrak menjadi satu tryout untuk setiap bab dalam rentang.
          </p>
        </div>

        <CreateBundleTryoutForm
          learningPathOptions={(learningPaths ?? []).map((item) => ({
            value: item.id,
            label: buildLearningPathOptionLabel(item),
          }))}
          categoryOptions={(categories ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))}
          subCategoryOptions={(subCategories ?? []).map((item) => ({
            id: item.id,
            categoryId: item.category_id,
            name: item.name,
          }))}
          statusOptions={statusOptions}
        />
      </section>
    </div>
  );
}
