import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicNavbar from "@/components/header/PublicNavbar";
import TryoutResultReviewClient from "@/components/tryout/TryoutResultReviewClient";
import { ACTIVE_ROLE_COOKIE, getEffectiveRole, getUserRole } from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";
import { getUserProfile } from "@/lib/user-profile";

type ResultPageParams = { uuid: string; slug: string; attemptId: string };
type QuestionRow = { id: string; question_order: number | null; question: string | null; correct_option_id: string | null };
type OptionRow = { id: string; tryout_question_id: string; option_order: number | null; option_text: string | null };
type AnswerRow = { tryout_question_id: string; selected_option_id: string | null; is_correct: boolean | null };

export async function generateMetadata(props: PageProps<"/tryout/result/[uuid]/[slug]/[attemptId]">): Promise<Metadata> {
  const params = (await props.params) as ResultPageParams;
  return { title: `Hasil Tryout ${params.slug}`, description: "Review jawaban hasil pengerjaan tryout." };
}

export default async function TryoutResultPage(props: PageProps<"/tryout/result/[uuid]/[slug]/[attemptId]">) {
  const params = (await props.params) as ResultPageParams;
  const supabase = await createClient();
  const [{ data: { user } }, cookieStore] = await Promise.all([
    supabase.auth.getUser(),
    cookies(),
  ]);

  if (!user) redirect(`/login?redirectedFrom=${encodeURIComponent(`/tryout/result/${params.uuid}/${params.slug}/${params.attemptId}`)}`);

  const { data: attemptRow } = await supabase
    .from("tryout_attempts")
    .select("id, tryout_id, user_id, status, score")
    .eq("id", params.attemptId)
    .eq("tryout_id", params.uuid)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attemptRow) notFound();
  if (attemptRow.status !== "submitted" && attemptRow.status !== "graded") {
    redirect(`/tryout/exam/${params.uuid}/${params.slug}`);
  }

  const { data: tryoutRow } = await supabase.from("tryouts").select("id, title").eq("id", attemptRow.tryout_id).single();
  if (!tryoutRow) notFound();

  const expectedSlug = slugify(tryoutRow.title);
  if (params.slug !== expectedSlug) redirect(`/tryout/result/${tryoutRow.id}/${expectedSlug}/${attemptRow.id}`);

  const { data: questionData } = await supabase
    .from("tryout_questions")
    .select("id, question_order, question, correct_option_id")
    .eq("tryout_id", tryoutRow.id)
    .order("question_order", { ascending: true });
  const questions = (questionData as QuestionRow[] | null) ?? [];
  const questionIds = questions.map((question) => question.id);

  const [{ data: optionData }, { data: answerData }] = questionIds.length
    ? await Promise.all([
        supabase.from("tryout_question_options").select("id, tryout_question_id, option_order, option_text").in("tryout_question_id", questionIds).order("option_order", { ascending: true }),
        supabase.from("tryout_attempt_answers").select("tryout_question_id, selected_option_id, is_correct").eq("attempt_id", attemptRow.id),
      ])
    : [{ data: [] as OptionRow[] }, { data: [] as AnswerRow[] }];

  const optionMap = new Map<string, OptionRow[]>();
  ((optionData as OptionRow[] | null) ?? []).forEach((option) => optionMap.set(option.tryout_question_id, [...(optionMap.get(option.tryout_question_id) ?? []), option]));
  const answerMap = new Map(((answerData as AnswerRow[] | null) ?? []).map((answer) => [answer.tryout_question_id, answer]));
  const accountRole = getUserRole(user);
  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: cookieStore.get(ACTIVE_ROLE_COOKIE)?.value,
  });
  const resultHref = `/tryout/result/${tryoutRow.id}/${expectedSlug}/${attemptRow.id}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PublicNavbar
        userProfile={getUserProfile(user)}
        activeRole={activeRole}
        canSwitchRole={accountRole === "admin"}
        loginHref={`/login?redirectedFrom=${encodeURIComponent(resultHref)}`}
      />
      <TryoutResultReviewClient
        tryoutTitle={tryoutRow.title}
        score={Number(attemptRow.score ?? 0)}
        detailHref={`/tryout/${tryoutRow.id}/${expectedSlug}`}
        retryHref={`/tryout/exam/${tryoutRow.id}/${expectedSlug}`}
        questions={questions.map((question, index) => {
          const answer = answerMap.get(question.id);
          return {
            id: question.id,
            order: question.question_order ?? index + 1,
            question: question.question ?? "Soal belum memiliki teks.",
            selectedOptionId: answer?.selected_option_id ?? null,
            correctOptionId: question.correct_option_id,
            isCorrect: answer?.is_correct ?? (Boolean(question.correct_option_id) && answer?.selected_option_id === question.correct_option_id),
            options: (optionMap.get(question.id) ?? []).map((option) => ({ id: option.id, text: option.option_text ?? "-" })),
          };
        })}
      />
    </div>
  );
}
