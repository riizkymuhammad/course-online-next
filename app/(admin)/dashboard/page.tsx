import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import MetricCard from "@/components/molecules/MetricCard";
import LearningCourseWeeklyChart from "@/components/organisms/dashboard/LearningCourseWeeklyChart";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CourseRelation = { id: string; title: string } | { id: string; title: string }[] | null;
type ModuleRelation = { id: string; title: string } | { id: string; title: string }[] | null;
type TryoutRelation = { id: string; title: string } | { id: string; title: string }[] | null;

type LearningCourseRow = {
  id: string;
  user_id: string;
  status: string;
  last_opened_at: string | null;
  courses: CourseRelation;
  course_modules: ModuleRelation;
};

type LearningTryoutRow = {
  id: string;
  user_id: string;
  status: string | null;
  started_at: string | null;
  submitted_at: string | null;
  tryouts: TryoutRelation;
};

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan data pengguna, course, tryout, dan aktivitas pembelajaran.",
};

const statusTone: Record<string, string> = {
  Selesai: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  Membaca: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  Progres: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  Dikumpulkan: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  "-": "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
};

function getRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
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

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

function getTryoutStatus(status: string | null) {
  if (status === "submitted" || status === "graded") return "Dikumpulkan";
  if (status === "in_progress") return "Progres";
  return "-";
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function getWeekKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildWeeklyLearningCourse(rows: Array<{ last_opened_at: string | null }>) {
  const currentWeek = startOfWeek(new Date());
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const week = new Date(currentWeek);
    week.setDate(currentWeek.getDate() - (7 - index) * 7);
    return week;
  });
  const counts = new Map(weeks.map((week) => [getWeekKey(week), 0]));

  rows.forEach((row) => {
    if (!row.last_opened_at) return;
    const key = getWeekKey(startOfWeek(new Date(row.last_opened_at)));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return {
    labels: weeks.map((week) =>
      new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(week)
    ),
    values: weeks.map((week) => counts.get(getWeekKey(week)) ?? 0),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectedFrom=/dashboard");
  if (getUserRole(user) !== "admin") redirect("/app");

  const adminClient = createAdminClient();
  const database = adminClient ?? supabase;
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const [
    courseCountResult,
    tryoutCountResult,
    learningCourseCountResult,
    learningTryoutCountResult,
    weeklyLearningResult,
    recentLearningCourseResult,
    recentLearningTryoutResult,
  ] = await Promise.all([
    database.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
    database.from("tryouts").select("id", { count: "exact", head: true }).eq("status", "published"),
    database.from("learning_course").select("id", { count: "exact", head: true }),
    database.from("tryout_attempts").select("id", { count: "exact", head: true }),
    database
      .from("learning_course")
      .select("last_opened_at")
      .gte("last_opened_at", eightWeeksAgo.toISOString()),
    database
      .from("learning_course")
      .select("id, user_id, status, last_opened_at, courses(id, title), course_modules(id, title)")
      .order("last_opened_at", { ascending: false })
      .limit(8),
    database
      .from("tryout_attempts")
      .select("id, user_id, status, started_at, submitted_at, tryouts(id, title)")
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  const userNameMap = new Map<string, string>();
  let userCountLabel = "-";
  if (adminClient) {
    const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!authUsersError) {
      userCountLabel = String(authUsers.users.length);
      authUsers.users.forEach((authUser) => {
        userNameMap.set(
          authUser.id,
          getUserName(authUser.user_metadata, authUser.email, authUser.id)
        );
      });
    }
  }

  const errors = [
    courseCountResult.error,
    tryoutCountResult.error,
    learningCourseCountResult.error,
    learningTryoutCountResult.error,
    weeklyLearningResult.error,
    recentLearningCourseResult.error,
    recentLearningTryoutResult.error,
  ].filter((error): error is NonNullable<typeof error> => Boolean(error));
  const weeklyData = buildWeeklyLearningCourse(
    ((weeklyLearningResult.data as Array<{ last_opened_at: string | null }> | null) ?? [])
  );
  const recentLearningCourses =
    ((recentLearningCourseResult.data as LearningCourseRow[] | null) ?? []).map((item) => {
      const course = getRelation(item.courses);
      const module = getRelation(item.course_modules);
      return {
        id: item.id,
        user_name: userNameMap.get(item.user_id) ?? item.user_id,
        course_name: course?.title ?? "Course tidak ditemukan",
        module_name: module?.title ?? "Modul tidak ditemukan",
        status: item.status === "complete" ? "Selesai" : "Membaca",
        last_opened_at: formatDateTime(item.last_opened_at),
      };
    });
  const recentLearningTryouts =
    ((recentLearningTryoutResult.data as LearningTryoutRow[] | null) ?? []).map((item) => {
      const tryout = getRelation(item.tryouts);
      return {
        id: item.id,
        user_name: userNameMap.get(item.user_id) ?? item.user_id,
        tryout_name: tryout?.title ?? "Tryout tidak ditemukan",
        status: getTryoutStatus(item.status),
        activity_at: formatDateTime(item.submitted_at ?? item.started_at),
      };
    });

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Pantau ringkasan data platform dan aktivitas pembelajaran siswa terbaru."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 md:gap-6">
        <MetricCard label="Jumlah User" value={userCountLabel} description="Akun yang terdaftar" icon="◉" />
        <MetricCard label="Jumlah Materi" value={String(courseCountResult.count ?? 0)} description="Course published" icon="▤" />
        <MetricCard label="Jumlah Tryout" value={String(tryoutCountResult.count ?? 0)} description="Tryout published" icon="✓" />
        <MetricCard label="Learning Course" value={String(learningCourseCountResult.count ?? 0)} description="Progres modul siswa" icon="◷" />
        <MetricCard label="Learning Tryout" value={String(learningTryoutCountResult.count ?? 0)} description="Attempt tryout siswa" icon="▥" />
      </section>

      {errors.length ? (
        <StatusAlert
          variant="warning"
          title="Sebagian data dashboard belum dapat dimuat"
          message={errors[0].message}
        />
      ) : null}

      {!adminClient ? (
        <StatusAlert
          variant="warning"
          title="Jumlah user belum tersedia"
          message="Atur SUPABASE_SERVICE_ROLE_KEY agar dashboard dapat menghitung user dan menampilkan nama siswa pada aktivitas terbaru."
        />
      ) : null}

      <LearningCourseWeeklyChart labels={weeklyData.labels} values={weeklyData.values} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DataTable
          title="Recent Learning Course"
          description="Aktivitas modul course terbaru dari siswa."
          searchPlaceholder="Cari siswa, course, atau modul..."
          pageSize={5}
          pageSizeOptions={[5, 10, 25]}
          columns={[
            { key: "user_name", label: "Siswa", sortable: true },
            { key: "course_name", label: "Course", sortable: true, type: "imageText", subtitleKey: "module_name" },
            { key: "status", label: "Status", type: "badge", badgeToneMap: statusTone },
            { key: "last_opened_at", label: "Terakhir Dibuka", sortable: true },
          ]}
          data={recentLearningCourses}
        />

        <DataTable
          title="Recent Learning Tryout"
          description="Aktivitas pengerjaan tryout terbaru dari siswa."
          searchPlaceholder="Cari siswa atau tryout..."
          pageSize={5}
          pageSizeOptions={[5, 10, 25]}
          columns={[
            { key: "user_name", label: "Siswa", sortable: true },
            { key: "tryout_name", label: "Tryout", sortable: true },
            { key: "status", label: "Status", type: "badge", badgeToneMap: statusTone },
            { key: "activity_at", label: "Aktivitas", sortable: true },
          ]}
          data={recentLearningTryouts}
        />
      </section>
    </div>
  );
}
