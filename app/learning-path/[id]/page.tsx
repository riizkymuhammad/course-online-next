import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PublicNavbar from "@/components/header/PublicNavbar";
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

      <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 sm:py-12 lg:px-0">
        <Link href="/#learning-path" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          ← Kembali ke Learning Path
        </Link>

        <section className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="bg-linear-to-br from-[#144272] to-[#2C74B3] px-6 py-12 text-white sm:px-10 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Learning Path</p>
            <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-tight sm:text-4xl">{learningPath.title}</h1>
            <p className="mt-4 text-sm font-medium text-white/80">{tryouts.length} tryout tersedia</p>
          </div>
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tentang Learning Path</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
              {learningPath.description?.trim() || "Belum ada deskripsi untuk learning path ini."}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Rangkaian Belajar</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">Daftar Tryout</h2>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{tryouts.length} tryout</p>
          </div>

          {tryouts.length ? (
            <div className="mt-6 space-y-3">
              {tryouts.map((tryout) => (
                <Link key={tryout.id} href={`/tryout/${tryout.id}/${slugify(tryout.title)}`} className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30 sm:p-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white sm:text-base">{tryout.title}</span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{tryout.total_questions ?? 0} soal</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              Belum ada tryout published pada learning path ini.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
