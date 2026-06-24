"use client";

import LearningCollection from "@/components/organisms/learning/LearningCollection";
import type { LearningCardItem } from "@/components/organisms/learning/LearningCard";

export type TryoutCard = LearningCardItem;

export default function TryoutList({ tryouts }: { tryouts: TryoutCard[] }) {
  return (
    <LearningCollection
      items={tryouts}
      label="Tryout"
      allHref="/tryouts"
      allLabel="Lihat semua tryout"
      moreLabel="Lihat tryout lebih banyak"
    />
  );
}
