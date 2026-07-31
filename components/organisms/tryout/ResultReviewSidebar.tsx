import ActionLink from "@/components/atoms/ActionLink";
import Surface from "@/components/atoms/Surface";
import ResultScoreCard from "@/components/molecules/tryout/ResultScoreCard";
import type { TryoutReviewQuestion } from "@/components/tryout/tryout-result-review.types";

type ResultReviewSidebarProps = {
  score: number;
  questions: TryoutReviewQuestion[];
  activeIndex: number;
  detailHref: string;
  retryHref: string;
  onSelectQuestion: (index: number) => void;
};

export default function ResultReviewSidebar({
  score,
  questions,
  activeIndex,
  detailHref,
  retryHref,
  onSelectQuestion,
}: ResultReviewSidebarProps) {
  const correctCount = questions.filter((question) => question.isCorrect).length;

  return (
    <aside className="space-y-4">
      <ResultScoreCard score={score} correctCount={correctCount} wrongCount={questions.length - correctCount} />

      <Surface className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Peta Soal</h2>
          <p className="shrink-0 text-right text-sm text-gray-500 dark:text-gray-400">
            Hijau benar, merah salah
          </p>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              aria-label={`Buka soal ${question.order}, jawaban ${question.isCorrect ? "benar" : "salah"}`}
              aria-current={index === activeIndex ? "step" : undefined}
              onClick={() => onSelectQuestion(index)}
              className={`inline-flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${question.isCorrect ? "border-success-300 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400" : "border-error-300 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"} ${index === activeIndex ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-950" : ""}`}
            >
              {question.order}
            </button>
          ))}
        </div>
      </Surface>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <ActionLink href={detailHref} variant="outline">Kembali ke Detail</ActionLink>
        <ActionLink href={retryHref} variant="secondary">Kerjakan Lagi</ActionLink>
      </div>
    </aside>
  );
}
