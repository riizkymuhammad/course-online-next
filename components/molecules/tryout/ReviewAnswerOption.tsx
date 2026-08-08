import ResultTag from "@/components/atoms/tryout/ResultTag";

type ReviewAnswerOptionProps = {
  text: string;
  isSelected: boolean;
  isCorrectOption: boolean;
};

export default function ReviewAnswerOption({
  text,
  isSelected,
  isCorrectOption,
}: ReviewAnswerOptionProps) {
  const isWrongSelection = isSelected && !isCorrectOption;
  const optionClass = isCorrectOption
    ? "border-success-300 bg-success-50 dark:border-success-500/40 dark:bg-success-500/10"
    : isWrongSelection
      ? "border-error-300 bg-error-50 dark:border-error-500/40 dark:bg-error-500/10"
      : "border-gray-200 bg-white dark:border-gray-800 dark:bg-transparent";
  return (
    <div className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-2 text-left sm:px-5 ${optionClass}`}>
      <span className="min-w-0 flex-1 pt-0.5 text-sm leading-6 text-gray-700 dark:text-gray-300 sm:text-base">
        {text}
      </span>
      <div className="ml-auto flex shrink-0 flex-col items-end gap-1 pt-0.5">
        {isSelected ? (
          <ResultTag tone={isCorrectOption ? "success" : "error"}>Pilihan Anda</ResultTag>
        ) : null}
        {isCorrectOption ? <ResultTag tone="success">Jawaban benar</ResultTag> : null}
      </div>
    </div>
  );
}
