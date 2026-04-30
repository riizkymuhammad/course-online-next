import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";

type ResultPageParams = {
  uuid: string;
  slug: string;
  attemptId: string;
};

export async function generateMetadata(
  props: PageProps<"/tryout/result/[uuid]/[slug]/[attemptId]">
): Promise<Metadata> {
  const params = (await props.params) as ResultPageParams;

  return {
    title: `Hasil Tryout ${params.slug}`,
    description: "Halaman hasil pengerjaan tryout.",
  };
}

function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds) return "-";

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  return [hours, minutes, seconds].map((item) => String(item).padStart(2, "0")).join(":");
}

function getScoreAppearance(score: number) {
  if (score >= 80) {
    return {
      badge: "Excellent",
      badgeClass:
        "border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400",
      scoreClass: "text-success-700 dark:text-success-400",
      panelClass:
        "border-success-200 bg-linear-to-br from-success-50 via-white to-success-25 dark:border-success-500/20 dark:from-success-500/10 dark:via-white/[0.03] dark:to-white/[0.02]",
    };
  }

  if (score >= 60) {
    return {
      badge: "Good",
      badgeClass:
        "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400",
      scoreClass: "text-warning-700 dark:text-warning-400",
      panelClass:
        "border-warning-200 bg-linear-to-br from-warning-50 via-white to-warning-25 dark:border-warning-500/20 dark:from-warning-500/10 dark:via-white/[0.03] dark:to-white/[0.02]",
    };
  }

  return {
    badge: "Perlu Evaluasi",
    badgeClass:
      "border-error-200 bg-error-50 text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400",
    scoreClass: "text-error-700 dark:text-error-400",
    panelClass:
      "border-error-200 bg-linear-to-br from-error-50 via-white to-error-25 dark:border-error-500/20 dark:from-error-500/10 dark:via-white/[0.03] dark:to-white/[0.02]",
  };
}

export default async function TryoutResultPage(
  props: PageProps<"/tryout/result/[uuid]/[slug]/[attemptId]">
) {
  const params = (await props.params) as ResultPageParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/tryout");
  }

  const { data: attemptRow } = await supabase
    .from("tryout_attempts")
    .select(
      "id, tryout_id, user_id, status, score, total_questions, correct_answers, wrong_answers, unanswered_answers, duration_seconds, submitted_at"
    )
    .eq("id", params.attemptId)
    .eq("tryout_id", params.uuid)
    .eq("user_id", user.id)
    .single();

  if (!attemptRow) {
    notFound();
  }

  const { data: tryoutRow } = await supabase
    .from("tryouts")
    .select("id, title")
    .eq("id", attemptRow.tryout_id)
    .single();

  if (!tryoutRow) {
    notFound();
  }

  const expectedSlug = slugify(tryoutRow.title);
  if (params.slug !== expectedSlug) {
    redirect(`/tryout/result/${tryoutRow.id}/${expectedSlug}/${attemptRow.id}`);
  }

  const submittedAt = attemptRow.submitted_at
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(attemptRow.submitted_at))
    : "-";
  const scoreValue = Number(attemptRow.score ?? 0);
  const scoreAppearance = getScoreAppearance(scoreValue);

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 px-4 py-6 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-500">
              Hasil Tryout
            </p>
            <div className="mt-3 grid gap-4 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
                  {tryoutRow.title}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Ringkasan hasil pengerjaan Anda ditampilkan dengan metrik utama yang lebih mudah
                  dibaca dan fokus pada performa akhir.
                </p>
                <div className="mt-3 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  Attempt ID: {attemptRow.id}
                </div>
              </div>

              <div
                className={`rounded-[20px] border p-5 shadow-theme-sm ${scoreAppearance.panelClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Score Akhir
                    </p>
                    <p className={`mt-2 text-4xl font-semibold tracking-tight ${scoreAppearance.scoreClass}`}>
                      {scoreValue.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${scoreAppearance.badgeClass}`}
                  >
                    {scoreAppearance.badge}
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/80 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full ${
                      scoreValue >= 80
                        ? "bg-success-500"
                        : scoreValue >= 60
                          ? "bg-warning-500"
                          : "bg-error-500"
                    }`}
                    style={{ width: `${Math.min(Math.max(scoreValue, 0), 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Nilai divisualisasikan dari 0 sampai 100.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Jawaban Benar"
                value={String(attemptRow.correct_answers)}
                tone="success"
              />
              <MetricCard
                label="Jawaban Salah"
                value={String(attemptRow.wrong_answers)}
                tone="error"
              />
              <MetricCard
                label="Tidak Dijawab"
                value={String(attemptRow.unanswered_answers)}
                tone="neutral"
              />
              <MetricCard
                label="Durasi Pengerjaan"
                value={formatDuration(attemptRow.duration_seconds)}
                tone="brand"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InfoCard label="Total Soal" value={String(attemptRow.total_questions)} />
              <InfoCard label="Dikumpulkan" value={submittedAt} />
              <InfoCard
                label="Akurasi"
                value={
                  attemptRow.total_questions > 0
                    ? `${Math.round((attemptRow.correct_answers / attemptRow.total_questions) * 100)}%`
                    : "0%"
                }
              />
            </div>

            <div className="mt-5 flex flex-col justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row">
              <Link
                href={`/tryout/${tryoutRow.id}/${expectedSlug}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
              >
                Kembali ke Detail
              </Link>
              <Link
                href={`/tryout/exam/${tryoutRow.id}/${expectedSlug}`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                Kerjakan Lagi
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "error" | "neutral" | "brand";
}) {
  const toneClasses = {
    success:
      "border-success-100 bg-success-50/80 dark:border-success-500/15 dark:bg-success-500/10",
    error: "border-error-100 bg-error-50/80 dark:border-error-500/15 dark:bg-error-500/10",
    neutral: "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]",
    brand: "border-brand-100 bg-brand-50/80 dark:border-brand-500/15 dark:bg-brand-500/10",
  };

  const valueClasses = {
    success: "text-success-700 dark:text-success-400",
    error: "text-error-700 dark:text-error-400",
    neutral: "text-gray-800 dark:text-white/90",
    brand: "text-brand-700 dark:text-brand-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClasses[tone]}`}>{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}
