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

  const visibleSlides =
    slides.length > 1
      ? [slides[activeIndex], slides[(activeIndex + 1) % slides.length]]
      : slides;

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        {visibleSlides.map((slide, index) => (
          <article
            key={`${activeIndex}-${slide.id}`}
            className={`relative aspect-[7/4] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_12px_32px_rgba(16,24,40,0.06)] ${
              index === 1 ? "hidden lg:block" : ""
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={activeIndex === 0 && index === 0}
              className="object-contain"
              sizes="(min-width: 1024px) 540px, 100vw"
            />
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Tampilkan banner ${slide.badge}`}
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
