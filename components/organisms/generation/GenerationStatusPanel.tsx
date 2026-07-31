import { cn } from "@/lib/cn";

export type GenerationPhase = "idle" | "validating" | "generating" | "saving" | "success" | "error";
export type GenerationStep = {
  phase: Exclude<GenerationPhase, "idle" | "error">;
  title: string;
  description: string;
};
export type GenerationLog = {
  message: string;
  tone: "default" | "success" | "error";
};

const phaseOrder: GenerationPhase[] = ["validating", "generating", "saving", "success"];

function getStepStatus(step: GenerationPhase, current: GenerationPhase) {
  if (current === "error") return "error";
  const stepIndex = phaseOrder.indexOf(step);
  const currentIndex = phaseOrder.indexOf(current);
  if (currentIndex > stepIndex) return "done";
  if (current === step) return "active";
  return "pending";
}

function ProcessStep({ title, description, status }: { title: string; description: string; status: "pending" | "active" | "done" | "error" }) {
  const markerClass = {
    done: "bg-success-500 text-white",
    active: "bg-brand-500 text-white",
    error: "bg-error-500 text-white",
    pending: "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  }[status];
  const cardClass = status === "active"
    ? "border-brand-200 bg-white dark:border-brand-500/30 dark:bg-brand-500/10"
    : status === "done"
      ? "border-success-200 bg-white dark:border-success-500/30 dark:bg-success-500/10"
      : status === "error"
        ? "border-error-200 bg-white dark:border-error-500/30 dark:bg-error-500/10"
        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]";

  return (
    <div className={cn("rounded-xl border p-3", cardClass)}>
      <div className="flex items-start gap-3">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", markerClass)}>
          {status === "done" ? "OK" : status === "error" ? "!" : status === "active" ? "..." : ""}
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function GenerationStatusPanel({ title, phase, summary, steps, logs = [] }: { title: string; phase: GenerationPhase; summary: string; steps: GenerationStep[]; logs?: GenerationLog[] }) {
  const statusLabel = phase === "success" ? "Berhasil" : phase === "error" ? "Gagal" : "Sedang proses";
  const statusTone = phase === "success"
    ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
    : phase === "error"
      ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
      : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{summary}</p>
        </div>
        <span className={cn("inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold", statusTone)}>{statusLabel}</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {steps.map((step) => <ProcessStep key={step.phase} title={step.title} description={step.description} status={getStepStatus(step.phase, phase)} />)}
      </div>

      {logs.length ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Log proses</p>
          <ul className="mt-2 space-y-1.5">
            {logs.map((log, index) => (
              <li key={`${log.message}-${index}`} className={cn("text-xs leading-5", log.tone === "success" ? "text-success-700 dark:text-success-400" : log.tone === "error" ? "text-error-700 dark:text-error-400" : "text-gray-600 dark:text-gray-300")}>{log.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
