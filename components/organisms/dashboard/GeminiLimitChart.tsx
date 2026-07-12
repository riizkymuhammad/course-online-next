"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { GeminiLimitSummary } from "@/lib/gemini-limits";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type GeminiLimitChartProps = GeminiLimitSummary;

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatLimit(value: number | null) {
  return value === null ? "Belum diatur" : numberFormatter.format(value);
}

export default function GeminiLimitChart({
  apiKeyConfigured,
  model,
  usageTier,
  metrics,
  configuredMetricCount,
  activeLimitUrl,
  docsUrl,
}: GeminiLimitChartProps) {
  const hasConfiguredLimit = configuredMetricCount > 0;
  const options: ApexOptions = {
    colors: ["#0d6efd", "#12b76a", "#f79009"],
    chart: {
      type: "bar",
      height: 280,
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        barHeight: "48%",
        distributed: true,
        horizontal: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => numberFormatter.format(Number(value)),
      style: {
        colors: ["#ffffff"],
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    legend: { show: false },
    xaxis: {
      categories: metrics.map((metric) => metric.shortLabel),
      min: 0,
      labels: {
        formatter: (value) => numberFormatter.format(Number(value)),
        style: { colors: "#6b7280", fontSize: "12px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: "#6b7280", fontSize: "12px" } },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (value, options) => {
          const metric = metrics[options.dataPointIndex];
          return `${numberFormatter.format(value)} ${metric?.unit ?? ""}`;
        },
      },
    },
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Gemini API
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            Limit key dan project AI
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
            Gemini menghitung rate limit per Google Cloud project, bukan per API key. Angka
            aktif tetap perlu dicocokkan dari AI Studio.
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
            apiKeyConfigured
              ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
              : "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
          }`}
        >
          {apiKeyConfigured ? "API key aktif" : "API key belum ada"}
        </span>
      </div>

      <div className="mt-5 grid gap-5 border-t border-gray-100 pt-5 dark:border-gray-800 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Model</p>
          <p className="mt-2 break-words text-base font-semibold text-gray-900 dark:text-white">
            {model}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Tier</p>
          <p className="mt-2 break-words text-base font-semibold text-gray-900 dark:text-white">
            {usageTier}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
            Limit terset
          </p>
          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
            {configuredMetricCount}/{metrics.length}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">Sumber</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
            <a
              href={activeLimitUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              AI Studio
            </a>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Docs
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-h-[280px]">
          {hasConfiguredLimit ? (
            <ReactApexChart
              options={options}
              series={[
                {
                  name: "Limit",
                  data: metrics.map((metric) => metric.value ?? 0),
                },
              ]}
              type="bar"
              height={280}
            />
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-200 px-6 text-center dark:border-gray-800">
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                Isi GEMINI_RATE_LIMIT_RPM, GEMINI_RATE_LIMIT_TPM, dan GEMINI_RATE_LIMIT_RPD di
                environment agar chart limit tampil di dashboard.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {metric.shortLabel}
                </p>
                <p className="text-right text-sm font-semibold text-gray-900 dark:text-white">
                  {formatLimit(metric.value)}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-400">{metric.label}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
