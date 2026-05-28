"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowRightIcon, ChevronLeftIcon } from "@/icons";

type PromoSlide = {
  id: number;
  image: string;
  badge: string;
  title: string;
  description: string;
  meta: string;
};

export default function AppPromoSlider({ slides }: { slides: PromoSlide[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(direction: "left" | "right") {
    const container = containerRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "right" ? container.clientWidth : -container.clientWidth,
      behavior: "smooth",
    });
  }

  if (!slides.length) {
    return null;
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex snap-x snap-mandatory gap-4">
          {slides.map((slide, index) => (
            <article
              key={slide.id}
              className="relative h-[220px] min-w-full snap-start overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:h-[240px] lg:min-w-[calc((100%_-_1rem)/2)] xl:h-[260px]"
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index < 2}
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                  {slide.badge}
                </span>
                <h2 className="mt-3 max-w-md text-lg font-semibold leading-6 sm:text-xl">
                  {slide.title}
                </h2>
                <p className="mt-2 text-xs font-medium text-blue-light-100 sm:text-sm">
                  {slide.meta}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Geser promo ke kiri"
          onClick={() => scrollByAmount("left")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-theme-sm backdrop-blur transition hover:bg-white dark:bg-gray-900/85 dark:text-gray-300"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Geser promo ke kanan"
          onClick={() => scrollByAmount("right")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-theme-sm backdrop-blur transition hover:bg-white dark:bg-gray-900/85 dark:text-gray-300"
        >
          <ArrowRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
