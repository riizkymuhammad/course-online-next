export type TryoutReviewOption = {
  id: string;
  text: string;
};

export type TryoutReviewQuestion = {
  id: string;
  order: number;
  question: string;
  options: TryoutReviewOption[];
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
};
