import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BrandLogo from "@/components/header/BrandLogo";
import {
  ArrowRightIcon,
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  ListIcon,
  TableIcon,
} from "@/icons";
import AppHeader from "@/layout/AppHeader";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { getRelation } from "@/lib/supabase/relations";
import { getUserProfile } from "@/lib/user-profile";
import { slugify } from "@/lib/tryout";

export const metadata: Metadata = {
  title: "Dashboard — Learning With Rizky",
  description:
    "Dashboard belajar Course Online untuk memantau progres materi, riwayat tryout, dan akses cepat ke menu belajar.",
};

const menuItems = [
  {
    title: "Learning Path",
    description: "Pilih jalur belajar yang sesuai target.",
    href: "/learning-paths",
    icon: GridIcon,
    group: "core" as const,
  },
  {
    title: "Materi",
    description: "Buka koleksi materi dan modul belajar.",
    href: "/courses",
    icon: BoxCubeIcon,
    group: "core" as const,
  },
  {
    title: "Tryout",
    description: "Latihan soal dan simulasi evaluasi.",
    href: "/tryouts",
    icon: ListIcon,
    group: "core" as const,
  },
  {
    title: "Riwayat Tryout",
    description: "Lihat hasil pengerjaan dan progres.",
    href: "/app/history-tryout",
    icon: CalenderIcon,
    group: "advanced" as const,
  },
  {
    title: "Quiz",
    description: "Kelola latihan pendek untuk setiap materi.",
    href: "/dashboard/quiz-management",
    icon: TableIcon,
    group: "advanced" as const,
  },
];

type DashboardMenuItem = (typeof menuItems)[number];

type CourseRelation = {
  id: string;
  title: string;
  module_count: number | null;
  section_count: number | null;
};

type CourseProgressRow = {
  id: string;
  course_id: string;
  status: string | null;
  completed_at: string | null;
  updated_at: string | null;
  courses: CourseRelation | CourseRelation[] | null;
};

type CourseSummaryRow = {
  course_id: string;
  status: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

type TryoutRelation = {
  id: string;
  title: string;
};

type TryoutAttemptRow = {
  id: string;
  tryout_id: string;
  status: string | null;
  updated_at: string | null;
  submitted_at: string | null;
  started_at: string | null;
  tryouts: TryoutRelation | TryoutRelation[] | null;
};

type TryoutSummaryRow = {
  tryout_id: string;
  started_at: string | null;
  submitted_at: string | null;
};

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/app");
  }

  const userProfile = getUserProfile(user);
  const cookieStore = await cookies();
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });
  const [
    { data: latestCourseProgress },
    { data: latestTryoutAttempt },
    { data: courseSummaryRows },
    { data: tryoutSummaryRows },
  ] = await Promise.all([
    supabase
      .from("course_progress")
      .select("id, course_id, status, completed_at, updated_at, courses(id, title, module_count, section_count)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tryout_attempts")
      .select("id, tryout_id, status, updated_at, submitted_at, started_at, tryouts(id, title)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("course_progress")
      .select("course_id, status, completed_at, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("tryout_attempts")
      .select("tryout_id, started_at, submitted_at")
      .eq("user_id", user.id),
  ]);

  const materialProgress = latestCourseProgress as CourseProgressRow | null;
  const materialCourse = getRelation(materialProgress?.courses);
  const tryoutAttempt = latestTryoutAttempt as TryoutAttemptRow | null;
  const attemptTryout = getRelation(tryoutAttempt?.tryouts);
  const hasMaterialAccess = Boolean(materialProgress && materialCourse);
  const hasTryoutAccess = Boolean(tryoutAttempt && attemptTryout);
  const isTryoutCompleted = Boolean(
    tryoutAttempt?.status === "submitted" || tryoutAttempt?.status === "graded"
  );
  const isMaterialCompleted = Boolean(
    materialProgress?.completed_at || materialProgress?.status === "completed"
  );
  const courseSummaries = (courseSummaryRows as CourseSummaryRow[] | null) ?? [];
  const tryoutSummaries = (tryoutSummaryRows as TryoutSummaryRow[] | null) ?? [];
  const accessedCourseCount = new Set(courseSummaries.map((item) => item.course_id)).size;
  const completedCourseCount = new Set(
    courseSummaries
      .filter((item) => item.completed_at || item.status === "completed")
      .map((item) => item.course_id)
  ).size;
  const attemptedTryoutCount = new Set(tryoutSummaries.map((item) => item.tryout_id)).size;
  const learningActivityDates = [
    ...courseSummaries.map((item) => item.updated_at),
    ...tryoutSummaries.flatMap((item) => [item.started_at, item.submitted_at]),
  ].filter((value): value is string => Boolean(value));
  const materialHref = "/courses";
  const tryoutHref =
    tryoutAttempt && attemptTryout
      ? `/tryout/exam/${attemptTryout.id}/${slugify(attemptTryout.title)}`
      : "/tryouts";
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const displayName = userProfile.displayName || "Teman Belajar";
  const stats = [
    {
      label: "Course diakses",
      value: String(accessedCourseCount),
      hint: accessedCourseCount ? "Total course yang pernah dibuka" : "Mulai course pertamamu",
      icon: BoxCubeIcon,
      isNumeric: true,
    },
    {
      label: "Course selesai",
      value: String(completedCourseCount),
      hint: completedCourseCount ? "Course yang sudah kamu selesaikan" : "Belum ada course selesai",
      icon: GridIcon,
      isNumeric: true,
    },
    {
      label: "Tryout dikerjakan",
      value: String(attemptedTryoutCount),
      hint: attemptedTryoutCount ? "Total tryout yang pernah dibuka" : "Mulai tryout pertamamu",
      icon: ListIcon,
      isNumeric: true,
    },
  ];
  const coreMenuItems = menuItems.filter((item) => item.group === "core");
  const advancedMenuItems = menuItems.filter((item) => item.group === "advanced");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <AppHeader
        logoHref="/app"
        showSidebarToggle={false}
        userProfile={userProfile}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
        showLearningNav
      />

      <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 lg:px-0">
        <div className="space-y-8">
          <section id="progress-belajar" className="grid scroll-mt-24 gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <div className="relative min-h-48 overflow-hidden rounded-md bg-[#1E40AF] px-6 py-8 text-white shadow-theme-sm sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.65)_1px,transparent_0)] [background-size:22px_22px]" />
            <div className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border-[40px] border-white/5" />
            <div className="pointer-events-none absolute -bottom-28 right-32 size-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex min-h-32 items-center justify-between gap-8">
              <div>
                <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur-sm">
                  {today}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Halo, {displayName}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-[15px]">
                  Selamat datang kembali! Yuk, lanjut belajar dan explore materi atau
                  tryout yang kamu mau.
                </p>
              </div>
              <LearningHeroVisual />
            </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article
                      key={stat.label}
                      className="rounded-md border border-gray-200 bg-white p-4 shadow-[0_12px_32px_rgba(16,24,40,0.04)] transition hover:border-brand-200 hover:shadow-[0_16px_40px_rgba(16,24,40,0.08)] sm:p-5"
                    >
                      <IconTile icon={Icon} />
                      <p
                        className={`mt-4 text-gray-900 ${
                          stat.isNumeric
                            ? "text-2xl font-semibold"
                            : "text-sm font-medium leading-8"
                        }`}
                      >
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-700">{stat.label}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-400">{stat.hint}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <LearningActivityCalendar
              activityDates={learningActivityDates}
              className="lg:col-span-4"
            />
          </section>

          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-brand-600">Menu</p>
              </div>
              <span className="text-xs text-gray-400">{menuItems.length} menu tersedia</span>
            </div>

            <DashboardMenuGrid items={coreMenuItems} />

            {advancedMenuItems.length ? (
              <div className="mt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Fitur lanjutan
                </p>
                <DashboardMenuGrid items={advancedMenuItems} advanced />
              </div>
            ) : null}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.04)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <IconTile icon={BoxCubeIcon} />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Materi terakhir
                    </p>
                    <h2 className="text-base font-semibold text-gray-900">Lanjutkan belajar</h2>
                  </div>
                </div>
                <Link href={materialHref} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Lihat semua
                </Link>
              </div>

              {hasMaterialAccess ? (
                <div className="mt-4 flex items-center gap-4 rounded-md border border-gray-100 p-3 transition-colors hover:border-brand-100 hover:bg-brand-50/30">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-brand-600 text-xs font-medium text-white">
                    COURSE
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{materialCourse?.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: isMaterialCompleted ? "100%" : "50%" }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        {isMaterialCompleted ? "100" : "50"}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Terakhir dibuka {formatActivityDate(materialProgress?.updated_at ?? null)}
                    </p>
                  </div>
                  <Link
                    href={materialHref}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
                  >
                    Lanjutkan
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <EmptyPanel
                  title="Belum ada materi diakses"
                  description="Mulai dari materi yang tersedia agar progresmu tersusun rapi."
                  href={materialHref}
                  action="Jelajahi materi"
                />
              )}
            </article>

            <article className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-brand-600">
                    Aktivitas tryout
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-gray-900">Tryout terakhir</h2>
                </div>
                <Link
                  href="/app/history-tryout"
                  className="text-xs font-medium text-gray-500 transition hover:text-brand-600"
                >
                  Lihat riwayat
                </Link>
              </div>

              {hasTryoutAccess && tryoutAttempt ? (
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
                    {attemptTryout?.title}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                          isTryoutCompleted
                            ? "text-success-700"
                            : "text-warning-700"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isTryoutCompleted ? "bg-success-500" : "bg-warning-500"
                          }`}
                        />
                        {isTryoutCompleted ? "Selesai" : "Sedang dikerjakan"}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        Dikerjakan {formatActivityDate(tryoutAttempt.updated_at)}
                      </span>
                    </div>

                    <Link
                      href={tryoutHref}
                      className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-brand-200 px-4 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
                    >
                      Kerjakan lagi
                      <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500">Belum ada tryout yang dikerjakan.</p>
                  <Link
                    href="/tryouts"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Jelajahi tryout
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </article>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-[1080px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] lg:px-0">
          <div>
            <Link href="/app" className="inline-flex">
              <BrandLogo />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-6 text-gray-600">
              Platform belajar online untuk persiapan CPNS, Bahasa Inggris, dan Teknologi
              Informasi. Belajar terarah, raih targetmu.
            </p>
          </div>
          <FooterColumn title="Kategori" items={["CPNS", "Bahasa Inggris", "TI & Perangkat Lunak", "Tryout"]} />
          <FooterColumn title="Perusahaan" items={["Tentang Kami", "Karier", "Blog", "Kontak"]} />
          <FooterColumn title="Bantuan" items={["Pusat Bantuan", "Syarat & Ketentuan", "Kebijakan Privasi", "FAQ"]} />
        </div>
        <div className="border-t border-gray-200">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-4 py-6 text-xs text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-0">
            <p>Copyright 2026 Learning With Rizky. Seluruh hak cipta dilindungi.</p>
            <p>Dibuat untuk masa depan pendidikan Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardMenuGrid({
  items,
  advanced = false,
}: {
  items: DashboardMenuItem[];
  advanced?: boolean;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.title}
            href={item.href}
            className={`group grid min-h-28 grid-cols-[40px_minmax(0,1fr)_16px] grid-rows-[auto_auto] items-start gap-x-4 rounded-md border p-5 transition-all hover:border-brand-300 hover:shadow-[0_16px_40px_rgba(16,24,40,0.08)] ${
              advanced
                ? "border-dashed border-gray-300 bg-white hover:border-brand-200"
                : "border-gray-200 bg-white"
            }`}
          >
            <IconTile
              icon={Icon}
              className="row-span-2 transition-colors group-hover:bg-brand-100 group-hover:text-brand-700"
            />
            <p className="min-w-0 self-center text-base font-medium text-gray-900">
              {item.title}
            </p>
            <p className="col-start-2 mt-1 text-sm leading-5 text-gray-500">{item.description}</p>
            <ArrowRightIcon className="col-start-3 row-span-2 row-start-1 h-4 w-4 self-center text-gray-300 transition-colors group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </Link>
        );
      })}
    </div>
  );
}

function IconTile({
  icon: Icon,
  className = "",
}: {
  icon: DashboardMenuItem["icon"];
  className?: string;
}) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 ${className}`}
      aria-hidden="true"
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
    </span>
  );
}

function EmptyPanel({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="mt-6 rounded-md border border-dashed border-gray-300 p-6 text-center">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
        {action}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-950">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <Link key={item} href="/" className="block text-sm font-medium text-gray-600 hover:text-brand-600">
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}

function LearningActivityCalendar({
  activityDates,
  className = "",
}: {
  activityDates: string[];
  className?: string;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayKey = buildCalendarDayKey(year, month, now.getDate());
  const activityCounts = new Map<string, number>();

  activityDates.forEach((value) => {
    const key = getJakartaDayKey(value);
    activityCounts.set(key, (activityCounts.get(key) ?? 0) + 1);
  });

  const calendarDays: Array<number | null> = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <aside
      className={`flex h-full flex-col rounded-md border border-gray-200 bg-white p-5 shadow-[0_12px_32px_rgba(16,24,40,0.04)] ${className}`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-brand-600">
          Progress belajar
        </p>
        <h2 className="mt-1 text-base font-semibold capitalize text-gray-900">
          {monthLabel}
        </h2>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-x-1 gap-y-2 text-center">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
          <span key={day} className="text-[10px] font-medium text-gray-400">
            {day}
          </span>
        ))}
        {calendarDays.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="size-8" />;

          const dayKey = buildCalendarDayKey(year, month, day);
          const activityCount = activityCounts.get(dayKey) ?? 0;
          const isToday = dayKey === todayKey;
          const activityClassName = activityCount >= 3
            ? "bg-brand-700 text-white"
            : activityCount >= 2
              ? "bg-brand-500 text-white"
              : activityCount === 1
                ? "bg-brand-100 text-brand-700"
                : "text-gray-600 hover:bg-gray-50";

          return (
            <span
              key={dayKey}
              title={activityCount ? `${activityCount} aktivitas belajar` : "Belum ada aktivitas"}
              className={`mx-auto flex size-8 items-center justify-center rounded-full text-xs font-medium ${activityClassName} ${
                isToday ? "ring-1 ring-brand-500 ring-offset-2" : ""
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-5 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-brand-100" />
          Aktif belajar
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-brand-700" />
          Lebih aktif
        </span>
      </div>
    </aside>
  );
}

function buildCalendarDayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getJakartaDayKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const partMap = new Map(parts.map((part) => [part.type, part.value]));

  return `${partMap.get("year")}-${partMap.get("month")}-${partMap.get("day")}`;
}

function LearningHeroVisual() {
  return (
    <div className="relative hidden h-32 w-64 shrink-0 sm:block" aria-hidden="true">
      <div className="absolute inset-y-2 right-0 w-52 rotate-2 rounded-md border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm" />
      <div className="absolute inset-y-0 right-5 flex w-52 -rotate-2 items-center rounded-md border border-white/25 bg-white/15 p-5 shadow-2xl backdrop-blur-sm">
        <svg className="h-20 w-full text-white" viewBox="0 0 190 86" fill="none">
          <path d="M17 18c22-8 43-7 64 3v51c-21-10-42-11-64-3V18Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="2" />
          <path d="M173 18c-22-8-43-7-64 3v51c21-10 42-11 64-3V18Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="2" />
          <path d="M95 24v51M31 33h34M31 44h40M31 55h28M123 34l5 5 10-12M123 51l5 5 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function formatActivityDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
