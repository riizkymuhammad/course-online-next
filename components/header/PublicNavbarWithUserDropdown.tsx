import Link from "next/link";
import PublicNavbar, { type PublicNavbarProps } from "@/components/header/PublicNavbar";
import UserDropdown from "@/components/header/UserDropdown";

type PublicNavbarWithUserDropdownProps = PublicNavbarProps & {
  primaryActionLabel?: string;
  compactAvatar?: boolean;
};

export function PublicNavbarUserActions({
  userProfile,
  activeRole,
  canSwitchRole,
  primaryActionLabel = "Dashboard",
  compactAvatar = false,
}: Pick<PublicNavbarProps, "userProfile" | "activeRole" | "canSwitchRole"> & {
  primaryActionLabel?: string;
  compactAvatar?: boolean;
}) {
  if (!userProfile) return null;

  return (
    <>
      <Link
        href="/app"
        className="hidden h-9 items-center justify-center rounded-md border border-brand-200 px-4 text-sm font-medium text-brand-600 transition hover:bg-brand-50 sm:inline-flex"
      >
        {primaryActionLabel}
      </Link>
      <UserDropdown
        avatarUrl={userProfile.avatarUrl}
        displayName={userProfile.displayName}
        email={userProfile.email}
        activeRole={activeRole}
        canSwitchRole={canSwitchRole}
        compactAvatar={compactAvatar}
      />
    </>
  );
}

export default function PublicNavbarWithUserDropdown({
  primaryActionLabel,
  compactAvatar,
  ...navbarProps
}: PublicNavbarWithUserDropdownProps) {
  return (
    <PublicNavbar
      {...navbarProps}
      userActions={(
        <PublicNavbarUserActions
          {...navbarProps}
          primaryActionLabel={primaryActionLabel}
          compactAvatar={compactAvatar}
        />
      )}
    />
  );
}
