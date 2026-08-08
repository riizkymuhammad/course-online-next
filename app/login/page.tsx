import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Halaman login.",
};

export default function LoginPage() {
  return (
    <AuthShell
      singleColumn
      eyebrow="Login"
      title=""
      description=""
      footerText="Don't have an account?"
      footerLink="/register"
      footerLinkLabel="Sign Up"
    >
      <LoginForm />
    </AuthShell>
  );
}
