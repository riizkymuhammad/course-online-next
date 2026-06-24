export default function CategoryBadge({
  children,
  tone = "light",
}: {
  children: string;
  tone?: "light" | "muted";
}) {
  const className =
    tone === "light"
      ? "bg-white/90 text-blue-800"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
  );
}
