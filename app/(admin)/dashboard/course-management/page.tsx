import type { Metadata } from "next";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DataTable from "@/components/ui/table/DataTable";

type Course = {
  id: string;
  learning_path_id: string | null;
  learning_path_title: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  section_count: number;
  module_count: number;
  presenter: string;
  price: number;
  is_free: boolean;
  source_file: string;
  ai_generated_summary: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

const courses: Course[] = [
  {
    id: "d071a84f-56e2-4e0c-bef3-4f7e88d00201",
    learning_path_id: "8e3d9b68-4d0f-4a7b-bf5f-f1d52ff0b201",
    learning_path_title: "SQL Fundamentals for Data Analysis",
    title: "SQL Select, Filter, and Order By",
    slug: "sql-select-filter-order-by",
    description:
      "Materi dasar untuk memahami cara mengambil, memfilter, dan mengurutkan data dari tabel.",
    thumbnail: "/images/product/product-01.jpg",
    section_count: 4,
    module_count: 12,
    presenter: "Rizky Pratama",
    price: 0,
    is_free: true,
    source_file: "storage/courses/sql-select-filter-order-by.mp4",
    ai_generated_summary:
      "Membahas query SELECT, WHERE, ORDER BY, dan kombinasi kondisi dasar untuk eksplorasi dataset.",
    status: "published",
    created_at: "2026-04-11T09:00:00+07:00",
    updated_at: "2026-04-24T13:45:00+07:00",
  },
  {
    id: "5b40ff7a-a730-4860-9de7-909857a4e902",
    learning_path_id: "71a10e9e-3362-465f-a1c7-32ed9afcf012",
    learning_path_title: "Backend API with PostgreSQL",
    title: "Build CRUD API for Course Catalog",
    slug: "build-crud-api-for-course-catalog",
    description:
      "Membangun endpoint CRUD course dengan validasi payload, slug, dan koneksi PostgreSQL.",
    thumbnail: "/images/product/product-02.jpg",
    section_count: 6,
    module_count: 18,
    presenter: "Nabila Putri",
    price: 149000,
    is_free: false,
    source_file: "storage/courses/build-crud-api-for-course-catalog.mp4",
    ai_generated_summary:
      "Fokus pada routing API, validasi data, pengelolaan slug unik, dan relasi ke learning path.",
    status: "draft",
    created_at: "2026-04-18T10:30:00+07:00",
    updated_at: "2026-04-25T08:20:00+07:00",
  },
  {
    id: "b4fb59cb-c28d-4499-9fa0-4f34b6853d03",
    learning_path_id: null,
    learning_path_title: "Unassigned",
    title: "Database Indexing Essentials",
    slug: "database-indexing-essentials",
    description:
      "Penjelasan konsep indexing untuk mempercepat query pencarian dan agregasi pada data besar.",
    thumbnail: "/images/product/product-03.jpg",
    section_count: 3,
    module_count: 9,
    presenter: "Bagas Aditya",
    price: 99000,
    is_free: false,
    source_file: "storage/courses/database-indexing-essentials.pdf",
    ai_generated_summary:
      "Mengulas jenis index, trade-off performa write/read, dan kapan index perlu ditambahkan.",
    status: "archived",
    created_at: "2026-03-20T14:15:00+07:00",
    updated_at: "2026-04-07T11:05:00+07:00",
  },
];

export const metadata: Metadata = {
  title: "Course Management Dashboard",
  description: "Manajemen data course untuk dashboard admin.",
};

const statusStyles: Record<Course["status"], string> = {
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

export default function CourseManagementPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Course Management" },
        ]}
        title="Course Management"
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <SummaryCard label="Total Courses" value="3" note="Semua course aktif dan arsip" />
        <SummaryCard label="Published" value="1" note="Sudah siap untuk siswa" />
        <SummaryCard label="Paid Courses" value="2" note="Memiliki harga lebih dari 0" />
        <SummaryCard label="Free Courses" value="1" note="Terbuka tanpa pembayaran" />
      </section>

      <section>
        <DataTable
          title="Course Records"
          description="DataTable course dengan pencarian, sorting, dan pagination."
          searchPlaceholder="Search courses..."
          action={
            <Link
              href="/dashboard/course-management/create"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Materi
            </Link>
          }
          columns={[
            {
              key: "title",
              label: "Judul",
              sortable: true,
              type: "imageText",
              imageKey: "thumbnail",
              subtitleKey: "description",
            },
            { key: "learning_path_title", label: "Learning Path", sortable: true },
            { key: "section_count", label: "Section", sortable: true },
            { key: "module_count", label: "Modul", sortable: true },
            { key: "presenter", label: "Pemateri", sortable: true },
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
          data={courses.map((item) => ({
            ...item,
            title: `${item.title} (${item.slug})`,
            section_count: `${item.section_count} Section`,
            module_count: `${item.module_count} Modul`,
            presenter: item.presenter,
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
