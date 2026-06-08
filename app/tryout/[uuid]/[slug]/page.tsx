import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import UserDropdown from "@/components/header/UserDropdown";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { buildLearningPathLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";

type TryoutPageParams = {
  uuid: string;
  slug: string;
};

type AttemptScoreRow = {
  id: string;
  score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  status: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isSvgImage(value: string) {
  return value.toLowerCase().includes(".svg");
}

function buildCategoryPath(category: string | null, subCategory: string | null) {
  return [category?.trim() ?? "", subCategory?.trim() ?? ""].filter(Boolean).join(" > ");
}

export async function generateMetadata(
  props: PageProps<"/tryout/[uuid]/[slug]">
): Promise<Metadata> {
  const params = (await props.params) as TryoutPageParams;
  return {
    title: `Tryout ${params.slug}`,
    description: "Halaman detail tryout.",
  };
}

export default async function TryoutDetailPage(props: PageProps<"/tryout/[uuid]/[slug]">) {
  const params = (await props.params) as TryoutPageParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tryoutRow } = await supabase
    .from("tryouts")
    .select("id, title, total_questions, learning_path_id, category, sub_category, thumbnail_url")
    .eq("id", params.uuid)
    .single();

  if (!tryoutRow) {
    notFound();
  }

  const expectedSlug = slugify(tryoutRow.title);
  if (params.slug !== expectedSlug) {
    redirect(`/tryout/${tryoutRow.id}/${expectedSlug}`);
  }

  let learningPathTitle = buildCategoryPath(tryoutRow.category, tryoutRow.sub_category) || "Unassigned";
  if (tryoutRow.learning_path_id) {
    const { data: learningPathRow } = await supabase
      .from("learning_paths")
      .select("title, category, sub_category, sub_sub_category")
      .eq("id", tryoutRow.learning_path_id)
      .single();

    learningPathTitle = learningPathRow ? buildLearningPathLabel(learningPathRow) : "Unassigned";
  }

  const { data: attemptRows } = user
    ? await supabase
        .from("tryout_attempts")
        .select("id, score, max_score, submitted_at, status")
        .eq("tryout_id", tryoutRow.id)
        .eq("user_id", user.id)
        .in("status", ["submitted", "graded"])
        .order("submitted_at", { ascending: false })
    : { data: [] as AttemptScoreRow[] };

  const attempts = (attemptRows as AttemptScoreRow[] | null) ?? [];
  const detailHref = `/tryout/${tryoutRow.id}/${expectedSlug}`;
  const thumbnailUrl =
    typeof tryoutRow.thumbnail_url === "string" && tryoutRow.thumbnail_url
      ? tryoutRow.thumbnail_url
      : null;
  const startHref = user
    ? `/tryout/exam/${tryoutRow.id}/${expectedSlug}`
    : `/login?redirectedFrom=${encodeURIComponent(detailHref)}`;
  const userProfile = user ? getUserProfile(user) : null;
  const cookieStore = await cookies();
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-theme-sm">
              <Image
                src="/images/logo/logo-icon.svg"
                alt="Logo platform belajar"
                width={20}
                height={20}
              />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white/90">
                Course Online
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Detail tryout</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {userProfile ? (
              <>
                <Link
                  href="/app"
                  className="hidden rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/10 sm:inline-flex"
                >
                  App
                </Link>
                <UserDropdown
                  avatarUrl={userProfile.avatarUrl}
                  displayName={userProfile.displayName}
                  email={userProfile.email}
                  activeRole={activeRole}
                  canSwitchRole={accountRole === "admin"}
                />
              </>
            ) : (
              <>
                <Link
                  href={`/login?redirectedFrom=${encodeURIComponent(detailHref)}`}
                  className="inline-flex rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-500">
            Tryout Detail
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
            {tryoutRow.title}
          </h1>
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="relative h-56 bg-[#0466c8]">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={tryoutRow.title}
                fill
                priority
                unoptimized={isSvgImage(thumbnailUrl)}
                className="object-cover"
                sizes="(min-width: 1024px) 896px, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                  {tryoutRow.title}
                </h2>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard label="Learning Path/Kategori" value={learningPathTitle} />
              <InfoCard label="Nama Tryout" value={tryoutRow.title} />
              <InfoCard label="Jumlah Soal" value={`${tryoutRow.total_questions ?? 0} soal`} />
            </div>

            <div className="mt-5 flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
              <Link
                href={startHref}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
              >
                {user ? "Mulai" : "Masuk terlebih dahulu"}
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                Nilai Tryout
              </p>
              <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                Riwayat pengerjaan
              </h2>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {attempts.length} nilai
            </p>
          </div>

          {attempts.length ? (
            <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex flex-col gap-3 bg-white p-4 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                      Score {Number(attempt.score ?? 0).toFixed(2)}
                      <span className="text-gray-400"> / {Number(attempt.max_score ?? 100)}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(attempt.submitted_at)}
                    </p>
                  </div>
                  <Link
                    href={`/tryout/result/${tryoutRow.id}/${expectedSlug}/${attempt.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-brand-200 px-4 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  >
                    Lihat pengerjaan
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              {user
                ? "Belum ada nilai untuk tryout ini."
                : "Masuk terlebih dahulu untuk melihat nilai tryout yang pernah dikerjakan."}
            </div>
          )}
        </section>
      </div>
      </main>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}
