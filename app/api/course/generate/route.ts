import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserRole } from "@/lib/auth-roles";
import { GEMINI_GENERATION_MODEL } from "@/lib/gemini-limits";
import { buildLearningPathLabel } from "@/lib/learning-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const generatedCourseSchema = z.object({
  description: z
    .string()
    .describe("Deskripsi singkat course yang langsung menjelaskan topik besar dan manfaatnya."),
  summary: z
    .string()
    .describe("Ringkasan materi dan hasil belajar utama dengan bahasa sederhana."),
  sections: z
    .array(
      z.object({
        title: z.string().describe("Judul section yang singkat dan spesifik."),
        description: z.string().describe("Tujuan section dalam satu kalimat ringkas."),
        modules: z
          .array(
            z.object({
              title: z
                .string()
                .describe("Judul modul yang diawali emoji buku: 📑."),
              description: z.string().describe("Ringkasan isi modul dalam satu kalimat."),
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
                .describe(
                  "Isi modul dalam Markdown berisi poin penting, istilah teknis bold, dan contoh praktis."
                ),
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

const COURSE_GENERATION_SYSTEM_PROMPT = [
  "Anda adalah Instructional Designer dan Ahli Kurikulum Online berpengalaman.",
  "Tugas Anda adalah menyusun dokumen atau materi dari PDF menjadi struktur pembelajaran yang rapi, scannable, dan mudah dipahami peserta kursus.",
  "Gunakan bahasa Indonesia yang santai namun tetap profesional dan edukatif.",
  "Jaga setiap penjelasan tetap padat, ringkas, dan langsung pada intinya. Hindari dinding teks yang terlalu panjang.",
  "Jangan gunakan sapaan seperti 'Halo mahasiswa', 'Selamat datang', 'mari kita renungkan', atau pertanyaan retoris seperti 'Pernahkah Anda membayangkan'.",
  "Fokus pada hal yang membantu pengguna mengerti: definisi inti, klasifikasi, karakteristik, contoh nyata, tantangan, aplikasi praktis, dan analogi bila perlu.",
  "Semua materi wajib bersumber dari PDF. Boleh menambahkan analogi singkat atau contoh sederhana hanya untuk memperjelas konsep yang memang ada di PDF.",
  "Jangan mengarang teori, angka, nama tokoh, atau kesimpulan yang tidak didukung oleh PDF.",
  "Tebalkan istilah teknis atau kata kunci penting dengan format Markdown **istilah** agar materi mudah dipindai.",
].join(" ");

function ensureModuleTitlePrefix(title: string) {
  const normalizedTitle = title.trim().replace(/^📑\s*/u, "") || "Modul";
  return `📑 ${normalizedTitle}`;
}

function removeAwkwardOpening(value: string) {
  const paragraphs = value.trim().split(/\n\s*\n/);
  const firstParagraph = paragraphs[0]?.trim() ?? "";
  const startsWithAwkwardOpening =
    /^(halo|hai|selamat datang|untuk mengawali|mari kita|pernahkah)/i.test(firstParagraph);

  if (startsWithAwkwardOpening && paragraphs.length > 1) {
    return paragraphs.slice(1).join("\n\n").trim();
  }

  return value.trim();
}

function cleanGeneratedMarkdown(value: string) {
  return removeAwkwardOpening(value)
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/([^\n])\s*(#{1,4}\s+)/g, "$1\n\n$2")
    .replace(/\n+\s*\*\*(?=[\s.,;:!?a-z])/g, "**")
    .replace(/\*\*\s*\n+\s*(?=[.,;:!?])/g, "**")
    .replace(/([.!?])(?=[^\s\d])/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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
    } | null = null;

    if (learningPathId) {
      const { data, error } = await supabase
        .from("learning_paths")
        .select("id, title")
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
      model: google(GEMINI_GENERATION_MODEL),
      messages: [
        {
          role: "system",
          content: COURSE_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                `### Rencana Pembuatan Kursus Online: ${title}`,
                "Saya sedang membuat kursus online berdasarkan materi PDF yang diunggah.",
                "Baca dan pahami PDF materi tersebut sebelum membuat course.",
                context,
                "Breakdown materi menggunakan struktur berikut:",
                "1. SECTION digunakan sebagai bab atau bagian besar. Berikan penjelasan singkat 1 kalimat di bawah nama section mengenai fokus utama bagian tersebut.",
                "2. MODUL diturunkan dari section sebagai topik spesifik yang siap diajarkan. Wajib gunakan emoji buku 📑 di awal setiap nama modul.",
                "Di dalam setiap Modul, breakdown materi menjadi poin-poin penting yang mencakup:",
                "- Definisi atau Konsep Utama: gunakan istilah yang jelas dan buat dalam bullet points.",
                "- Karakteristik / Klasifikasi / Atribut: tuliskan pembagian kelompok, sifat khusus, atribut, atau ciri penting jika ada di PDF.",
                "- Realitas / Tantangan / Aplikasi Praktis: jelaskan contoh nyata, mitos vs realitas, tantangan, atau penggunaan konsep di dunia nyata.",
                "Untuk setiap contentMarkdown, tulis sekitar 220-360 kata. Fokus pada poin penting, bukan paragraf panjang.",
                "Struktur contentMarkdown wajib menggunakan heading Markdown berikut: ### Definisi atau Konsep Utama, ### Karakteristik / Klasifikasi / Atribut, dan ### Realitas / Tantangan / Aplikasi Praktis.",
                "Setiap heading berisi bullet '-' yang singkat, jelas, dan mudah dipahami. Boleh tambahkan paragraf pembuka maksimal 2 kalimat sebelum heading pertama.",
                "Tebalkan istilah teknis dan kata kunci penting dengan format **istilah** agar scannable.",
                "Gunakan Markdown bersih: pisahkan heading dengan baris kosong, gunakan bullet '-' untuk daftar, dan jangan menempelkan tanda ### atau bullet langsung setelah paragraf.",
                "Jangan mulai modul dengan sapaan atau pembukaan seperti 'Halo mahasiswa', 'Selamat datang', 'mari kita renungkan', atau pertanyaan retoris. Langsung mulai dari inti materi.",
                "Gunakan bahasa Indonesia yang santai namun tetap profesional dan edukatif.",
                "Gunakan arahan tambahan admin jika tersedia, selama tidak bertentangan dengan isi PDF.",
                "Jangan membuat materi yang tidak didukung oleh PDF kecuali analogi singkat yang diperlukan untuk memperjelas konsep.",
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
            title: ensureModuleTitlePrefix(module.title),
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
        title: ensureModuleTitlePrefix(module.title),
        description: module.description,
        content_markdown: cleanGeneratedMarkdown(module.contentMarkdown),
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
