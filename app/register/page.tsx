import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Halaman register.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      singleColumn
      eyebrow="Register"
      title=""
      description=""
      footerText="Sudah punya akun?"
      footerLink="/login"
      footerLinkLabel="Login"
    >
      <RegisterForm />
    </AuthShell>
  );
}
