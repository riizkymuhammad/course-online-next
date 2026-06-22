"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type GenerateCourseResponse = {
  courseId: string;
  courseTitle: string;
  learningPath: string;
  status: string;
  sectionCount: number;
  moduleCount: number;
};

type GenerateCourseError = {
  error?: string;
  stage?: string;
};

type GenerationLog = {
  message: string;
  tone: "default" | "success" | "error";
};

type GenerationPhase = "idle" | "validating" | "generating" | "saving" | "success" | "error";

export default function CreateCourseForm({
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
    sectionCount: number;
    moduleCount: number;
  } | null>(null);
  const [generationLogs, setGenerationLogs] = useState<GenerationLog[]>([]);
  const filteredSubCategoryOptions = useMemo(
    () => subCategoryOptions.filter((option) => option.categoryId === selectedCategoryId),
    [selectedCategoryId, subCategoryOptions]
  );
  const hasCategories = categoryOptions.length > 0;
  const hasSubCategoryOptions = filteredSubCategoryOptions.length > 0;

  useEffect(() => {
    if (!startedAt || ["idle", "success", "error"].includes(generationPhase)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [generationPhase, startedAt]);

  useEffect(() => {
    if (generationPhase !== "validating") return;

    const timeoutId = window.setTimeout(() => {
      setGenerationPhase("generating");
      setGenerationLogs((logs) => [
        ...logs,
        { message: "PDF sedang dianalisis untuk menyusun section, modul, dan materi.", tone: "default" },
      ]);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [generationPhase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessSummary(null);
      setGenerationLogs([{ message: "Memulai validasi input dan file PDF.", tone: "default" }]);
      setElapsedSeconds(0);
      setStartedAt(Date.now());
      setGenerationPhase("validating");

      const response = await fetch("/api/course/generate", {
        method: "POST",
        body: formData,
      });
      const responseText = await response.text();
      let payload: GenerateCourseResponse | GenerateCourseError = {};

      try {
        payload = responseText ? (JSON.parse(responseText) as GenerateCourseResponse | GenerateCourseError) : {};
      } catch {
        payload = {
          error: responseText
            ? `Server mengirim respons yang tidak dapat dibaca (HTTP ${response.status}).`
            : `Server tidak mengirim respons (HTTP ${response.status}).`,
        };
      }

      if (!response.ok) {
        const failure = payload as GenerateCourseError;
        const detail = failure.error || `Generate course gagal (HTTP ${response.status}).`;
        throw new Error(failure.stage ? `Tahap ${failure.stage}: ${detail}` : detail);
      }

      const result = payload as GenerateCourseResponse;
      setGenerationPhase("saving");
      setGenerationLogs((logs) => [
        ...logs,
        { message: "Materi berhasil dibuat. Course, section, dan modul sedang disimpan.", tone: "default" },
      ]);
      setSuccessSummary({
        title: result.courseTitle,
        sectionCount: result.sectionCount,
        moduleCount: result.moduleCount,
      });
      setGenerationPhase("success");
      setGenerationLogs((logs) => [
        ...logs,
        { message: "Course beserta section, modul, dan isi materi berhasil disimpan.", tone: "success" },
      ]);

      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      router.push("/dashboard/course-management?created=1");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat course.";
      setErrorMessage(message);
      setGenerationPhase("error");
      setGenerationLogs((logs) => [...logs, { message: `Gagal: ${message}`, tone: "error" }]);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <FormField
              label="Nama Course"
              name="title"
              placeholder="Contoh: Dasar-Dasar Analisis Data dengan SQL"
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
                  label: hasCategories ? "Opsional - pilih kategori" : "Belum ada kategori",
                },
                ...categoryOptions.map((option) => ({ value: option.id, label: option.name })),
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
          </div>

          <div className="space-y-6">
            <SelectField
              label="Status"
              name="status"
              defaultValue="published"
              required
              options={statusOptions}
            />

            <FileField
              label="Upload PDF Materi"
              name="material_file"
              required
              accept="application/pdf"
              hint="PDF digunakan AI untuk menyusun outline section dan modul course."
            />

            <TextAreaField
              label="Catatan Materi"
              name="material_notes"
              placeholder="Opsional. Contoh: fokuskan pada pemula, sertakan latihan di setiap section, dan gunakan contoh kasus penjualan."
              hint="Gunakan kolom ini untuk memberi arahan bagaimana materi perlu disusun oleh AI."
            />
          </div>
        </div>

        {generationPhase !== "idle" ? (
          <GenerationStatusPanel
            phase={generationPhase}
            elapsedSeconds={elapsedSeconds}
            successSummary={successSummary}
            errorMessage={errorMessage}
            logs={generationLogs}
          />
        ) : null}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/course-management"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? getSubmitLabel(generationPhase) : "Generate & Simpan Course"}
          </button>
        </div>
      </form>
    </div>
  );
}

function getSubmitLabel(phase: GenerationPhase) {
  if (phase === "validating") return "Memvalidasi...";
  if (phase === "generating") return "Menyusun materi...";
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
  logs,
}: {
  phase: GenerationPhase;
  elapsedSeconds: number;
  successSummary: { title: string; sectionCount: number; moduleCount: number } | null;
  errorMessage: string | null;
  logs: GenerationLog[];
}) {
  const steps = [
    {
      phase: "validating" as const,
      title: "Validasi input dan PDF",
      description: "Mengecek nama course, kategori, status, dan file materi.",
    },
    {
      phase: "generating" as const,
      title: "Susun materi dengan AI",
      description: "AI membaca PDF lalu membuat section, modul, dan konten pembelajaran.",
    },
    {
      phase: "saving" as const,
      title: "Simpan course",
      description: "Menyimpan course, section, modul, serta isi materi ke database.",
    },
    {
      phase: "success" as const,
      title: "Selesai",
      description: "Course siap dikelola dari halaman Course Management.",
    },
  ];

  const statusLabel =
    phase === "success" ? "Berhasil" : phase === "error" ? "Gagal" : "Sedang proses";
  const statusTone =
    phase === "success"
      ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
      : phase === "error"
        ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
        : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Status generate course
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {phase === "success"
              ? `Course \"${successSummary?.title ?? "course"}\" berhasil dibuat dengan ${successSummary?.sectionCount ?? 0} section dan ${successSummary?.moduleCount ?? 0} modul.`
              : phase === "error"
                ? errorMessage || "Generate course gagal. Silakan cek pesan error."
                : `Proses berjalan ${elapsedSeconds} detik. Jangan tutup halaman ini.`}
          </p>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
          {statusLabel}
        </span>
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

      {logs.length ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Log proses</p>
          <ul className="mt-2 space-y-1.5">
            {logs.map((log, index) => {
              const tone =
                log.tone === "success"
                  ? "text-success-700 dark:text-success-400"
                  : log.tone === "error"
                    ? "text-error-700 dark:text-error-400"
                    : "text-gray-600 dark:text-gray-300";

              return (
                <li key={`${log.message}-${index}`} className={`text-xs leading-5 ${tone}`}>
                  {log.message}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
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
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</p>
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
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <LabelText htmlFor={name} label={label} required={required} />
      <input
        id={name}
        name={name}
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
  options: Option[];
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
