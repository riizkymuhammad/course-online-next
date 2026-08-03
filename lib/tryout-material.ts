import type { SupabaseClient } from "@supabase/supabase-js";

export const TRYOUT_MATERIAL_BUCKET = "tryout-materials";
const TRYOUT_MATERIAL_FILE_SIZE_LIMIT = 50 * 1024 * 1024;

async function ensureTryoutMaterialBucket(supabase: SupabaseClient) {
  const { error: lookupError } = await supabase.storage.getBucket(
    TRYOUT_MATERIAL_BUCKET
  );

  if (!lookupError) return;

  const { error: createError } = await supabase.storage.createBucket(
    TRYOUT_MATERIAL_BUCKET,
    {
      public: false,
      allowedMimeTypes: ["application/pdf"],
      fileSizeLimit: TRYOUT_MATERIAL_FILE_SIZE_LIMIT,
    }
  );

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message || "Gagal membuat bucket materi tryout.");
  }
}

export async function uploadTryoutMaterial(
  supabase: SupabaseClient,
  tryoutId: string,
  materialFile: File
) {
  await ensureTryoutMaterialBucket(supabase);

  const path = `${tryoutId}/material.pdf`;
  const { error } = await supabase.storage
    .from(TRYOUT_MATERIAL_BUCKET)
    .upload(path, materialFile, {
      contentType: materialFile.type || "application/pdf",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message || "Gagal mengunggah PDF materi tryout.");
  }

  return path;
}
