"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type DataTableColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  type?: "text" | "imageText" | "badge" | "actions";
  imageKey?: string;
  subtitleKey?: string;
  badgeToneMap?: Record<string, string>;
  className?: string;
  actions?: Array<{
    label: string;
    tone?: "primary" | "secondary" | "danger";
    hrefKey?: string;
  }>;
};

type CellValue = string | number | boolean | null | undefined;

function normalizeValue(value: CellValue) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction?: "asc" | "desc";
}) {
  return (
    <span className="inline-flex flex-col items-center justify-center gap-0.5">
      <span
        className={`h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent ${
          active && direction === "asc" ? "border-b-brand-500" : "border-b-gray-300"
        }`}
      />
      <span
        className={`h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent ${
          active && direction === "desc" ? "border-t-brand-500" : "border-t-gray-300"
        }`}
      />
    </span>
  );
}

export default function DataTable<T extends object>({
  title,
  description,
  columns,
  data,
  searchPlaceholder = "Search table...",
  pageSize = 5,
  pageSizeOptions = [5, 10, 25],
  action,
}: {
  title: string;
  description?: string;
  columns: DataTableColumn[];
  data: T[];
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  action?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(
    null
  );

  const searchableColumns = columns.filter((column) => column.searchable !== false);

  const filteredData = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    if (!lowered) {
      return data;
    }

    return data.filter((row) =>
      searchableColumns.some((column) =>
        normalizeValue((row as Record<string, CellValue>)[column.key]).toLowerCase().includes(lowered)
      )
    );
  }, [data, query, searchableColumns]);

  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const left = normalizeValue((a as Record<string, CellValue>)[sortConfig.key]).toLowerCase();
      const right = normalizeValue((b as Record<string, CellValue>)[sortConfig.key]).toLowerCase();

      if (left < right) return sortConfig.direction === "asc" ? -1 : 1;
      if (left > right) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [currentPage, rowsPerPage, sortedData]);

  function handleSort(column: DataTableColumn) {
    if (!column.sortable) return;

    setPage(1);
    setSortConfig((prev) => {
      if (prev?.key === column.key) {
        return {
          key: column.key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: column.key,
        direction: "asc",
      };
    });
  }

  function renderCell(row: T, column: DataTableColumn) {
    const record = row as Record<string, CellValue>;
    const value = normalizeValue(record[column.key]);

    if (column.type === "imageText") {
      const imageSrc = normalizeValue(record[column.imageKey || "image"]);
      const subtitle = normalizeValue(record[column.subtitleKey || "subtitle"]);

      return (
        <div className="flex items-start gap-3">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={value}
              width={80}
              height={56}
              className="h-14 w-20 rounded-lg object-cover"
            />
          ) : null}
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{value}</p>
            {subtitle ? (
              <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
      );
    }

    if (column.type === "badge") {
      const tone =
        column.badgeToneMap?.[value] ??
        "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300";

      return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tone}`}>
          {value}
        </span>
      );
    }

    if (column.type === "actions") {
      return (
        <div className="flex items-center gap-2">
          {(column.actions ?? []).map((action) => {
            const toneClass =
              action.tone === "primary"
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : action.tone === "danger"
                  ? "bg-error-500 text-white hover:bg-error-600"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5";

            return (
              action.hrefKey && normalizeValue(record[action.hrefKey]) ? (
                <Link
                  key={action.label}
                  href={normalizeValue(record[action.hrefKey])}
                  className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium ${toneClass}`}
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-medium ${toneClass}`}
                >
                  {action.label}
                </button>
              )
            );
          })}
        </div>
      );
    }

    return <span>{value}</span>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 sm:w-72"
            />
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-gray-100 dark:border-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${column.className ?? ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className={`inline-flex items-center gap-2 ${column.sortable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {column.label}
                    {column.sortable ? (
                      <SortIndicator
                        active={sortConfig?.key === column.key}
                        direction={sortConfig?.key === column.key ? sortConfig.direction : undefined}
                      />
                    ) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <tr
                  key={`${normalizeValue((row as Record<string, CellValue>).id) || "row"}-${index}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 align-top text-sm text-gray-600 dark:text-gray-300 ${column.className ?? ""}`}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{" "}
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50 dark:border-gray-800"
          >
            Prev
          </button>
          <span className="px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50 dark:border-gray-800"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
