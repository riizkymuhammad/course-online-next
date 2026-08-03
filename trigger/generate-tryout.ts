import { google } from "@ai-sdk/google";
import { metadata, task } from "@trigger.dev/sdk";
import { generateText, Output } from "ai";
import { z } from "zod";
import { GEMINI_GENERATION_MODEL } from "@/lib/gemini-limits";
import { buildLearningPathLabel } from "@/lib/learning-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCategoryPath } from "@/lib/text";
import { TRYOUT_MATERIAL_BUCKET } from "@/lib/tryout-material";

export type GenerateTryoutPayload = {
  tryoutId: string;
  materialPath: string;
};

const generatedQuestionSchema = z.object({
  number: z.number().int().positive(),
  type: z.literal("multiple-choice"),
  question: z.string(),
  options: z.array(z.string()).length(5),
  answer: z.string(),
  explanation: z.string(),
});

const generatedTryoutSchema = z.object({
  tryoutTitle: z.string(),
  learningPath: z.string(),
  status: z.string(),
  questionCount: z.number().int().positive(),
  notes: z.string().optional(),
  questions: z.array(generatedQuestionSchema),
});

function resolveCorrectOptionIndex(answer: string, options: string[]) {
  const normalizedAnswer = answer.trim().toLowerCase();
  const letterMatch = normalizedAnswer.match(/^([a-z])(?:[\).\-\s]|$)/i);

  if (letterMatch) {
    const index = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (index >= 0 && index < options.length) return index;
  }

  const exactIndex = options.findIndex(
    (option) => option.trim().toLowerCase() === normalizedAnswer
  );
  if (exactIndex !== -1) return exactIndex;

  const containsIndex = options.findIndex((option) => {
    const normalizedOption = option.trim().toLowerCase();
    return (
      normalizedAnswer.includes(normalizedOption) ||
      normalizedOption.includes(normalizedAnswer)
    );
  });

  return containsIndex !== -1 ? containsIndex : null;
}

export const generateTryoutTask = task({
  id: "generate-tryout",
  queue: {
    concurrencyLimit: 2,
  },
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async ({ tryoutId, materialPath }: GenerateTryoutPayload) => {
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Supabase service role belum dikonfigurasi.");

    metadata.set("phase", "generating").set("progress", 10);

    await supabase
      .from("tryouts")
      .update({
        ai_generation_status: "processing",
        ai_generation_error: null,
        ai_generation_started_at: new Date().toISOString(),
      })
      .eq("id", tryoutId);

    try {
      const { data: tryout, error: tryoutError } = await supabase
        .from("tryouts")
        .select(
          "id, title, total_questions, question_notes, status, learning_path_id, category_id, sub_category_id, material_file_name, material_file_type"
        )
        .eq("id", tryoutId)
        .single();

      if (tryoutError || !tryout) {
        throw new Error(tryoutError?.message || "Tryout tidak ditemukan.");
      }

      const [{ data: learningPath }, { data: category }, { data: subCategory }] =
        await Promise.all([
          tryout.learning_path_id
            ? supabase
                .from("learning_paths")
                .select("id, title")
                .eq("id", tryout.learning_path_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          tryout.category_id
            ? supabase
                .from("categories")
                .select("name")
                .eq("id", tryout.category_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          tryout.sub_category_id
            ? supabase
                .from("sub_categories")
                .select("name")
                .eq("id", tryout.sub_category_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

      const { data: material, error: materialError } = await supabase.storage
        .from(TRYOUT_MATERIAL_BUCKET)
        .download(materialPath);

      if (materialError || !material) {
        throw new Error(materialError?.message || "PDF materi tidak ditemukan.");
      }

      const categoryPath = buildCategoryPath(category?.name ?? "", subCategory?.name ?? "");
      const learningPathLabel = learningPath
        ? buildLearningPathLabel(learningPath)
        : categoryPath || "Tryout Umum";
      const contextText = [
        learningPath ? `Learning path: ${learningPathLabel}.` : "",
        categoryPath ? `Kategori tryout: ${categoryPath}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const materialBuffer = Buffer.from(await material.arrayBuffer());
      const fileDataUrl = `data:${tryout.material_file_type || "application/pdf"};base64,${materialBuffer.toString("base64")}`;
      const instructionText = tryout.question_notes
        ? `Gunakan catatan tambahan berikut untuk menentukan isi dan tingkat kesulitan soal: ${tryout.question_notes}`
        : "Buat seluruh soal sebagai pilihan ganda standar.";

      const result = await generateText({
        model: google(GEMINI_GENERATION_MODEL),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Buat paket soal tryout berdasarkan PDF yang diunggah.",
                  `Judul tryout: ${tryout.title}.`,
                  contextText,
                  `Status: ${tryout.status}.`,
                  `Jumlah soal yang wajib dibuat: ${tryout.total_questions}.`,
                  instructionText,
                  "Kembalikan soal dalam format terstruktur.",
                  "Seluruh soal wajib bertipe multiple-choice dengan tepat 5 opsi jawaban (A, B, C, D, dan E).",
                  "Setiap opsi harus berbeda dan hanya satu opsi yang benar.",
                ].join(" "),
              },
              {
                type: "file",
                data: fileDataUrl,
                mediaType: tryout.material_file_type || "application/pdf",
                filename: tryout.material_file_name || "tryout-material.pdf",
              },
            ],
          },
        ],
        output: Output.object({ schema: generatedTryoutSchema }),
      });

      if (result.output.questions.length !== tryout.total_questions) {
        throw new Error(
          `AI menghasilkan ${result.output.questions.length} soal, seharusnya ${tryout.total_questions}.`
        );
      }

      metadata.set("phase", "saving").set("progress", 65);

      const { data: oldQuestions, error: oldQuestionsError } = await supabase
        .from("tryout_questions")
        .select("id")
        .eq("tryout_id", tryoutId);
      if (oldQuestionsError) throw new Error(oldQuestionsError.message);

      const oldQuestionIds = (oldQuestions ?? []).map((question) => question.id);
      if (oldQuestionIds.length > 0) {
        const { error: clearCorrectError } = await supabase
          .from("tryout_questions")
          .update({ correct_option_id: null })
          .in("id", oldQuestionIds);
        if (clearCorrectError) throw new Error(clearCorrectError.message);

        const { error: oldOptionsError } = await supabase
          .from("tryout_question_options")
          .delete()
          .in("tryout_question_id", oldQuestionIds);
        if (oldOptionsError) throw new Error(oldOptionsError.message);

        const { error: deleteOldQuestionsError } = await supabase
          .from("tryout_questions")
          .delete()
          .eq("tryout_id", tryoutId);
        if (deleteOldQuestionsError) throw new Error(deleteOldQuestionsError.message);
      }

      let savedQuestionCount = 0;
      for (const [index, question] of result.output.questions.entries()) {
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

        const correctIndex = resolveCorrectOptionIndex(question.answer, question.options);
        const correctOption = optionRows?.find(
          (option) => option.option_order === (correctIndex ?? -1) + 1
        );
        if (!correctOption) {
          throw new Error(`Jawaban benar soal nomor ${index + 1} tidak dapat dicocokkan.`);
        }

        const { error: updateQuestionError } = await supabase
          .from("tryout_questions")
          .update({ correct_option_id: correctOption.id })
          .eq("id", questionInsert.id);
        if (updateQuestionError) throw new Error(updateQuestionError.message);

        savedQuestionCount += 1;
        metadata.set(
          "progress",
          65 + Math.round((savedQuestionCount / result.output.questions.length) * 30)
        );
      }

      const { error: completeError } = await supabase
        .from("tryouts")
        .update({
          ai_generation_status: "completed",
          ai_generation_error: null,
          ai_generation_completed_at: new Date().toISOString(),
        })
        .eq("id", tryoutId);
      if (completeError) throw new Error(completeError.message);

      metadata.set("phase", "completed").set("progress", 100);
      return { tryoutId, savedQuestionCount };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generate soal tryout gagal.";

      await supabase
        .from("tryouts")
        .update({ ai_generation_status: "failed", ai_generation_error: message })
        .eq("id", tryoutId);

      metadata.set("phase", "failed").set("error", message);
      throw error;
    }
  },
});
