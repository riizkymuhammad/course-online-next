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
      eyebrow="Register"
      title="Buat Akun"
      description="Daftarkan akun baru untuk mengakses materi, tryout, dan progres belajar."
      footerText="Sudah punya akun?"
      footerLink="/login"
      footerLinkLabel="Login"
    >
      <RegisterForm />
    </AuthShell>
  );
}
