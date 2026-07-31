type ResultScoreCardProps = {
  score: number;
  correctCount: number;
  wrongCount: number;
};

export default function ResultScoreCard({ score, correctCount, wrongCount }: ResultScoreCardProps) {
  return (
    <Surface>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nilai Akhir</p>
      <p className="mt-1 text-4xl font-semibold text-gray-800 dark:text-white/90">{score.toFixed(2)}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-success-50 p-3 text-success-700 dark:bg-success-500/10 dark:text-success-400">
          <span className="block text-xs">Benar</span>
          <strong className="text-lg">{correctCount}</strong>
        </div>
        <div className="rounded-xl bg-error-50 p-3 text-error-700 dark:bg-error-500/10 dark:text-error-400">
          <span className="block text-xs">Salah</span>
          <strong className="text-lg">{wrongCount}</strong>
        </div>
      </div>
    </Surface>
  );
}
import Surface from "@/components/atoms/Surface";
