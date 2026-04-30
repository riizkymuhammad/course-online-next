import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import StatusAlert from "@/components/ui/alert/StatusAlert";
import DataTable from "@/components/ui/table/DataTable";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";

type TryoutAttemptRow = {
  attempt_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  tryout_id: string | null;
  tryout_title: string | null;
  learning_path_title: string | null;
  score: number | null;
  status: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  wrong_answers: number | null;
  started_at: string | null;
  submitted_at: string | null;
  duration_seconds: number | null;
};

type DirectTryoutAttemptRow = {
  id: string;
  user_id: string;
  score: number | null;
  status: string | null;
  total_questions: number | null;
  correct_answers: number | null;
  wrong_answers: number | null;
  started_at: string | null;
  submitted_at: string | null;
  duration_seconds: number | null;
  tryouts:
    | {
        id: string;
        title: string;
        learning_path_id?: string | null;
      }
    | {
        id: string;
        title: string;
        learning_path_id?: string | null;
      }[]
    | null;
};

type HistoryTableRow = {
  id: string;
  user_name: string;
  tryout_name: string;
  learning_path_name: string;
  score: string;
  total_questions: string;
  correct_answers: string;
  wrong_answers: string;
  started_at: string;
  duration: string;
  status: string;
  result_url: string;
};

export const metadata: Metadata = {
  title: "Riwayat Tryout Dashboard",
  description: "Riwayat pengerjaan tryout user yang sedang login.",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds || durationSeconds < 0) return "-";

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  return [hours, minutes, seconds].map((item) => String(item).padStart(2, "0")).join(":");
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case "in_progress":
      return "Progres";
    case "graded":
      return "Selesai";
    case "submitted":
      return "Dikumpulkan";
    case "cancelled":
      return "Dibatalkan";
    default:
      return status || "-";
  }
}

const statusStyles: Record<string, string> = {
  Progres: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  Selesai: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  Dikumpulkan: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  Dibatalkan: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  "-": "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
};

function getUserNameFromMeta(metadata: unknown, email?: string | null, fallback?: string) {
  if (metadata && typeof metadata === "object") {
    const record = metadata as Record<string, unknown>;
    const fullName = typeof record.full_name === "string" ? record.full_name.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";

    if (fullName) return fullName;
    if (name) return name;
  }

  return email?.trim() || fallback || "User";
}

export default async function RiwayatTryoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/dashboard/riwayat-tryout");
  }

  const { data: rpcAttemptRows, error: rpcError } = await supabase.rpc("get_tryout_attempt_history");
  const { data: learningPathRows } = await supabase.from("learning_paths").select("id, title");
  const learningPathMap = new Map((learningPathRows ?? []).map((item) => [item.id, item.title]));
  const adminClient = createAdminClient();

  const rpcRows = (rpcAttemptRows as TryoutAttemptRow[] | null) ?? [];

  const historyResult =
    rpcRows.length > 0 || !rpcError
      ? {
          isFallbackMode: false,
          attempts: rpcRows.map((attempt): HistoryTableRow => {
            const tryoutTitle = attempt.tryout_title ?? "Tryout tidak ditemukan";
            const tryoutId = attempt.tryout_id ?? "";
            const tryoutSlug = tryoutTitle ? slugify(tryoutTitle) : "";

            return {
              id: attempt.attempt_id,
              user_name: attempt.user_name?.trim() || attempt.user_email?.trim() || "User",
              tryout_name: tryoutTitle,
              learning_path_name: attempt.learning_path_title ?? "Tanpa Learning Path",
              score: Number(attempt.score ?? 0).toFixed(2),
              total_questions: String(attempt.total_questions ?? 0),
              correct_answers: String(attempt.correct_answers ?? 0),
              wrong_answers: String(attempt.wrong_answers ?? 0),
              started_at: formatDateTime(attempt.started_at),
              duration: formatDuration(attempt.duration_seconds),
              status: getStatusLabel(attempt.status),
              result_url:
                tryoutId && tryoutSlug
                  ? `/tryout/result/${tryoutId}/${tryoutSlug}/${attempt.attempt_id}`
                  : "",
            };
          }),
        }
      : {
          isFallbackMode: true,
          attempts: await (async () => {
            const userNameMap = new Map<string, string>();

            if (adminClient) {
              const { data: authUsers } = await adminClient.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
              });

              authUsers?.users.forEach((authUser) => {
                userNameMap.set(
                  authUser.id,
                  getUserNameFromMeta(authUser.user_metadata, authUser.email, authUser.id)
                );
              });
            }

            const { data: directAttemptRows } = await supabase
              .from("tryout_attempts")
              .select(
                "id, user_id, score, status, total_questions, correct_answers, wrong_answers, started_at, submitted_at, duration_seconds, tryouts(id, title, learning_path_id)"
              )
              .order("started_at", { ascending: false });

            return ((directAttemptRows as DirectTryoutAttemptRow[] | null) ?? []).map(
              (attempt): HistoryTableRow => {
                const tryoutValue = Array.isArray(attempt.tryouts)
                  ? (attempt.tryouts[0] ?? null)
                  : attempt.tryouts;
                const tryoutTitle = tryoutValue?.title ?? "Tryout tidak ditemukan";
                const tryoutId = tryoutValue?.id ?? "";
                const tryoutSlug = tryoutTitle ? slugify(tryoutTitle) : "";
                const learningPathTitle =
                  (tryoutValue?.learning_path_id
                    ? learningPathMap.get(tryoutValue.learning_path_id)
                    : null) ?? "Tanpa Learning Path";

                return {
                  id: attempt.id,
                  user_name: userNameMap.get(attempt.user_id) ?? attempt.user_id,
                  tryout_name: tryoutTitle,
                  learning_path_name: learningPathTitle,
                  score: Number(attempt.score ?? 0).toFixed(2),
                  total_questions: String(attempt.total_questions ?? 0),
                  correct_answers: String(attempt.correct_answers ?? 0),
                  wrong_answers: String(attempt.wrong_answers ?? 0),
                  started_at: formatDateTime(attempt.started_at),
                  duration: formatDuration(attempt.duration_seconds),
                  status: getStatusLabel(attempt.status),
                  result_url:
                    tryoutId && tryoutSlug
                      ? `/tryout/result/${tryoutId}/${tryoutSlug}/${attempt.id}`
                      : "",
                };
              }
            );
          })(),
        };

  const { attempts, isFallbackMode } = historyResult;

  const finishedAttempts = attempts.filter((item) => item.status === "Selesai").length;
  const averageScore =
    attempts.length > 0
      ? (
          attempts.reduce((total, item) => total + Number(item.score), 0) / attempts.length
        ).toFixed(2)
      : "0.00";
  const totalQuestions = attempts.reduce((total, item) => total + Number(item.total_questions), 0);
  const submittedCount = attempts.filter((item) => item.status === "Selesai").length;

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Riwayat Tryout" },
        ]}
        title="Riwayat Tryout"
        description="Lihat seluruh riwayat pengerjaan tryout semua user berdasarkan data terbaru, lengkap dengan status, learning path, jumlah soal, dan hasil jawaban."
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <SummaryCard
          label="Total Attempt"
          value={String(attempts.length)}
          note="Semua riwayat pengerjaan tryout user"
        />
        <SummaryCard
          label="Rata-rata Score"
          value={averageScore}
          note={`${finishedAttempts} attempt memiliki waktu selesai`}
        />
        <SummaryCard
          label="Attempt Selesai"
          value={String(submittedCount)}
          note="Status graded yang sudah selesai"
        />
        <SummaryCard
          label="Total Soal"
          value={String(totalQuestions)}
          note="Akumulasi jumlah soal dari semua attempt"
        />
      </section>

      {isFallbackMode ? (
        <StatusAlert
          variant="warning"
          title="Mode Fallback Aktif"
          message="Halaman memakai query langsung ke tryout_attempts karena fungsi get_tryout_attempt_history() belum tersedia atau belum aktif. Jika SUPABASE_SERVICE_ROLE_KEY belum diatur, kolom nama masih bisa tampil sebagai UUID user."
        />
      ) : null}

      <section>
        <DataTable
          title="Data Riwayat Tryout"
          description="Riwayat pengerjaan tryout user dengan pencarian, sorting, dan pagination."
          searchPlaceholder="Cari riwayat tryout..."
          action={
            <Link
              href="/dashboard/tryout-management"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Lihat Tryout
            </Link>
          }
          columns={[
            { key: "user_name", label: "Nama", sortable: true },
            {
              key: "tryout_name",
              label: "Nama Tryout",
              sortable: true,
              type: "imageText",
              subtitleKey: "learning_path_name",
            },
            {
              key: "status",
              label: "Status",
              sortable: true,
              type: "badge",
              badgeToneMap: statusStyles,
            },
            { key: "total_questions", label: "Jumlah Soal", sortable: true },
            { key: "correct_answers", label: "Benar", sortable: true },
            { key: "wrong_answers", label: "Salah", sortable: true },
            { key: "score", label: "Score", sortable: true },
            { key: "started_at", label: "Waktu Pengerjaan", sortable: true },
            { key: "duration", label: "Durasi", sortable: true },
            {
              key: "actions",
              label: "Aksi",
              type: "actions",
              searchable: false,
              className: "w-[140px]",
              actions: [{ label: "Detail", tone: "primary", hrefKey: "result_url" }],
            },
          ]}
          data={attempts}
        />
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white/90">{value}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>
    </div>
  );
}
