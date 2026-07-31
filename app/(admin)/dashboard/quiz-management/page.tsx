import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import SummaryCard from "@/components/molecules/SummaryCard";
import DataTable from "@/components/ui/table/DataTable";

type Quiz = {
  id: string;
  title: string;
  course_title: string;
  section_title: string;
  question_count: number;
  duration_minutes: number;
  status: "draft" | "published" | "archived";
  updated_at: string;
};

const quizzes: Quiz[] = [
  {
    id: "quiz-001",
    title: "SQL Basics Assessment",
    course_title: "SQL Select, Filter, and Order By",
    section_title: "Query Fundamentals",
    question_count: 15,
    duration_minutes: 20,
    status: "published",
    updated_at: "2026-04-24T13:00:00+07:00",
  },
  {
    id: "quiz-002",
    title: "PostgreSQL API Validation Quiz",
    course_title: "Build CRUD API for Course Catalog",
    section_title: "Payload Validation",
    question_count: 12,
    duration_minutes: 18,
    status: "draft",
    updated_at: "2026-04-25T09:10:00+07:00",
  },
  {
    id: "quiz-003",
    title: "Indexing Strategy Review",
    course_title: "Database Indexing Essentials",
    section_title: "Read and Write Optimization",
    question_count: 10,
    duration_minutes: 15,
    status: "archived",
    updated_at: "2026-04-12T10:20:00+07:00",
  },
];

export const metadata: Metadata = {
  title: "Quiz Management Dashboard",
  description: "Manajemen quiz untuk dashboard admin.",
};

const statusStyles: Record<Quiz["status"], string> = {
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

export default function QuizManagementPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Quiz Management" },
        ]}
        title="Quiz Management"
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <SummaryCard label="Total Quiz" value="3" note="Semua bank soal aktif dan arsip" />
        <SummaryCard label="Published" value="1" note="Sudah tampil untuk peserta" />
        <SummaryCard label="Draft" value="1" note="Masih dalam tahap penyusunan" />
        <SummaryCard label="Questions" value="37" note="Total soal di seluruh quiz" />
      </section>

      <section>
        <DataTable
          title="Quiz Records"
          description="DataTable quiz dengan pencarian, sorting, dan pagination."
          searchPlaceholder="Search quizzes..."
          action={
            <button className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600">
              Add Quiz
            </button>
          }
          columns={[
            { key: "title", label: "Judul Quiz", sortable: true },
            { key: "course_title", label: "Course", sortable: true },
            { key: "section_title", label: "Section", sortable: true },
            { key: "question_count", label: "Soal", sortable: true },
            { key: "duration_minutes", label: "Durasi", sortable: true },
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
          data={quizzes.map((item) => ({
            ...item,
            question_count: `${item.question_count} Soal`,
            duration_minutes: `${item.duration_minutes} Menit`,
            updated_at: formatDate(item.updated_at),
          }))}
        />
      </section>
    </div>
  );
}
