import type { ReactNode } from "react";
import { cookies } from "next/headers";
import AdminLayoutShell from "@/layout/AdminLayoutShell";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });

  return (
    <AdminLayoutShell
      userProfile={user ? getUserProfile(user) : undefined}
      activeRole={activeRole}
      canSwitchRole={accountRole === "admin"}
    >
      {children}
    </AdminLayoutShell>
  );
}
