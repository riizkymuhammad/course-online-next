import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TryoutListClient from "@/components/tryout/TryoutListClient";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";

type TryoutRow = {
  id: string;
  title: string;
  learning_path_id: string | null;
  total_questions: number | null;
  status: "draft" | "published" | "archived" | null;
};

type LearningPathRow = {
  id: string;
  title: string;
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
  description: "Daftar seluruh tryout dengan pencarian dan filter learning path.",
};

export default async function TryoutsPage() {
  const supabase = await createClient();

  const [{ data: tryoutRows }, { data: learningPathRows }] = await Promise.all([
    supabase
      .from("tryouts")
      .select("id, title, learning_path_id, total_questions, status")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase.from("learning_paths").select("id, title").eq("status", "published"),
  ]);

  const learningPathMap = new Map(
    ((learningPathRows as LearningPathRow[] | null) ?? []).map((item) => [item.id, item.title])
  );

  const tryouts = ((tryoutRows as TryoutRow[] | null) ?? []).map((item, index) => ({
    id: item.id,
    title: item.title,
    learningPath: item.learning_path_id
      ? learningPathMap.get(item.learning_path_id) || "Learning Path"
      : "Tryout Umum",
    totalQuestions: item.total_questions ?? 0,
    href: `/tryout/${item.id}/${slugify(item.title)}`,
    image: fallbackImages[index % fallbackImages.length],
  }));

  const learningPathOptions = Array.from(new Set(tryouts.map((item) => item.learningPath))).sort();

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
        <TryoutListClient tryouts={tryouts} learningPathOptions={learningPathOptions} />
      </div>
    </main>
  );
}
