"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";

type TryoutItem = {
  id: string;
  title: string;
  learningPath: string;
  learningPathTitle: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  categoryPath: string;
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

  if (normalizedCategory.includes("cpns")) return "#144272";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "#205295";
  }

  return "#2C74B3";
}

export default function TryoutListClient({
  tryouts,
  catalogLabel = "Tryout",
}: {
  tryouts: TryoutItem[];
  catalogLabel?: "Tryout" | "Course";
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("all");
  const deferredQuery = useDeferredValue(query);
  const catalogLabelLower = catalogLabel.toLowerCase();

  const categoryOptions = useMemo(
    () => getUniqueOptions(tryouts.map((item) => item.category)),
    [tryouts]
  );

  const subCategoryOptions = useMemo(() => {
    if (selectedCategory === "all") return [];

    return getUniqueOptions(
      tryouts
        .filter((item) => item.category === selectedCategory)
        .map((item) => item.subCategory)
    );
  }, [selectedCategory, tryouts]);

  const subSubCategoryOptions = useMemo(() => {
    if (selectedCategory === "all" || selectedSubCategory === "all") return [];

    return getUniqueOptions(
      tryouts
        .filter(
          (item) =>
            item.category === selectedCategory && item.subCategory === selectedSubCategory
        )
        .map((item) => item.subSubCategory)
    );
  }, [selectedCategory, selectedSubCategory, tryouts]);

  const filteredTryouts = tryouts.filter((item) => {
    const normalizedQuery = normalizeText(deferredQuery);
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSubCategory =
      selectedSubCategory === "all" || item.subCategory === selectedSubCategory;
    const matchesSubSubCategory =
      selectedSubSubCategory === "all" || item.subSubCategory === selectedSubSubCategory;
    const matchesQuery =
      !normalizedQuery ||
      normalizeText(item.title).includes(normalizedQuery) ||
      normalizeText(item.learningPath).includes(normalizedQuery) ||
      normalizeText(item.learningPathTitle).includes(normalizedQuery) ||
      normalizeText(item.categoryPath).includes(normalizedQuery);

    return matchesCategory && matchesSubCategory && matchesSubSubCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Halaman {catalogLabel}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white/90 sm:text-3xl">
              Koleksi {catalogLabel}
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {filteredTryouts.length} {catalogLabelLower}
          </p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="tryout-search"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Pencarian
            </label>
            <input
              id="tryout-search"
              value={query}
              onChange={(event) => {
                const nextValue = event.target.value;
                startTransition(() => {
                  setQuery(nextValue);
                });
              }}
              placeholder={`Cari judul ${catalogLabelLower}, learning path, atau kategori...`}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            />
          </div>

          <FilterSelect
            id="category-filter"
            label="Kategori"
            value={selectedCategory}
            allLabel="Semua Kategori"
            options={categoryOptions}
            onChange={(nextValue) => {
              startTransition(() => {
                setSelectedCategory(nextValue);
                setSelectedSubCategory("all");
                setSelectedSubSubCategory("all");
              });
            }}
          />

          <FilterSelect
            id="sub-category-filter"
            label="Sub Kategori"
            value={selectedSubCategory}
            allLabel="Semua Sub Kategori"
            options={subCategoryOptions}
            disabled={selectedCategory === "all" || subCategoryOptions.length === 0}
            onChange={(nextValue) => {
              startTransition(() => {
                setSelectedSubCategory(nextValue);
                setSelectedSubSubCategory("all");
              });
            }}
          />

          <FilterSelect
            id="sub-sub-category-filter"
            label="Sub Sub Kategori"
            value={selectedSubSubCategory}
            allLabel="Semua Sub Sub Kategori"
            options={subSubCategoryOptions}
            disabled={
              selectedCategory === "all" ||
              selectedSubCategory === "all" ||
              subSubCategoryOptions.length === 0
            }
            onChange={(nextValue) => {
              startTransition(() => {
                setSelectedSubSubCategory(nextValue);
              });
            }}
          />
        </div>
      </section>

      {filteredTryouts.length ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTryouts.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-label={`Buka ${catalogLabelLower} ${item.title}`}
              className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:shadow-md">
                <div
                  className="relative flex h-40 items-center justify-center"
                  style={{ backgroundColor: getCardBackground(item.category) }}
                >
                  <span className="absolute left-3 top-3 rounded bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                    {item.category || "Umum"}
                  </span>
                  <span className="line-clamp-3 px-6 text-center text-base font-semibold text-white/95">
                    {item.title}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 text-md font-semibold text-slate-900">{item.title}</h3>
                  <span className="mt-1 w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-small text-slate-600">
                    {item.subCategory || "Umum"}
                  </span>
                </div>
              </article>
            </Link>
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

function FilterSelect({
  id,
  label,
  value,
  allLabel,
  options,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  allLabel: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:disabled:bg-white/[0.02] dark:disabled:text-gray-500"
      >
        <option value="all">{allLabel}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
