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
import { buildLearningPathLabel } from "@/lib/learning-path";
import { getUserProfile } from "@/lib/user-profile";

type CoursePageParams = {
  uuid: string;
  slug: string;
};

type SectionRow = {
  id: string;
  title: string;
  section_order: number;
};

type ModuleRow = {
  id: string;
  course_section_id: string;
  title: string;
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
  props: PageProps<"/course/[uuid]/[slug]">
): Promise<Metadata> {
  const params = (await props.params) as CoursePageParams;
  return {
    title: `Course ${params.slug}`,
    description: "Halaman detail course.",
  };
}

export default async function CourseDetailPage(props: PageProps<"/course/[uuid]/[slug]">) {
  const params = (await props.params) as CoursePageParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: courseRow } = await supabase
    .from("courses")
    .select(
      "id, title, description, learning_path_id, category_id, sub_category_id, section_count, module_count"
    )
    .eq("id", params.uuid)
    .single();

  if (!courseRow) {
    notFound();
  }

  const expectedSlug = slugify(courseRow.title);
  if (params.slug !== expectedSlug) {
    redirect(`/course/${courseRow.id}/${expectedSlug}`);
  }

  let category = "Umum";
  let subCategory = "Umum";
  if (courseRow.learning_path_id) {
    const { data: learningPathRow } = await supabase
      .from("learning_paths")
      .select("title, category, sub_category, sub_sub_category")
      .eq("id", courseRow.learning_path_id)
      .single();

    if (learningPathRow) {
      category = learningPathRow.category?.trim() || buildLearningPathLabel(learningPathRow);
      subCategory = learningPathRow.sub_category?.trim() || learningPathRow.sub_sub_category?.trim() || "Umum";
    }
  }

  if (courseRow.category_id || courseRow.sub_category_id) {
    const [categoryResult, subCategoryResult] = await Promise.all([
      courseRow.category_id
        ? supabase.from("categories").select("name").eq("id", courseRow.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      courseRow.sub_category_id
        ? supabase
            .from("sub_categories")
            .select("name")
            .eq("id", courseRow.sub_category_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    category = categoryResult.data?.name?.trim() || category;
    subCategory = subCategoryResult.data?.name?.trim() || subCategory;
  }

  const { data: sectionRows } = await supabase
    .from("course_sections")
    .select("id, title, section_order")
    .eq("course_id", courseRow.id)
    .order("section_order", { ascending: true });
  const sections = (sectionRows as SectionRow[] | null) ?? [];
  const sectionIds = sections.map((section) => section.id);
  const { data: moduleRows } = sectionIds.length
    ? await supabase
        .from("course_modules")
        .select("id, course_section_id, title, module_order")
        .in("course_section_id", sectionIds)
        .order("module_order", { ascending: true })
    : { data: [] as ModuleRow[] };
  const modulesBySection = new Map<string, ModuleRow[]>();

  ((moduleRows as ModuleRow[] | null) ?? []).forEach((module) => {
    const modules = modulesBySection.get(module.course_section_id) ?? [];
    modules.push(module);
    modulesBySection.set(module.course_section_id, modules);
  });

  const detailHref = `/course/${courseRow.id}/${expectedSlug}`;
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
        loginHref={`/login?redirectedFrom=${encodeURIComponent(detailHref)}`}
      />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0d6efd] via-[#205295] to-[#144272] p-6 text-white shadow-xl shadow-brand-500/15 sm:p-8 lg:col-span-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-950/30 blur-3xl" />

              <div className="relative">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-50">
                  Detail Course
                </span>
                <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  {courseRow.title}
                </h1>
                {courseRow.description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-50">{courseRow.description}</p>
                ) : null}

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Kategori" value={category} />
                  <InfoCard label="Sub Kategori" value={subCategory} />
                  <InfoCard label="Jumlah Section" value={`${courseRow.section_count ?? sections.length} section`} />
                  <InfoCard label="Jumlah Modul" value={`${courseRow.module_count ?? 0} modul`} />
                </div>

                <Link
                  href={`${detailHref}/materi`}
                  className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 shadow-lg shadow-blue-950/15 transition hover:bg-blue-50"
                >
                  Pelajari Materi
                </Link>
              </div>
            </section>

            <aside className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-4">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Struktur Course
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Section & Modul</h2>
              </div>

              {sections.length ? (
                <div className="mt-4 space-y-3">
                  {sections.map((section, index) => {
                    const modules = modulesBySection.get(section.id) ?? [];

                    return (
                      <details
                        key={section.id}
                        open={index === 0}
                        className="group rounded-xl border border-gray-200 dark:border-gray-800"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-gray-800 marker:content-none dark:text-white/90">
                          <span className="min-w-0 truncate">
                            {section.section_order}. {section.title}
                          </span>
                          <span className="shrink-0 text-xs font-medium text-brand-500 group-open:rotate-45">+</span>
                        </summary>
                        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                          {modules.length ? (
                            <ul className="space-y-2">
                              {modules.map((module) => (
                                <li key={module.id} className="text-sm text-gray-600 dark:text-gray-300">
                                  {section.section_order}.{module.module_order} {module.title}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Belum ada modul.</p>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Section dan modul belum tersedia.
                </p>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-100">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
