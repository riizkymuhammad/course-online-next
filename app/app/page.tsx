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
  title: "Dashboard — Course Online",
  description:
    "Dashboard belajar Course Online untuk memantau progres materi, riwayat tryout, dan akses cepat ke menu belajar.",
};

const menuItems = [
  {
    title: "Learning Path",
    description: "Pilih jalur belajar yang sesuai target.",
    href: "/dashboard/learning-path",
    icon: GridIcon,
    tone: "bg-brand-50 text-brand-600",
    group: "core" as const,
  },
  {
    title: "Materi",
    description: "Buka koleksi materi dan modul belajar.",
    href: "/courses",
    icon: BoxCubeIcon,
    tone: "bg-blue-light-50 text-blue-light-600",
    group: "core" as const,
  },
  {
    title: "Tryout",
    description: "Latihan soal dan simulasi evaluasi.",
    href: "/tryouts",
    icon: ListIcon,
    tone: "bg-success-50 text-success-600",
    group: "core" as const,
  },
  {
    title: "Riwayat Tryout",
    description: "Lihat hasil pengerjaan dan progres.",
    href: "/app/history-tryout",
    icon: CalenderIcon,
    tone: "bg-warning-50 text-warning-600",
    group: "advanced" as const,
  },
  {
    title: "Quiz",
    description: "Kelola latihan pendek untuk setiap materi.",
    href: "/dashboard/quiz-management",
    icon: TableIcon,
    tone: "bg-orange-50 text-orange-600",
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
  const isMaterialCompleted = Boolean(
    materialProgress?.completed_at || materialProgress?.status === "completed"
  );
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
  const firstName = userProfile.displayName.split(" ")[0] || "Teman";
  const learningFocus = materialCourse?.title || "jalur belajar pilihanmu";
  const stats = [
    {
      label: "Course diakses",
      value: hasMaterialAccess ? "1" : "0",
      hint: hasMaterialAccess ? "Course terakhir siap dilanjutkan" : "Mulai course pertamamu",
      icon: BoxCubeIcon,
      tone: "bg-[#144272]",
    },
    {
      label: "Modul tersedia",
      value: String(materialCourse?.module_count ?? 0),
      hint: materialCourse ? `${materialCourse.section_count ?? 0} section pada course terakhir` : "Belum ada modul aktif",
      icon: GridIcon,
      tone: "bg-[#205295]",
    },
    {
      label: "Tryout dikerjakan",
      value: hasTryoutAccess ? "1" : "0",
      hint: hasTryoutAccess ? "Riwayat tryout terbaru tersedia" : "Mulai tryout pertamamu",
      icon: ListIcon,
      tone: "bg-[#2C74B3]",
    },
    {
      label: "Nilai terakhir",
      value: tryoutAttempt ? getAttemptScoreLabel(tryoutAttempt) : "-",
      hint: tryoutAttempt ? "Dari tryout terbaru" : "Belum ada nilai tryout",
      icon: CalenderIcon,
      tone: "bg-brand-500",
    },
  ];
  const coreMenuItems = menuItems.filter((item) => item.group === "core");
  const advancedMenuItems = menuItems.filter((item) => item.group === "advanced");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader
        logoHref="/app"
        showSidebarToggle={false}
        userProfile={userProfile}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section className="relative overflow-hidden rounded-2xl bg-[#144272] px-6 py-8 text-white sm:px-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:22px_22px]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#2C74B3] opacity-40 blur-3xl" />
            <div className="relative">
              <p className="text-sm font-medium text-blue-light-100">{today}</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Halo, {firstName} 👋
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-light-100">
                Lanjutkan progres belajarmu di jalur{" "}
                <span className="font-semibold text-white">{learningFocus}</span>. Konsistensi kecil hari
                ini menentukan hasil besar nanti.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                <SparklesIcon className="h-4 w-4 text-blue-light-100" />
                Target hari ini: selesaikan 1 materi &amp; 1 tryout
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-theme-sm"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${stat.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-2xl font-extrabold text-gray-900">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-700">{stat.label}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">{stat.hint}</p>
                </article>
              );
            })}
          </section>

          <section>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Menu</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">Akses cepat</h2>
              </div>
              <span className="text-xs text-gray-400">{menuItems.length} menu tersedia</span>
            </div>

            <DashboardMenuGrid items={coreMenuItems} />

            {advancedMenuItems.length ? (
              <div className="mt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Fitur lanjutan
                </p>
                <DashboardMenuGrid items={advancedMenuItems} advanced />
              </div>
            ) : null}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <BoxCubeIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Materi terakhir
                    </p>
                    <h2 className="text-base font-bold text-gray-900">Lanjutkan belajar</h2>
                  </div>
                </div>
                <Link href={materialHref} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Lihat semua
                </Link>
              </div>

              {hasMaterialAccess ? (
                <div className="mt-4 flex items-center gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200 hover:bg-gray-50">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#144272] text-xs font-bold text-white">
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
                      <span className="text-xs font-medium text-gray-500">
                        {isMaterialCompleted ? "100" : "50"}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Terakhir dibuka {formatActivityDate(materialProgress?.updated_at ?? null)}
                    </p>
                  </div>
                  <Link
                    href={materialHref}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
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

            <article className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <ListIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Tryout terakhir
                    </p>
                    <h2 className="text-base font-bold text-gray-900">Hasil pengerjaan</h2>
                  </div>
                </div>
                <Link href="/app/history-tryout" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Lihat semua
                </Link>
              </div>

              {hasTryoutAccess && tryoutAttempt ? (
                <div className="mt-4 flex items-center gap-4 rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200 hover:bg-gray-50">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#2C74B3] text-xs font-bold text-white">
                    TRYOUT
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{attemptTryout?.title}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Dikerjakan {formatActivityDate(tryoutAttempt.updated_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold leading-none text-gray-900">
                      {getAttemptScoreLabel(tryoutAttempt)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">skor</p>
                  </div>
                  <Link
                    href={tryoutHref}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
                  >
                    Kerjakan
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <EmptyPanel
                  title="Belum ada tryout"
                  description="Kerjakan tryout pertamamu untuk mengukur kesiapan."
                  href="/tryouts"
                  action="Jelajahi tryout"
                />
              )}
            </article>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] lg:px-8">
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
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs font-medium text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p>Copyright 2026 Course Online. Seluruh hak cipta dilindungi.</p>
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
            className={`group flex items-start gap-4 rounded-xl border p-5 transition-all hover:border-brand-500 hover:shadow-theme-sm ${
              advanced
                ? "border-dashed border-gray-300 bg-gray-50 hover:bg-white"
                : "border-gray-200 bg-white"
            }`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
                advanced
                  ? "bg-white text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600"
                  : `${item.tone} group-hover:bg-brand-500 group-hover:text-white`
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="mt-0.5 text-sm leading-5 text-gray-500">{item.description}</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-gray-300 transition-colors group-hover:text-brand-600" />
          </Link>
        );
      })}
    </div>
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
    <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center">
      <p className="font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        {action}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-gray-950">{title}</h2>
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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 1.7 11.6 7l5.3 1.6-5.3 1.6-1.6 5.3-1.6-5.3L3.1 8.6 8.4 7 10 1.7Zm5.7 10.2.6 2 .6-2 2-.6-2-.6-.6-2-.6 2-2 .6 2 .6Z"
        fill="currentColor"
      />
    </svg>
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
