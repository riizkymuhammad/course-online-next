import Image from "next/image";
import Link from "next/link";
import CategoryBadge from "@/components/molecules/CategoryBadge";

export type LearningCardItem = {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  imageUrl?: string | null;
  backgroundColor: string;
  href: string;
};

export default function LearningCard({ item, label, rounded = "xl" }: { item: LearningCardItem; label: string; rounded?: "md" | "xl" }) {
  const roundedClassName = rounded === "md" ? "rounded-md" : "rounded-xl";

  return (
    <Link
      href={item.href}
      className={`group block ${roundedClassName} outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`}
    >
      <article className={`flex flex-col overflow-hidden ${roundedClassName} border border-slate-200 bg-white shadow-sm transition duration-300 group-hover:shadow-md`}>
        <div
          className="relative flex h-28 items-center justify-center sm:h-40"
          style={{ backgroundColor: item.backgroundColor }}
        >
          {item.imageUrl ? (
            <>
              <Image
                src={item.imageUrl}
                alt=""
                fill
                loading="lazy"
                quality={70}
                unoptimized={item.imageUrl.toLowerCase().includes(".svg")}
                sizes="(min-width: 1024px) 250px, (min-width: 640px) 50vw, 50vw"
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-transparent" />
            </>
          ) : (
            <span className="line-clamp-4 px-3 text-center text-xs font-semibold leading-5 text-white/95 sm:px-5 sm:text-sm">
              {item.title}
            </span>
          )}
          <span className="absolute left-3 top-3 z-10">
            <CategoryBadge>{item.category || "Umum"}</CategoryBadge>
          </span>
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-5">
          <h3 className="line-clamp-3 text-[13px] font-semibold leading-5 text-slate-900 sm:text-sm">
            <span className="sr-only">{label}: </span>
            {item.title}
          </h3>
          <span className="mt-1 w-fit">
            <CategoryBadge tone="muted">{item.subCategory || "Umum"}</CategoryBadge>
          </span>
        </div>
      </article>
    </Link>
  );
}
