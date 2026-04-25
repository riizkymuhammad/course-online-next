"use client";

import Link from "next/link";
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
  learningPathOptions: string[];
  statusOptions: Option[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateTryoutResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setResult(null);

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

      setResult(payload as GenerateTryoutResponse);
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
              options={[
                { value: "", label: "Pilih learning path" },
                ...learningPathOptions.map((item) => ({ value: item, label: item })),
              ]}
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

      {result ? (
        <section className="rounded-2xl border border-success-200 bg-success-50/60 p-5 dark:border-success-500/20 dark:bg-success-500/10 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Generated Questions
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {result.tryoutTitle} - {result.learningPath}
              </p>
            </div>
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-success-700 shadow-theme-xs dark:bg-white/10 dark:text-success-400">
              {result.questionCount} Soal
            </span>
          </div>

          {result.notes ? (
            <p className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
              Catatan soal: {result.notes}
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
            {result.questions.map((question) => (
              <article
                key={`${question.number}-${question.question}`}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    Soal {question.number}
                  </span>
                  <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    {question.type}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium text-gray-800 dark:text-white/90">
                  {question.question}
                </p>

                {question.options.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {question.options.map((option, index) => (
                      <li key={`${question.number}-option-${index}`} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                        {String.fromCharCode(65 + index)}. {option}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm dark:bg-white/[0.03]">
                    <p className="font-medium text-gray-800 dark:text-white/90">Jawaban</p>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">{question.answer}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm dark:bg-white/[0.03]">
                    <p className="font-medium text-gray-800 dark:text-white/90">Penjelasan</p>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">{question.explanation}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
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
