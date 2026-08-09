"use client";

import Link from "next/link";

export type LearningPathCard = {
  id: string;
  title: string;
  tryoutCount: number;
  backgroundColor: string;
  href: string;
};

export default function LearningPathList({ items }: { items: LearningPathCard[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
          <article className="flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:shadow-md">
            <div className="flex h-28 items-center justify-center sm:h-40" style={{ backgroundColor: item.backgroundColor }}>
              <span className="line-clamp-3 px-3 text-center text-sm font-semibold text-white/95 sm:px-6 sm:text-base">{item.title}</span>
            </div>
            <div className="flex flex-1 flex-col p-3 sm:p-5">
              <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-500 sm:text-sm">{item.tryoutCount} tryout</p>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
