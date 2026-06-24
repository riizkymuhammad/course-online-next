"use client";

import Button from "@/components/atoms/Button";

export type LearningCategoryKey = "all" | "cpns" | "english" | "it";

const filters: Array<{ key: LearningCategoryKey; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "cpns", label: "CPNS" },
  { key: "english", label: "Bahasa Inggris" },
  { key: "it", label: "TI & Perangkat Lunak" },
];

export default function CategoryFilterTabs({
  activeCategory,
  onChange,
}: {
  activeCategory: LearningCategoryKey;
  onChange: (category: LearningCategoryKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = activeCategory === filter.key;

        return (
          <Button
            key={filter.key}
            type="button"
            variant={isActive ? "primary" : "filter"}
            aria-pressed={isActive}
            onClick={() => onChange(filter.key)}
            className="h-8 px-4 text-xs"
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
