import type { Metadata } from "next";
import { cookies } from "next/headers";
import TryoutListClient from "@/components/tryout/TryoutListClient";
import AppHeader from "@/layout/AppHeader";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import {
  buildLearningPathCategoryPath,
  buildLearningPathLabel,
} from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";
import { getUserProfile } from "@/lib/user-profile";

type CourseRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  status: "draft" | "published" | "archived" | null;
};

type LearningPathRow = {
  id: string;
  title: string;
  category: string | null;
  sub_category: string | null;
  sub_sub_category: string | null;
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

function buildCategoryPath(category: string | null, subCategory: string | null) {
  return [category?.trim() ?? "", subCategory?.trim() ?? ""].filter(Boolean).join(" > ");
}

export const metadata: Metadata = {
  title: "Semua Course",
  description: "Daftar seluruh course dengan pencarian dan filter kategori.",
};

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });
  const [{ data: courseRows }, { data: learningPathRows }, { data: categoryRows }, { data: subCategoryRows }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, title, learning_path_id, category_id, sub_category_id, status")
        .eq("status", "published")
        .order("updated_at", { ascending: false }),
      supabase
        .from("learning_paths")
        .select("id, title, category, sub_category, sub_sub_category")
        .eq("status", "published"),
      supabase.from("categories").select("id, name"),
      supabase.from("sub_categories").select("id, category_id, name"),
    ]);

  const learningPaths = (learningPathRows as LearningPathRow[] | null) ?? [];
  const learningPathMap = new Map(learningPaths.map((item) => [item.id, item]));
  const categoryMap = new Map(
    ((categoryRows ?? []) as CategoryRow[]).map((item) => [item.id, item.name])
  );
  const subCategoryMap = new Map(
    ((subCategoryRows ?? []) as SubCategoryRow[]).map((item) => [item.id, item.name])
  );
  const courses = ((courseRows as CourseRow[] | null) ?? []).map((item) => {
    const learningPath = item.learning_path_id ? learningPathMap.get(item.learning_path_id) : null;
    const category =
      learningPath?.category?.trim() ??
      (item.category_id ? categoryMap.get(item.category_id)?.trim() : undefined) ??
      "Umum";
    const subCategory =
      learningPath?.sub_category?.trim() ??
      learningPath?.sub_sub_category?.trim() ??
      (item.sub_category_id ? subCategoryMap.get(item.sub_category_id)?.trim() : undefined) ??
      "Umum";
    const subSubCategory = learningPath?.sub_sub_category?.trim() ?? "";
    const categoryPath = learningPath
      ? buildLearningPathCategoryPath(learningPath)
      : buildCategoryPath(category, subCategory);
    const label = learningPath ? buildLearningPathLabel(learningPath) : categoryPath || "Course Umum";

    return {
      id: item.id,
      title: item.title,
      learningPath: label,
      learningPathTitle: learningPath?.title ?? label,
      category,
      subCategory,
      subSubCategory,
      categoryPath,
      href: `/course/${item.id}/${slugify(item.title)}`,
    };
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-white via-blue-light-25 to-white text-gray-900">
      <AppHeader
        logoHref="/app"
        showSidebarToggle={false}
        userProfile={user ? getUserProfile(user) : undefined}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TryoutListClient tryouts={courses} catalogLabel="Course" />
      </div>
    </main>
  );
}
