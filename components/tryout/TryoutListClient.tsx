"use client";

import Image from "next/image";
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
  totalQuestions: number;
  href: string;
  image: string;
};

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function isSvgImage(value: string) {
  return value.toLowerCase().includes(".svg");
}

function getUniqueOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "id")
  );
}

export default function TryoutListClient({
  tryouts,
}: {
  tryouts: TryoutItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("all");
  const deferredQuery = useDeferredValue(query);

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
              Halaman Tryout
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white/90 sm:text-3xl">
              Koleksi Tryout
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {filteredTryouts.length} tryout
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
              placeholder="Cari judul tryout, learning path, atau kategori..."
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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {filteredTryouts.map((item) => {
            const isGeneratedThumbnail = isSvgImage(item.image);

            return (
              <Link
                key={item.id}
                href={item.href}
                className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm transition duration-300 hover:-translate-y-1 hover:shadow-theme-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="relative h-40 overflow-hidden border-b border-brand-200 bg-brand-500 p-5 dark:border-brand-500/20 dark:bg-brand-600">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    unoptimized={isGeneratedThumbnail}
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(min-width: 1280px) 20vw, (min-width: 640px) 50vw, 100vw"
                  />
                  {!isGeneratedThumbnail ? (
                    <div className="absolute inset-0 bg-linear-to-br from-brand-500/70 via-brand-500/35 to-brand-800/75" />
                  ) : null}
                  <div className="relative flex h-full flex-col justify-between">
                    <span className="inline-flex max-w-full rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.01em] text-white/90 backdrop-blur">
                      <span className="truncate">{item.learningPath}</span>
                    </span>
                    {!isGeneratedThumbnail ? (
                      <h3 className="max-w-[90%] text-lg font-semibold leading-7 text-white">
                        {item.title}
                      </h3>
                    ) : null}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                    <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                      {item.totalQuestions} soal
                    </span>
                    <span className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition group-hover:bg-brand-600">
                      Kerjakan
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center shadow-theme-sm dark:border-brand-500/20 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Tryout tidak ditemukan
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
