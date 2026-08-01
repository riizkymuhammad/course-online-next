"use client";

import { useMemo, useState } from "react";
import { updateCourse } from "@/app/(admin)/dashboard/course-management/[id]/edit/actions";
import ActionLink from "@/components/atoms/ActionLink";
import SubmitButton from "@/components/atoms/SubmitButton";
import InfoField from "@/components/molecules/InfoField";
import { SelectField, TextAreaField, TextField as FormField } from "@/components/molecules/form";

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
          <ActionLink href="/dashboard/course-management" variant="outline">
            Cancel
          </ActionLink>
          <SubmitButton pendingLabel="Memperbarui Course...">
            Update Course
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
