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

export default function LearningCard({ item, label, rounded = "xl" }: { item: LearningCardItem; label: string; rounded?: "md" | "xl" }) {
  const roundedClassName = rounded === "md" ? "rounded-md" : "rounded-xl";

  return (
    <Link
      href={item.href}
      aria-label={`Buka ${label.toLowerCase()} ${item.title}`}
      className={`group block ${roundedClassName} outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`}
    >
      <article className={`flex flex-col overflow-hidden ${roundedClassName} border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:shadow-md`}>
        <div
          className="relative flex h-28 items-center justify-center sm:h-40"
          style={{ backgroundColor: item.backgroundColor }}
        >
          <span className="absolute left-3 top-3">
            <CategoryBadge>{item.category || "Umum"}</CategoryBadge>
          </span>
          <span className="line-clamp-4 px-3 text-center text-xs font-semibold leading-5 text-white/95 sm:px-5 sm:text-sm">
            {item.title}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-5">
          <h4 className="line-clamp-3 text-[13px] font-semibold leading-5 text-slate-900 sm:text-sm">
            {item.title}
          </h4>
          <span className="mt-1 w-fit">
            <CategoryBadge tone="muted">{item.subCategory || "Umum"}</CategoryBadge>
          </span>
        </div>
      </article>
    </Link>
  );
}
