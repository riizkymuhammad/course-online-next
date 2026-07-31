type ResultTagProps = {
  children: React.ReactNode;
  tone: "success" | "error";
};

const toneClasses = {
  success: "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400",
  error: "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400",
};

export default function ResultTag({ children, tone }: ResultTagProps) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
