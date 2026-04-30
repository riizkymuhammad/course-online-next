"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TryoutExamOption = {
  id: string;
  order: number;
  text: string;
};

type TryoutExamQuestion = {
  id: string;
  order: number;
  question: string;
  options: TryoutExamOption[];
};

type TryoutExamClientProps = {
  attemptId: string;
  tryoutTitle: string;
  questions: TryoutExamQuestion[];
  previewHref: string;
  initialAnswers: Record<string, string>;
};

function getOptionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export default function TryoutExamClient({
  attemptId,
  tryoutTitle,
  questions,
  previewHref,
  initialAnswers,
}: TryoutExamClientProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!questions.length) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-500">
            Tryout Exam
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {tryoutTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Soal untuk tryout ini belum tersedia. Silakan kembali ke halaman preview tryout.
          </p>
          <Link
            href={previewHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
          >
            Kembali ke Preview
          </Link>
        </div>
      </main>
    );
  }

  const activeQuestion = questions[activeIndex];
  const selectedOptionId = answers[activeQuestion.id] ?? null;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

  async function handleSelectOption(questionId: string, optionId: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
    setIsSaving(questionId);
    setErrorMessage(null);

    const response = await fetch("/api/tryout/attempts/save-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attemptId,
        questionId,
        optionId,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setErrorMessage(payload?.error ?? "Gagal menyimpan jawaban.");
    }

    setIsSaving(null);
  }

  async function handleSubmitTryout() {
    if (!allAnswered || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const response = await fetch("/api/tryout/attempts/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attemptId,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { redirectTo?: string; error?: string }
      | null;

    if (!response.ok || !payload?.redirectTo) {
      setErrorMessage(payload?.error ?? "Gagal mengumpulkan tryout.");
      setIsSubmitting(false);
      return;
    }

    router.push(payload.redirectTo);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.62fr)_340px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-[28px]">
                  {tryoutTitle}
                </h1>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:pt-1">
                Soal {activeQuestion.order} dari {questions.length}
              </p>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl bg-gray-50 px-5 py-3.5 dark:bg-white/[0.03] sm:px-6">
              <p className="text-base leading-7 text-gray-800 dark:text-white/90 sm:text-lg">
                {activeQuestion.question}
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              {activeQuestion.options.map((option, optionIndex) => {
                const isSelected = selectedOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(activeQuestion.id, option.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition sm:px-5 ${
                      isSelected
                        ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                        : "border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-transparent dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        isSelected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {getOptionLabel(optionIndex)}
                    </span>
                    <span className="pt-0.5 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:text-[15px]">
                      {option.text}
                    </span>
                    {isSaving === activeQuestion.id && selectedOptionId === option.id ? (
                      <span className="ml-auto pt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        Menyimpan...
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setActiveIndex((current) => Math.max(current - 1, 0))}
                disabled={activeIndex === 0}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
              >
                Soal Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeIndex === questions.length - 1) {
                    void handleSubmitTryout();
                    return;
                  }

                  setActiveIndex((current) => Math.min(current + 1, questions.length - 1));
                }}
                disabled={activeIndex === questions.length - 1 ? !allAnswered || isSubmitting : false}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeIndex === questions.length - 1
                  ? isSubmitting
                    ? "Mengumpulkan..."
                    : "Kumpulkan Tryout"
                  : "Soal Berikutnya"}
              </button>
            </div>
          </section>

          <aside>
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                Peta Soal
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Terjawab {answeredCount}/{questions.length}
              </p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const isActive = index === activeIndex;
                  const isAnswered = Boolean(answers[question.id]);

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`inline-flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                        isActive
                          ? "border-brand-500 bg-brand-500 text-white"
                          : isAnswered
                            ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
                            : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-700 dark:border-gray-800 dark:bg-transparent dark:text-gray-300"
                      }`}
                    >
                      {question.order}
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
