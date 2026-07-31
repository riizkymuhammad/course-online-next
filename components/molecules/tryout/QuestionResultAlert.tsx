import ResultStatusIcon from "@/components/atoms/tryout/ResultStatusIcon";

export default function QuestionResultAlert({ isCorrect }: { isCorrect: boolean }) {
  const toneClass = isCorrect
    ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
    : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400";

  return (
    <div role="status" className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${toneClass}`}>
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-current/10">
        <ResultStatusIcon isCorrect={isCorrect} />
      </span>
      <p className="text-sm font-semibold">
        {isCorrect ? "Jawaban Anda benar" : "Jawaban Anda salah"}
      </p>
    </div>
  );
}
