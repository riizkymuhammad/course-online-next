import { Suspense } from "react";
import CatalogSearch from "@/components/header/CatalogSearch";
import PublicNavbar, { type PublicNavbarProps } from "@/components/header/PublicNavbar";

export default function PublicNavbarWithSearch(props: PublicNavbarProps) {
  return (
    <PublicNavbar
      {...props}
      searchSlot={
        <Suspense fallback={<div className="hidden min-w-0 flex-1 md:block md:max-w-[420px]" />}>
          <CatalogSearch />
        </Suspense>
      }
    />
  );
}
