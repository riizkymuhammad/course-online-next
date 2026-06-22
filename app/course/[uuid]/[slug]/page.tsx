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
  estimated_minutes: number | null;
  learning_objectives: unknown;
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
        .select("id, course_section_id, title, module_order, estimated_minutes, learning_objectives")
        .in("course_section_id", sectionIds)
        .order("module_order", { ascending: true })
    : { data: [] as ModuleRow[] };
  const modulesBySection = new Map<string, ModuleRow[]>();

  ((moduleRows as ModuleRow[] | null) ?? []).forEach((module) => {
    const modules = modulesBySection.get(module.course_section_id) ?? [];
    modules.push(module);
    modulesBySection.set(module.course_section_id, modules);
  });

  const modules = (moduleRows as ModuleRow[] | null) ?? [];
  const totalEstimatedMinutes = modules.reduce(
    (total, module) => total + Math.max(0, Number(module.estimated_minutes ?? 0)),
    0
  );
  const highlights = Array.from(
    new Set(
      modules.flatMap((module) =>
        Array.isArray(module.learning_objectives)
          ? module.learning_objectives.filter(
              (objective): objective is string =>
                typeof objective === "string" && Boolean(objective.trim())
            )
          : []
      )
    )
  ).slice(0, 6);

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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-brand-600">
            Beranda
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/#kelas" className="hover:text-brand-600">
            Kelas
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">{courseRow.title}</span>
        </nav>

        <div className="mt-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8 lg:col-span-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Detail Course</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {courseRow.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {category}
                </span>
                <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  {subCategory}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <InfoCard label="Jumlah Section" value={`${courseRow.section_count ?? sections.length} section`} />
                <InfoCard label="Jumlah Modul" value={`${courseRow.module_count ?? modules.length} modul`} />
                <InfoCard
                  label="Estimasi"
                  value={totalEstimatedMinutes ? `${totalEstimatedMinutes} menit` : "-"}
                />
              </div>

              {courseRow.description ? (
                <div className="mt-8">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Deskripsi Course</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
                    {courseRow.description}
                  </p>
                </div>
              ) : null}

              {highlights.length ? (
                <div className="mt-8">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Yang akan kamu pelajari</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2.5 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                          ✓
                        </span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
                <Link
                  href={`${detailHref}/materi`}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                >
                  Pelajari Materi
                </Link>
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-24 lg:col-span-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  ☷
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Struktur Course</p>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Section & Modul</h2>
                </div>
              </div>

              {sections.length ? (
                <div className="mt-2 max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                  {sections.map((section, index) => {
                    const modules = modulesBySection.get(section.id) ?? [];

                    return (
                      <details
                        key={section.id}
                        open={index === 0}
                        className="group border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold text-gray-800 marker:content-none dark:text-white/90">
                          <span className="min-w-0 truncate">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                              {section.section_order}
                            </span>
                            {section.title}
                          </span>
                          <span className="shrink-0 text-xs font-medium text-brand-500 group-open:rotate-45">+</span>
                        </summary>
                        <div className="pb-4 pl-8">
                          {modules.length ? (
                            <>
                              <p className="mb-2 text-xs font-medium text-gray-400">{modules.length} modul</p>
                              <ul className="space-y-1">
                                {modules.map((module) => (
                                  <li key={module.id}>
                                    <Link
                                      href={`${detailHref}/materi/${module.id}`}
                                      className="block rounded-md px-2 py-1.5 text-sm text-gray-600 transition hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                                    >
                                      <span className="mr-2 font-semibold text-brand-600">
                                        {section.section_order}.{module.module_order}
                                      </span>
                                      {module.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </>
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
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
        •
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
