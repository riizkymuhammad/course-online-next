"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function LearningCourseWeeklyChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const options: ApexOptions = {
    colors: ["#0d6efd"],
    chart: {
      type: "bar",
      height: 280,
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "42%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#6b7280", fontSize: "12px" } },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: { style: { colors: "#6b7280", fontSize: "12px" } },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} aktivitas belajar`,
      },
    },
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Aktivitas belajar</p>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Course per minggu</h2>
        <span className="text-xs text-gray-400">8 minggu terakhir</span>
      </div>
      <div className="mt-5 min-h-[280px]">
        <ReactApexChart
          options={options}
          series={[{ name: "Learning Course", data: values }]}
          type="bar"
          height={280}
        />
      </div>
    </section>
  );
}
