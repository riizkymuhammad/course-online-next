import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import EditTryoutForm from "@/components/tryout/EditTryoutForm";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import { buildLearningPathOptionLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit Tryout",
  description: "Edit data tryout dari dashboard admin.",
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
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

function getErrorMessage(error: string) {
  switch (error) {
    case "required-fields":
      return "Field wajib belum lengkap. Pastikan judul, jumlah soal, dan status terisi.";
    case "category-required":
      return "Pilih kategori terlebih dahulu sebelum memilih sub kategori.";
    case "category-not-found":
      return "Kategori yang dipilih tidak ditemukan.";
    case "sub-category-not-found":
      return "Sub kategori tidak ditemukan untuk kategori yang dipilih.";
    case "PGRST116":
      return "Data tryout tidak ditemukan.";
    default:
      return "Gagal memperbarui tryout. Silakan coba lagi.";
  }
}

export default async function EditTryoutPage({
  params,
  searchParams,
}: PageProps<"/dashboard/tryout-management/[id]/edit">) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const [{ data: tryoutRow }, { data: learningPathRows }, { data: categoryRows }, { data: subCategoryRows }] = await Promise.all([
    supabase
      .from("tryouts")
      .select(
        "id, title, learning_path_id, category_id, sub_category_id, total_questions, question_notes, status, material_file_name"
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

  if (!tryoutRow) {
    redirect("/dashboard/tryout-management?error=tryout-not-found");
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
          { label: "Tryout Management", href: "/dashboard/tryout-management" },
          { label: "Edit Tryout" },
        ]}
        title="Edit Tryout"
        description="Perbarui metadata tryout yang sudah ada tanpa meng-generate ulang soal."
      />

      {query.error ? (
        <StatusAlert
          variant="error"
          title="Gagal Memperbarui Tryout"
          message={getErrorMessage(String(query.error))}
        />
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit Tryout Form
          </h2>
        </div>

        <EditTryoutForm
          values={{
            id: tryoutRow.id,
            title: tryoutRow.title ?? "",
            learningPathId: tryoutRow.learning_path_id ?? "",
            categoryId: tryoutRow.category_id ?? "",
            subCategoryId: tryoutRow.sub_category_id ?? "",
            questionCount: tryoutRow.total_questions ?? 0,
            questionNotes: tryoutRow.question_notes ?? "",
            status: tryoutRow.status ?? "draft",
            materialFileName: tryoutRow.material_file_name ?? null,
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
