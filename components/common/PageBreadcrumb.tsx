import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function PageBreadcrumb({
  items,
  title,
  description,
}: {
  items: BreadcrumbItem[];
  title: string;
  description?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span>/</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-500">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-brand-500">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
