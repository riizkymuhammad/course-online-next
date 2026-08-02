"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRYOUT_THUMBNAIL_BUCKET } from "@/lib/tryout-thumbnail";

export type DeleteTryoutResult = {
  success: boolean;
  error?: string;
};

export async function deleteTryoutAction(
  action: string,
  tryoutId: string
): Promise<DeleteTryoutResult> {
  if (action !== "delete" || !tryoutId) {
    return { success: false, error: "Permintaan hapus tryout tidak valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || getUserRole(user) !== "admin") {
    return { success: false, error: "Anda tidak memiliki izin untuk menghapus tryout." };
  }

  const { data, error } = await supabase.rpc("delete_tryout_with_relations", {
    p_tryout_id: tryoutId,
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Tryout beserta soal dan opsi jawabannya gagal dihapus.",
    };
  }

  const thumbnailPath = typeof data === "string" ? data : null;
  const adminSupabase = createAdminClient();

  if (thumbnailPath && adminSupabase) {
    await adminSupabase.storage
      .from(TRYOUT_THUMBNAIL_BUCKET)
      .remove([thumbnailPath]);
  }

  revalidatePath("/dashboard/tryout-management");
  revalidatePath("/tryouts");
  revalidatePath("/");

  return { success: true };
}
