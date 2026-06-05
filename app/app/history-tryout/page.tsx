import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DataTable from "@/components/ui/table/DataTable";
import AppHeader from "@/layout/AppHeader";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";
import { getUserProfile } from "@/lib/user-profile";

type TryoutRelation = {
  id: string;
  title: string;
};

type TryoutAttemptRow = {
  id: string;
  tryout_id: string;
  score: number | null;
  max_score: number | null;
  status: string | null;
  started_at: string | null;
  submitted_at: string | null;
  tryouts: TryoutRelation | TryoutRelation[] | null;
};

type HistoryTableRow = {
  id: string;
  tryout_title: string;
  score: string;
  worked_at: string;
  result_url: string;
};

export const metadata: Metadata = {
  title: "Riwayat Tryout",
  description: "Riwayat tryout yang telah dikerjakan user.",
};

function getRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatScore(score: number | null, maxScore: number | null) {
  const scoreValue = Number(score ?? 0).toFixed(2);
  const maxScoreValue = Number(maxScore ?? 100).toFixed(0);

  return `${scoreValue} / ${maxScoreValue}`;
}

export default async function HistoryTryoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/app/history-tryout");
  }

  const { data: attemptRows, error: attemptError } = await supabase
    .from("tryout_attempts")
    .select("id, tryout_id, score, max_score, status, started_at, submitted_at, tryouts(id, title)")
    .eq("user_id", user.id)
    .in("status", ["submitted", "graded"])
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("started_at", { ascending: false });

  const attempts = ((attemptRows as TryoutAttemptRow[] | null) ?? []).map(
    (attempt): HistoryTableRow => {
      const tryout = getRelation(attempt.tryouts);
      const title = tryout?.title ?? "Tryout tidak ditemukan";
      const resultUrl = tryout
        ? `/tryout/result/${tryout.id}/${slugify(tryout.title)}/${attempt.id}`
        : "";

      return {
        id: attempt.id,
        tryout_title: title,
        score: formatScore(attempt.score, attempt.max_score),
        worked_at: formatDateTime(attempt.submitted_at ?? attempt.started_at),
        result_url: resultUrl,
      };
    }
  );
  const userProfile = getUserProfile(user);
  const cookieStore = await cookies();
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white/90">
      <AppHeader
        logoHref="/app"
        showSidebarToggle={false}
        userProfile={userProfile}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/app" className="hover:text-brand-500">
                App
              </Link>
              <span>/</span>
              <span className="font-medium text-brand-500">Riwayat Tryout</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white/90">
              Riwayat Tryout
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              Daftar tryout yang sudah dikerjakan, diurutkan dari pengerjaan terbaru.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Kembali
            </Link>
            <Link
              href="/tryouts"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
            >
              Cari Tryout
            </Link>
          </div>
        </section>

        {attemptError ? (
          <section className="mt-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/25 dark:bg-error-500/10 dark:text-error-400">
            Riwayat tryout belum bisa dimuat: {attemptError.message}
          </section>
        ) : null}

        <section className="mt-5">
          <DataTable
            title="Data Riwayat Tryout"
            description={`${attempts.length} tryout sudah dikerjakan.`}
            searchPlaceholder="Cari judul tryout..."
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            columns={[
              {
                key: "tryout_title",
                label: "Judul Tryout",
                sortable: true,
              },
              {
                key: "score",
                label: "Score",
              },
              {
                key: "worked_at",
                label: "Dikerjakan Kapan",
              },
              {
                key: "actions",
                label: "Aksi",
                type: "actions",
                searchable: false,
                className: "w-[180px]",
                actions: [
                  {
                    label: "Lihat pengerjaan",
                    tone: "primary",
                    hrefKey: "result_url",
                  },
                ],
              },
            ]}
            data={attempts}
          />
        </section>
      </main>
    </div>
  );
}
