"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getStringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getSafePathValue(formData: FormData, key: string, fallback: string) {
  const value = getStringValue(formData, key);

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return fallback;
}

export async function createCategory(formData: FormData) {
  const name = getStringValue(formData, "name");
  const redirectTo = getSafePathValue(formData, "redirect_to", "/dashboard/master-data/kategori");

  if (!name) {
    redirect("/dashboard/master-data/kategori/create?error=name-required");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name });

  if (error) {
    const errorCode = encodeURIComponent(error.code || "insert-failed");
    redirect(`/dashboard/master-data/kategori/create?error=${errorCode}`);
  }

  revalidatePath("/dashboard/master-data/kategori");
  revalidatePath("/dashboard/master-data/sub-kategori");
  redirect(`${redirectTo}?categoryCreated=1`);
}

export async function createSubCategory(formData: FormData) {
  const categoryId = getStringValue(formData, "category_id");
  const name = getStringValue(formData, "name");
  const redirectTo = getSafePathValue(
    formData,
    "redirect_to",
    "/dashboard/master-data/sub-kategori"
  );
  const currentPath = getSafePathValue(
    formData,
    "current_path",
    "/dashboard/master-data/sub-kategori/create"
  );

  if (!categoryId) {
    redirect(`${currentPath}?error=category-required`);
  }

  if (!name) {
    redirect(`${currentPath}?error=name-required`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sub_categories").insert({
    category_id: categoryId,
    name,
  });

  if (error) {
    const errorCode = encodeURIComponent(error.code || "insert-failed");
    redirect(`${currentPath}?error=${errorCode}`);
  }

  revalidatePath("/dashboard/master-data/kategori");
  revalidatePath("/dashboard/master-data/sub-kategori");
  redirect(`${redirectTo}?subCategoryCreated=1`);
}
