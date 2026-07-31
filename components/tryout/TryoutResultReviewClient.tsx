"use client";

import Link from "next/link";
import { useState } from "react";

type ReviewOption = {
  id: string;
  text: string;
};

type ReviewQuestion = {
  id: string;
  order: number;
  question: string;
  options: ReviewOption[];
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
};

type TryoutResultReviewClientProps = {
  tryoutTitle: string;
  score: number;
  questions: ReviewQuestion[];
  detailHref: string;
  retryHref: string;
};

function getOptionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export default function TryoutResultReviewClient({
  tryoutTitle,
  score,
  questions,
  detailHref,
  retryHref,
}: TryoutResultReviewClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!questions.length) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{tryoutTitle}</h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Detail soal untuk hasil tryout ini tidak tersedia.
          </p>
          <Link href={detailHref} className="mt-6 inline-flex h-11 items-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200">
            Kembali ke Detail
          </Link>
        </div>
      </main>
    );
  }

  const activeQuestion = questions[activeIndex];
  const correctCount = questions.filter((question) => question.isCorrect).length;
  const wrongCount = questions.length - correctCount;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.62fr)_340px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Hasil Pengerjaan</p>
                <h1 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-[28px]">{tryoutTitle}</h1>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:pt-1">
                Soal {activeQuestion.order} dari {questions.length}
              </p>
            </div>

            <div className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 ${activeQuestion.isCorrect ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400" : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"}`}>
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-current/10 text-lg font-bold">
                {activeQuestion.isCorrect ? "✓" : "×"}
              </span>
              <p className="text-sm font-semibold">
                {activeQuestion.isCorrect ? "Jawaban Anda benar" : "Jawaban Anda salah"}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 px-5 py-3.5 dark:bg-white/[0.03] sm:px-6">
              <p className="text-base leading-7 text-gray-800 dark:text-white/90 sm:text-lg">{activeQuestion.question}</p>
            </div>

            <div className="mt-4 space-y-2.5">
              {activeQuestion.options.map((option, optionIndex) => {
                const isSelected = activeQuestion.selectedOptionId === option.id;
                const isCorrectOption = activeQuestion.correctOptionId === option.id;
                const isWrongSelection = isSelected && !isCorrectOption;

                const optionClass = isCorrectOption
                  ? "border-success-300 bg-success-50 dark:border-success-500/40 dark:bg-success-500/10"
                  : isWrongSelection
                    ? "border-error-300 bg-error-50 dark:border-error-500/40 dark:bg-error-500/10"
                    : "border-gray-200 bg-white dark:border-gray-800 dark:bg-transparent";
                const labelClass = isCorrectOption
                  ? "border-success-500 bg-success-500 text-white"
                  : isWrongSelection
                    ? "border-error-500 bg-error-500 text-white"
                    : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300";

                return (
                  <div key={option.id} className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left sm:px-5 ${optionClass}`}>
                    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${labelClass}`}>
                      {getOptionLabel(optionIndex)}
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:text-[15px]">{option.text}</span>
                    <div className="ml-auto flex shrink-0 flex-col items-end gap-1 pt-0.5">
                      {isSelected ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isCorrectOption ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400" : "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400"}`}>
                          Pilihan Anda
                        </span>
                      ) : null}
                      {isCorrectOption ? (
                        <span className="rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-400">Jawaban benar</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))} disabled={activeIndex === 0} className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]">
                Soal Sebelumnya
              </button>
              {activeIndex < questions.length - 1 ? (
                <button type="button" onClick={() => setActiveIndex((current) => Math.min(current + 1, questions.length - 1))} className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600">
                  Soal Berikutnya
                </button>
              ) : (
                <Link href={detailHref} className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600">Selesai</Link>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nilai Akhir</p>
              <p className="mt-1 text-4xl font-semibold text-gray-800 dark:text-white/90">{score.toFixed(2)}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-success-50 p-3 text-success-700 dark:bg-success-500/10 dark:text-success-400"><span className="block text-xs">Benar</span><strong className="text-lg">{correctCount}</strong></div>
                <div className="rounded-xl bg-error-50 p-3 text-error-700 dark:bg-error-500/10 dark:text-error-400"><span className="block text-xs">Salah</span><strong className="text-lg">{wrongCount}</strong></div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Peta Soal</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Hijau benar, merah salah</p>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button key={question.id} type="button" onClick={() => setActiveIndex(index)} className={`inline-flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${question.isCorrect ? "border-success-300 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400" : "border-error-300 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"} ${isActive ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-950" : ""}`}>
                      {question.order}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link href={detailHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]">Kembali ke Detail</Link>
              <Link href={retryHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-200 px-5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/10">Kerjakan Lagi</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
