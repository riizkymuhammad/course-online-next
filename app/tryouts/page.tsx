import type { Metadata } from "next";
import { cookies } from "next/headers";
import PublicNavbar from "@/components/header/PublicNavbarWithSearch";
import TryoutListClient from "@/components/tryout/TryoutListClient";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import {
  buildLearningPathLabel,
} from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";
import { buildCategoryPath } from "@/lib/text";
import { slugify } from "@/lib/tryout";
import { getUserProfile } from "@/lib/user-profile";

type TryoutRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  thumbnail_url: string | null;
  status: "draft" | "published" | "archived" | null;
};

type LearningPathRow = {
  id: string;
  title: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

type SubCategoryRow = {
  id: string;
  category_id: string;
  name: string;
};

export const metadata: Metadata = {
  title: "Semua Tryout",
  description: "Daftar seluruh tryout dengan pencarian dan filter kategori.",
};

export default async function TryoutsPage() {
  const supabase = await createClient();
  const [
    { data: { user } },
    cookieStore,
    { data: tryoutRows },
    { data: learningPathRows },
    { data: categoryRows },
    { data: subCategoryRows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    cookies(),
    supabase.from("tryouts").select("id, title, learning_path_id, category_id, sub_category_id, thumbnail_url, status").eq("status", "published").order("updated_at", { ascending: false }),
    supabase.from("learning_paths").select("id, title").eq("status", "published"),
    supabase.from("categories").select("id, name"),
    supabase.from("sub_categories").select("id, category_id, name"),
  ]);
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });
  const userProfile = user ? getUserProfile(user) : null;
  const PublicNavbarWithSearchAndUserDropdown = user
    ? (await import("@/components/header/PublicNavbarWithSearchAndUserDropdown")).default
    : null;

  const learningPaths = (learningPathRows as LearningPathRow[] | null) ?? [];
  const learningPathMap = new Map(learningPaths.map((item) => [item.id, item]));
  const categoryMap = new Map(
    ((categoryRows ?? []) as CategoryRow[]).map((item) => [item.id, item.name])
  );
  const subCategoryMap = new Map(
    ((subCategoryRows ?? []) as SubCategoryRow[]).map((item) => [item.id, item.name])
  );

  const tryouts = ((tryoutRows as TryoutRow[] | null) ?? []).map((item) => {
    const learningPath = item.learning_path_id
      ? learningPathMap.get(item.learning_path_id)
      : null;
    const category =
      (item.category_id ? categoryMap.get(item.category_id)?.trim() : undefined) ??
      "";
    const subCategory =
      (item.sub_category_id ? subCategoryMap.get(item.sub_category_id)?.trim() : undefined) ??
      "";
    const subSubCategory = "";
    const categoryPath = buildCategoryPath(category, subCategory);
    const label = learningPath ? buildLearningPathLabel(learningPath) : categoryPath || "Tryout Umum";

    return {
      id: item.id,
      title: item.title,
      learningPath: label,
      learningPathTitle: learningPath?.title ?? label,
      category,
      subCategory,
      subSubCategory,
      categoryPath,
      imageUrl: item.thumbnail_url,
      href: `/tryout/${item.id}/${slugify(item.title)}`,
    };
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-white via-blue-light-25 to-white text-gray-900">
      {PublicNavbarWithSearchAndUserDropdown ? (
        <PublicNavbarWithSearchAndUserDropdown
          userProfile={userProfile}
          activeRole={activeRole}
          canSwitchRole={accountRole === "admin"}
        />
      ) : (
        <PublicNavbar
          userProfile={null}
          activeRole={activeRole}
          canSwitchRole={false}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TryoutListClient tryouts={tryouts} />
      </div>
    </main>
  );
}
