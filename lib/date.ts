export function formatDateTime(
  value: string | null | undefined,
  fallback = "-"
) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
