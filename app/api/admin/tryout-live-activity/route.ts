import { getUserRole } from "@/lib/auth-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null;

type LiveAttemptRow = {
  id: string;
  user_id: string;
  answered_questions: number | null;
  total_questions: number | null;
  current_question_order: number | null;
  last_activity_at: string | null;
  started_at: string;
  tryouts: Relation<{ title: string }>;
  current_question: Relation<{ question: string | null }>;
};

function firstRelation<T>(value: Relation<T>) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getUserName(metadata: unknown, email?: string | null) {
  const value = metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : {};
  const fullName = typeof value.full_name === "string" ? value.full_name.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  return fullName || name || email?.trim() || "User";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ error: "Supabase service role belum dikonfigurasi." }, { status: 503 });
  }

  const [{ data, error }, { data: authData }] = await Promise.all([
    admin
      .from("tryout_attempts")
      .select("id, user_id, answered_questions, total_questions, current_question_order, last_activity_at, started_at, tryouts(title), current_question:tryout_questions!tryout_attempts_current_question_id_fkey(question)")
      .eq("status", "in_progress")
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(100),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const userMap = new Map(
    (authData?.users ?? []).map((item) => [item.id, getUserName(item.user_metadata, item.email)])
  );
  const now = Date.now();
  const attempts = ((data as LiveAttemptRow[] | null) ?? []).map((attempt) => {
    const lastActivityTime = attempt.last_activity_at
      ? new Date(attempt.last_activity_at).getTime()
      : 0;

    return {
      id: attempt.id,
      userName: userMap.get(attempt.user_id) ?? attempt.user_id,
      tryoutTitle: firstRelation(attempt.tryouts)?.title ?? "Tryout tidak ditemukan",
      currentQuestionOrder: attempt.current_question_order,
      currentQuestion: firstRelation(attempt.current_question)?.question ?? null,
      answeredQuestions: attempt.answered_questions ?? 0,
      totalQuestions: attempt.total_questions ?? 0,
      lastActivityAt: attempt.last_activity_at,
      startedAt: attempt.started_at,
      isOnline: lastActivityTime > 0 && now - lastActivityTime <= 30_000,
    };
  });

  return Response.json({ attempts, generatedAt: new Date(now).toISOString() });
}

