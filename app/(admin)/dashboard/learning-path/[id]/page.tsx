import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import LearningPathDetailTabs, { type LearningPathTryout } from "@/components/learning-path/LearningPathDetailTabs";
import InfoCard from "@/components/molecules/InfoCard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Detail Learning Path",
  description: "Informasi dan pengurutan tryout dalam learning path.",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

export default async function LearningPathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: learningPath }, { data: tryoutRows }, { data: availableTryoutRows }] = await Promise.all([
    supabase.from("learning_paths").select("id, title, slug, description, status, created_at, updated_at").eq("id", id).maybeSingle(),
    supabase.from("tryouts").select("id, title, status, total_questions, updated_at, learning_path_order").eq("learning_path_id", id).order("learning_path_order", { ascending: true, nullsFirst: false }).order("updated_at", { ascending: false }),
    supabase.from("tryouts").select("id, title, status, total_questions, updated_at").is("learning_path_id", null).order("title", { ascending: true }),
  ]);

  if (!learningPath) notFound();

  const tryouts: LearningPathTryout[] = (tryoutRows ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status ?? "draft",
    totalQuestions: item.total_questions ?? 0,
    updatedAt: formatDate(item.updated_at),
  }));
  const availableTryouts: LearningPathTryout[] = (availableTryoutRows ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status ?? "draft",
    totalQuestions: item.total_questions ?? 0,
    updatedAt: formatDate(item.updated_at),
  }));

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Learning Path", href: "/dashboard/learning-path" }, { label: "Detail" }]} title={learningPath.title} description="Informasi learning path dan susunan tryout yang ditampilkan kepada pengguna." />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Slug" value={learningPath.slug || "-"} />
        <InfoCard label="Status" value={learningPath.status || "draft"} />
        <InfoCard label="Jumlah Tryout" value={`${tryouts.length} Tryout`} />
        <InfoCard label="Terakhir Diperbarui" value={formatDate(learningPath.updated_at)} />
      </section>
      <LearningPathDetailTabs learningPathId={learningPath.id} description={learningPath.description ?? ""} tryouts={tryouts} availableTryouts={availableTryouts} />
    </div>
  );
}
