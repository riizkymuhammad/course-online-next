"use client";

import { useMemo, useState } from "react";
import { updateTryout } from "@/app/(admin)/dashboard/tryout-management/[id]/edit/actions";
import ActionLink from "@/components/atoms/ActionLink";
import Button from "@/components/atoms/Button";
import InfoField from "@/components/molecules/InfoField";
import { SelectField, TextAreaField, TextField as FormField } from "@/components/molecules/form";

type Option = {
  value: string;
  label: string;
};

type EditTryoutValues = {
  id: string;
  title: string;
  learningPathId: string;
  categoryId: string;
  subCategoryId: string;
  questionCount: number;
  questionNotes: string;
  status: string;
  materialFileName: string | null;
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

export default function EditTryoutForm({
  values,
  learningPathOptions,
  categoryOptions,
  subCategoryOptions,
  statusOptions,
}: {
  values: EditTryoutValues;
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
          <ActionLink href="/dashboard/tryout-management" variant="outline">
            Cancel
          </ActionLink>
          <Button type="submit">
            Update Tryout
          </Button>
        </div>
      </form>
    </div>
  );
}
