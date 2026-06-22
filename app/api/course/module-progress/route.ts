import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    courseId?: unknown;
    moduleId?: unknown;
    action?: unknown;
  } | null;
  const courseId = typeof body?.courseId === "string" ? body.courseId.trim() : "";
  const moduleId = typeof body?.moduleId === "string" ? body.moduleId.trim() : "";
  const action = body?.action === "complete" ? "complete" : "open";

  if (!courseId || !moduleId) {
    return Response.json({ error: "Course atau modul tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Masuk terlebih dahulu untuk menyimpan progres." }, { status: 401 });
  }

  const { data: moduleRow } = await supabase
    .from("course_modules")
    .select("id, course_section_id")
    .eq("id", moduleId)
    .single();

  if (!moduleRow) {
    return Response.json({ error: "Modul tidak ditemukan." }, { status: 404 });
  }

  const { data: sectionRow } = await supabase
    .from("course_sections")
    .select("course_id")
    .eq("id", moduleRow.course_section_id)
    .eq("course_id", courseId)
    .single();

  if (!sectionRow) {
    return Response.json({ error: "Modul tidak termasuk dalam course ini." }, { status: 400 });
  }

  const { data: existingProgress } = await supabase
    .from("learning_course")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_module_id", moduleId)
    .maybeSingle();
  const now = new Date().toISOString();
  const payload =
    action === "complete"
      ? { status: "complete", last_opened_at: now, completed_at: now }
      : existingProgress?.status === "complete"
        ? { last_opened_at: now }
        : { status: "reading", last_opened_at: now };
  const { error } = existingProgress
    ? await supabase.from("learning_course").update(payload).eq("id", existingProgress.id)
    : await supabase.from("learning_course").insert({
        user_id: user.id,
        course_id: courseId,
        course_module_id: moduleId,
        ...payload,
      });

  if (error) {
    return Response.json(
      { error: error.message || "Gagal menyimpan progres pembelajaran." },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    status: action === "complete" || existingProgress?.status === "complete" ? "complete" : "reading",
  });
}
