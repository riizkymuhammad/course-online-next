"use client";

import { useEffect, useState } from "react";

export default function HeroCarousel({
  labels = [],
  children,
}: {
  labels?: readonly string[];
  children: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (labels.length <= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % labels.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [labels.length]);

  return (
    <div className="hero-carousel" data-active-index={activeIndex}>
      <div className="grid gap-5 lg:grid-cols-2">{children}</div>
      {labels.length ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {labels.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-label={`Tampilkan banner ${label}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? "w-8 bg-brand-500" : "w-2.5 bg-brand-200"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
