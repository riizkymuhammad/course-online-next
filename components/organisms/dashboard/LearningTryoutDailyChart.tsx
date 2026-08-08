"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function LearningTryoutDailyChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const options: ApexOptions = {
    colors: ["#2563EB"],
    chart: {
      type: "bar",
      height: 280,
      fontFamily: "var(--font-sans)",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "55%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#6b7280", fontSize: "var(--font-xs)" } },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: { style: { colors: "#6b7280", fontSize: "var(--font-xs)" } },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} pengerjaan tryout`,
      },
    },
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        Aktivitas tryout
      </p>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Learning Tryout per hari
        </h2>
        <span className="text-xs text-gray-400">14 hari terakhir</span>
      </div>
      <div className="mt-5 min-h-[280px]">
        <ReactApexChart
          options={options}
          series={[{ name: "Learning Tryout", data: values }]}
          type="bar"
          height={280}
        />
      </div>
    </section>
  );
}
