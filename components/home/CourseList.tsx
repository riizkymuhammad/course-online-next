"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CourseCard = {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  backgroundColor: string;
};

type CategoryKey = "all" | "cpns" | "english" | "it";

const categoryFilters: Array<{ key: CategoryKey; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "cpns", label: "CPNS" },
  { key: "english", label: "Bahasa Inggris" },
  { key: "it", label: "TI & Perangkat Lunak" },
];

function getCategoryKey(category: string): Exclude<CategoryKey, "all"> {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes("cpns")) return "cpns";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "english";
  }

  return "it";
}

function CourseCardItem({ course, actionHref }: { course: CourseCard; actionHref: string }) {
  return (
    <Link
      href={actionHref}
      aria-label={`Buka course ${course.title}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:shadow-md">
        <div
          className="relative flex h-40 items-center justify-center"
          style={{ backgroundColor: course.backgroundColor }}
        >
          <span className="absolute left-3 top-3 rounded bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            {course.category}
          </span>
          <span className="line-clamp-3 px-6 text-center text-base font-semibold text-white/95">
            {course.title}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h4 className="line-clamp-2 text-md font-semibold text-slate-900">{course.title}</h4>
          <span className="mt-1 w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-small text-slate-600">
            {course.subCategory}
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function CourseList({
  courses,
  actionHref,
}: {
  courses: CourseCard[];
  actionHref: string;
}) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const filteredCourses = useMemo(
    () =>
      activeCategory === "all"
        ? courses
        : courses.filter((course) => getCategoryKey(course.category) === activeCategory),
    [activeCategory, courses]
  );

  return (
    <div className="mt-8">
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

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filteredCourses.map((course) => (
          <CourseCardItem key={course.id} course={course} actionHref={actionHref} />
        ))}
      </div>
    </div>
  );
}
