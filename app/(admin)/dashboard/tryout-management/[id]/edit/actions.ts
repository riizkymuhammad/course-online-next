"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateTryout(formData: FormData) {
  const tryoutId = String(formData.get("tryout_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const learningPathId = String(formData.get("learning_path") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const subCategory = String(formData.get("sub_category") ?? "").trim();
  const questionCount = Number(formData.get("question_count") ?? 0);
  const status = String(formData.get("status") ?? "draft").trim() || "draft";
  const questionNotes = String(formData.get("question_notes") ?? "").trim();

  if (!tryoutId) {
    redirect("/dashboard/tryout-management?error=tryout-not-found");
  }

  if (!title || !questionCount || !status) {
    redirect(`/dashboard/tryout-management/${tryoutId}/edit?error=required-fields`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tryouts")
    .update({
      title,
      learning_path_id: learningPathId || null,
      category: category || null,
      sub_category: subCategory || null,
      total_questions: questionCount,
      question_notes: questionNotes || null,
      status,
    })
    .eq("id", tryoutId);

  if (error) {
    const errorCode = encodeURIComponent(error.code || "update-failed");
    redirect(`/dashboard/tryout-management/${tryoutId}/edit?error=${errorCode}`);
  }

  revalidatePath("/dashboard/tryout-management");
  revalidatePath(`/dashboard/tryout-management/${tryoutId}/edit`);
  revalidatePath(`/tryout/${tryoutId}`);
  redirect("/dashboard/tryout-management?updated=1");
}
