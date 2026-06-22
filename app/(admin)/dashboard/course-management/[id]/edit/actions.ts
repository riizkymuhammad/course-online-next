"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateCourse(formData: FormData) {
  const courseId = String(formData.get("course_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const learningPathId = String(formData.get("learning_path") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const subCategoryId = String(formData.get("sub_category_id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "published").trim() || "published";

  if (!courseId) {
    redirect("/dashboard/course-management?error=course-not-found");
  }

  if (!title || !status) {
    redirect(`/dashboard/course-management/${courseId}/edit?error=required-fields`);
  }

  if (!categoryId && subCategoryId) {
    redirect(`/dashboard/course-management/${courseId}/edit?error=category-required`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || getUserRole(user) !== "admin") {
    redirect(`/dashboard/course-management/${courseId}/edit?error=unauthorized`);
  }

  if (categoryId) {
    const { data: categoryRow, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .single();

    if (categoryError || !categoryRow) {
      redirect(`/dashboard/course-management/${courseId}/edit?error=category-not-found`);
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
      redirect(`/dashboard/course-management/${courseId}/edit?error=sub-category-not-found`);
    }
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    redirect(`/dashboard/course-management/${courseId}/edit?error=server-configuration`);
  }

  const { error } = await adminSupabase
    .from("courses")
    .update({
      title,
      learning_path_id: learningPathId || null,
      category_id: categoryId || null,
      sub_category_id: subCategoryId || null,
      description: description || null,
      status,
    })
    .eq("id", courseId);

  if (error) {
    redirect(`/dashboard/course-management/${courseId}/edit?error=update-failed`);
  }

  revalidatePath("/");
  revalidatePath("/dashboard/course-management");
  revalidatePath(`/dashboard/course-management/${courseId}/edit`);
  revalidatePath(`/dashboard/course-management/${courseId}/material`);
  redirect("/dashboard/course-management?updated=1");
}
