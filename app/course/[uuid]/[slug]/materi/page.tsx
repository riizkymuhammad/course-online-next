import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CourseMaterialParams = {
  uuid: string;
  slug: string;
};

export default async function CourseMaterialIndexPage({
  params,
}: PageProps<"/course/[uuid]/[slug]/materi">) {
  const routeParams = (await params) as CourseMaterialParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirectedFrom=${encodeURIComponent(
        `/course/${routeParams.uuid}/${routeParams.slug}/materi`
      )}`
    );
  }

  const { data: sections } = await supabase
    .from("course_sections")
    .select("id")
    .eq("course_id", routeParams.uuid)
    .order("section_order", { ascending: true })
    .limit(1);
  const firstSectionId = sections?.[0]?.id;
  const { data: modules } = firstSectionId
    ? await supabase
        .from("course_modules")
        .select("id")
        .eq("course_section_id", firstSectionId)
        .order("module_order", { ascending: true })
        .limit(1)
    : { data: [] as Array<{ id: string }> };
  const firstModuleId = modules?.[0]?.id;

  if (!firstModuleId) {
    redirect(`/course/${routeParams.uuid}/${routeParams.slug}`);
  }

  redirect(`/course/${routeParams.uuid}/${routeParams.slug}/materi/${firstModuleId}`);
}
