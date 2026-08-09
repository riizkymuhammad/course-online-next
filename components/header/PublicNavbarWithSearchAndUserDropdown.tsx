import type { PublicNavbarProps } from "@/components/header/PublicNavbar";
import PublicNavbarWithSearch from "@/components/header/PublicNavbarWithSearch";
import { PublicNavbarUserActions } from "@/components/header/PublicNavbarWithUserDropdown";

export default function PublicNavbarWithSearchAndUserDropdown(props: PublicNavbarProps) {
  return (
    <PublicNavbarWithSearch
      {...props}
      userActions={<PublicNavbarUserActions {...props} />}
    />
  );
}
