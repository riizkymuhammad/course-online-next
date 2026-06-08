"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type SubCategoryOption = {
  id: string;
  categoryId: string;
  name: string;
};

type GeneratedQuestion = {
  number: number;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type GenerateTryoutResponse = {
  tryoutId?: string;
  tryoutTitle: string;
  learningPath: string;
  status: string;
  questionCount: number;
  savedQuestionCount?: number;
  notes?: string;
  questions: GeneratedQuestion[];
};

type GenerationPhase = "idle" | "validating" | "generating" | "saving" | "success" | "error";

export default function CreateTryoutForm({
  learningPathOptions,
  categoryOptions,
  subCategoryOptions,
  statusOptions,
}: {
  learningPathOptions: Option[];
  categoryOptions: CategoryOption[];
  subCategoryOptions: SubCategoryOption[];
  statusOptions: Option[];
}) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [successSummary, setSuccessSummary] = useState<{
    title: string;
    questionCount: number;
  } | null>(null);
  const filteredSubCategoryOptions = useMemo(() => {
    if (!selectedCategoryId) return [];

    return subCategoryOptions.filter(
      (option) => option.categoryId === selectedCategoryId
    );
  }, [selectedCategoryId, subCategoryOptions]);
  const hasCategories = categoryOptions.length > 0;
  const hasSubCategoryOptions = filteredSubCategoryOptions.length > 0;

  useEffect(() => {
    if (!startedAt || generationPhase === "idle" || generationPhase === "success" || generationPhase === "error") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [generationPhase, startedAt]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessSummary(null);
      setElapsedSeconds(0);
      setStartedAt(Date.now());
      setGenerationPhase("validating");

      window.setTimeout(() => {
        setGenerationPhase((current) => (current === "validating" ? "generating" : current));
      }, 600);

      const response = await fetch("/api/tryout/generate", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | GenerateTryoutResponse
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in payload ? payload.error : "Gagal meng-generate soal tryout.";
        throw new Error(message || "Gagal meng-generate soal tryout.");
      }

      const resultPayload = payload as GenerateTryoutResponse;

      setGenerationPhase("saving");

      const savedQuestionCount =
        typeof resultPayload.savedQuestionCount === "number"
          ? resultPayload.savedQuestionCount
          : resultPayload.questions.length
            ? resultPayload.questions.length
            : resultPayload.questionCount;

      setSuccessSummary({
        title: resultPayload.tryoutTitle,
        questionCount: savedQuestionCount,
      });
      setGenerationPhase("success");

      await new Promise((resolve) => window.setTimeout(resolve, 1200));

      router.push(
        `/dashboard/tryout-management?created=1&questions=${savedQuestionCount}`
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan saat membuat tryout.";
      setErrorMessage(message);
      setGenerationPhase("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <FormField
              label="Judul Tryout"
              name="title"
              placeholder="Contoh: SQL Analyst Final Tryout"
              required
            />

            <SelectField
              label="Learning Path"
              name="learning_path"
              defaultValue=""
              options={[{ value: "", label: "Opsional - pilih learning path" }, ...learningPathOptions]}
            />

            <SelectField
              label="Kategori"
              name="category_id"
              value={selectedCategoryId}
              defaultValue=""
              disabled={!hasCategories}
              options={[
                {
                  value: "",
                  label: hasCategories
                    ? "Opsional - pilih kategori"
                    : "Belum ada kategori",
                },
                ...categoryOptions.map((option) => ({
                  value: option.id,
                  label: option.name,
                })),
              ]}
              onChange={(value) => {
                setSelectedCategoryId(value);
                setSelectedSubCategoryId("");
              }}
            />

            <SelectField
              label="Sub Kategori"
              name="sub_category_id"
              value={selectedSubCategoryId}
              defaultValue=""
              disabled={!selectedCategoryId || !hasSubCategoryOptions}
              options={[
                {
                  value: "",
                  label: !selectedCategoryId
                    ? "Pilih kategori terlebih dahulu"
                    : hasSubCategoryOptions
                      ? "Opsional - pilih sub kategori"
                      : "Belum ada sub kategori",
                },
                ...filteredSubCategoryOptions.map((option) => ({
                  value: option.id,
                  label: option.name,
                })),
              ]}
              onChange={setSelectedSubCategoryId}
            />

            <FormField
              label="Jumlah Soal"
              name="question_count"
              placeholder="Contoh: 50"
              required
              type="number"
              min={1}
            />
          </div>

          <div className="space-y-6">
            <SelectField
              label="Status"
              name="status"
              defaultValue="draft"
              required
              options={statusOptions}
            />

            <FileField
              label="Upload Materi"
              name="material_file"
              required
              accept="application/pdf"
              hint="Upload file PDF materi tryout. File ini akan dipakai AI untuk membuat soal."
            />

            <TextAreaField
              label="Catatan Soal"
              name="question_notes"
              placeholder="Opsional. Contoh: buat 10 soal pilihan ganda level menengah dengan fokus pada join dan aggregation."
              hint="Catatan soal ini opsional. Jika kosong, sistem akan membuat soal pilihan ganda standar tanpa syarat tambahan."
            />
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {errorMessage}
          </div>
        ) : null}

        {generationPhase !== "idle" ? (
          <GenerationStatusPanel
            phase={generationPhase}
            elapsedSeconds={elapsedSeconds}
            successSummary={successSummary}
            errorMessage={errorMessage}
          />
        ) : null}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/tryout-management"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? getSubmitLabel(generationPhase) : "Save Tryout"}
          </button>
        </div>
      </form>
    </div>
  );
}

function getSubmitLabel(phase: GenerationPhase) {
  if (phase === "validating") return "Memvalidasi...";
  if (phase === "generating") return "Generate soal...";
  if (phase === "saving") return "Menyimpan...";
  if (phase === "success") return "Berhasil";
  return "Memproses...";
}

function getStepStatus(step: GenerationPhase, current: GenerationPhase) {
  const order: GenerationPhase[] = ["validating", "generating", "saving", "success"];
  const stepIndex = order.indexOf(step);
  const currentIndex = order.indexOf(current);

  if (current === "error") return "error";
  if (currentIndex > stepIndex) return "done";
  if (current === step) return "active";
  return "pending";
}

function GenerationStatusPanel({
  phase,
  elapsedSeconds,
  successSummary,
  errorMessage,
}: {
  phase: GenerationPhase;
  elapsedSeconds: number;
  successSummary: { title: string; questionCount: number } | null;
  errorMessage: string | null;
}) {
  const steps = [
    {
      phase: "validating" as const,
      title: "Validasi input dan file PDF",
      description: "Mengecek judul, learning path/kategori, jumlah soal, status, dan file materi.",
    },
    {
      phase: "generating" as const,
      title: "Generate soal dengan AI",
      description: "AI membaca materi PDF dan menyusun soal sesuai jumlah yang diminta.",
    },
    {
      phase: "saving" as const,
      title: "Simpan tryout dan thumbnail",
      description: "Menyimpan data tryout, soal, opsi jawaban, dan thumbnail ke Supabase.",
    },
    {
      phase: "success" as const,
      title: "Selesai",
      description: "Tryout sudah siap dicek di halaman Tryout Management.",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Status generate tryout
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {phase === "success"
              ? `${successSummary?.questionCount ?? 0} soal "${successSummary?.title ?? "tryout"}" berhasil disimpan. Anda akan diarahkan ke daftar tryout.`
              : phase === "error"
                ? errorMessage || "Generate tryout gagal. Silakan cek pesan error."
                : `Proses berjalan ${elapsedSeconds} detik. Jangan tutup halaman ini.`}
          </p>
        </div>
        <StatusPill phase={phase} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {steps.map((step) => (
          <ProcessStep
            key={step.phase}
            title={step.title}
            description={step.description}
            status={getStepStatus(step.phase, phase)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusPill({ phase }: { phase: GenerationPhase }) {
  const label =
    phase === "success" ? "Berhasil" : phase === "error" ? "Gagal" : "Sedang proses";
  const tone =
    phase === "success"
      ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
      : phase === "error"
        ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
        : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400";

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function ProcessStep({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: "pending" | "active" | "done" | "error";
}) {
  const markerClass =
    status === "done"
      ? "bg-success-500 text-white"
      : status === "active"
        ? "bg-brand-500 text-white"
        : status === "error"
          ? "bg-error-500 text-white"
          : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  const cardClass =
    status === "active"
      ? "border-brand-200 bg-white dark:border-brand-500/30 dark:bg-brand-500/10"
      : status === "done"
        ? "border-success-200 bg-white dark:border-success-500/30 dark:bg-success-500/10"
        : status === "error"
          ? "border-error-200 bg-white dark:border-error-500/30 dark:bg-error-500/10"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]";

  return (
    <div className={`rounded-xl border p-3 ${cardClass}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${markerClass}`}
        >
          {status === "done" ? "OK" : status === "error" ? "!" : status === "active" ? "..." : ""}
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
  min,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "number";
  min?: number;
}) {
  return (
    <div className="space-y-2">
      <LabelText htmlFor={name} label={label} required={required} />
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
    </div>
  );
}

function FileField({
  label,
  name,
  required = false,
  accept,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  accept?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <LabelText htmlFor={name} label={label} required={required} />
      <input
        id={name}
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="block w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-800 file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-600 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:file:bg-white/10 dark:file:text-white"
      />
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <LabelText htmlFor={name} label={label} />
      <textarea
        id={name}
        name={name}
        rows={7}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  required = false,
  options,
  disabled = false,
  value,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <LabelText htmlFor={name} label={label} required={required} />
      <select
        id={name}
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        required={required}
        disabled={disabled}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:disabled:bg-white/[0.02] dark:disabled:text-gray-500"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LabelText({
  htmlFor,
  label,
  required = false,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
      {required ? <span className="ml-1 text-error-500">*</span> : null}
    </label>
  );
}
