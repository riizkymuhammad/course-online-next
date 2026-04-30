import { getAuthenticatedUser } from "@/lib/tryout-attempts";

type SaveAnswerPayload = {
  attemptId: string;
  questionId: string;
  optionId: string;
};

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SaveAnswerPayload>;
  const attemptId = String(body.attemptId ?? "").trim();
  const questionId = String(body.questionId ?? "").trim();
  const optionId = String(body.optionId ?? "").trim();

  if (!attemptId || !questionId || !optionId) {
    return Response.json({ error: "Payload jawaban tidak lengkap." }, { status: 400 });
  }

  const { data: attemptRow } = await supabase
    .from("tryout_attempts")
    .select("id, tryout_id, user_id, status, total_questions")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attemptRow) {
    return Response.json({ error: "Attempt tidak ditemukan." }, { status: 404 });
  }

  if (attemptRow.status !== "in_progress") {
    return Response.json({ error: "Attempt sudah tidak aktif." }, { status: 400 });
  }

  const [{ data: questionRow }, { data: optionRow }] = await Promise.all([
    supabase
      .from("tryout_questions")
      .select("id, tryout_id")
      .eq("id", questionId)
      .eq("tryout_id", attemptRow.tryout_id)
      .maybeSingle(),
    supabase
      .from("tryout_question_options")
      .select("id, tryout_question_id")
      .eq("id", optionId)
      .eq("tryout_question_id", questionId)
      .maybeSingle(),
  ]);

  if (!questionRow || !optionRow) {
    return Response.json({ error: "Soal atau opsi tidak valid." }, { status: 400 });
  }

  const { error: upsertError } = await supabase.from("tryout_attempt_answers").upsert(
    {
      attempt_id: attemptId,
      tryout_id: attemptRow.tryout_id,
      tryout_question_id: questionId,
      selected_option_id: optionId,
      answered_at: new Date().toISOString(),
      is_correct: null,
    },
    { onConflict: "attempt_id,tryout_question_id" }
  );

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 });
  }

  const { count: answeredCount } = await supabase
    .from("tryout_attempt_answers")
    .select("*", { count: "exact", head: true })
    .eq("attempt_id", attemptId);

  const safeAnsweredCount = answeredCount ?? 0;
  const unansweredCount = Math.max((attemptRow.total_questions ?? 0) - safeAnsweredCount, 0);

  const { error: attemptUpdateError } = await supabase
    .from("tryout_attempts")
    .update({
      answered_questions: safeAnsweredCount,
      unanswered_answers: unansweredCount,
    })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (attemptUpdateError) {
    return Response.json({ error: attemptUpdateError.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    answeredQuestions: safeAnsweredCount,
    unansweredQuestions: unansweredCount,
  });
}
