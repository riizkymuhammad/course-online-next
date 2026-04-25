import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DataTable from "@/components/ui/table/DataTable";

type Tryout = {
  id: string;
  title: string;
  learning_path_title: string;
  material_title: string;
  participant_count: number;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

const tryouts: Tryout[] = [
  {
    id: "tryout-001",
    title: "SQL Analyst Final Tryout",
    learning_path_title: "SQL Fundamentals for Data Analysis",
    material_title: "SELECT, WHERE, JOIN, dan Aggregation",
    participant_count: 124,
    status: "published",
    updated_at: "2026-04-24T15:25:00+07:00",
  },
  {
    id: "tryout-002",
    title: "Backend PostgreSQL Certification Pack",
    learning_path_title: "Backend API with PostgreSQL",
    material_title: "CRUD API, Validasi, dan Relasi Data",
    participant_count: 58,
    status: "draft",
    updated_at: "2026-04-25T08:40:00+07:00",
  },
  {
    id: "tryout-003",
    title: "Database Optimization Challenge",
    learning_path_title: "Database Design for Web Apps",
    material_title: "Indexing, Normalisasi, dan Query Tuning",
    participant_count: 31,
    status: "archived",
    updated_at: "2026-04-10T16:05:00+07:00",
  },
];

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

export default function TryoutManagementPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tryout Management" },
        ]}
        title="Tryout Management"
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <SummaryCard label="Total Tryout" value="3" note="Semua tryout aktif dan arsip" />
        <SummaryCard label="Published" value="1" note="Sudah tersedia untuk peserta" />
        <SummaryCard label="Participants" value="213" note="Total peserta terdaftar" />
        <SummaryCard label="Materials" value="3" note="Materi utama untuk setiap tryout" />
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
            { key: "title", label: "Judul Tryout", sortable: true },
            { key: "learning_path_title", label: "Learning Path", sortable: true },
            { key: "material_title", label: "Materi", sortable: true },
            { key: "participant_count", label: "Peserta", sortable: true },
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
              className: "w-[160px]",
              actions: [
                { label: "Edit", tone: "secondary" },
                { label: "Detail", tone: "primary" },
              ],
            },
          ]}
          data={tryouts.map((item) => ({
            ...item,
            participant_count: `${item.participant_count} Peserta`,
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
