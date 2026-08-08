"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useOptimistic } from "react";

export default function CatalogSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(currentQuery);

  const catalogName = pathname === "/courses"
    ? "course"
    : pathname === "/learning-paths"
      ? "learning path"
      : "tryout";

  function updateQuery(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());
    const normalizedQuery = nextQuery.trim();

    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    } else {
      params.delete("q");
    }

    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      setOptimisticQuery(nextQuery);
      router.replace(nextUrl, { scroll: false });
    });
  }

  return (
    <label className="relative hidden min-w-0 flex-1 md:block md:max-w-[420px]">
      <span className="sr-only">Cari {catalogName}</span>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={optimisticQuery}
        onChange={(event) => updateQuery(event.target.value)}
        placeholder={`Cari ${catalogName} atau subkategori...`}
        className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-xs font-normal text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:shadow-focus-ring"
      />
    </label>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="m14.5 14.5 3 3m-1.4-8.1a6.7 6.7 0 1 1-13.4 0 6.7 6.7 0 0 1 13.4 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
