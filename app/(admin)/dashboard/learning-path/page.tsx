import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DataTable from "@/components/ui/table/DataTable";

type LearningPath = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  material_count: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

const learningPaths: LearningPath[] = [
  {
    id: "8e3d9b68-4d0f-4a7b-bf5f-f1d52ff0b201",
    title: "SQL Fundamentals for Data Analysis",
    slug: "sql-fundamentals-for-data-analysis",
    description:
      "Belajar query dasar, filtering, join, agregasi, dan analisis data untuk kebutuhan reporting.",
    thumbnail: "/images/product/product-01.jpg",
    material_count: 12,
    status: "published",
    created_at: "2026-04-10T08:30:00+07:00",
    updated_at: "2026-04-24T16:45:00+07:00",
  },
  {
    id: "71a10e9e-3362-465f-a1c7-32ed9afcf012",
    title: "Backend API with PostgreSQL",
    slug: "backend-api-with-postgresql",
    description:
      "Membangun REST API yang terhubung ke PostgreSQL, lengkap dengan validasi dan optimasi query.",
    thumbnail: "/images/product/product-02.jpg",
    material_count: 8,
    status: "draft",
    created_at: "2026-04-18T10:00:00+07:00",
    updated_at: "2026-04-25T09:15:00+07:00",
  },
  {
    id: "d2f4b2ea-f614-4d8e-aa8a-c13c4355f913",
    title: "Database Design for Web Apps",
    slug: "database-design-for-web-apps",
    description:
      "Menyusun relasi tabel, indexing, normalisasi, dan strategi schema untuk aplikasi production.",
    thumbnail: "/images/product/product-03.jpg",
    material_count: 10,
    status: "archived",
    created_at: "2026-03-22T13:00:00+07:00",
    updated_at: "2026-04-12T11:20:00+07:00",
  },
];

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

export default function LearningPathPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Learning Path" },
        ]}
        title="Learning Path Management"
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <SummaryCard label="Total Learning Path" value="3" note="Semua status" />
        <SummaryCard label="Published" value="1" note="Siap tampil ke user" />
        <SummaryCard label="Draft & Archived" value="2" note="Perlu review internal" />
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
