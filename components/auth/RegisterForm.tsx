"use client";

import { useState } from "react";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import FormField from "@/components/molecules/FormField";
import { createClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak sama.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name,
          role: "user",
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(
      "Registrasi berhasil. Jika email confirmation aktif di Supabase, silakan cek inbox Anda."
    );
    setIsSubmitting(false);
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <GoogleAuthButton
          label="Daftar dengan Google"
          loadingLabel="Mengarahkan ke Google..."
          onStart={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          onError={setErrorMessage}
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          <span className="text-xs font-medium text-gray-400">atau daftar dengan email</span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      <div className="grid gap-4">
        <FormField label="Nama" name="name" placeholder="John Doe" required inputClassName="rounded-xl" />
        <FormField label="Email" name="email" type="email" placeholder="admin@courseonline.com" required inputClassName="rounded-xl" />
        <FormField label="Password" name="password" type="password" placeholder="Buat password" required inputClassName="rounded-xl" />
        <FormField
          label="Confirm Password"
          name="confirm_password"
          type="password"
          placeholder="Ulangi password"
          required
          inputClassName="rounded-xl"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          {successMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account..." : "Register"}
      </button>
    </form>
  );
}
