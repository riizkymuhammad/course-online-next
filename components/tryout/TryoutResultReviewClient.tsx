"use client";

import { useState } from "react";
import ActionLink from "@/components/atoms/ActionLink";
import Surface from "@/components/atoms/Surface";
import ReviewQuestionPanel from "@/components/organisms/tryout/ReviewQuestionPanel";
import ResultReviewSidebar from "@/components/organisms/tryout/ResultReviewSidebar";
import type { TryoutReviewQuestion } from "@/components/tryout/tryout-result-review.types";

type TryoutResultReviewClientProps = {
  tryoutTitle: string;
  score: number;
  questions: TryoutReviewQuestion[];
  detailHref: string;
  retryHref: string;
};

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
      <main className="min-h-[calc(100vh-3.5rem)] bg-gray-50 px-4 py-8 dark:bg-gray-950 sm:px-6 lg:px-8">
        <Surface className="mx-auto max-w-3xl p-8">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{tryoutTitle}</h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Detail soal untuk hasil tryout ini tidak tersedia.</p>
          <ActionLink href={detailHref} variant="outline" className="mt-6">Kembali ke Detail</ActionLink>
        </Surface>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1.62fr)_340px]">
        <ReviewQuestionPanel
          tryoutTitle={tryoutTitle}
          question={questions[activeIndex]}
          activeIndex={activeIndex}
          totalQuestions={questions.length}
          detailHref={detailHref}
          onPrevious={() => setActiveIndex((current) => Math.max(current - 1, 0))}
          onNext={() => setActiveIndex((current) => Math.min(current + 1, questions.length - 1))}
        />
        <ResultReviewSidebar
          score={score}
          questions={questions}
          activeIndex={activeIndex}
          detailHref={detailHref}
          retryHref={retryHref}
          onSelectQuestion={setActiveIndex}
        />
      </div>
    </main>
  );
}
