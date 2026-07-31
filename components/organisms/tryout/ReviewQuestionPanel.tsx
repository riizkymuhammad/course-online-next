import ActionLink from "@/components/atoms/ActionLink";
import Button from "@/components/atoms/Button";
import Surface from "@/components/atoms/Surface";
import QuestionResultAlert from "@/components/molecules/tryout/QuestionResultAlert";
import ReviewAnswerOption from "@/components/molecules/tryout/ReviewAnswerOption";
import type { TryoutReviewQuestion } from "@/components/tryout/tryout-result-review.types";

type ReviewQuestionPanelProps = {
  tryoutTitle: string;
  question: TryoutReviewQuestion;
  activeIndex: number;
  totalQuestions: number;
  detailHref: string;
  onPrevious: () => void;
  onNext: () => void;
};

function getOptionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export default function ReviewQuestionPanel({
  tryoutTitle,
  question,
  activeIndex,
  totalQuestions,
  detailHref,
  onPrevious,
  onNext,
}: ReviewQuestionPanelProps) {
  const isLastQuestion = activeIndex === totalQuestions - 1;

  return (
    <Surface>
      <header className="flex flex-col gap-3 border-b border-gray-100 pb-5 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-[16px]">
            {tryoutTitle}
          </h1>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:pt-1">
          Soal {question.order} dari {totalQuestions}
        </p>
      </header>

      <div className="mt-5">
        <QuestionResultAlert isCorrect={question.isCorrect} />
      </div>

      <div className="mt-4 rounded-2xl bg-gray-50 px-5 py-3.5 dark:bg-white/[0.03] sm:px-6">
        <p className="text-base leading-7 text-gray-800 dark:text-white/90 sm:text-lg">{question.question}</p>
      </div>

      <div className="mt-4 space-y-2.5">
        {question.options.map((option, optionIndex) => (
          <ReviewAnswerOption
            key={option.id}
            label={getOptionLabel(optionIndex)}
            text={option.text}
            isSelected={question.selectedOptionId === option.id}
            isCorrectOption={question.correctOptionId === option.id}
          />
        ))}
      </div>

      <footer className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onPrevious} disabled={activeIndex === 0}>
          Soal Sebelumnya
        </Button>
        {isLastQuestion ? (
          <ActionLink href={detailHref}>Selesai</ActionLink>
        ) : (
          <Button type="button" onClick={onNext}>
            Soal Berikutnya
          </Button>
        )}
      </footer>
    </Surface>
  );
}
