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
      title="Sign In"
      description="Enter your email and password to sign in!"
      footerText="Don't have an account?"
      footerLink="/register"
      footerLinkLabel="Sign Up"
    >
      <LoginForm />
    </AuthShell>
  );
}
