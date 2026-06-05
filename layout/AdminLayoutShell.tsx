"use client";

import { useSidebar } from "@/context/SidebarContext";
import type { AuthRole } from "@/lib/auth-roles";
import type { UserProfile } from "@/lib/user-profile";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";

export default function AdminLayoutShell({
  children,
  userProfile,
  activeRole,
  canSwitchRole,
}: {
  children: React.ReactNode;
  userProfile?: UserProfile;
  activeRole: AuthRole;
  canSwitchRole: boolean;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader
          userProfile={userProfile}
          activeRole={activeRole}
          canSwitchRole={canSwitchRole}
        />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
