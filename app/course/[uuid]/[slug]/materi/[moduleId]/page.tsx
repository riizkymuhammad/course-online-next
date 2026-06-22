import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicNavbar from "@/components/header/PublicNavbar";
import CourseMaterialClient, {
  type CourseMaterialModule,
  type CourseMaterialSection,
} from "@/components/course/CourseMaterialClient";
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
  moduleId: string;
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
  props: PageProps<"/course/[uuid]/[slug]/materi/[moduleId]">
): Promise<Metadata> {
  const params = (await props.params) as CourseMaterialParams;
  return {
    title: `Materi ${params.slug}`,
    description: "Materi modul course.",
  };
}

export default async function CourseModuleMaterialPage({
  params,
}: PageProps<"/course/[uuid]/[slug]/materi/[moduleId]">) {
  const routeParams = (await params) as CourseMaterialParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: courseRow } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", routeParams.uuid)
    .single();

  if (!courseRow) {
    notFound();
  }

  const expectedSlug = slugify(courseRow.title);
  const detailHref = `/course/${courseRow.id}/${expectedSlug}`;
  const materialBaseHref = `${detailHref}/materi`;
  if (routeParams.slug !== expectedSlug) {
    redirect(`${materialBaseHref}/${routeParams.moduleId}`);
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
  const modules = (moduleRows as ModuleRow[] | null) ?? [];
  const moduleIds = modules.map((module) => module.id);

  if (!moduleIds.includes(routeParams.moduleId)) {
    notFound();
  }

  const { data: progressRows } = user && moduleIds.length
    ? await supabase
        .from("learning_course")
        .select("course_module_id, status")
        .eq("user_id", user.id)
        .eq("course_id", courseRow.id)
        .in("course_module_id", moduleIds)
    : { data: [] as Array<{ course_module_id: string; status: string }> };
  const modulesBySection = new Map<string, CourseMaterialModule[]>();

  modules.forEach((module) => {
    const sectionModules = modulesBySection.get(module.course_section_id) ?? [];
    sectionModules.push({
      id: module.id,
      title: module.title,
      description: module.description,
      contentMarkdown: module.content_markdown,
      learningObjectives: module.learning_objectives,
      estimatedMinutes: module.estimated_minutes,
      moduleOrder: module.module_order,
    });
    modulesBySection.set(module.course_section_id, sectionModules);
  });

  const materialSections: CourseMaterialSection[] = sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    sectionOrder: section.section_order,
    modules: modulesBySection.get(section.id) ?? [],
  }));
  const completedModuleIds = (progressRows ?? [])
    .filter((row) => row.status === "complete")
    .map((row) => row.course_module_id);
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
        loginHref={`/login?redirectedFrom=${encodeURIComponent(`${materialBaseHref}/${routeParams.moduleId}`)}`}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link href={detailHref} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          ← Kembali ke detail course
        </Link>
        <div className="mt-5">
          <CourseMaterialClient
            key={routeParams.moduleId}
            courseId={courseRow.id}
            courseTitle={courseRow.title}
            sections={materialSections}
            initialModuleId={routeParams.moduleId}
            completedModuleIds={completedModuleIds}
            isLoggedIn={Boolean(user)}
            materialBaseHref={materialBaseHref}
          />
        </div>
      </main>
    </div>
  );
}
