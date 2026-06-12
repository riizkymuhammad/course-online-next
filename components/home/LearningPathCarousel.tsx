"use client";

import { useRef } from "react";

type LearningPathItem = {
  id: string;
  title: string;
  categoryPath?: string;
  materialCount: number;
};

export default function LearningPathCarousel({
  items,
}: {
  items: LearningPathItem[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const amount = Math.max(container.clientWidth * 0.8, 320);
    container.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Geser learning path ke kiri"
          onClick={() => scrollByAmount("left")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-base font-semibold text-brand-600 shadow-theme-sm transition hover:bg-brand-50"
        >
          {"<"}
        </button>
        <button
          type="button"
          aria-label="Geser learning path ke kanan"
          onClick={() => scrollByAmount("right")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-base font-semibold text-brand-600 shadow-theme-sm transition hover:bg-brand-50"
        >
          {">"}
        </button>
      </div>

      <div ref={containerRef} className="overflow-x-auto pb-3">
        <div className="flex min-w-max snap-x snap-mandatory gap-4">
          {items.map((path) => (
            <article
              key={path.id}
              className="w-[220px] shrink-0 snap-start rounded-lg border border-brand-100 bg-white p-4 shadow-theme-sm transition hover:-translate-y-1 hover:shadow-theme-md sm:w-[240px]"
            >
              {path.categoryPath ? (
                <p className="mb-2 line-clamp-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                  {path.categoryPath}
                </p>
              ) : null}
              <h3 className="text-base font-semibold leading-6 text-gray-900">{path.title}</h3>
              <p className="mt-1 text-sm font-semibold text-brand-600">
                {path.materialCount} materi
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
