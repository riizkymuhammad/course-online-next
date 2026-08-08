import { getAuthenticatedUser } from "@/lib/tryout-attempts";

type ActivityPayload = {
  attemptId: string;
  questionId: string;
  questionOrder: number;
};

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<ActivityPayload> | null;
  const attemptId = String(body?.attemptId ?? "").trim();
  const questionId = String(body?.questionId ?? "").trim();
  const questionOrder = Number(body?.questionOrder);

  if (!attemptId || !questionId || !Number.isInteger(questionOrder) || questionOrder < 1) {
    return Response.json({ error: "Payload aktivitas tidak valid." }, { status: 400 });
  }

  const { data: attempt } = await supabase
    .from("tryout_attempts")
    .select("id, tryout_id, status")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attempt || attempt.status !== "in_progress") {
    return Response.json({ error: "Attempt aktif tidak ditemukan." }, { status: 404 });
  }

  const { data: question } = await supabase
    .from("tryout_questions")
    .select("id, question_order")
    .eq("id", questionId)
    .eq("tryout_id", attempt.tryout_id)
    .eq("question_order", questionOrder)
    .maybeSingle();

  if (!question) {
    return Response.json({ error: "Soal tidak termasuk dalam tryout ini." }, { status: 400 });
  }

  const { error } = await supabase
    .from("tryout_attempts")
    .update({
      current_question_id: question.id,
      current_question_order: question.question_order,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", attempt.id)
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

