import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppPromoSlider from "@/components/app/AppPromoSlider";
import {
  ArrowRightIcon,
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  TableIcon,
} from "@/icons";
import AppHeader from "@/layout/AppHeader";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";
import { slugify } from "@/lib/tryout";

export const metadata: Metadata = {
  title: "App",
  description: "Halaman utama aplikasi belajar.",
};

const promoSlides = [
  {
    id: 1,
    image: "/images/hero/hero-cpns.png",
    badge: "CPNS",
    title: "Persiapan CPNS lebih terarah",
    description: "",
    meta: "Materi SKD, SKB, dan tryout CAT dalam satu jalur belajar",
  },
  {
    id: 2,
    image: "/images/hero/hero-english.png",
    badge: "Bahasa Inggris",
    title: "Tingkatkan kemampuan Bahasa Inggris",
    description: "",
    meta: "Kuasai grammar, TOEFL, IELTS, serta speaking dengan percaya diri",
  },
  {
    id: 3,
    image: "/images/hero/hero-it.png",
    badge: "TI & Perangkat Lunak",
    title: "Bangun skill teknologi untuk masa depan",
    description: "",
    meta: "Belajar web development, data science, dan tools profesional",
  },
];

const menuItems = [
  {
    title: "Learning Path",
    description: "Pilih jalur belajar yang sesuai target.",
    href: "/dashboard/learning-path",
    icon: GridIcon,
    tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  },
  {
    title: "Materi",
    description: "Buka koleksi materi dan modul belajar.",
    href: "/dashboard/course-management",
    icon: BoxCubeIcon,
    tone: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
  },
  {
    title: "Tryout",
    description: "Latihan soal dan simulasi evaluasi.",
    href: "/tryouts",
    icon: ListIcon,
    tone: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  },
  {
    title: "Riwayat Tryout",
    description: "Lihat hasil pengerjaan dan progres.",
    href: "/app/history-tryout",
    icon: CalenderIcon,
    tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
  },
  {
    title: "Quiz",
    description: "Kelola latihan pendek untuk setiap materi.",
    href: "/dashboard/quiz-management",
    icon: TableIcon,
    tone: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  },
  {
    title: "Buat Tryout",
    description: "Siapkan tryout baru untuk evaluasi belajar.",
    href: "/dashboard/tryout-management/create",
    icon: PageIcon,
    tone: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
  },
];

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

type TryoutRelation = {
  id: string;
  title: string;
};

type TryoutAttemptRow = {
  id: string;
  tryout_id: string;
  status: string | null;
  score: number | null;
  updated_at: string | null;
  submitted_at: string | null;
  started_at: string | null;
  tryouts: TryoutRelation | TryoutRelation[] | null;
};

function getRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getAttemptScoreLabel(attempt: TryoutAttemptRow) {
  if (attempt.status === "submitted" || attempt.status === "graded") {
    return Number(attempt.score ?? 0).toFixed(2);
  }

  return "Belum selesai";
}

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
  const [{ data: latestCourseProgress }, { data: latestTryoutAttempt }] = await Promise.all([
    supabase
      .from("course_progress")
      .select("id, course_id, status, completed_at, updated_at, courses(id, title, module_count, section_count)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tryout_attempts")
      .select("id, tryout_id, status, score, updated_at, submitted_at, started_at, tryouts(id, title)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const materialProgress = latestCourseProgress as CourseProgressRow | null;
  const materialCourse = getRelation(materialProgress?.courses);
  const tryoutAttempt = latestTryoutAttempt as TryoutAttemptRow | null;
  const attemptTryout = getRelation(tryoutAttempt?.tryouts);
  const hasMaterialAccess = Boolean(materialProgress && materialCourse);
  const hasTryoutAccess = Boolean(tryoutAttempt && attemptTryout);
  const isMaterialCompleted = Boolean(materialProgress?.completed_at || materialProgress?.status === "completed");
  const materialHref = "/dashboard/course-management";
  const tryoutHref =
    tryoutAttempt && attemptTryout
      ? `/tryout/exam/${attemptTryout.id}/${slugify(attemptTryout.title)}`
      : "/tryouts";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white/90">
      <AppHeader
        logoHref="/app"
        showSidebarToggle={false}
        userProfile={userProfile}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
      />

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6">
        <section>
          <AppPromoSlider slides={promoSlides} />
        </section>

        <section className="mt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
                Menu
              </span>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white/90">
                Akses cepat
              </h2>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {menuItems.length} menu tersedia
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex min-h-[108px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm transition hover:-translate-y-0.5 hover:shadow-theme-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-white/[0.03] dark:focus-visible:ring-offset-gray-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <ArrowRightIcon className="mt-1 size-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-3 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
                  Materi terakhir
                </span>
                <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white/90">
                  {hasMaterialAccess ? materialCourse?.title : "Belum ada materi diakses"}
                </h2>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400">
                <BoxCubeIcon className="size-5" />
              </span>
            </div>

            {hasMaterialAccess ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-700 dark:bg-white/[0.03]">
                    {materialCourse?.section_count ?? 0} section
                  </span>
                  <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-700 dark:bg-white/[0.03]">
                    {materialCourse?.module_count ?? 0} modul
                  </span>
                  <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-gray-700 dark:bg-white/[0.03]">
                    {isMaterialCompleted ? "Selesai" : "Belum selesai"}
                  </span>
                </div>
                <Link
                  href={materialHref}
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                >
                  {isMaterialCompleted ? "Pelajari lagi" : "Lanjutkan materi"}
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Mulai dari materi yang tersedia agar progres belajarmu bisa tersusun rapi.
                </p>
                <Link
                  href={materialHref}
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                >
                  Explore Materi
                </Link>
              </>
            )}
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
                  Tryout terakhir
                </span>
                <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white/90">
                  {hasTryoutAccess ? attemptTryout?.title : "Belum ada tryout dikerjakan"}
                </h2>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
                <ListIcon className="size-5" />
              </span>
            </div>

            {hasTryoutAccess && tryoutAttempt ? (
              <>
                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Score terakhir
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white/90">
                      {getAttemptScoreLabel(tryoutAttempt)}
                    </p>
                  </div>
                  <Link
                    href={tryoutHref}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                  >
                    Kerjakan lagi
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Coba tryout pertama untuk melihat score dan riwayat pengerjaanmu.
                </p>
                <Link
                  href="/tryouts"
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                >
                  Explore Tryout
                </Link>
              </>
            )}
          </article>
        </section>
      </main>

      <footer className="border-t border-brand-100 bg-gray-900 text-gray-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <p className="text-lg font-semibold text-white">Course Online</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">
              Platform belajar online dengan alur yang lebih rapi dan terarah.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Navigasi</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/" className="block transition hover:text-white">
                Hero
              </Link>
              <Link href="/#learning-path" className="block transition hover:text-white">
                Learning Path
              </Link>
              <Link href="/#materi" className="block transition hover:text-white">
                Materi
              </Link>
              <Link href="/#tryout" className="block transition hover:text-white">
                Tryout
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Program</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>Learning Path Terarah</p>
              <p>Materi Bertahap</p>
              <p>Tryout Evaluasi</p>
              <p>Dashboard Belajar</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Kontak</p>
            <div className="mt-3 space-y-2 text-sm">
              <p>hello@courseonline.id</p>
              <p>+62 812 0000 0000</p>
              <p>Senin - Sabtu, 08.00 - 20.00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-gray-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>(c) 2026 Course Online. Semua hak dilindungi.</p>
            <div className="flex flex-wrap gap-4">
              <p>Kebijakan Privasi</p>
              <p>Syarat Layanan</p>
              <p>Bantuan</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
