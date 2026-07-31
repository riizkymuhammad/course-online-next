import type { Metadata } from "next";
import ActionLink from "@/components/atoms/ActionLink";
import Button from "@/components/atoms/Button";
import Surface from "@/components/atoms/Surface";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { SelectField, TextAreaField, TextField as FormField } from "@/components/molecules/form";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import { createLearningPath } from "./actions";

export const metadata: Metadata = {
  title: "Add Learning Path",
  description: "Tambah learning path baru dari dashboard admin.",
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export default async function CreateLearningPathPage({
  searchParams,
}: PageProps<"/dashboard/learning-path/create">) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Learning Path", href: "/dashboard/learning-path" },
          { label: "Add Learning Path" },
        ]}
        title="Add Learning Path"
      />

      <Surface padded={false}>
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Learning Path Form
          </h2>
        </div>

        <form action={createLearningPath} className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
          {error ? (
            <StatusAlert
              variant="error"
              title="Gagal Menyimpan Learning Path"
              message={getErrorMessage(error)}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <FormField
                label="Title"
                name="title"
                placeholder="Contoh: SQL Fundamentals for Data Analysis"
                required
              />

              <TextAreaField
                label="Description"
                name="description"
                placeholder="Tulis ringkasan learning path untuk admin dan pengguna."
              />
            </div>

            <div className="space-y-6">
              <SelectField label="Status" name="status" defaultValue="draft" options={[...statusOptions]} />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
            <ActionLink href="/dashboard/learning-path" variant="outline">
              Cancel
            </ActionLink>
            <Button type="submit">
              Save Learning Path
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}

function getErrorMessage(error: string | string[] | undefined) {
  const value = Array.isArray(error) ? error[0] : error;

  switch (value) {
    case "title-required":
      return "Title wajib diisi.";
    case "invalid-title":
      return "Title tidak valid untuk dibuatkan slug.";
    case "23505":
      return "Learning path dengan judul atau slug yang sama sudah ada.";
    case "invalid-status":
      return "Status learning path tidak valid.";
    case "PGRST204":
      return "Kolom yang dikirim tidak sesuai dengan tabel learning_paths di Supabase.";
    default:
      return "Gagal menyimpan learning path ke database Supabase.";
  }
}
