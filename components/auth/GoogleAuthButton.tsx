"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GoogleAuthButtonProps = {
  label: string;
  loadingLabel: string;
  onError: (message: string) => void;
  onStart?: () => void;
};

export function getAuthRedirectPath() {
  if (typeof window === "undefined") return "/dashboard";

  const redirectedFrom = new URLSearchParams(window.location.search).get("redirectedFrom");

  if (redirectedFrom?.startsWith("/") && !redirectedFrom.startsWith("//")) {
    return redirectedFrom;
  }

  return "/dashboard";
}

export default function GoogleAuthButton({
  label,
  loadingLabel,
  onError,
  onStart,
}: GoogleAuthButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleAuth() {
    onStart?.();
    setIsSubmitting(true);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", getAuthRedirectPath());

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      onError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={isSubmitting}
      className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-200 dark:hover:bg-white/[0.06]"
    >
      <GoogleIcon />
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.171 10.2c0-.66-.059-1.294-.169-1.902H10v3.586h4.573a3.91 3.91 0 0 1-1.695 2.567v2.135h2.748c1.607-1.48 2.545-3.659 2.545-6.386Z"
        fill="#4285F4"
      />
      <path
        d="M10 18.5c2.295 0 4.22-.761 5.626-2.064l-2.748-2.135c-.761.51-1.733.812-2.878.812-2.215 0-4.09-1.496-4.758-3.506H2.4v2.203A8.497 8.497 0 0 0 10 18.5Z"
        fill="#34A853"
      />
      <path
        d="M5.242 11.607A5.109 5.109 0 0 1 4.976 10c0-.557.096-1.094.266-1.607V6.19H2.4A8.497 8.497 0 0 0 1.5 10c0 1.37.328 2.666.9 3.81l2.842-2.203Z"
        fill="#FBBC05"
      />
      <path
        d="M10 4.887c1.248 0 2.368.429 3.25 1.271l2.438-2.438C14.216 2.35 12.291 1.5 10 1.5A8.497 8.497 0 0 0 2.4 6.19l2.842 2.203C5.91 6.383 7.785 4.887 10 4.887Z"
        fill="#EA4335"
      />
    </svg>
  );
}
