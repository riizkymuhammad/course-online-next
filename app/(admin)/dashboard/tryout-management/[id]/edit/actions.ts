"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateTryout(formData: FormData) {
  const tryoutId = String(formData.get("tryout_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const learningPathId = String(formData.get("learning_path") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const subCategoryId = String(formData.get("sub_category_id") ?? "").trim();
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

  if (!categoryId && subCategoryId) {
    redirect(`/dashboard/tryout-management/${tryoutId}/edit?error=category-required`);
  }

  if (categoryId) {
    const { data: categoryRow, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .single();

    if (categoryError || !categoryRow) {
      redirect(`/dashboard/tryout-management/${tryoutId}/edit?error=category-not-found`);
    }
  }

  if (subCategoryId) {
    const { data: subCategoryRow, error: subCategoryError } = await supabase
      .from("sub_categories")
      .select("id")
      .eq("id", subCategoryId)
      .eq("category_id", categoryId)
      .single();

    if (subCategoryError || !subCategoryRow) {
      redirect(`/dashboard/tryout-management/${tryoutId}/edit?error=sub-category-not-found`);
    }
  }

  const { error } = await supabase
    .from("tryouts")
    .update({
      title,
      learning_path_id: learningPathId || null,
      category_id: categoryId || null,
      sub_category_id: subCategoryId || null,
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
  revalidatePath("/");
  revalidatePath("/tryouts");
  redirect("/dashboard/tryout-management?updated=1");
}
