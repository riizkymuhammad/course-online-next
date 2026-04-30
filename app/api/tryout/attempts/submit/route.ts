import { slugify } from "@/lib/tryout";
import { getAuthenticatedUser } from "@/lib/tryout-attempts";

type SubmitAttemptPayload = {
  attemptId: string;
};

type QuestionRow = {
  id: string;
  correct_option_id: string | null;
};

type AnswerRow = {
  id: string;
  tryout_question_id: string;
  selected_option_id: string | null;
};

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<SubmitAttemptPayload>;
  const attemptId = String(body.attemptId ?? "").trim();

  if (!attemptId) {
    return Response.json({ error: "Attempt tidak ditemukan." }, { status: 400 });
  }

  const { data: attemptRow } = await supabase
    .from("tryout_attempts")
    .select("id, tryout_id, user_id, status, started_at, total_questions")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attemptRow) {
    return Response.json({ error: "Attempt tidak ditemukan." }, { status: 404 });
  }

  if (attemptRow.status !== "in_progress") {
    return Response.json({ error: "Attempt sudah dikumpulkan." }, { status: 400 });
  }

  const [{ data: tryoutRow }, { data: questionRows }, { data: answerRows }] = await Promise.all([
    supabase.from("tryouts").select("id, title").eq("id", attemptRow.tryout_id).single(),
    supabase
      .from("tryout_questions")
      .select("id, correct_option_id")
      .eq("tryout_id", attemptRow.tryout_id)
      .order("question_order", { ascending: true }),
    supabase
      .from("tryout_attempt_answers")
      .select("id, tryout_question_id, selected_option_id")
      .eq("attempt_id", attemptId),
  ]);

  if (!tryoutRow) {
    return Response.json({ error: "Tryout tidak ditemukan." }, { status: 404 });
  }

  const questions = (questionRows as QuestionRow[] | null) ?? [];
  const answers = (answerRows as AnswerRow[] | null) ?? [];
  const answerMap = new Map(answers.map((answer) => [answer.tryout_question_id, answer]));

  const unansweredQuestions = questions.filter((question) => !answerMap.has(question.id));
  if (unansweredQuestions.length > 0) {
    return Response.json(
      { error: "Masih ada soal yang belum dijawab. Selesaikan semua soal terlebih dahulu." },
      { status: 400 }
    );
  }

  let correctAnswers = 0;
  let wrongAnswers = 0;

  for (const question of questions) {
    const answer = answerMap.get(question.id);
    const isCorrect =
      Boolean(question.correct_option_id) && answer?.selected_option_id === question.correct_option_id;

    if (isCorrect) {
      correctAnswers += 1;
    } else {
      wrongAnswers += 1;
    }

    await supabase
      .from("tryout_attempt_answers")
      .update({ is_correct: isCorrect })
      .eq("id", answer!.id)
      .eq("attempt_id", attemptId);
  }

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0;
  const submittedAt = new Date();
  const durationSeconds = attemptRow.started_at
    ? Math.max(
        Math.round((submittedAt.getTime() - new Date(attemptRow.started_at).getTime()) / 1000),
        0
      )
    : null;

  const { error: updateError } = await supabase
    .from("tryout_attempts")
    .update({
      status: "graded",
      submitted_at: submittedAt.toISOString(),
      graded_at: submittedAt.toISOString(),
      total_questions: totalQuestions,
      answered_questions: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      unanswered_answers: 0,
      score,
      max_score: 100,
      duration_seconds: durationSeconds,
    })
    .eq("id", attemptId)
    .eq("user_id", user.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    redirectTo: `/tryout/result/${tryoutRow.id}/${slugify(tryoutRow.title)}/${attemptId}`,
  });
}
