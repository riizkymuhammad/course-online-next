import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon } from "@/icons";

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLink,
  footerLinkLabel,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkLabel: string;
}) {
  return (
    <main className="h-dvh overflow-hidden bg-white dark:bg-gray-950">
      <div className="grid h-full w-full lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex h-full min-h-0 flex-col px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-theme-xs transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
            >
              <ChevronLeftIcon className="size-4" />
              Kembali ke halaman beranda
            </Link>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            <div className="w-full max-w-[380px] space-y-4">
              <div className="space-y-2">
                {eyebrow ? (
                  <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {eyebrow}
                  </span>
                ) : null}
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                  <p className="text-sm leading-5 text-gray-500 dark:text-gray-400">
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
          </div>
        </section>

        <section className="relative hidden h-full overflow-hidden bg-brand-600 text-white lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-linear-to-br from-brand-500 via-brand-600 to-brand-800" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="relative z-10 flex max-w-md flex-col items-center px-8 text-center">
            <Image
              src="/images/logo/auth-logo.svg"
              alt="Course Online"
              width={210}
              height={44}
              priority
            />
            <p className="mt-6 text-sm leading-6 text-gray-300">
              Free and focused learning dashboard for materi, learning path, quiz, and tryout.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
