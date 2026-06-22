import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicNavbar from "@/components/header/PublicNavbar";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";

type CourseMaterialParams = {
  uuid: string;
  slug: string;
};

type SectionRow = {
  id: string;
  title: string;
  description: string | null;
  section_order: number;
};

type ModuleRow = {
  id: string;
  course_section_id: string;
  title: string;
  description: string | null;
  content_markdown: string | null;
  learning_objectives: unknown;
  estimated_minutes: number | null;
  module_order: number;
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
  props: PageProps<"/course/[uuid]/[slug]/materi">
): Promise<Metadata> {
  const params = (await props.params) as CourseMaterialParams;
  return {
    title: `Materi ${params.slug}`,
    description: "Materi lengkap course.",
  };
}

export default async function CourseMaterialPage(
  props: PageProps<"/course/[uuid]/[slug]/materi">
) {
  const params = (await props.params) as CourseMaterialParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: courseRow } = await supabase
    .from("courses")
    .select("id, title, description, ai_generated_summary")
    .eq("id", params.uuid)
    .single();

  if (!courseRow) {
    notFound();
  }

  const expectedSlug = slugify(courseRow.title);
  const detailHref = `/course/${courseRow.id}/${expectedSlug}`;
  if (params.slug !== expectedSlug) {
    redirect(`${detailHref}/materi`);
  }

  const { data: sectionRows } = await supabase
    .from("course_sections")
    .select("id, title, description, section_order")
    .eq("course_id", courseRow.id)
    .order("section_order", { ascending: true });
  const sections = (sectionRows as SectionRow[] | null) ?? [];
  const sectionIds = sections.map((section) => section.id);
  const { data: moduleRows } = sectionIds.length
    ? await supabase
        .from("course_modules")
        .select(
          "id, course_section_id, title, description, content_markdown, learning_objectives, estimated_minutes, module_order"
        )
        .in("course_section_id", sectionIds)
        .order("module_order", { ascending: true })
    : { data: [] as ModuleRow[] };
  const modulesBySection = new Map<string, ModuleRow[]>();

  ((moduleRows as ModuleRow[] | null) ?? []).forEach((module) => {
    const modules = modulesBySection.get(module.course_section_id) ?? [];
    modules.push(module);
    modulesBySection.set(module.course_section_id, modules);
  });

  const userProfile = user ? getUserProfile(user) : null;
  const cookieStore = await cookies();
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicNavbar
        userProfile={userProfile}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
        loginHref={`/login?redirectedFrom=${encodeURIComponent(`${detailHref}/materi`)}`}
      />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <Link href={detailHref} className="text-sm font-medium text-brand-600 hover:text-brand-700">
              ← Kembali ke detail course
            </Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
              Materi Course
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{courseRow.title}</h1>
            {courseRow.description ? (
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{courseRow.description}</p>
            ) : null}
            {courseRow.ai_generated_summary ? (
              <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
                {courseRow.ai_generated_summary}
              </p>
            ) : null}
          </section>

          {sections.map((section) => {
            const modules = modulesBySection.get(section.id) ?? [];

            return (
              <section
                key={section.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Section {section.section_order}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                {section.description ? (
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    {section.description}
                  </p>
                ) : null}

                <div className="mt-5 space-y-4">
                  {modules.map((module) => (
                    <article key={module.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                            Modul {section.section_order}.{module.module_order}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                            {module.title}
                          </h3>
                        </div>
                        {module.estimated_minutes ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                            {module.estimated_minutes} menit
                          </span>
                        ) : null}
                      </div>

                      {module.description ? (
                        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                          {module.description}
                        </p>
                      ) : null}
                      <LearningObjectives value={module.learning_objectives} />
                      <MarkdownContent value={module.content_markdown} />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function LearningObjectives({ value }: { value: unknown }) {
  const objectives = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

  if (!objectives.length) return null;

  return (
    <div className="mt-4 rounded-lg bg-brand-50 p-3 dark:bg-brand-500/10">
      <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">Tujuan belajar</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-brand-800 dark:text-brand-200">
        {objectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
    </div>
  );
}

function MarkdownContent({ value }: { value: string | null }) {
  if (!value) {
    return <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Isi materi belum tersedia.</p>;
  }

  return (
    <div className="mt-4 space-y-3 text-sm leading-7 text-gray-700 dark:text-gray-200">
      {value.split("\n").map((line, index) => {
        const heading = line.match(/^(#{1,3})\s+(.+)/);
        const bullet = line.match(/^[-*]\s+(.+)/);

        if (heading) {
          const headingClass =
            heading[1].length === 1
              ? "text-lg font-semibold text-gray-900 dark:text-white"
              : "text-base font-semibold text-gray-900 dark:text-white";
          return (
            <p key={`${line}-${index}`} className={headingClass}>
              {heading[2]}
            </p>
          );
        }

        if (bullet) {
          return (
            <p key={`${line}-${index}`} className="pl-4 before:mr-2 before:content-['•']">
              {bullet[1]}
            </p>
          );
        }

        return line.trim() ? <p key={`${line}-${index}`}>{line}</p> : <div key={`space-${index}`} />;
      })}
    </div>
  );
}
