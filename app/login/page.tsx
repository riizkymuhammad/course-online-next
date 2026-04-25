import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Halaman login admin.",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Login"
      title="Masuk ke Dashboard"
      description="Gunakan akun admin Anda untuk mengakses dashboard learning path, course management, quiz, dan tryout."
      footerText="Belum punya akun?"
      footerLink="/register"
      footerLinkLabel="Register"
    >
      <LoginForm />
    </AuthShell>
  );
}
