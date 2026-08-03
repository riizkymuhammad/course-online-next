"use server";

import { revalidatePath } from "next/cache";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRYOUT_MATERIAL_BUCKET } from "@/lib/tryout-material";
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

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return {
      success: false,
      error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.",
    };
  }

  const { data: tryout, error: tryoutLookupError } = await adminSupabase
    .from("tryouts")
    .select("id, thumbnail_path, material_file_url")
    .eq("id", tryoutId)
    .maybeSingle();

  if (tryoutLookupError || !tryout) {
    return {
      success: false,
      error: tryoutLookupError?.message || "Tryout tidak ditemukan.",
    };
  }

  const { data: questions, error: questionsLookupError } = await adminSupabase
    .from("tryout_questions")
    .select("id")
    .eq("tryout_id", tryoutId);

  if (questionsLookupError) {
    return { success: false, error: questionsLookupError.message };
  }

  const questionIds = (questions ?? []).map((question) => question.id);
  const { error: answersError } = await adminSupabase
    .from("tryout_attempt_answers")
    .delete()
    .eq("tryout_id", tryoutId);

  if (answersError) {
    return { success: false, error: answersError.message };
  }

  const { error: attemptsError } = await adminSupabase
    .from("tryout_attempts")
    .delete()
    .eq("tryout_id", tryoutId);

  if (attemptsError) {
    return { success: false, error: attemptsError.message };
  }

  if (questionIds.length > 0) {
    const { error: clearCorrectAnswersError } = await adminSupabase
      .from("tryout_questions")
      .update({ correct_option_id: null })
      .in("id", questionIds);

    if (clearCorrectAnswersError) {
      return { success: false, error: clearCorrectAnswersError.message };
    }

    const { error: optionsError } = await adminSupabase
      .from("tryout_question_options")
      .delete()
      .in("tryout_question_id", questionIds);

    if (optionsError) {
      return { success: false, error: optionsError.message };
    }
  }

  const { error: questionsError } = await adminSupabase
    .from("tryout_questions")
    .delete()
    .eq("tryout_id", tryoutId);

  if (questionsError) {
    return { success: false, error: questionsError.message };
  }

  const { error: deleteTryoutError } = await adminSupabase
    .from("tryouts")
    .delete()
    .eq("id", tryoutId);

  if (deleteTryoutError) {
    return { success: false, error: deleteTryoutError.message };
  }

  if (tryout.thumbnail_path) {
    await adminSupabase.storage
      .from(TRYOUT_THUMBNAIL_BUCKET)
      .remove([tryout.thumbnail_path]);
  }

  if (tryout.material_file_url) {
    await adminSupabase.storage
      .from(TRYOUT_MATERIAL_BUCKET)
      .remove([tryout.material_file_url]);
  }

  revalidatePath("/dashboard/tryout-management");
  revalidatePath("/tryouts");
  revalidatePath("/");

  return { success: true };
}
