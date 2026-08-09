import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "@/components/header/BrandLogo";
import type { AuthRole } from "@/lib/auth-roles";
import type { UserProfile } from "@/lib/user-profile";

export type PublicNavbarProps = {
  userProfile: UserProfile | null;
  activeRole: AuthRole;
  canSwitchRole: boolean;
  loginHref?: string;
  searchSlot?: ReactNode;
  userActions?: ReactNode;
};

export default function PublicNavbar({
  userProfile,
  loginHref = "/login",
  searchSlot,
  userActions,
}: PublicNavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-0">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <BrandLogo />
        </Link>

        {searchSlot}

        <div className="flex shrink-0 items-center gap-7">
          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-700 lg:flex">
            <Link href="/#kelas" className="transition hover:text-brand-600">
              Kelas
            </Link>
            <Link href="/#tryout" className="transition hover:text-brand-600">
              Tryout
            </Link>
            <Link href="/#tentang" className="transition hover:text-brand-600">
              Tentang
            </Link>
          </nav>

          <div className="flex items-center gap-2">
          {userProfile ? (
            userActions ?? (
              <Link
                href="/app"
                className="inline-flex h-9 items-center justify-center rounded-md bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Dashboard
              </Link>
            )
          ) : (
            <>
              <Link
                href={loginHref}
                className="inline-flex h-9 items-center justify-center rounded-md border border-brand-500 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-50"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Daftar
              </Link>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
