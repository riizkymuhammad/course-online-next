import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type TryoutPageParams = {
  uuid: string;
  slug: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateMetadata(
  props: PageProps<"/tryout/[uuid]/[slug]">
): Promise<Metadata> {
  const params = (await props.params) as TryoutPageParams;
  return {
    title: `Tryout ${params.slug}`,
    description: "Halaman detail tryout.",
  };
}

export default async function TryoutDetailPage(props: PageProps<"/tryout/[uuid]/[slug]">) {
  const params = (await props.params) as TryoutPageParams;
  const supabase = await createClient();

  const { data: tryoutRow } = await supabase
    .from("tryouts")
    .select(
      "id, title, total_questions, question_notes, status, material_file_name, updated_at, learning_path_id"
    )
    .eq("id", params.uuid)
    .single();

  if (!tryoutRow) {
    notFound();
  }

  const expectedSlug = slugify(tryoutRow.title);
  if (params.slug !== expectedSlug) {
    redirect(`/tryout/${tryoutRow.id}/${expectedSlug}`);
  }

  let learningPathTitle = "Unassigned";
  if (tryoutRow.learning_path_id) {
    const { data: learningPathRow } = await supabase
      .from("learning_paths")
      .select("title")
      .eq("id", tryoutRow.learning_path_id)
      .single();

    learningPathTitle = learningPathRow?.title ?? "Unassigned";
  }

  const updatedAt = tryoutRow.updated_at
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(tryoutRow.updated_at))
    : "-";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-500">
            Tryout Detail
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {tryoutRow.title}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Pelajari informasi tryout terlebih dahulu sebelum memulai pengerjaan soal.
          </p>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {tryoutRow.status}
              </span>
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                {tryoutRow.total_questions} Soal
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard label="Learning Path" value={learningPathTitle} />
              <InfoCard label="File Materi" value={tryoutRow.material_file_name ?? "Belum ada file"} />
              <InfoCard label="Status" value={tryoutRow.status} />
              <InfoCard label="Updated" value={updatedAt} />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Catatan Soal
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {tryoutRow.question_notes ||
                  "Tidak ada catatan tambahan. Tryout akan mengikuti format standar yang telah dibuat sistem."}
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/dashboard/tryout-management"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
              >
                Kembali
              </Link>
              <Link
                href={`/tryout/exam/${tryoutRow.id}/${expectedSlug}`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Mulai
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}
