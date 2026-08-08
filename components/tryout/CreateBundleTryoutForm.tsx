"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import ActionLink from "@/components/atoms/ActionLink";
import Button from "@/components/atoms/Button";
import {
  SelectField,
  TextAreaField,
  TextField as FormField,
} from "@/components/molecules/form";
import InlineAlert from "@/components/molecules/InlineAlert";

type Option = { value: string; label: string };
type CategoryOption = { id: string; name: string };
type SubCategoryOption = { id: string; categoryId: string; name: string };

type BundleResponse = {
  runId: string;
  titlePrefix: string;
  startChapter: number;
  endChapter: number;
  expectedTryoutCount: number;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreateBundleTryoutForm({
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startChapter, setStartChapter] = useState("1");
  const [endChapter, setEndChapter] = useState("1");

  const filteredSubCategories = useMemo(
    () =>
      subCategoryOptions.filter(
        (option) => option.categoryId === selectedCategoryId
      ),
    [selectedCategoryId, subCategoryOptions]
  );
  const expectedTryoutCount = Math.max(
    0,
    Number(endChapter) - Number(startChapter) + 1
  );

  function acceptFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMessage("File materi harus berupa PDF.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("Ukuran PDF maksimal 50 MB.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!selectedFile) {
      setErrorMessage("Pilih atau drop file PDF materi terlebih dahulu.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("material_file", selectedFile);

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await fetch("/api/tryout/generate-bundle", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as BundleResponse | { error?: string };

      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Gagal membuat bundle tryout."
        );
      }

      const result = payload as BundleResponse;
      router.push(
        `/dashboard/tryout-management?bundleQueued=1&count=${result.expectedTryoutCount}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal membuat bundle tryout."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <FormField
            label="Judul Awal Tryout"
            name="title"
            placeholder="Contoh: [IT Enterprise]"
            hint="Judul bab dari PDF akan ditambahkan setelah teks ini."
            required
          />

          <SelectField
            label="Learning Path"
            name="learning_path"
            defaultValue=""
            options={[
              { value: "", label: "Opsional - pilih learning path" },
              ...learningPathOptions,
            ]}
          />

          <SelectField
            label="Kategori"
            name="category_id"
            value={selectedCategoryId}
            options={[
              { value: "", label: "Opsional - pilih kategori" },
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
            disabled={!selectedCategoryId || !filteredSubCategories.length}
            options={[
              {
                value: "",
                label: !selectedCategoryId
                  ? "Pilih kategori terlebih dahulu"
                  : filteredSubCategories.length
                    ? "Opsional - pilih sub kategori"
                    : "Belum ada sub kategori",
              },
              ...filteredSubCategories.map((option) => ({
                value: option.id,
                label: option.name,
              })),
            ]}
            onChange={setSelectedSubCategoryId}
          />

          <FormField
            label="Jumlah Soal per Bab"
            name="question_count"
            type="number"
            min={1}
            placeholder="Contoh: 20"
            required
          />

          <FormField
            label="Durasi per Tryout (menit)"
            name="duration_minutes"
            type="number"
            min={1}
            max={1440}
            defaultValue="60"
            required
          />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Dari Bab"
              name="start_chapter"
              type="number"
              min={1}
              value={startChapter}
              onChange={(event) => setStartChapter(event.target.value)}
              required
            />
            <FormField
              label="Sampai Bab"
              name="end_chapter"
              type="number"
              min={1}
              value={endChapter}
              onChange={(event) => setEndChapter(event.target.value)}
              required
            />
          </div>

          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {expectedTryoutCount > 0
              ? `${expectedTryoutCount} tryout akan dibuat, satu tryout untuk setiap bab.`
              : "Bab akhir harus sama dengan atau lebih besar dari bab awal."}
          </p>

          <SelectField
            label="Status"
            name="status"
            defaultValue="draft"
            required
            options={statusOptions}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Materi <span className="text-error-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                acceptFile(event.dataTransfer.files[0]);
              }}
              className={`flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 text-center transition ${
                isDragging
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-gray-300 bg-gray-50 hover:border-brand-400 dark:border-gray-700 dark:bg-white/[0.03]"
              }`}
            >
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {selectedFile ? selectedFile.name : "Drop PDF di sini atau klik untuk memilih"}
              </span>
              <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} · Klik untuk mengganti file`
                  : "PDF maksimal 50 MB"}
              </span>
            </button>
          </div>

          <TextAreaField
            label="Catatan Soal"
            name="question_notes"
            placeholder="Opsional. Contoh: utamakan soal analisis dan studi kasus."
            hint="Catatan diterapkan pada seluruh tryout hasil ekstraksi bab."
          />
        </div>
      </div>

      {errorMessage ? <InlineAlert tone="error">{errorMessage}</InlineAlert> : null}

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:justify-end">
        <ActionLink href="/dashboard/tryout-management" variant="outline">
          Cancel
        </ActionLink>
        <Button type="submit" disabled={isSubmitting || expectedTryoutCount < 1}>
          {isSubmitting ? "Mengunggah dan memasukkan antrean..." : "Generate Bundle Tryout"}
        </Button>
      </div>
    </form>
  );
}
