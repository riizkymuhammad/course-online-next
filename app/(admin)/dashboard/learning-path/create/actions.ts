"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/text";

export async function createLearningPath(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim() || "draft";
  const allowedStatuses = new Set(["draft", "published", "archived"]);

  if (!title) {
    redirect("/dashboard/learning-path/create?error=title-required");
  }

  if (!allowedStatuses.has(status)) {
    redirect("/dashboard/learning-path/create?error=invalid-status");
  }

  const slug = slugify(title);

  if (!slug) {
    redirect("/dashboard/learning-path/create?error=invalid-title");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("learning_paths").insert({
    title,
    slug,
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
