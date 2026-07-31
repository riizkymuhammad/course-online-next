type ResultStatusIconProps = {
  isCorrect: boolean;
  className?: string;
};

export default function ResultStatusIcon({
  isCorrect,
  className = "h-4 w-4",
}: ResultStatusIconProps) {
  return isCorrect ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="m4.5 10.5 3.25 3.25 7.75-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
