"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type TryoutCard = {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  backgroundColor: string;
  href: string;
};

type CategoryKey = "all" | "cpns" | "english" | "it";

const categoryFilters: Array<{ key: CategoryKey; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "cpns", label: "CPNS" },
  { key: "english", label: "Bahasa Inggris" },
  { key: "it", label: "TI & Perangkat Lunak" },
];

const MAX_VISIBLE_TRYOUTS = 12;

function getCategoryKey(category: string): Exclude<CategoryKey, "all"> {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes("cpns")) return "cpns";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "english";
  }

  return "it";
}

function TryoutCardItem({ tryout }: { tryout: TryoutCard }) {
  return (
    <Link
      href={tryout.href}
      aria-label={`Buka tryout ${tryout.title}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:shadow-md">
        <div
          className="relative flex h-40 items-center justify-center"
          style={{ backgroundColor: tryout.backgroundColor }}
        >
          <span className="absolute left-3 top-3 rounded bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            {tryout.category}
          </span>
          <span className="line-clamp-3 px-6 text-center text-base font-semibold text-white/95">
            {tryout.title}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-md font-semibold text-slate-900">{tryout.title}</h3>
          <span className="mt-1 w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-small text-slate-600">
            {tryout.subCategory}
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function TryoutList({ tryouts }: { tryouts: TryoutCard[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const filteredTryouts = useMemo(
    () =>
      activeCategory === "all"
        ? tryouts
        : tryouts.filter((tryout) => getCategoryKey(tryout.category) === activeCategory),
    [activeCategory, tryouts]
  );
  const visibleTryouts = filteredTryouts.slice(0, MAX_VISIBLE_TRYOUTS);
  const hasMoreTryouts = filteredTryouts.length > MAX_VISIBLE_TRYOUTS;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-pressed={activeCategory === filter.key}
              onClick={() => setActiveCategory(filter.key)}
              className={`inline-flex h-8 items-center rounded-md border px-4 text-xs font-bold transition ${
                activeCategory === filter.key
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:text-brand-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <Link
          href="/tryouts"
          className="inline-flex h-8 w-fit items-center justify-center rounded-md border border-brand-200 px-4 text-xs font-bold text-brand-600 transition hover:bg-brand-50"
        >
          Lihat semua tryout
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visibleTryouts.map((tryout) => (
          <TryoutCardItem key={tryout.id} tryout={tryout} />
        ))}
      </div>

      {hasMoreTryouts ? (
        <div className="mt-7 flex justify-center">
          <Link
            href="/tryouts"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-brand-200 px-5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Lihat tryout lebih banyak
          </Link>
        </div>
      ) : null}
    </div>
  );
}
