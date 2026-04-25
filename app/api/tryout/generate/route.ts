import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

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

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY belum tersedia di environment project." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const learningPath = String(formData.get("learning_path") ?? "").trim();
    const questionCount = Number(formData.get("question_count") ?? 0);
    const status = String(formData.get("status") ?? "draft").trim();
    const questionNotes = String(formData.get("question_notes") ?? "").trim();
    const materialFile = formData.get("material_file");

    if (!title || !learningPath || !status || !questionCount || !(materialFile instanceof File)) {
      return Response.json(
        { error: "Field wajib belum lengkap. Pastikan judul, learning path, jumlah soal, status, dan file materi sudah terisi." },
        { status: 400 }
      );
    }

    const arrayBuffer = await materialFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const fileDataUrl = `data:${materialFile.type || "application/pdf"};base64,${base64Data}`;

    const instructionText = questionNotes
      ? `Gunakan catatan tambahan berikut saat menyusun soal: ${questionNotes}`
      : "Jika tidak ada catatan tambahan, buat seluruh soal sebagai pilihan ganda standar dengan 4 opsi jawaban.";

    const result = await generateText({
      model: openai("gpt-5"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Buat paket soal tryout berdasarkan PDF yang diunggah.",
                `Judul tryout: ${title}.`,
                `Learning path: ${learningPath}.`,
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

    return Response.json({
      ...result.output,
      tryoutTitle: title,
      learningPath,
      status,
      questionCount,
      notes: questionNotes || undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat generate soal tryout.";

    return Response.json({ error: message }, { status: 500 });
  }
}
