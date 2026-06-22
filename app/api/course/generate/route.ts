import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildLearningPathLabel } from "@/lib/learning-path";
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
            })
          )
          .min(1),
      })
    )
    .min(1),
});

function buildCategoryPath(category: string, subCategory: string) {
  return [category, subCategory].filter(Boolean).join(" > ");
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
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const subCategoryId = String(formData.get("sub_category_id") ?? "").trim();
    const status = String(formData.get("status") ?? "published").trim() || "published";
    const materialNotes = String(formData.get("material_notes") ?? "").trim();
    const materialFile = formData.get("material_file");

    if (!title || !(materialFile instanceof File)) {
      return Response.json(
        { error: "Field wajib belum lengkap. Pastikan nama course dan file PDF sudah diisi." },
        { status: 400 }
      );
    }

    if (materialFile.type && materialFile.type !== "application/pdf") {
      return Response.json({ error: "File materi harus berformat PDF." }, { status: 400 });
    }

    if (!categoryId && subCategoryId) {
      return Response.json(
        { error: "Pilih kategori terlebih dahulu sebelum memilih sub kategori." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
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
        return Response.json(
          { error: "Learning path tidak ditemukan di database." },
          { status: 400 }
        );
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
        return Response.json({ error: "Kategori tidak ditemukan di database." }, { status: 400 });
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
          return Response.json(
            { error: "Sub kategori tidak ditemukan untuk kategori yang dipilih." },
            { status: 400 }
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
    const arrayBuffer = await materialFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const fileDataUrl = `data:${materialFile.type || "application/pdf"};base64,${base64Data}`;

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
                "Buat section dan modul yang runtut, praktis, dan relevan bagi siswa Indonesia.",
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
    const { data: courseInsert, error: courseError } = await supabase
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
        course_outline: result.output.sections,
        status,
      })
      .select("id")
      .single();

    if (courseError || !courseInsert) {
      return Response.json(
        { error: courseError?.message || "Gagal menyimpan course ke database." },
        { status: 500 }
      );
    }

    const sectionRows = result.output.sections.map((section, index) => ({
      id: crypto.randomUUID(),
      course_id: courseInsert.id,
      title: section.title,
      description: section.description,
      section_order: index + 1,
    }));
    const { error: sectionError } = await supabase.from("course_sections").insert(sectionRows);

    if (sectionError) {
      await supabase.from("courses").delete().eq("id", courseInsert.id);

      return Response.json(
        { error: sectionError.message || "Gagal menyimpan section course." },
        { status: 500 }
      );
    }

    const moduleRows = result.output.sections.flatMap((section, sectionIndex) =>
      section.modules.map((module, moduleIndex) => ({
        course_section_id: sectionRows[sectionIndex].id,
        title: module.title,
        description: module.description,
        module_order: moduleIndex + 1,
      }))
    );
    const { error: moduleError } = await supabase.from("course_modules").insert(moduleRows);

    if (moduleError) {
      await supabase.from("courses").delete().eq("id", courseInsert.id);

      return Response.json(
        { error: moduleError.message || "Gagal menyimpan modul course." },
        { status: 500 }
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
    return Response.json({ error: message }, { status: 500 });
  }
}
