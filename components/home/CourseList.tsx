"use client";

import LearningCollection from "@/components/organisms/learning/LearningCollection";
import type { LearningCardItem } from "@/components/organisms/learning/LearningCard";

export type CourseCard = Omit<LearningCardItem, "href"> & {
  href?: string;
};

export default function CourseList({
  courses,
  actionHref,
}: {
  courses: CourseCard[];
  actionHref: string;
}) {
  return (
    <LearningCollection
      items={courses.map((course) => ({ ...course, href: course.href || actionHref }))}
      label="Course"
      allHref="/courses"
      allLabel="Lihat semua materi"
      moreLabel="Lihat course lebih banyak"
    />
  );
}
