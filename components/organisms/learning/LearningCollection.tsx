"use client";

import { useMemo, useState } from "react";
import TextLinkButton from "@/components/atoms/TextLinkButton";
import CategoryFilterTabs, {
  type LearningCategoryKey,
} from "@/components/molecules/CategoryFilterTabs";
import LearningCard, { type LearningCardItem } from "./LearningCard";

function getCategoryKey(category: string): Exclude<LearningCategoryKey, "all"> {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes("cpns")) return "cpns";
  if (normalizedCategory.includes("english") || normalizedCategory.includes("inggris")) {
    return "english";
  }

  return "it";
}

export default function LearningCollection({
  items,
  label,
  allHref,
  allLabel,
  moreLabel,
  maxVisibleItems = 12,
}: {
  items: LearningCardItem[];
  label: string;
  allHref: string;
  allLabel: string;
  moreLabel: string;
  maxVisibleItems?: number;
}) {
  const [activeCategory, setActiveCategory] = useState<LearningCategoryKey>("all");
  const filteredItems = useMemo(
    () =>
      activeCategory === "all"
        ? items
        : items.filter((item) => getCategoryKey(item.category) === activeCategory),
    [activeCategory, items]
  );
  const visibleItems = filteredItems.slice(0, maxVisibleItems);
  const hasMoreItems = filteredItems.length > maxVisibleItems;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilterTabs activeCategory={activeCategory} onChange={setActiveCategory} />
        <TextLinkButton href={allHref} className="h-8 w-fit px-4 text-xs">
          {allLabel}
        </TextLinkButton>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((item) => (
          <LearningCard key={item.id} item={item} label={label} />
        ))}
      </div>

      {hasMoreItems ? (
        <div className="mt-7 flex justify-center">
          <TextLinkButton href={allHref} className="h-10 px-5 text-sm font-semibold">
            {moreLabel}
          </TextLinkButton>
        </div>
      ) : null}
    </div>
  );
}
