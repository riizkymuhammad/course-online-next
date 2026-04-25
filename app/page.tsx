export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-500">
          Homepage Placeholder
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
          Halaman homepage akan dibuat nanti
        </h1>
        <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
          Dashboard TailAdmin sekarang sudah dipindahkan ke route
          {" "}
          <span className="font-semibold text-gray-800 dark:text-white">/dashboard</span>.
        </p>
        <a
          href="/dashboard"
          className="mt-8 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600"
        >
          Buka Dashboard
        </a>
      </div>
    </main>
  );
}
