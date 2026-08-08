import Link from "next/link";
import BrandLogo from "@/components/header/BrandLogo";

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLink,
  footerLinkLabel,
  singleColumn = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkLabel: string;
  singleColumn?: boolean;
}) {
  return (
    <main className="h-dvh overflow-hidden bg-white dark:bg-gray-950">
      <div className={singleColumn ? "h-full w-full" : "grid h-full w-full lg:grid-cols-[0.92fr_1.08fr]"}>
        <section className={`flex h-full min-h-0 flex-col px-5 py-4 sm:px-8 lg:px-10 ${singleColumn ? "mx-auto w-full max-w-5xl" : ""}`}>
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="Kembali ke halaman beranda"
              className="inline-flex rounded-lg px-1 py-1 transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
            >
              <BrandLogo />
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
                {title || description ? (
                  <div className="space-y-1.5">
                    {title ? (
                      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {title}
                      </h1>
                    ) : null}
                    {description ? (
                      <p className="text-sm leading-5 text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    ) : null}
                  </div>
                ) : null}
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

        {!singleColumn ? (
          <section className="relative hidden h-full overflow-hidden bg-brand-600 text-white lg:flex lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-linear-to-br from-brand-500 via-brand-600 to-brand-800" />
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="relative z-10 flex max-w-md flex-col items-center px-8 text-center">
              <Link href="/" aria-label="Kembali ke beranda">
                <BrandLogo textClassName="text-white" />
              </Link>
              <p className="mt-6 text-sm leading-6 text-gray-300">
                Platform belajar untuk materi, learning path, quiz, dan tryout.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
