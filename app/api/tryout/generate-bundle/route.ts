import type { generateTryoutBundleTask } from "@/trigger/generate-tryout-bundle";
import { tasks } from "@trigger.dev/sdk";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRYOUT_MATERIAL_BUCKET, uploadTryoutMaterial } from "@/lib/tryout-material";

export const runtime = "nodejs";

const allowedStatuses = new Set(["draft", "published", "archived"]);

export async function POST(request: Request) {
  try {
    if (!process.env.TRIGGER_SECRET_KEY) {
      return Response.json(
        { error: "TRIGGER_SECRET_KEY belum tersedia di environment project." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || getUserRole(user) !== "admin") {
      return Response.json(
        { error: "Anda tidak memiliki izin untuk membuat bundle tryout." },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return Response.json(
        { error: "Supabase service role belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const titlePrefix = String(formData.get("title") ?? "").trim();
    const learningPathId = String(formData.get("learning_path") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const subCategoryId = String(formData.get("sub_category_id") ?? "").trim();
    const questionCount = Number(formData.get("question_count") ?? 0);
    const startChapter = Number(formData.get("start_chapter") ?? 0);
    const endChapter = Number(formData.get("end_chapter") ?? 0);
    const status = String(formData.get("status") ?? "draft").trim();
    const questionNotes = String(formData.get("question_notes") ?? "").trim();
    const materialFile = formData.get("material_file");

    if (
      !titlePrefix ||
      !Number.isInteger(questionCount) ||
      questionCount < 1 ||
      !Number.isInteger(startChapter) ||
      !Number.isInteger(endChapter) ||
      startChapter < 1 ||
      endChapter < startChapter ||
      !(materialFile instanceof File) ||
      !allowedStatuses.has(status)
    ) {
      return Response.json(
        { error: "Data bundle tryout belum lengkap atau rentang bab tidak valid." },
        { status: 400 }
      );
    }

    if (endChapter - startChapter + 1 > 20) {
      return Response.json(
        { error: "Maksimal 20 bab dapat dibuat dalam satu bundle." },
        { status: 400 }
      );
    }

    if (materialFile.type !== "application/pdf") {
      return Response.json(
        { error: "Materi bundle tryout harus berupa file PDF." },
        { status: 400 }
      );
    }

    if (!categoryId && subCategoryId) {
      return Response.json(
        { error: "Pilih kategori terlebih dahulu sebelum memilih sub kategori." },
        { status: 400 }
      );
    }

    const validations = await Promise.all([
      learningPathId
        ? adminSupabase
            .from("learning_paths")
            .select("id")
            .eq("id", learningPathId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      categoryId
        ? adminSupabase
            .from("categories")
            .select("id")
            .eq("id", categoryId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      subCategoryId
        ? adminSupabase
            .from("sub_categories")
            .select("id")
            .eq("id", subCategoryId)
            .eq("category_id", categoryId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (learningPathId && (!validations[0].data || validations[0].error)) {
      return Response.json({ error: "Learning path tidak ditemukan." }, { status: 400 });
    }
    if (categoryId && (!validations[1].data || validations[1].error)) {
      return Response.json({ error: "Kategori tidak ditemukan." }, { status: 400 });
    }
    if (subCategoryId && (!validations[2].data || validations[2].error)) {
      return Response.json(
        { error: "Sub kategori tidak ditemukan untuk kategori yang dipilih." },
        { status: 400 }
      );
    }

    const materialStorageId = crypto.randomUUID();
    const materialPath = await uploadTryoutMaterial(
      adminSupabase,
      materialStorageId,
      materialFile
    );

    try {
      const handle = await tasks.trigger<typeof generateTryoutBundleTask>(
        "generate-tryout-bundle",
        {
          titlePrefix,
          learningPathId: learningPathId || null,
          categoryId: categoryId || null,
          subCategoryId: subCategoryId || null,
          questionCount,
          startChapter,
          endChapter,
          status: status as "draft" | "published" | "archived",
          questionNotes,
          materialPath,
          materialFileName: materialFile.name || "bundle-material.pdf",
          materialFileType: materialFile.type || "application/pdf",
          materialFileSize: materialFile.size,
        },
        {
          tags: [`tryout-material:${materialStorageId}`, "tryout-bundle"],
          idempotencyKey: `generate-tryout-bundle-${materialStorageId}`,
        }
      );

      return Response.json(
        {
          runId: handle.id,
          titlePrefix,
          startChapter,
          endChapter,
          expectedTryoutCount: endChapter - startChapter + 1,
        },
        { status: 202 }
      );
    } catch (error) {
      await adminSupabase.storage
        .from(TRYOUT_MATERIAL_BUCKET)
        .remove([materialPath]);
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memasukkan bundle tryout ke antrean.";
    return Response.json({ error: message }, { status: 500 });
  }
}
