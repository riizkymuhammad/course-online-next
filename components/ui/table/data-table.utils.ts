export type TableCellValue = string | number | boolean | null | undefined;
export type TableSortConfig = { key: string; direction: "asc" | "desc" };

export function normalizeTableValue(value: TableCellValue) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function filterTableRows<T extends object>(data: T[], keys: string[], query: string) {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return data;

  return data.filter((row) => {
    const record = row as Record<string, TableCellValue>;
    return keys.some((key) => normalizeTableValue(record[key]).toLowerCase().includes(lowered));
  });
}

export function sortTableRows<T extends object>(data: T[], sortConfig: TableSortConfig | null) {
  if (!sortConfig) return data;

  return [...data].sort((a, b) => {
    const left = normalizeTableValue((a as Record<string, TableCellValue>)[sortConfig.key]).toLowerCase();
    const right = normalizeTableValue((b as Record<string, TableCellValue>)[sortConfig.key]).toLowerCase();
    if (left < right) return sortConfig.direction === "asc" ? -1 : 1;
    if (left > right) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function paginateTableRows<T>(data: T[], page: number, rowsPerPage: number) {
  const start = (page - 1) * rowsPerPage;
  return data.slice(start, start + rowsPerPage);
}
