"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleAuthButton, { getAuthRedirectPath } from "@/components/auth/GoogleAuthButton";
import FormField from "@/components/molecules/FormField";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    await fetch("/api/auth/active-role", {
      method: "DELETE",
    }).catch(() => null);

    router.push(getAuthRedirectPath(data.user));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <GoogleAuthButton
          label="Sign in with Google"
          loadingLabel="Redirecting to Google..."
          onStart={() => setErrorMessage(null)}
          onError={setErrorMessage}
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          <span className="text-xs font-medium text-gray-400">Or</span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      <div className="grid gap-4">
        <FormField label="Email" name="email" type="email" placeholder="admin@courseonline.com" required />
        <FormField label="Password" name="password" type="password" placeholder="Enter your password" required />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
          Keep me logged in
        </label>
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Forgot password?
        </Link>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
