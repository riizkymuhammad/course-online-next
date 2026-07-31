export function isRouteActive(pathname: string, path: string) {
  if (path === "/dashboard") return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}
