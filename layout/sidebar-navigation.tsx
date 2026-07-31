import type { ReactNode } from "react";
import { BoxCubeIcon, GridIcon, ListIcon, PageIcon, TableIcon, UserCircleIcon } from "@/icons/index";
import { isRouteActive } from "@/lib/navigation";

export type SidebarNavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

export const sidebarNavItems: SidebarNavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  {
    icon: <TableIcon />,
    name: "Master Data",
    subItems: [
      { name: "Kategori", path: "/dashboard/master-data/kategori" },
      { name: "Sub Kategori", path: "/dashboard/master-data/sub-kategori" },
    ],
  },
  { icon: <ListIcon />, name: "Learning Path", path: "/dashboard/learning-path" },
  { icon: <TableIcon />, name: "Course Management", path: "/dashboard/course-management" },
  { icon: <PageIcon />, name: "Quiz Management", path: "/dashboard/quiz-management" },
  { icon: <BoxCubeIcon />, name: "Tryout Management", path: "/dashboard/tryout-management" },
  { icon: <ListIcon />, name: "Riwayat Tryout", path: "/dashboard/riwayat-tryout" },
  { icon: <BoxCubeIcon />, name: "Learning Course", path: "/dashboard/learning-course" },
  { icon: <UserCircleIcon />, name: "Manajemen User", path: "/dashboard/user-management" },
];

export function findMatchedSidebarSubmenu(pathname: string) {
  for (const [index, nav] of sidebarNavItems.entries()) {
    if (nav.subItems?.some((subItem) => isRouteActive(pathname, subItem.path))) {
      return { type: "main" as const, index };
    }
  }
  return null;
}
