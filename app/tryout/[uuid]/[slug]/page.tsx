import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicNavbar from "@/components/header/PublicNavbarWithUserDropdown";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { buildLearningPathLabel } from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";
import { buildCategoryPath, slugify } from "@/lib/text";
import { formatDateTime } from "@/lib/date";

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

function isSvgImage(value: string) {
  return value.toLowerCase().includes(".svg");
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
  const [{ data: { user } }, cookieStore, { data: tryoutRow }] = await Promise.all([
    supabase.auth.getUser(),
    cookies(),
    supabase.from("tryouts").select("id, title, total_questions, duration_minutes, learning_path_id, category_id, sub_category_id, thumbnail_url").eq("id", params.uuid).single(),
  ]);

  if (!tryoutRow) {
    notFound();
  }

  const expectedSlug = slugify(tryoutRow.title);
  if (params.slug !== expectedSlug) {
    redirect(`/tryout/${tryoutRow.id}/${expectedSlug}`);
  }

  const learningPathPromise = tryoutRow.learning_path_id
    ? supabase.from("learning_paths").select("title").eq("id", tryoutRow.learning_path_id).maybeSingle()
    : Promise.resolve({ data: null });
  const categoryPromise = tryoutRow.category_id
    ? supabase.from("categories").select("name").eq("id", tryoutRow.category_id).maybeSingle()
    : Promise.resolve({ data: null });
  const subCategoryPromise = tryoutRow.sub_category_id
    ? supabase.from("sub_categories").select("name").eq("id", tryoutRow.sub_category_id).maybeSingle()
    : Promise.resolve({ data: null });
  const attemptRowsPromise = user
    ? supabase
        .from("tryout_attempts")
        .select("id, score, max_score, submitted_at, status")
        .eq("tryout_id", tryoutRow.id)
        .eq("user_id", user.id)
        .in("status", ["submitted", "graded"])
        .order("submitted_at", { ascending: false })
    : Promise.resolve({ data: [] as AttemptScoreRow[] });
  const [learningPathResult, categoryResult, subCategoryResult, { data: attemptRows }] = await Promise.all([
    learningPathPromise,
    categoryPromise,
    subCategoryPromise,
    attemptRowsPromise,
  ]);
  const categoryName = categoryResult.data?.name?.trim() || "Umum";
  const subCategoryName = subCategoryResult.data?.name?.trim() || "Umum";
  const learningPathTitle = learningPathResult.data
    ? buildLearningPathLabel(learningPathResult.data)
    : buildCategoryPath(categoryName, subCategoryName);

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
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicNavbar
        userProfile={userProfile}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
        loginHref={`/login?redirectedFrom=${encodeURIComponent(detailHref)}`}
      />

      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl space-y-6">

          <section className="grid overflow-hidden rounded-md border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-[320px_minmax(0,1fr)]">
            <div className="relative h-52 bg-white md:h-full md:min-h-[300px]">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={tryoutRow.title}
                  fill
                  priority
                  unoptimized={isSvgImage(thumbnailUrl)}
                  className="object-contain"
                  sizes="(min-width: 768px) 320px, 100vw"
                />
              ) : (
                <div className="flex h-full min-h-52 items-center justify-center bg-linear-to-br from-brand-500 to-brand-700 px-8 text-center md:min-h-[300px]">
                  <span className="max-w-60 text-sm font-semibold leading-5 text-white sm:text-base">{tryoutRow.title}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col p-5 sm:p-7">
              <span className="w-fit rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                Tryout
              </span>
              <h1 className="mt-3 max-w-2xl text-xl font-semibold leading-7 text-gray-900 dark:text-white">
                {tryoutRow.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="mr-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{learningPathTitle}</p>
                <span className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {categoryName}
                </span>
                <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  {subCategoryName}
                </span>
              </div>

              <dl className="mt-5 flex flex-wrap gap-x-7 gap-y-4 border-y border-gray-100 py-4 dark:border-gray-800">
                {[
                  { label: "Soal", value: `${tryoutRow.total_questions ?? 0} soal` },
                  { label: "Durasi", value: `${tryoutRow.duration_minutes ?? 60} menit` },
                ].map((item) => (
                  <div key={item.label} className="min-w-20">
                    <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">{item.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <Link href={startHref} className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600 sm:w-fit sm:self-end">
                Mulai Tryout
              </Link>
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat pengerjaan</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nilai tryout yang sudah selesai.</p>
              </div>
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">{attempts.length}</span>
            </div>

            {attempts.length ? (
              <div className="mt-5 space-y-3">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white/90">
                        {Number(attempt.score ?? 0).toFixed(2)}
                        <span className="text-sm font-normal text-gray-400"> / {Number(attempt.max_score ?? 100)}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDateTime(attempt.submitted_at)}</p>
                    </div>
                    <Link href={`/tryout/result/${tryoutRow.id}/${expectedSlug}/${attempt.id}`} className="inline-flex h-9 items-center justify-center rounded-md border border-brand-200 px-4 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/10">
                      Lihat hasil
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                {user ? "Belum ada riwayat pengerjaan." : "Login untuk melihat riwayat pengerjaan."}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
