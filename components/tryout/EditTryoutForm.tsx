import Link from "next/link";
import { updateTryout } from "@/app/(admin)/dashboard/tryout-management/[id]/edit/actions";

type Option = {
  value: string;
  label: string;
};

type EditTryoutValues = {
  id: string;
  title: string;
  learningPathId: string;
  questionCount: number;
  questionNotes: string;
  status: string;
  materialFileName: string | null;
};

export default function EditTryoutForm({
  values,
  learningPathOptions,
  statusOptions,
}: {
  values: EditTryoutValues;
  learningPathOptions: Option[];
  statusOptions: Option[];
}) {
  return (
    <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
      <form action={updateTryout} className="space-y-6">
        <input type="hidden" name="tryout_id" value={values.id} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <FormField
              label="Judul Tryout"
              name="title"
              placeholder="Contoh: SQL Analyst Final Tryout"
              required
              defaultValue={values.title}
            />

            <SelectField
              label="Learning Path"
              name="learning_path"
              defaultValue={values.learningPathId}
              required
              options={learningPathOptions}
            />

            <FormField
              label="Jumlah Soal"
              name="question_count"
              placeholder="Contoh: 50"
              required
              type="number"
              min={1}
              defaultValue={String(values.questionCount)}
            />

            <TextAreaField
              label="Catatan Soal"
              name="question_notes"
              placeholder="Tambahkan catatan tryout bila diperlukan."
              defaultValue={values.questionNotes}
              hint="Catatan ini hanya memperbarui metadata tryout dan tidak akan meng-generate ulang soal."
            />
          </div>

          <div className="space-y-6">
            <SelectField
              label="Status"
              name="status"
              defaultValue={values.status}
              required
              options={statusOptions}
            />

            <InfoField
              label="File Materi Aktif"
              value={values.materialFileName || "Belum ada file materi"}
              hint="Untuk versi edit ini, file materi ditampilkan sebagai referensi dan belum diganti dari form edit."
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/tryout-management"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Update Tryout
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
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "number";
  min?: number;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
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

function InfoField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
        {value}
      </div>
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
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
