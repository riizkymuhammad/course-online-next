import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";

type CourseRelation = {
  id: string;
  title: string;
  module_count: number | null;
} | null;

type LearningCourseRow = {
  id: string;
  user_id: string;
  course_id: string;
  course_module_id: string;
  status: string;
  first_opened_at: string | null;
  last_opened_at: string | null;
  completed_at: string | null;
  courses: CourseRelation | CourseRelation[];
};

type LearningCourseTableRow = {
  id: string;
  user_name: string;
  course_title: string;
  opened_modules: number;
  completed_modules: number;
  total_modules: number;
  progress: string;
  status: string;
  last_opened_at: string;
  course_url: string;
};

export const metadata: Metadata = {
  title: "Learning Course Dashboard",
  description: "Pantau progres pembelajaran course semua siswa.",
};

const statusStyles: Record<string, string> = {
  Selesai: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  Membaca: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  "-": "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
};

function getRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getUserName(metadata: unknown, email: string | undefined, fallback: string) {
  if (metadata && typeof metadata === "object") {
    const record = metadata as Record<string, unknown>;
    const fullName = typeof record.full_name === "string" ? record.full_name.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (fullName) return fullName;
    if (name) return name;
  }

  return email?.trim() || fallback;
}

export default async function LearningCoursePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/dashboard/learning-course");
  }

  const adminClient = createAdminClient();
  const database = adminClient ?? supabase;
  const { data: progressRows, error: progressError } = await database
    .from("learning_course")
    .select(
      "id, user_id, course_id, course_module_id, status, first_opened_at, last_opened_at, completed_at, courses(id, title, module_count)"
    )
    .order("last_opened_at", { ascending: false })
    .limit(1000);

  const userNameMap = new Map<string, string>();
  if (adminClient) {
    const { data: authUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authUsers?.users.forEach((authUser) => {
      userNameMap.set(authUser.id, getUserName(authUser.user_metadata, authUser.email, authUser.id));
    });
  }

  const groupedProgress = new Map<
    string,
    {
      userId: string;
      course: CourseRelation;
      openedModules: number;
      completedModules: number;
      latestOpenedAt: string | null;
      latestStatus: string;
    }
  >();

  ((progressRows as LearningCourseRow[] | null) ?? []).forEach((item) => {
    const course = getRelation(item.courses);
    const key = `${item.user_id}:${item.course_id}`;
    const current = groupedProgress.get(key);
    const isComplete = item.status === "complete";

    if (current) {
      current.openedModules += 1;
      current.completedModules += isComplete ? 1 : 0;
      return;
    }

    groupedProgress.set(key, {
      userId: item.user_id,
      course,
      openedModules: 1,
      completedModules: isComplete ? 1 : 0,
      latestOpenedAt: item.last_opened_at,
      latestStatus: item.status,
    });
  });

  const records: LearningCourseTableRow[] = Array.from(groupedProgress.values()).map((item) => {
    const courseTitle = item.course?.title ?? "Course tidak ditemukan";
    const totalModules = Math.max(item.openedModules, Number(item.course?.module_count ?? 0));
    const percentage = totalModules ? Math.round((item.completedModules / totalModules) * 100) : 0;
    const isComplete = totalModules > 0 && item.completedModules >= totalModules;

    return {
      id: `${item.userId}:${item.course?.id ?? courseTitle}`,
      user_name: userNameMap.get(item.userId) ?? item.userId,
      course_title: courseTitle,
      opened_modules: item.openedModules,
      completed_modules: item.completedModules,
      total_modules: totalModules,
      progress: `${percentage}%`,
      status: isComplete ? "Selesai" : item.latestStatus === "reading" ? "Membaca" : "-",
      last_opened_at: formatDateTime(item.latestOpenedAt),
      course_url: item.course ? `/course/${item.course.id}/${slugify(item.course.title)}` : "",
    };
  });

  const completedCourses = records.filter((item) => item.status === "Selesai").length;
  const activeCourses = records.filter((item) => item.status === "Membaca").length;
  const averageProgress = records.length
    ? Math.round(records.reduce((total, item) => total + Number.parseInt(item.progress, 10), 0) / records.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Learning Course" },
        ]}
        title="Learning Course"
        description="Pantau course yang dibuka siswa, jumlah modul yang selesai, dan progres belajar terkini."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <SummaryCard label="Siswa Belajar" value={String(new Set(records.map((item) => item.user_name)).size)} note="Siswa yang membuka materi" />
        <SummaryCard label="Course Diakses" value={String(records.length)} note="Kombinasi siswa dan course" />
        <SummaryCard label="Sedang Membaca" value={String(activeCourses)} note="Course yang belum selesai" />
        <SummaryCard label="Rata-rata Progres" value={`${averageProgress}%`} note={`${completedCourses} course sudah selesai`} />
      </section>

      {progressError ? (
        <StatusAlert
          variant="error"
          title="Progress Learning Course belum dapat dimuat"
          message={progressError.message}
        />
      ) : null}

      {!adminClient ? (
        <StatusAlert
          variant="warning"
          title="Nama siswa mungkin belum tersedia"
          message="SUPABASE_SERVICE_ROLE_KEY belum diatur. Data progres tetap dibaca melalui kebijakan admin, tetapi nama siswa dapat tampil sebagai UUID."
        />
      ) : null}

      <DataTable
        title="Progress Pembelajaran Siswa"
        description="Data dikelompokkan per siswa dan course; modul yang dibuka dicatat sebagai reading, sedangkan modul selesai berstatus complete."
        searchPlaceholder="Cari nama siswa atau course..."
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        action={
          <Link
            href="/dashboard/course-management"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Kelola Course
          </Link>
        }
        columns={[
          { key: "user_name", label: "Siswa", sortable: true },
          { key: "course_title", label: "Course", sortable: true },
          { key: "opened_modules", label: "Modul Dibuka", sortable: true },
          { key: "completed_modules", label: "Selesai", sortable: true },
          { key: "total_modules", label: "Total Modul", sortable: true },
          { key: "progress", label: "Progress", sortable: true },
          { key: "status", label: "Status", sortable: true, type: "badge", badgeToneMap: statusStyles },
          { key: "last_opened_at", label: "Terakhir Dibuka", sortable: true },
          {
            key: "actions",
            label: "Aksi",
            type: "actions",
            searchable: false,
            className: "w-[140px]",
            actions: [{ label: "Lihat Course", tone: "primary", hrefKey: "course_url" }],
          },
        ]}
        data={records}
      />
    </div>
  );
}

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </article>
  );
}
