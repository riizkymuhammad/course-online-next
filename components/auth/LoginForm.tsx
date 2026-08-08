"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Button from "@/components/atoms/Button";
import GoogleAuthButton, { getAuthRedirectPath } from "@/components/auth/GoogleAuthButton";
import PasswordField from "@/components/auth/PasswordField";
import FormField from "@/components/molecules/FormField";
import InlineAlert from "@/components/molecules/InlineAlert";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const isSubmittingRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
      isSubmittingRef.current = false;
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
        <PasswordField label="Password" name="password" placeholder="Enter your password" required />
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
        <InlineAlert tone="error">{errorMessage}</InlineAlert>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
