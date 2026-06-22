import type { User } from "@supabase/supabase-js";

export type UserProfile = {
  avatarUrl?: string;
  displayName: string;
  email: string;
};

function getUserMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value.trim() : "";
}

function getAvatarUrl(value: string) {
  if (value.startsWith("/")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".googleusercontent.com")
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function getUserProfile(user: User | null): UserProfile {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    getUserMetadataString(metadata, "full_name") ||
    getUserMetadataString(metadata, "name") ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarCandidate =
    getUserMetadataString(metadata, "avatar_url") ||
    getUserMetadataString(metadata, "picture");

  return {
    avatarUrl: getAvatarUrl(avatarCandidate),
    displayName,
    email: user?.email ?? "",
  };
}
