import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserRole } from "@/lib/auth-roles";
import { buildLearningPathLabel } from "@/lib/learning-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const generatedCourseSchema = z.object({
  description: z.string().describe("Deskripsi singkat course untuk siswa."),
  summary: z.string().describe("Ringkasan materi dan hasil belajar utama."),
  sections: z
    .array(
      z.object({
        title: z.string().describe("Judul section."),
        description: z.string().describe("Tujuan pembelajaran section."),
        modules: z
          .array(
            z.object({
              title: z.string().describe("Judul modul."),
              description: z.string().describe("Ringkasan isi modul."),
              learningObjectives: z
                .array(z.string())
                .min(2)
                .max(5)
                .describe("Tujuan belajar modul."),
              estimatedMinutes: z
                .number()
                .int()
                .positive()
                .max(180)
                .describe("Estimasi durasi belajar dalam menit."),
              contentMarkdown: z
                .string()
                .describe("Isi materi lengkap modul dalam Markdown."),
            })
          )
          .min(1)
          .max(5),
      })
    )
    .min(1)
    .max(6),
});

type GenerationStage =
  | "validasi input"
  | "verifikasi akses"
  | "memuat data referensi"
  | "membaca PDF"
  | "membuat materi dengan AI"
  | "menyimpan course"
  | "menyimpan section"
  | "menyimpan modul";

function errorResponse(error: string, stage: GenerationStage, status: number) {
  return Response.json({ error, stage }, { status });
}

function buildCategoryPath(category: string, subCategory: string) {
  return [category, subCategory].filter(Boolean).join(" > ");
}

export async function POST(request: Request) {
  let stage: GenerationStage = "validasi input";

  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return errorResponse(
        "GOOGLE_GENERATIVE_AI_API_KEY belum tersedia di environment project.",
        stage,
        500
      );
    }

    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const learningPathId = String(formData.get("learning_path") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const subCategoryId = String(formData.get("sub_category_id") ?? "").trim();
    const status = String(formData.get("status") ?? "published").trim() || "published";
    const materialNotes = String(formData.get("material_notes") ?? "").trim();
    const materialFile = formData.get("material_file");

    if (!title || !(materialFile instanceof File)) {
      return errorResponse(
        "Field wajib belum lengkap. Pastikan nama course dan file PDF sudah diisi.",
        stage,
        400
      );
    }

    if (materialFile.type && materialFile.type !== "application/pdf") {
      return errorResponse("File materi harus berformat PDF.", stage, 400);
    }

    if (!categoryId && subCategoryId) {
      return errorResponse(
        "Pilih kategori terlebih dahulu sebelum memilih sub kategori.",
        stage,
        400
      );
    }

    stage = "verifikasi akses";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Sesi login tidak ditemukan. Silakan masuk kembali.", stage, 401);
    }

    if (getUserRole(user) !== "admin") {
      return errorResponse("Hanya admin yang dapat membuat course.", stage, 403);
    }

    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return errorResponse(
        "Konfigurasi server belum lengkap. Tambahkan SUPABASE_SERVICE_ROLE_KEY untuk menyimpan course.",
        stage,
        500
      );
    }

    stage = "memuat data referensi";
    let category = "";
    let subCategory = "";
    let learningPathRow: {
      id: string;
      title: string | null;
      category: string | null;
      sub_category: string | null;
      sub_sub_category: string | null;
    } | null = null;

    if (learningPathId) {
      const { data, error } = await supabase
        .from("learning_paths")
        .select("id, title, category, sub_category, sub_sub_category")
        .eq("id", learningPathId)
        .single();

      if (error || !data) {
        return errorResponse("Learning path tidak ditemukan di database.", stage, 400);
      }

      learningPathRow = data;
    }

    if (categoryId) {
      const { data: categoryRow, error: categoryError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("id", categoryId)
        .single();

      if (categoryError || !categoryRow) {
        return errorResponse("Kategori tidak ditemukan di database.", stage, 400);
      }

      category = String(categoryRow.name ?? "").trim();

      if (subCategoryId) {
        const { data: subCategoryRow, error: subCategoryError } = await supabase
          .from("sub_categories")
          .select("id, category_id, name")
          .eq("id", subCategoryId)
          .eq("category_id", categoryId)
          .single();

        if (subCategoryError || !subCategoryRow) {
          return errorResponse(
            "Sub kategori tidak ditemukan untuk kategori yang dipilih.",
            stage,
            400
          );
        }

        subCategory = String(subCategoryRow.name ?? "").trim();
      }
    }

    const categoryPath = buildCategoryPath(category, subCategory);
    const learningPathLabel = learningPathRow
      ? buildLearningPathLabel(learningPathRow)
      : categoryPath || "Course Umum";
    const context = [
      `Nama course: ${title}.`,
      learningPathRow ? `Learning path: ${learningPathLabel}.` : "",
      categoryPath ? `Kategori: ${categoryPath}.` : "",
      materialNotes ? `Arahan tambahan dari admin: ${materialNotes}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    stage = "membaca PDF";
    const arrayBuffer = await materialFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const fileDataUrl = `data:${materialFile.type || "application/pdf"};base64,${base64Data}`;

    stage = "membuat materi dengan AI";
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Susun outline course dari PDF materi yang diunggah.",
                context,
                "Buat maksimal 6 section dan maksimal 5 modul per section yang runtut, praktis, dan relevan bagi siswa Indonesia.",
                "Untuk setiap modul, buat isi materi siap belajar dalam Markdown sekitar 350-500 kata: pembuka singkat, penjelasan konsep, contoh praktis bila relevan, poin penting, dan latihan/refleksi singkat.",
                "Gunakan arahan tambahan admin jika tersedia.",
                "Jangan membuat materi yang tidak didukung oleh PDF kecuali diperlukan sebagai pengantar singkat.",
              ].join(" "),
            },
            {
              type: "file",
              data: fileDataUrl,
              mediaType: materialFile.type || "application/pdf",
              filename: materialFile.name || "course-material.pdf",
            },
          ],
        },
      ],
      output: Output.object({ schema: generatedCourseSchema }),
    });

    const moduleCount = result.output.sections.reduce(
      (total, section) => total + section.modules.length,
      0
    );
    const courseId = crypto.randomUUID();
    stage = "menyimpan course";
    const { data: courseInsert, error: courseError } = await adminSupabase
      .from("courses")
      .insert({
        id: courseId,
        title,
        learning_path_id: learningPathRow?.id ?? null,
        category_id: categoryId || null,
        sub_category_id: subCategoryId || null,
        description: result.output.description,
        section_count: result.output.sections.length,
        module_count: moduleCount,
        material_file_url: null,
        material_file_name: materialFile.name || null,
        material_file_type: materialFile.type || null,
        material_file_size: materialFile.size || null,
        ai_generation_status: "completed",
        ai_generation_notes: materialNotes || null,
        ai_generated_summary: result.output.summary,
        course_outline: result.output.sections.map((section) => ({
          title: section.title,
          description: section.description,
          modules: section.modules.map((module) => ({
            title: module.title,
            description: module.description,
            learningObjectives: module.learningObjectives,
            estimatedMinutes: module.estimatedMinutes,
          })),
        })),
        status,
      })
      .select("id")
      .single();

    if (courseError || !courseInsert) {
      return errorResponse(
        courseError?.message || "Gagal menyimpan course ke database.",
        stage,
        500
      );
    }

    const sectionRows = result.output.sections.map((section, index) => ({
      id: crypto.randomUUID(),
      course_id: courseInsert.id,
      title: section.title,
      description: section.description,
      section_order: index + 1,
    }));
    stage = "menyimpan section";
    const { error: sectionError } = await adminSupabase.from("course_sections").insert(sectionRows);

    if (sectionError) {
      await adminSupabase.from("courses").delete().eq("id", courseInsert.id);

      return errorResponse(
        sectionError.message || "Gagal menyimpan section course.",
        stage,
        500
      );
    }

    const moduleRows = result.output.sections.flatMap((section, sectionIndex) =>
      section.modules.map((module, moduleIndex) => ({
        course_section_id: sectionRows[sectionIndex].id,
        title: module.title,
        description: module.description,
        content_markdown: module.contentMarkdown,
        learning_objectives: module.learningObjectives,
        estimated_minutes: module.estimatedMinutes,
        module_order: moduleIndex + 1,
      }))
    );
    stage = "menyimpan modul";
    const { error: moduleError } = await adminSupabase.from("course_modules").insert(moduleRows);

    if (moduleError) {
      await adminSupabase.from("courses").delete().eq("id", courseInsert.id);

      return errorResponse(
        moduleError.message || "Gagal menyimpan modul course.",
        stage,
        500
      );
    }

    revalidatePath("/");
    revalidatePath("/dashboard/course-management");

    return Response.json({
      courseId: courseInsert.id,
      courseTitle: title,
      learningPath: learningPathLabel,
      status,
      sectionCount: result.output.sections.length,
      moduleCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat course.";
    console.error(`[course:generate] Gagal pada tahap ${stage}`, error);
    return errorResponse(`Gagal pada tahap ${stage}: ${message}`, stage, 500);
  }
}
