import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TryoutListClient from "@/components/tryout/TryoutListClient";
import {
  buildLearningPathCategoryPath,
  buildLearningPathLabel,
} from "@/lib/learning-path";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";

type TryoutRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  total_questions: number | null;
  thumbnail_url: string | null;
  status: "draft" | "published" | "archived" | null;
};

type LearningPathRow = {
  id: string;
  title: string;
  category: string | null;
  sub_category: string | null;
  sub_sub_category: string | null;
};

const fallbackImages = [
  "/images/product/product-01.jpg",
  "/images/product/product-02.jpg",
  "/images/product/product-03.jpg",
  "/images/product/product-04.jpg",
  "/images/product/product-05.jpg",
];

export const metadata: Metadata = {
  title: "Semua Tryout",
  description: "Daftar seluruh tryout dengan pencarian dan filter kategori.",
};

export default async function TryoutsPage() {
  const supabase = await createClient();

  const [{ data: tryoutRows }, { data: learningPathRows }] = await Promise.all([
    supabase
      .from("tryouts")
      .select("id, title, learning_path_id, total_questions, thumbnail_url, status")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("learning_paths")
      .select("id, title, category, sub_category, sub_sub_category")
      .eq("status", "published"),
  ]);

  const learningPaths = (learningPathRows as LearningPathRow[] | null) ?? [];
  const learningPathMap = new Map(learningPaths.map((item) => [item.id, item]));

  const tryouts = ((tryoutRows as TryoutRow[] | null) ?? []).map((item, index) => {
    const learningPath = item.learning_path_id
      ? learningPathMap.get(item.learning_path_id)
      : null;

    return {
      id: item.id,
      title: item.title,
      learningPath: learningPath ? buildLearningPathLabel(learningPath) : "Tryout Umum",
      learningPathTitle: learningPath?.title ?? "Tryout Umum",
      category: learningPath?.category?.trim() ?? "",
      subCategory: learningPath?.sub_category?.trim() ?? "",
      subSubCategory: learningPath?.sub_sub_category?.trim() ?? "",
      categoryPath: learningPath ? buildLearningPathCategoryPath(learningPath) : "",
      totalQuestions: item.total_questions ?? 0,
      href: `/tryout/${item.id}/${slugify(item.title)}`,
      image: item.thumbnail_url || fallbackImages[index % fallbackImages.length],
    };
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-white via-blue-light-25 to-white text-gray-900">
      <nav className="sticky top-0 z-50 border-b border-brand-100/70 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-theme-sm">
              <Image
                src="/images/logo/logo-icon.svg"
                alt="Logo platform belajar"
                width={20}
                height={20}
              />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">Course Online</p>
              <p className="text-xs text-gray-500">Materi dan tryout terarah</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-lg border border-brand-200 px-3.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 sm:inline-flex"
            >
              Homepage
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TryoutListClient tryouts={tryouts} />
      </div>
    </main>
  );
}
