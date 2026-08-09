import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PublicNavbar from "@/components/header/PublicNavbarWithUserDropdown";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/text";
import { getUserProfile } from "@/lib/user-profile";

type PageParams = { id: string };

export const metadata: Metadata = {
  title: "Detail Learning Path",
  description: "Informasi learning path dan rangkaian tryout.",
};

export default async function PublicLearningPathDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [
    { data: { user } },
    cookieStore,
    { data: learningPath },
    { data: tryoutRows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    cookies(),
    supabase
      .from("learning_paths")
      .select("id, title, description")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("tryouts")
      .select("id, title, total_questions, learning_path_order")
      .eq("learning_path_id", id)
      .eq("status", "published")
      .order("learning_path_order", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false }),
  ]);

  if (!learningPath) notFound();

  const tryouts = tryoutRows ?? [];
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <PublicNavbar
        userProfile={user ? getUserProfile(user) : null}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
        loginHref={`/login?redirectedFrom=${encodeURIComponent(`/learning-path/${id}`)}`}
      />

      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link
            href="/learning-paths"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400"
          >
            <BackIcon />
            Kembali ke Learning Path
          </Link>

          <section className="grid overflow-hidden rounded-md border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-[280px_minmax(0,1fr)]">
            <div className="flex min-h-52 items-center justify-center bg-linear-to-br from-brand-500 to-brand-700 p-8 text-white md:min-h-[300px]">
              <PathVisual />
            </div>

            <div className="flex flex-col p-5 sm:p-7">
              <span className="w-fit rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                Learning Path
              </span>
              <h1 className="mt-3 max-w-2xl text-xl font-semibold leading-7 text-gray-900 dark:text-white">
                {learningPath.title}
              </h1>
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-gray-500 dark:text-gray-400">
                {learningPath.description?.trim() ||
                  "Jalur belajar terstruktur untuk membantumu mencapai target."}
              </p>

              <dl className="mt-5 border-y border-gray-100 py-4 dark:border-gray-800">
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
                    Rangkaian
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                    {tryouts.length} tryout
                  </dd>
                </div>
              </dl>

              {tryouts[0] ? (
                <Link
                  href={`/tryout/${tryouts[0].id}/${slugify(tryouts[0].title)}`}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600 sm:w-fit sm:self-end"
                >
                  Mulai Belajar
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rangkaian Tryout
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Kerjakan sesuai urutan yang tersedia.
                </p>
              </div>
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                {tryouts.length}
              </span>
            </div>

            {tryouts.length ? (
              <div className="mt-5 space-y-3">
                {tryouts.map((tryout, index) => (
                  <Link
                    key={tryout.id}
                    href={`/tryout/${tryout.id}/${slugify(tryout.title)}`}
                    className="group flex items-center gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-5 text-gray-900 transition group-hover:text-brand-600 dark:text-white">
                        {tryout.title}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        {tryout.total_questions ?? 0} soal
                      </span>
                    </span>
                    <ArrowIcon />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                Belum ada tryout pada learning path ini.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="none">
      <path
        d="m12.5 5-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="m7.5 5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PathVisual() {
  return (
    <svg aria-hidden="true" className="h-32 w-40 text-white" viewBox="0 0 160 128" fill="none">
      <path
        d="M35 26h45c25 0 45 20 45 45v31"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="4 13"
        opacity=".65"
      />
      <circle cx="35" cy="26" r="17" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="3" />
      <circle cx="80" cy="70" r="17" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="3" />
      <circle cx="125" cy="102" r="17" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeWidth="3" />
      <path
        d="m29 26 4 4 8-9M74 70l4 4 8-9m33 37 4 4 8-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
