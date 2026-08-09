"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import LearningCard from "@/components/organisms/learning/LearningCard";

type TryoutItem = {
  id: string;
  title: string;
  learningPath: string;
  learningPathTitle: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  categoryPath: string;
  imageUrl?: string | null;
  href: string;
};

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function getUniqueOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "id")
  );
}

function getCardBackground(category: string) {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes("cpns")) return "#2563EB";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "#1D4ED8";
  }

  return "#1E40AF";
}

export default function TryoutListClient({
  tryouts,
  catalogLabel = "Tryout",
}: {
  tryouts: TryoutItem[];
  catalogLabel?: "Tryout" | "Course";
}) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const query = searchParams.get("q") ?? "";
  const catalogLabelLower = catalogLabel.toLowerCase();

  const categoryOptions = useMemo(
    () => getUniqueOptions(tryouts.map((item) => item.category)),
    [tryouts]
  );

  const filteredTryouts = tryouts.filter((item) => {
    const normalizedQuery = normalizeText(query);
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesQuery =
      !normalizedQuery ||
      normalizeText(item.title).includes(normalizedQuery) ||
      normalizeText(item.learningPath).includes(normalizedQuery) ||
      normalizeText(item.learningPathTitle).includes(normalizedQuery) ||
      normalizeText(item.categoryPath).includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white/90 sm:text-3xl">
            Koleksi {catalogLabel}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {filteredTryouts.length} {catalogLabelLower}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Semua" },
                ...categoryOptions.map((item) => ({ value: item, label: item })),
              ].map((option) => {
                  const isSelected = selectedCategory === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        startTransition(() => {
                          setSelectedCategory(option.value);
                        });
                      }}
                      className={`h-9 rounded-md border px-3.5 text-sm font-medium transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
              })}
            </div>
          </div>

        </div>
      </section>

      {filteredTryouts.length ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTryouts.map((item) => (
            <LearningCard
              key={item.id}
              label={catalogLabel}
              rounded={catalogLabel === "Tryout" ? "md" : "xl"}
              item={{
                ...item,
                backgroundColor: getCardBackground(item.category),
              }}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center shadow-theme-sm dark:border-brand-500/20 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            {catalogLabel} tidak ditemukan
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Coba ganti kata kunci pencarian atau pilih kategori lain.
          </p>
        </section>
      )}
    </div>
  );
}
