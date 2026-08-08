"use client";

import { useCallback, useEffect, useState } from "react";

type LiveAttempt = {
  id: string;
  userName: string;
  tryoutTitle: string;
  currentQuestionOrder: number | null;
  currentQuestion: string | null;
  answeredQuestions: number;
  totalQuestions: number;
  lastActivityAt: string | null;
  isOnline: boolean;
};

function formatActivityTime(value: string | null) {
  if (!value) return "Belum ada aktivitas";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export default function LiveTryoutActivity() {
  const [attempts, setAttempts] = useState<LiveAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    const response = await fetch("/api/admin/tryout-live-activity", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { attempts?: LiveAttempt[]; error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Aktivitas live gagal dimuat.");
      return;
    }

    setAttempts(payload?.attempts ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => void loadActivity(), 0);
    const intervalId = window.setInterval(() => void loadActivity(), 5_000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadActivity]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Aktivitas Tryout Live</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Diperbarui otomatis setiap 5 detik.</p>
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {attempts.filter((item) => item.isOnline).length} user aktif
        </span>
      </div>

      {error ? <p className="mt-4 text-sm text-error-600 dark:text-error-400">{error}</p> : null}
      {!error && attempts.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Belum ada user yang sedang mengerjakan tryout.</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {attempts.map((attempt) => (
          <article key={attempt.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${attempt.isOnline ? "bg-success-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                  <p className="font-semibold text-gray-800 dark:text-white/90">{attempt.userName}</p>
                  <span className="text-xs text-gray-400">{attempt.isOnline ? "Aktif" : "Tidak aktif"}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{attempt.tryoutTitle}</p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {attempt.currentQuestionOrder
                    ? `Membuka soal ${attempt.currentQuestionOrder}: ${attempt.currentQuestion ?? "-"}`
                    : "Belum membuka soal"}
                </p>
              </div>
              <div className="shrink-0 text-sm lg:text-right">
                <p className="font-semibold text-brand-600 dark:text-brand-400">
                  {attempt.answeredQuestions}/{attempt.totalQuestions} terjawab
                </p>
                <p className="mt-1 text-xs text-gray-400">Aktivitas terakhir {formatActivityTime(attempt.lastActivityAt)}</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${attempt.totalQuestions ? Math.min((attempt.answeredQuestions / attempt.totalQuestions) * 100, 100) : 0}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
