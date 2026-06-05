"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createLearningPath(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const subCategory = String(formData.get("sub_category") ?? "").trim();
  const subSubCategory = String(formData.get("sub_sub_category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim() || "draft";

  if (!title) {
    redirect("/dashboard/learning-path/create?error=title-required");
  }

  const slug = slugify(title);

  if (!slug) {
    redirect("/dashboard/learning-path/create?error=invalid-title");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("learning_paths").insert({
    title,
    slug,
    category: category || null,
    sub_category: subCategory || null,
    sub_sub_category: subSubCategory || null,
    description: description || null,
    status,
  });

  if (error) {
    const errorCode = encodeURIComponent(error.code || "insert-failed");
    redirect(`/dashboard/learning-path/create?error=${errorCode}`);
  }

  revalidatePath("/dashboard/learning-path");
  redirect("/dashboard/learning-path?created=1");
}
