"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ActionLink from "@/components/atoms/ActionLink";
import Button from "@/components/atoms/Button";
import { FileField, SelectField, TextAreaField, TextField as FormField } from "@/components/molecules/form";
import InlineAlert from "@/components/molecules/InlineAlert";
import GenerationStatusPanel, { type GenerationPhase, type GenerationStep } from "@/components/organisms/generation/GenerationStatusPanel";

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

const tryoutGenerationSteps: GenerationStep[] = [
  { phase: "validating", title: "Validasi input dan file PDF", description: "Mengecek judul, learning path/kategori, jumlah soal, status, dan file materi." },
  { phase: "generating", title: "Generate soal dengan AI", description: "AI membaca materi PDF dan menyusun soal sesuai jumlah yang diminta." },
  { phase: "saving", title: "Simpan tryout dan thumbnail", description: "Menyimpan data tryout, soal, opsi jawaban, dan thumbnail ke Supabase." },
  { phase: "success", title: "Selesai", description: "Tryout sudah siap dicek di halaman Tryout Management." },
];

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
          <InlineAlert tone="error">{errorMessage}</InlineAlert>
        ) : null}

        {generationPhase !== "idle" ? (
          <GenerationStatusPanel
            title="Status generate tryout"
            phase={generationPhase}
            summary={generationPhase === "success"
              ? `${successSummary?.questionCount ?? 0} soal "${successSummary?.title ?? "tryout"}" berhasil disimpan. Anda akan diarahkan ke daftar tryout.`
              : generationPhase === "error"
                ? errorMessage || "Generate tryout gagal. Silakan cek pesan error."
                : `Proses berjalan ${elapsedSeconds} detik. Jangan tutup halaman ini.`}
            steps={tryoutGenerationSteps}
          />
        ) : null}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <ActionLink href="/dashboard/tryout-management" variant="outline">
            Cancel
          </ActionLink>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? getSubmitLabel(generationPhase) : "Save Tryout"}
          </Button>
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
