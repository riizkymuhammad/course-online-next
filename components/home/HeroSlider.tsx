"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type HeroSlide = {
  id: number;
  image: string;
  badge: string;
  title: string;
  description: string;
  meta: string;
};

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-brand-100/80 bg-white shadow-theme-md">
      <div className="relative min-h-[360px] lg:min-h-[390px]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ${
              index === activeIndex
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/55 to-brand-700/10" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                {slide.badge}
              </span>
              <h2 className="mt-3 max-w-lg text-xl font-semibold sm:text-2xl">{slide.title}</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
                {slide.description}
              </p>
              <p className="mt-3 text-xs font-medium text-blue-light-200 sm:text-sm">{slide.meta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-theme-sm backdrop-blur">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Tampilkan slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex ? "w-8 bg-brand-500" : "w-2.5 bg-brand-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
