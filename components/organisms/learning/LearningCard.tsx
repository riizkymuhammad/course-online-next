import Link from "next/link";
import CategoryBadge from "@/components/molecules/CategoryBadge";

export type LearningCardItem = {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  backgroundColor: string;
  href: string;
};

export default function LearningCard({ item, label }: { item: LearningCardItem; label: string }) {
  return (
    <Link
      href={item.href}
      aria-label={`Buka ${label.toLowerCase()} ${item.title}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:shadow-md">
        <div
          className="relative flex h-40 items-center justify-center"
          style={{ backgroundColor: item.backgroundColor }}
        >
          <span className="absolute left-3 top-3">
            <CategoryBadge>{item.category || "Umum"}</CategoryBadge>
          </span>
          <span className="line-clamp-3 px-6 text-center text-base font-semibold text-white/95">
            {item.title}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-md font-semibold text-slate-900">{item.title}</h3>
          <span className="mt-1 w-fit">
            <CategoryBadge tone="muted">{item.subCategory || "Umum"}</CategoryBadge>
          </span>
        </div>
      </article>
    </Link>
  );
}
