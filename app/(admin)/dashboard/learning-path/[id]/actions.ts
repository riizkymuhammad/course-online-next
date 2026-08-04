"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ReorderResult = { success: boolean; error?: string };

export async function addTryoutsToLearningPath(
  learningPathId: string,
  tryoutIds: string[]
): Promise<ReorderResult> {
  const uniqueTryoutIds = [...new Set(tryoutIds)];
  if (!learningPathId || uniqueTryoutIds.length === 0) {
    return { success: false, error: "Pilih minimal satu tryout yang ingin ditambahkan." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || getUserRole(user) !== "admin") {
    return { success: false, error: "Anda tidak memiliki izin untuk menambahkan tryout." };
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) return { success: false, error: "Konfigurasi server Supabase belum lengkap." };

  const [{ data: learningPath }, { data: selectedTryouts, error: tryoutsError }, { data: lastTryout, error: orderError }] = await Promise.all([
    adminSupabase.from("learning_paths").select("id").eq("id", learningPathId).maybeSingle(),
    adminSupabase.from("tryouts").select("id, learning_path_id").in("id", uniqueTryoutIds),
    adminSupabase.from("tryouts").select("learning_path_order").eq("learning_path_id", learningPathId).order("learning_path_order", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ]);

  if (!learningPath) return { success: false, error: "Learning path tidak ditemukan." };
  if (tryoutsError) return { success: false, error: tryoutsError.message };
  if (selectedTryouts?.length !== uniqueTryoutIds.length) return { success: false, error: "Satu atau beberapa tryout tidak ditemukan." };
  if (selectedTryouts.some((tryout) => tryout.learning_path_id)) return { success: false, error: "Satu atau beberapa tryout sudah digunakan pada learning path lain." };
  if (orderError) return { success: false, error: orderError.message };

  const firstOrder = (lastTryout?.learning_path_order ?? -1) + 1;
  const updates = await Promise.all(uniqueTryoutIds.map((tryoutId, index) =>
    adminSupabase.from("tryouts")
      .update({ learning_path_id: learningPathId, learning_path_order: firstOrder + index })
      .eq("id", tryoutId)
      .is("learning_path_id", null)
      .select("id")
      .maybeSingle()
  ));
  const updateError = updates.find((result) => result.error)?.error;
  if (updateError) return { success: false, error: updateError.message };
  if (updates.some((result) => !result.data)) return { success: false, error: "Satu atau beberapa tryout baru saja digunakan pada learning path lain." };

  revalidatePath(`/dashboard/learning-path/${learningPathId}`);
  revalidatePath("/dashboard/tryout-management");
  revalidatePath("/tryouts");
  return { success: true };
}

export async function reorderLearningPathTryouts(
  learningPathId: string,
  orderedTryoutIds: string[]
): Promise<ReorderResult> {
  if (!learningPathId || orderedTryoutIds.length === 0 || new Set(orderedTryoutIds).size !== orderedTryoutIds.length) {
    return { success: false, error: "Urutan tryout tidak valid." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || getUserRole(user) !== "admin") {
    return { success: false, error: "Anda tidak memiliki izin untuk mengubah urutan tryout." };
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) return { success: false, error: "Konfigurasi server Supabase belum lengkap." };

  const { data: existingTryouts, error: lookupError } = await adminSupabase
    .from("tryouts").select("id").eq("learning_path_id", learningPathId);
  if (lookupError) return { success: false, error: lookupError.message };

  const existingIds = new Set((existingTryouts ?? []).map((item) => item.id));
  if (existingIds.size !== orderedTryoutIds.length || orderedTryoutIds.some((id) => !existingIds.has(id))) {
    return { success: false, error: "Daftar tryout telah berubah. Muat ulang halaman lalu coba lagi." };
  }

  const results = await Promise.all(orderedTryoutIds.map((id, index) =>
    adminSupabase.from("tryouts").update({ learning_path_order: index }).eq("id", id).eq("learning_path_id", learningPathId)
  ));
  const updateError = results.find((result) => result.error)?.error;
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/dashboard/learning-path/${learningPathId}`);
  return { success: true };
}
