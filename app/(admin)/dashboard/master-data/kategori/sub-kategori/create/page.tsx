import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import SubCategoryForm, {
  type CategoryOption,
} from "../../../_components/SubCategoryForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tambah Sub Kategori",
  description: "Tambah master data sub kategori dari menu kategori.",
};

export default async function CreateCategorySubCategoryPage({
  searchParams,
}: PageProps<"/dashboard/master-data/kategori/sub-kategori/create">) {
  const supabase = await createClient();
  const params = await searchParams;
  const error = params.error;

  const { data } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  const categories = ((data ?? []) as CategoryOption[]).map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Master Data" },
          { label: "Kategori", href: "/dashboard/master-data/kategori" },
          { label: "Tambah Sub Kategori" },
        ]}
        title="Tambah Sub Kategori"
      />

      <SubCategoryForm
        categories={categories}
        error={error}
        cancelHref="/dashboard/master-data/kategori"
        redirectTo="/dashboard/master-data/kategori"
        currentPath="/dashboard/master-data/kategori/sub-kategori/create"
      />
    </div>
  );
}
