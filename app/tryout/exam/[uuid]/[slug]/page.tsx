import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import TryoutExamClient from "@/components/tryout/TryoutExamClient";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/tryout";
import { findOrCreateInProgressAttempt } from "@/lib/tryout-attempts";

type TryoutExamPageParams = {
  uuid: string;
  slug: string;
};

type TryoutQuestionRow = {
  id: string;
  question_order: number | null;
  question: string | null;
};

type TryoutOptionRow = {
  id: string;
  tryout_question_id: string;
  option_order: number | null;
  option_text: string | null;
};

type AttemptAnswerRow = {
  tryout_question_id: string;
  selected_option_id: string | null;
};

export async function generateMetadata(
  props: PageProps<"/tryout/exam/[uuid]/[slug]">
): Promise<Metadata> {
  const params = (await props.params) as TryoutExamPageParams;

  return {
    title: `Exam ${params.slug}`,
    description: "Halaman pengerjaan tryout.",
  };
}

export default async function TryoutExamPage(props: PageProps<"/tryout/exam/[uuid]/[slug]">) {
  const params = (await props.params) as TryoutExamPageParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/tryout/exam/${params.uuid}/${params.slug}`)}`);
  }

  const { data: tryoutRow } = await supabase
    .from("tryouts")
    .select("id, title, status, total_questions")
    .eq("id", params.uuid)
    .single();

  if (!tryoutRow) {
    notFound();
  }

  const expectedSlug = slugify(tryoutRow.title);
  if (params.slug !== expectedSlug) {
    redirect(`/tryout/exam/${tryoutRow.id}/${expectedSlug}`);
  }

  const { data: questionRows } = await supabase
    .from("tryout_questions")
    .select("id, question_order, question")
    .eq("tryout_id", tryoutRow.id)
    .order("question_order", { ascending: true });

  const questions = (questionRows as TryoutQuestionRow[] | null) ?? [];

  const optionQueryIds = questions.map((item) => item.id);
  const { data: optionsData } = optionQueryIds.length
    ? await supabase
        .from("tryout_question_options")
        .select("id, tryout_question_id, option_order, option_text")
        .in("tryout_question_id", optionQueryIds)
        .order("option_order", { ascending: true })
    : { data: [] as TryoutOptionRow[] };

  const optionMap = new Map<string, TryoutOptionRow[]>();

  ((optionsData as TryoutOptionRow[] | null) ?? []).forEach((option) => {
    const current = optionMap.get(option.tryout_question_id) ?? [];
    current.push(option);
    optionMap.set(option.tryout_question_id, current);
  });

  const { attempt } = await findOrCreateInProgressAttempt({
    tryoutId: tryoutRow.id,
    totalQuestions: questions.length,
  });

  if (!attempt) {
    redirect(`/login?redirectedFrom=${encodeURIComponent(`/tryout/exam/${params.uuid}/${params.slug}`)}`);
  }

  const { data: attemptAnswers } = await supabase
    .from("tryout_attempt_answers")
    .select("tryout_question_id, selected_option_id")
    .eq("attempt_id", attempt.id);

  const initialAnswers = Object.fromEntries(
    ((attemptAnswers as AttemptAnswerRow[] | null) ?? [])
      .filter((item) => item.selected_option_id)
      .map((item) => [item.tryout_question_id, item.selected_option_id as string])
  );

  return (
    <TryoutExamClient
      attemptId={attempt.id}
      tryoutTitle={tryoutRow.title}
      previewHref={`/tryout/${tryoutRow.id}/${expectedSlug}`}
      initialAnswers={initialAnswers}
      questions={questions.map((question, index) => ({
        id: question.id,
        order: question.question_order ?? index + 1,
        question: question.question ?? "Soal belum memiliki teks.",
        options: (optionMap.get(question.id) ?? []).map((option, optionIndex) => ({
          id: option.id,
          order: option.option_order ?? optionIndex + 1,
          text: option.option_text ?? "-",
        })),
      }))}
    />
  );
}
