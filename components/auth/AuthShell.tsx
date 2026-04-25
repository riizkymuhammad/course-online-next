import Link from "next/link";

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLink,
  footerLinkLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkLabel: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl shadow-brand-500/10 xl:grid-cols-[1.05fr_0.95fr] dark:border-gray-800 dark:bg-gray-900">
        <section className="hidden flex-col justify-between bg-brand-500 p-10 text-white xl:flex">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold">
                CO
              </span>
              Course Online
            </Link>
          </div>

          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/80">
              Admin Portal
            </span>
            <div className="space-y-4">
              <h2 className="max-w-md text-4xl font-semibold leading-tight">
                Kelola learning path, materi, quiz, dan tryout dalam satu dashboard.
              </h2>
              <p className="max-w-lg text-sm leading-7 text-white/80">
                Halaman autentikasi ini disiapkan untuk akses admin dan tim internal sebelum
                masuk ke sistem manajemen course.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard value="120+" label="Materi Aktif" />
            <StatCard value="35+" label="Quiz Tersedia" />
            <StatCard value="12" label="Tryout AI" />
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl space-y-8">
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {eyebrow}
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <p className="max-w-lg text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </div>
            </div>

            {children}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {footerText}{" "}
              <Link href={footerLink} className="font-semibold text-brand-600 hover:text-brand-700">
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/75">{label}</p>
    </div>
  );
}
