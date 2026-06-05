import type { User } from "@supabase/supabase-js";

export type AuthRole = "admin" | "user";

type RoleUser = Pick<User, "app_metadata"> | null | undefined;

export const ACTIVE_ROLE_COOKIE = "course_online_active_role";
export const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const adminRoleValues = new Set(["admin", "super_admin"]);

function normalizeMetadataValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeMetadataValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(normalizeMetadataValue).filter(Boolean);
  }

  const normalizedValue = normalizeMetadataValue(value);
  return normalizedValue ? [normalizedValue] : [];
}

function hasAdminRoleValue(value: unknown) {
  return normalizeMetadataValues(value).some((item) => adminRoleValues.has(item));
}

export function normalizeAuthRole(value: unknown): AuthRole | null {
  const normalizedValue = normalizeMetadataValue(value);

  if (normalizedValue === "admin" || normalizedValue === "user") {
    return normalizedValue;
  }

  return null;
}

function getRedirectPathname(path: string) {
  return path.split(/[?#]/, 1)[0] || "/";
}

export function getUserRole(user: RoleUser): AuthRole {
  const metadata = (user?.app_metadata ?? {}) as Record<string, unknown>;
  if (
    hasAdminRoleValue(metadata.role) ||
    hasAdminRoleValue(metadata.user_role) ||
    hasAdminRoleValue(metadata.roles)
  ) {
    return "admin";
  }

  if (metadata.is_admin === true) {
    return "admin";
  }

  return "user";
}

export function getDefaultRedirectForRole(role: AuthRole) {
  return role === "admin" ? "/dashboard" : "/app";
}

export function getEffectiveRole({
  accountRole,
  activeRolePreference,
}: {
  accountRole: AuthRole;
  activeRolePreference?: string | null;
}) {
  if (accountRole !== "admin") {
    return "user";
  }

  return normalizeAuthRole(activeRolePreference) ?? "admin";
}

export function getSafeRedirectPath(value: string | null | undefined) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return null;
}

export function isAuthPath(path: string) {
  const pathname = getRedirectPathname(path);
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signin" ||
    pathname === "/signup"
  );
}

export function isDashboardPath(path: string) {
  const pathname = getRedirectPathname(path);
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function isAppPath(path: string) {
  const pathname = getRedirectPathname(path);
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function resolvePostLoginRedirect({
  requestedPath,
  role,
}: {
  requestedPath?: string | null;
  role: AuthRole;
}) {
  const safePath = getSafeRedirectPath(requestedPath);

  if (!safePath || isAuthPath(safePath)) {
    return getDefaultRedirectForRole(role);
  }

  if (isDashboardPath(safePath)) {
    return role === "admin" ? safePath : "/app";
  }

  if (isAppPath(safePath)) {
    return role === "admin" ? "/dashboard" : safePath;
  }

  return safePath;
}
