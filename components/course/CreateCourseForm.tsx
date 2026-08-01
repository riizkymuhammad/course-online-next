"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ActionLink from "@/components/atoms/ActionLink";
import Button from "@/components/atoms/Button";
import { FileField, SelectField, TextAreaField, TextField as FormField } from "@/components/molecules/form";
import GenerationStatusPanel, { type GenerationLog, type GenerationPhase, type GenerationStep } from "@/components/organisms/generation/GenerationStatusPanel";

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

const courseGenerationSteps: GenerationStep[] = [
  { phase: "validating", title: "Validasi input dan PDF", description: "Mengecek nama course, kategori, status, dan file materi." },
  { phase: "generating", title: "Susun materi dengan AI", description: "AI menyusun section, modul, dan poin penting dari PDF." },
  { phase: "saving", title: "Simpan course", description: "Menyimpan course, section, modul, serta isi materi ke database." },
  { phase: "success", title: "Selesai", description: "Course siap dikelola dari halaman Course Management." },
];

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
  const isSubmittingRef = useRef(false);
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
        {
          message:
            "PDF sedang dibaca untuk menyusun section, modul, dan poin penting yang scannable.",
          tone: "default",
        },
      ]);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [generationPhase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
      isSubmittingRef.current = false;
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
              hint="PDF akan dibaca AI untuk menyusun section, modul, dan materi poin-poin yang mudah dipindai."
            />

            <TextAreaField
              label="Catatan Materi"
              name="material_notes"
              placeholder="Opsional. Contoh: fokuskan ke konsep utama, tebalkan istilah teknis, pakai contoh nyata, dan hindari dinding teks."
              hint="Gunakan kolom ini untuk mengatur fokus materi, istilah penting, contoh praktis, dan tingkat keringkasan."
            />
          </div>
        </div>

        {generationPhase !== "idle" ? (
          <GenerationStatusPanel
            title="Status generate course"
            phase={generationPhase}
            summary={generationPhase === "success"
              ? `Course "${successSummary?.title ?? "course"}" berhasil dibuat dengan ${successSummary?.sectionCount ?? 0} section dan ${successSummary?.moduleCount ?? 0} modul.`
              : generationPhase === "error"
                ? errorMessage || "Generate course gagal. Silakan cek pesan error."
                : `Proses berjalan ${elapsedSeconds} detik. Jangan tutup halaman ini.`}
            steps={courseGenerationSteps}
            logs={generationLogs}
          />
        ) : null}

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <ActionLink href="/dashboard/course-management" variant="outline">
            Cancel
          </ActionLink>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? getSubmitLabel(generationPhase) : "Generate & Simpan Course"}
          </Button>
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
