import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import CreateTryoutForm from "@/components/tryout/CreateTryoutForm";

export const metadata: Metadata = {
  title: "Add Tryout",
  description: "Tambah tryout baru dari dashboard admin.",
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

const learningPathOptions = [
  "SQL Fundamentals for Data Analysis",
  "Backend API with PostgreSQL",
  "Database Design for Web Apps",
] as const;

export default function CreateTryoutPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tryout Management", href: "/dashboard/tryout-management" },
          { label: "Add Tryout" },
        ]}
        title="Add Tryout"
      />

      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Tryout Form</h2>
        </div>

        <CreateTryoutForm
          learningPathOptions={[...learningPathOptions]}
          statusOptions={statusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </section>
    </div>
  );
}
