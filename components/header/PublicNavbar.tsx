import Image from "next/image";
import Link from "next/link";
import UserDropdown from "@/components/header/UserDropdown";
import type { AuthRole } from "@/lib/auth-roles";
import type { UserProfile } from "@/lib/user-profile";

type PublicNavbarProps = {
  userProfile: UserProfile | null;
  activeRole: AuthRole;
  canSwitchRole: boolean;
  loginHref?: string;
};

export default function PublicNavbar({
  userProfile,
  activeRole,
  canSwitchRole,
  loginHref = "/login",
}: PublicNavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-0">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-theme-sm">
            <Image
              src="/images/logo/logo-icon.svg"
              alt=""
              width={17}
              height={17}
              className="brightness-0 invert"
            />
          </span>
          <span className="text-sm font-bold tracking-normal text-gray-900">
            Course<span className="text-brand-600">Online</span>
          </span>
        </Link>

        <label className="relative hidden min-w-0 flex-1 md:block md:max-w-[420px]">
          <span className="sr-only">Cari kelas</span>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Cari kelas, tryout, atau materi..."
            className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-xs font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:shadow-focus-ring"
          />
        </label>

        <nav className="hidden items-center gap-7 text-xs font-semibold text-gray-700 lg:flex">
          <Link href="/#beranda" className="transition hover:text-brand-600">
            Beranda
          </Link>
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

        <div className="flex shrink-0 items-center gap-2">
          {userProfile ? (
            <>
              <Link
                href="/app"
                className="hidden h-9 items-center justify-center rounded-md border border-brand-200 px-4 text-xs font-bold text-brand-600 transition hover:bg-brand-50 sm:inline-flex"
              >
                Dashboard
              </Link>
              <UserDropdown
                avatarUrl={userProfile.avatarUrl}
                displayName={userProfile.displayName}
                email={userProfile.email}
                activeRole={activeRole}
                canSwitchRole={canSwitchRole}
              />
            </>
          ) : (
            <>
              <Link
                href={loginHref}
                className="inline-flex h-9 items-center justify-center rounded-md border border-brand-500 px-4 text-xs font-bold text-brand-600 transition hover:bg-brand-50"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-brand-600 px-4 text-xs font-bold text-white shadow-theme-sm transition hover:bg-brand-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
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
