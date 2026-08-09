import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import PublicNavbar from "@/components/header/PublicNavbarWithSearch";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";

type LearningPathRow = {
  id: string;
  title: string;
  description: string | null;
};

type LearningPathTryoutRow = {
  learning_path_id: string | null;
};

export const metadata: Metadata = {
  title: "Semua Learning Path",
  description: "Daftar learning path untuk membantu proses belajar lebih terarah.",
};

export default async function LearningPathsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const [
    { data: { user } },
    cookieStore,
    { data: learningPathRows },
    { data: tryoutRows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    cookies(),
    supabase
      .from("learning_paths")
      .select("id, title, description")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("tryouts")
      .select("learning_path_id")
      .eq("status", "published")
      .not("learning_path_id", "is", null),
  ]);

  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });
  const learningPaths = (learningPathRows as LearningPathRow[] | null) ?? [];
  const normalizedQuery = q.trim().toLocaleLowerCase("id");
  const filteredLearningPaths = learningPaths.filter((learningPath) => {
    if (!normalizedQuery) return true;

    return [learningPath.title, learningPath.description ?? ""].some((value) =>
      value.toLocaleLowerCase("id").includes(normalizedQuery)
    );
  });
  const tryoutCounts = new Map<string, number>();

  ((tryoutRows as LearningPathTryoutRow[] | null) ?? []).forEach((tryout) => {
    if (!tryout.learning_path_id) return;
    tryoutCounts.set(
      tryout.learning_path_id,
      (tryoutCounts.get(tryout.learning_path_id) ?? 0) + 1
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <PublicNavbar
        userProfile={user ? getUserProfile(user) : null}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-600">
            Learning Path
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-950">
            Pilih jalur belajarmu
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Ikuti rangkaian belajar yang tersusun agar persiapanmu lebih fokus dan terarah.
          </p>
        </div>

        {filteredLearningPaths.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLearningPaths.map((learningPath) => {
              const tryoutCount = tryoutCounts.get(learningPath.id) ?? 0;

              return (
                <Link
                  key={learningPath.id}
                  href={`/learning-path/${learningPath.id}`}
                  className="group flex min-h-56 flex-col rounded-xl border border-gray-200 bg-white p-6 transition hover:border-brand-200 hover:shadow-theme-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600" aria-hidden="true">
                    <PathIcon />
                  </span>
                  <h2 className="mt-5 text-base font-semibold text-gray-950 group-hover:text-brand-600">
                    {learningPath.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    {learningPath.description?.trim() ||
                      "Jalur belajar terstruktur untuk membantumu mencapai target."}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-5 text-xs">
                    <span className="font-medium text-gray-500">{tryoutCount} tryout</span>
                    <span className="font-medium text-brand-600">Lihat detail →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <h2 className="text-base font-semibold text-gray-900">
              Learning path belum tersedia
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Daftar learning path akan ditampilkan di sini setelah tersedia.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function PathIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 3.75h6.25a3.5 3.5 0 0 1 0 7H8.75a3.5 3.5 0 0 0 0 7H15M5 3.75 6.75 2M5 3.75 6.75 5.5M15 17.75 13.25 16M15 17.75l-1.75 1.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
