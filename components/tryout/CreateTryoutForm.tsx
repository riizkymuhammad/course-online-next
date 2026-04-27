"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = {
  value: string;
  label: string;
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
  notes?: string;
  questions: GeneratedQuestion[];
};

export default function CreateTryoutForm({
  learningPathOptions,
  statusOptions,
}: {
  learningPathOptions: Option[];
  statusOptions: Option[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

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

      router.push("/dashboard/tryout-management?created=1");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan saat membuat tryout."
      );
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
              required
              options={[{ value: "", label: "Pilih learning path" }, ...learningPathOptions]}
            />

            <FormField
              label="Jumlah Soal"
              name="question_count"
              placeholder="Contoh: 50"
              required
              type="number"
              min={1}
            />

            <TextAreaField
              label="Catatan Soal"
              name="question_notes"
              placeholder="Opsional. Contoh: buat 10 soal pilihan ganda level menengah dengan fokus pada join dan aggregation."
              hint="Catatan soal ini opsional. Jika kosong, sistem akan membuat soal pilihan ganda standar tanpa syarat tambahan."
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
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {errorMessage}
          </div>
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
            {isSubmitting ? "Generating Questions..." : "Save Tryout"}
          </button>
        </div>
      </form>
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
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <LabelText htmlFor={name} label={label} required={required} />
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
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
