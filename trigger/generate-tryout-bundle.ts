import { google } from "@ai-sdk/google";
import { metadata, task } from "@trigger.dev/sdk";
import { generateText, Output } from "ai";
import { z } from "zod";
import { GEMINI_GENERATION_MODEL } from "@/lib/gemini-limits";
import { buildLearningPathLabel } from "@/lib/learning-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCategoryPath, normalizeTitleCase } from "@/lib/text";
import { TRYOUT_MATERIAL_BUCKET } from "@/lib/tryout-material";
import { HARD_TRYOUT_QUESTION_INSTRUCTIONS } from "@/lib/tryout-question-quality";
import {
  TRYOUT_THUMBNAIL_BUCKET,
  uploadTryoutThumbnail,
} from "@/lib/tryout-thumbnail";

export type GenerateTryoutBundlePayload = {
  titlePrefix: string;
  learningPathId: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
  questionCount: number;
  durationMinutes: number;
  startChapter: number;
  endChapter: number;
  status: "draft" | "published" | "archived";
  questionNotes: string;
  materialPath: string;
  materialFileName: string;
  materialFileType: string;
  materialFileSize: number;
};

const extractedChapterSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  content: z
    .string()
    .min(1)
    .describe("Materi bab yang lengkap, termasuk informasi penting dari tabel dan gambar."),
});

const extractedBundleSchema = z.object({
  chapters: z.array(extractedChapterSchema),
});

const generatedQuestionSchema = z.object({
  number: z.number().int().positive(),
  type: z.literal("multiple-choice"),
  question: z.string(),
  options: z.array(z.string()).length(5),
  correctOption: z
    .enum(["A", "B", "C", "D", "E"])
    .describe("Huruf opsi jawaban yang benar."),
  explanation: z.string(),
});

const generatedChapterQuestionsSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

function buildTryoutTitle(prefix: string, chapterTitle: string) {
  const normalizedPrefix = prefix.trim();
  const normalizedChapterTitle = normalizeTitleCase(chapterTitle);
  return normalizedPrefix
    ? `${normalizedPrefix}${normalizedPrefix.endsWith(" ") ? "" : " "}${normalizedChapterTitle}`
    : normalizedChapterTitle;
}

async function clearPreviousBundleAttempt(materialPath: string) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase service role belum dikonfigurasi.");

  const { data: tryouts, error: tryoutsError } = await supabase
    .from("tryouts")
    .select("id, thumbnail_path")
    .eq("material_file_url", materialPath);
  if (tryoutsError) throw new Error(tryoutsError.message);

  const tryoutIds = (tryouts ?? []).map((tryout) => tryout.id);
  if (!tryoutIds.length) return;

  const { data: questions, error: questionsError } = await supabase
    .from("tryout_questions")
    .select("id")
    .in("tryout_id", tryoutIds);
  if (questionsError) throw new Error(questionsError.message);

  const questionIds = (questions ?? []).map((question) => question.id);
  if (questionIds.length) {
    const { error: clearCorrectError } = await supabase
      .from("tryout_questions")
      .update({ correct_option_id: null })
      .in("id", questionIds);
    if (clearCorrectError) throw new Error(clearCorrectError.message);

    const { error: optionsError } = await supabase
      .from("tryout_question_options")
      .delete()
      .in("tryout_question_id", questionIds);
    if (optionsError) throw new Error(optionsError.message);
  }

  const { error: deleteQuestionsError } = await supabase
    .from("tryout_questions")
    .delete()
    .in("tryout_id", tryoutIds);
  if (deleteQuestionsError) throw new Error(deleteQuestionsError.message);

  const { error: deleteTryoutsError } = await supabase
    .from("tryouts")
    .delete()
    .in("id", tryoutIds);
  if (deleteTryoutsError) throw new Error(deleteTryoutsError.message);

  const thumbnailPaths = (tryouts ?? [])
    .map((tryout) => tryout.thumbnail_path)
    .filter((path): path is string => Boolean(path));
  if (thumbnailPaths.length) {
    await supabase.storage
      .from(TRYOUT_THUMBNAIL_BUCKET)
      .remove(thumbnailPaths);
  }
}

async function saveQuestions(
  tryoutId: string,
  questions: z.infer<typeof generatedQuestionSchema>[]
) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase service role belum dikonfigurasi.");

  for (const [index, question] of questions.entries()) {
    const { data: questionInsert, error: questionError } = await supabase
      .from("tryout_questions")
      .insert({
        tryout_id: tryoutId,
        question_order: index + 1,
        question: question.question,
        explanation: question.explanation || null,
        correct_option_id: null,
      })
      .select("id")
      .single();
    if (questionError || !questionInsert) {
      throw new Error(questionError?.message || "Gagal menyimpan soal tryout.");
    }

    const { data: optionRows, error: optionsError } = await supabase
      .from("tryout_question_options")
      .insert(
        question.options.map((option, optionIndex) => ({
          tryout_question_id: questionInsert.id,
          option_order: optionIndex + 1,
          option_text: option,
        }))
      )
      .select("id, option_order");
    if (optionsError) throw new Error(optionsError.message);

    const correctIndex = question.correctOption.charCodeAt(0) - 65;
    const correctOption = optionRows?.find(
      (option) => option.option_order === correctIndex + 1
    );
    if (!correctOption) {
      throw new Error(`Jawaban benar soal nomor ${index + 1} tidak dapat dicocokkan.`);
    }

    const { error: updateQuestionError } = await supabase
      .from("tryout_questions")
      .update({ correct_option_id: correctOption.id })
      .eq("id", questionInsert.id);
    if (updateQuestionError) throw new Error(updateQuestionError.message);
  }
}

export const generateTryoutBundleTask = task({
  id: "generate-tryout-bundle",
  queue: { concurrencyLimit: 1 },
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: GenerateTryoutBundlePayload) => {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Supabase service role belum dikonfigurasi.");

    await clearPreviousBundleAttempt(payload.materialPath);
    metadata.set("phase", "extracting-chapters").set("progress", 5);

    const { data: material, error: materialError } = await supabase.storage
      .from(TRYOUT_MATERIAL_BUCKET)
      .download(payload.materialPath);
    if (materialError || !material) {
      throw new Error(materialError?.message || "PDF materi tidak ditemukan.");
    }

    const materialBuffer = Buffer.from(await material.arrayBuffer());
    const fileDataUrl = `data:${payload.materialFileType};base64,${materialBuffer.toString("base64")}`;
    const expectedChapterNumbers = Array.from(
      { length: payload.endChapter - payload.startChapter + 1 },
      (_, index) => payload.startChapter + index
    );

    const extractionResult = await generateText({
      model: google(GEMINI_GENERATION_MODEL),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                `Analisis PDF dan ekstrak Bab ${payload.startChapter} sampai Bab ${payload.endChapter}.`,
                "Kembalikan tepat satu item untuk setiap nomor bab dalam rentang tersebut.",
                "Ambil judul bab persis dari dokumen tanpa menambahkan kata 'Bab' atau nomor bab ke judul.",
                "Untuk content, rangkum materi bab secara sangat lengkap agar dapat menjadi satu-satunya sumber pembuatan soal.",
                "Pertahankan fakta, definisi, langkah, contoh, hubungan konsep, tabel, serta deskripsi informasi penting dari gambar atau diagram.",
                "Jangan memasukkan materi dari bab lain.",
              ].join(" "),
            },
            {
              type: "file",
              data: fileDataUrl,
              mediaType: payload.materialFileType,
              filename: payload.materialFileName,
            },
          ],
        },
      ],
      output: Output.object({ schema: extractedBundleSchema }),
    });

    const chaptersByNumber = new Map(
      extractionResult.output.chapters.map((chapter) => [chapter.number, chapter])
    );
    const missingChapters = expectedChapterNumbers.filter(
      (chapterNumber) => !chaptersByNumber.has(chapterNumber)
    );
    if (missingChapters.length) {
      throw new Error(`Bab ${missingChapters.join(", ")} tidak ditemukan di PDF.`);
    }

    const [{ data: learningPath }, { data: category }, { data: subCategory }] =
      await Promise.all([
        payload.learningPathId
          ? supabase
              .from("learning_paths")
              .select("id, title")
              .eq("id", payload.learningPathId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        payload.categoryId
          ? supabase
              .from("categories")
              .select("name")
              .eq("id", payload.categoryId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        payload.subCategoryId
          ? supabase
              .from("sub_categories")
              .select("name")
              .eq("id", payload.subCategoryId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
    const categoryPath = buildCategoryPath(category?.name ?? "", subCategory?.name ?? "");
    const learningPathLabel = learningPath
      ? buildLearningPathLabel(learningPath)
      : categoryPath || "Tryout Umum";

    const createdTryouts: Array<{
      id: string;
      chapterNumber: number;
      title: string;
      content: string;
    }> = [];

    for (const chapterNumber of expectedChapterNumbers) {
      const chapter = chaptersByNumber.get(chapterNumber)!;
      const tryoutId = crypto.randomUUID();
      const title = buildTryoutTitle(payload.titlePrefix, chapter.title);
      const thumbnail = await uploadTryoutThumbnail(
        supabase,
        { tryoutId, title },
        { ensureBucket: true }
      );

      const { error: insertError } = await supabase.from("tryouts").insert({
        id: tryoutId,
        learning_path_id: payload.learningPathId,
        category_id: payload.categoryId,
        sub_category_id: payload.subCategoryId,
        title,
        total_questions: payload.questionCount,
        duration_minutes: payload.durationMinutes,
        question_notes: payload.questionNotes || null,
        thumbnail_url: thumbnail.publicUrl,
        thumbnail_path: thumbnail.path,
        status: payload.status,
        material_file_url: payload.materialPath,
        material_file_name: payload.materialFileName,
        material_file_type: payload.materialFileType,
        material_file_size: payload.materialFileSize,
        ai_generation_status: "pending",
        ai_generation_notes: payload.questionNotes || `Generated from Bab ${chapterNumber}`,
      });
      if (insertError) throw new Error(insertError.message);

      createdTryouts.push({
        id: tryoutId,
        chapterNumber,
        title,
        content: chapter.content,
      });
    }

    let completedCount = 0;
    for (const tryout of createdTryouts) {
      await supabase
        .from("tryouts")
        .update({
          ai_generation_status: "processing",
          ai_generation_started_at: new Date().toISOString(),
        })
        .eq("id", tryout.id);

      try {
        metadata
          .set("phase", `generating-chapter-${tryout.chapterNumber}`)
          .set("currentChapter", tryout.chapterNumber)
          .set("progress", 20 + Math.round((completedCount / createdTryouts.length) * 75));

        const instructionText = payload.questionNotes
          ? `Gunakan catatan tambahan berikut untuk menentukan fokus isi soal tanpa menurunkan tingkat kesulitan: ${payload.questionNotes}`
          : "Gunakan cakupan materi bab secara proporsional dan utamakan konsep-konsep penting.";
        const questionsResult = await generateText({
          model: google(GEMINI_GENERATION_MODEL),
          prompt: [
            `Buat tepat ${payload.questionCount} soal untuk ${tryout.title}.`,
            `Fokus hanya pada materi Bab ${tryout.chapterNumber} berikut:`,
            tryout.content,
            `Learning path/kategori: ${learningPathLabel}.`,
            instructionText,
            ...HARD_TRYOUT_QUESTION_INSTRUCTIONS,
            "Semua soal wajib multiple-choice dengan tepat 5 opsi berbeda (A-E) dan hanya satu jawaban benar.",
            "Isi correctOption hanya dengan satu huruf A, B, C, D, atau E yang menunjuk posisi opsi benar.",
            "Sertakan penjelasan singkat untuk setiap jawaban benar.",
          ].join("\n\n"),
          output: Output.object({ schema: generatedChapterQuestionsSchema }),
        });

        if (questionsResult.output.questions.length !== payload.questionCount) {
          throw new Error(
            `AI menghasilkan ${questionsResult.output.questions.length} soal, seharusnya ${payload.questionCount}.`
          );
        }

        await saveQuestions(tryout.id, questionsResult.output.questions);
        await supabase
          .from("tryouts")
          .update({
            ai_generation_status: "completed",
            ai_generation_error: null,
            ai_generation_completed_at: new Date().toISOString(),
          })
          .eq("id", tryout.id);
        completedCount += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Generate soal untuk bab gagal.";
        await supabase
          .from("tryouts")
          .update({ ai_generation_status: "failed", ai_generation_error: message })
          .eq("id", tryout.id);
        throw error;
      }
    }

    metadata.set("phase", "completed").set("progress", 100);
    return {
      materialPath: payload.materialPath,
      createdTryoutCount: createdTryouts.length,
      tryoutIds: createdTryouts.map((tryout) => tryout.id),
    };
  },
});
