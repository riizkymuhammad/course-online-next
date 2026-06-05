import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { buildLearningPathLabel } from "@/lib/learning-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRYOUT_THUMBNAIL_BUCKET, uploadTryoutThumbnail } from "@/lib/tryout-thumbnail";

export const runtime = "nodejs";

const generatedQuestionSchema = z.object({
  number: z.number().int().positive(),
  type: z
    .enum(["multiple-choice", "true-false", "short-answer", "essay"])
    .describe("Jenis soal yang dibuat."),
  question: z.string().describe("Teks soal."),
  options: z
    .array(z.string())
    .describe("Pilihan jawaban. Kosongkan jika tipe soal bukan pilihan ganda.")
    .default([]),
  answer: z.string().describe("Jawaban yang benar atau panduan jawaban."),
  explanation: z.string().describe("Penjelasan singkat mengapa jawaban tersebut benar."),
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
    if (index >= 0 && index < options.length) {
      return index;
    }
  }

  const exactIndex = options.findIndex(
    (option) => option.trim().toLowerCase() === normalizedAnswer
  );
  if (exactIndex !== -1) {
    return exactIndex;
  }

  const containsIndex = options.findIndex(
    (option) =>
      normalizedAnswer.includes(option.trim().toLowerCase()) ||
      option.trim().toLowerCase().includes(normalizedAnswer)
  );

  return containsIndex !== -1 ? containsIndex : null;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        { error: "GOOGLE_GENERATIVE_AI_API_KEY belum tersedia di environment project." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const learningPathId = String(formData.get("learning_path") ?? "").trim();
    const questionCount = Number(formData.get("question_count") ?? 0);
    const status = String(formData.get("status") ?? "draft").trim();
    const questionNotes = String(formData.get("question_notes") ?? "").trim();
    const materialFile = formData.get("material_file");

    if (!title || !learningPathId || !status || !questionCount || !(materialFile instanceof File)) {
      return Response.json(
        { error: "Field wajib belum lengkap. Pastikan judul, learning path, jumlah soal, status, dan file materi sudah terisi." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: learningPathRow, error: learningPathError } = await supabase
      .from("learning_paths")
      .select("id, title, category, sub_category, sub_sub_category")
      .eq("id", learningPathId)
      .single();

    if (learningPathError || !learningPathRow) {
      return Response.json(
        { error: "Learning path tidak ditemukan di database." },
        { status: 400 }
      );
    }

    const learningPathLabel = buildLearningPathLabel(learningPathRow);
    const arrayBuffer = await materialFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const fileDataUrl = `data:${materialFile.type || "application/pdf"};base64,${base64Data}`;

    const instructionText = questionNotes
      ? `Gunakan catatan tambahan berikut saat menyusun soal: ${questionNotes}`
      : "Jika tidak ada catatan tambahan, buat seluruh soal sebagai pilihan ganda standar dengan 4 opsi jawaban.";

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Buat paket soal tryout berdasarkan PDF yang diunggah.",
                `Judul tryout: ${title}.`,
                `Learning path: ${learningPathLabel}.`,
                `Status: ${status}.`,
                `Jumlah soal yang wajib dibuat: ${questionCount}.`,
                instructionText,
                "Kembalikan soal dalam format terstruktur.",
                "Jika catatan kosong, seluruh soal harus multiple-choice dengan tepat 4 opsi.",
                "Jika ada catatan, ikuti catatan tersebut dan sesuaikan tipe soal bila diperlukan.",
              ].join(" "),
            },
            {
              type: "file",
              data: fileDataUrl,
              mediaType: materialFile.type || "application/pdf",
              filename: materialFile.name || "tryout-material.pdf",
            },
          ],
        },
      ],
      output: Output.object({
        schema: generatedTryoutSchema,
      }),
    });

    const tryoutId = crypto.randomUUID();
    const adminSupabase = createAdminClient();
    const storageSupabase = adminSupabase ?? supabase;
    const thumbnail = await uploadTryoutThumbnail(
      storageSupabase,
      {
        tryoutId,
        title,
      },
      {
        ensureBucket: Boolean(adminSupabase),
      }
    );

    const { data: tryoutInsert, error: tryoutError } = await supabase
      .from("tryouts")
      .insert({
        id: tryoutId,
        learning_path_id: learningPathRow.id,
        title,
        total_questions: questionCount,
        question_notes: questionNotes || null,
        thumbnail_url: thumbnail.publicUrl,
        thumbnail_path: thumbnail.path,
        status,
        material_file_url: null,
        material_file_name: materialFile.name || null,
        material_file_type: materialFile.type || null,
        material_file_size: materialFile.size || null,
        ai_generation_status: "completed",
        ai_generation_notes: questionNotes || "Generated with Gemini via AI SDK",
      })
      .select("id")
      .single();

    if (tryoutError || !tryoutInsert) {
      await storageSupabase.storage.from(TRYOUT_THUMBNAIL_BUCKET).remove([thumbnail.path]);

      return Response.json(
        { error: tryoutError?.message || "Gagal menyimpan tryout ke database." },
        { status: 500 }
      );
    }

    let savedQuestionCount = 0;

    for (const [index, question] of result.output.questions.entries()) {
      const { data: questionInsert, error: questionError } = await supabase
        .from("tryout_questions")
        .insert({
          tryout_id: tryoutInsert.id,
          question_order: index + 1,
          question: question.question,
          explanation: question.explanation || null,
          correct_option_id: null,
        })
        .select("id")
        .single();

      if (questionError || !questionInsert) {
        return Response.json(
          { error: questionError?.message || "Gagal menyimpan soal tryout ke database." },
          { status: 500 }
        );
      }

      if (question.options.length > 0) {
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

        if (optionsError) {
          return Response.json(
            { error: optionsError.message || "Gagal menyimpan opsi soal ke database." },
            { status: 500 }
          );
        }

        const correctIndex = resolveCorrectOptionIndex(question.answer, question.options);
        if (correctIndex !== null) {
          const matchedOption = optionRows?.find((row) => row.option_order === correctIndex + 1);

          if (matchedOption) {
            const { error: updateQuestionError } = await supabase
              .from("tryout_questions")
              .update({ correct_option_id: matchedOption.id })
              .eq("id", questionInsert.id);

            if (updateQuestionError) {
              return Response.json(
                {
                  error:
                    updateQuestionError.message ||
                    "Gagal memperbarui jawaban benar soal tryout.",
                },
                { status: 500 }
              );
            }
          }
        }
      }

      savedQuestionCount += 1;
    }

    return Response.json({
      ...result.output,
      tryoutId: tryoutInsert.id,
      tryoutTitle: title,
      learningPath: learningPathLabel,
      status,
      questionCount,
      savedQuestionCount,
      notes: questionNotes || undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat generate soal tryout.";

    return Response.json({ error: message }, { status: 500 });
  }
}
