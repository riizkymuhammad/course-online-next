export default function RouteLoadingSkeleton({ withSidebar = false }: { withSidebar?: boolean }) {
  return (
    <main aria-label="Memuat halaman" aria-busy="true" className="min-h-[70vh] animate-pulse">
      <span className="sr-only">Memuat halaman...</span>
      <div className={withSidebar ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" : "space-y-6"}>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-8 w-72 max-w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-full max-w-xl rounded-full bg-gray-100 dark:bg-gray-800/70" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-28 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
            ))}
          </div>
          <div className="h-80 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        </div>
        {withSidebar ? (
          <div className="hidden h-96 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] lg:block" />
        ) : null}
      </div>
    </main>
  );
}
