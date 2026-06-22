"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { updateCourse } from "@/app/(admin)/dashboard/course-management/[id]/edit/actions";

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

type EditCourseValues = {
  id: string;
  title: string;
  learningPathId: string;
  categoryId: string;
  subCategoryId: string;
  description: string;
  status: string;
  materialFileName: string | null;
};

export default function EditCourseForm({
  values,
  learningPathOptions,
  categoryOptions,
  subCategoryOptions,
  statusOptions,
}: {
  values: EditCourseValues;
  learningPathOptions: Option[];
  categoryOptions: CategoryOption[];
  subCategoryOptions: SubCategoryOption[];
  statusOptions: Option[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(values.categoryId);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(values.subCategoryId);
  const filteredSubCategoryOptions = useMemo(
    () => subCategoryOptions.filter((option) => option.categoryId === selectedCategoryId),
    [selectedCategoryId, subCategoryOptions]
  );
  const hasCategories = categoryOptions.length > 0;
  const hasSubCategoryOptions = filteredSubCategoryOptions.length > 0;

  return (
    <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
      <form action={updateCourse} className="space-y-6">
        <input type="hidden" name="course_id" value={values.id} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <FormField
              label="Nama Course"
              name="title"
              placeholder="Contoh: Dasar-Dasar Analisis Data dengan SQL"
              required
              defaultValue={values.title}
            />

            <SelectField
              label="Learning Path"
              name="learning_path"
              defaultValue={values.learningPathId}
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
              defaultValue={values.status}
              required
              options={statusOptions}
            />

            <TextAreaField
              label="Deskripsi Course"
              name="description"
              placeholder="Ringkasan singkat course untuk siswa."
              defaultValue={values.description}
            />

            <InfoField
              label="File PDF Aktif"
              value={values.materialFileName || "Belum ada file materi"}
              hint="Untuk mengganti PDF atau menghasilkan ulang materi, buat course baru melalui form generate."
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/course-management"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Update Course
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
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <LabelText htmlFor={name} label={label} required={required} />
      <input
        id={name}
        name={name}
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
}: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
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

function InfoField({ label, value, hint }: { label: string; value: string; hint?: string }) {
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
