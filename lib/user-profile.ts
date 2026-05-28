import type { User } from "@supabase/supabase-js";

export type UserProfile = {
  avatarUrl: string;
  displayName: string;
  email: string;
};

function getUserMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value.trim() : "";
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
    avatarUrl: avatarCandidate.startsWith("/") ? avatarCandidate : "/images/user/owner.jpg",
    displayName,
    email: user?.email ?? "",
  };
}
