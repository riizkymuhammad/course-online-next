import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Halaman register admin.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Register"
      title="Buat Akun Admin"
      description="Daftarkan akun baru untuk mengelola learning path, materi, quiz, dan tryout di dashboard."
      footerText="Sudah punya akun?"
      footerLink="/login"
      footerLinkLabel="Login"
    >
      <RegisterForm />
    </AuthShell>
  );
}
