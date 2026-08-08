import type { generateTryoutTask } from "@/trigger/generate-tryout";
import { tasks } from "@trigger.dev/sdk";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRYOUT_MATERIAL_BUCKET, uploadTryoutMaterial } from "@/lib/tryout-material";
import {
  TRYOUT_THUMBNAIL_BUCKET,
  uploadTryoutThumbnail,
} from "@/lib/tryout-thumbnail";

export const runtime = "nodejs";

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
        { error: "Anda tidak memiliki izin untuk membuat tryout." },
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
    const title = String(formData.get("title") ?? "").trim();
    const learningPathId = String(formData.get("learning_path") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const subCategoryId = String(formData.get("sub_category_id") ?? "").trim();
    const questionCount = Number(formData.get("question_count") ?? 0);
    const durationMinutes = Number(formData.get("duration_minutes") ?? 60);
    const status = String(formData.get("status") ?? "draft").trim();
    const questionNotes = String(formData.get("question_notes") ?? "").trim();
    const materialFile = formData.get("material_file");

    if (!title || !status || !questionCount || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440 || !(materialFile instanceof File)) {
      return Response.json(
        {
          error:
            "Field wajib belum lengkap. Pastikan judul, jumlah soal, status, dan file materi sudah terisi.",
        },
        { status: 400 }
      );
    }

    if (materialFile.type !== "application/pdf") {
      return Response.json(
        { error: "Materi tryout harus berupa file PDF." },
        { status: 400 }
      );
    }

    if (!categoryId && subCategoryId) {
      return Response.json(
        { error: "Pilih kategori terlebih dahulu sebelum memilih sub kategori." },
        { status: 400 }
      );
    }

    if (learningPathId) {
      const { data, error } = await adminSupabase
        .from("learning_paths")
        .select("id")
        .eq("id", learningPathId)
        .single();
      if (error || !data) {
        return Response.json(
          { error: "Learning path tidak ditemukan di database." },
          { status: 400 }
        );
      }
    }

    if (categoryId) {
      const { data, error } = await adminSupabase
        .from("categories")
        .select("id")
        .eq("id", categoryId)
        .single();
      if (error || !data) {
        return Response.json(
          { error: "Kategori tidak ditemukan di database." },
          { status: 400 }
        );
      }
    }

    if (subCategoryId) {
      const { data, error } = await adminSupabase
        .from("sub_categories")
        .select("id")
        .eq("id", subCategoryId)
        .eq("category_id", categoryId)
        .single();
      if (error || !data) {
        return Response.json(
          { error: "Sub kategori tidak ditemukan untuk kategori yang dipilih." },
          { status: 400 }
        );
      }
    }

    const tryoutId = crypto.randomUUID();
    const materialPath = await uploadTryoutMaterial(
      adminSupabase,
      tryoutId,
      materialFile
    );

    let thumbnailPath: string | null = null;

    try {
      const thumbnail = await uploadTryoutThumbnail(
        adminSupabase,
        { tryoutId, title },
        { ensureBucket: true }
      );
      thumbnailPath = thumbnail.path;

      const { error: tryoutError } = await adminSupabase.from("tryouts").insert({
        id: tryoutId,
        learning_path_id: learningPathId || null,
        category_id: categoryId || null,
        sub_category_id: subCategoryId || null,
        title,
        total_questions: questionCount,
        duration_minutes: durationMinutes,
        question_notes: questionNotes || null,
        thumbnail_url: thumbnail.publicUrl,
        thumbnail_path: thumbnail.path,
        status,
        material_file_url: materialPath,
        material_file_name: materialFile.name || null,
        material_file_type: materialFile.type || null,
        material_file_size: materialFile.size || null,
        ai_generation_status: "pending",
        ai_generation_notes: questionNotes || "Queued with Trigger.dev",
      });

      if (tryoutError) {
        throw new Error(tryoutError.message || "Gagal membuat data tryout.");
      }

      const handle = await tasks.trigger<typeof generateTryoutTask>(
        "generate-tryout",
        { tryoutId, materialPath },
        {
          tags: [`tryout:${tryoutId}`],
          idempotencyKey: `generate-tryout-${tryoutId}`,
        }
      );

      const { error: runIdError } = await adminSupabase
        .from("tryouts")
        .update({ ai_generation_run_id: handle.id })
        .eq("id", tryoutId);

      if (runIdError) {
        console.error("Gagal menyimpan Trigger.dev run ID:", runIdError.message);
      }

      return Response.json(
        {
          tryoutId,
          runId: handle.id,
          tryoutTitle: title,
          questionCount,
          generationStatus: "pending",
        },
        { status: 202 }
      );
    } catch (error) {
      await adminSupabase.from("tryouts").delete().eq("id", tryoutId);
      await adminSupabase.storage
        .from(TRYOUT_MATERIAL_BUCKET)
        .remove([materialPath]);

      if (thumbnailPath) {
        await adminSupabase.storage
          .from(TRYOUT_THUMBNAIL_BUCKET)
          .remove([thumbnailPath]);
      }

      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memasukkan generate tryout ke antrean.";

    return Response.json({ error: message }, { status: 500 });
  }
}
