import { createClient } from "@/lib/supabase/server";

type AttemptRow = {
  id: string;
  tryout_id: string;
  user_id: string;
  status: string | null;
};

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function findOrCreateInProgressAttempt({
  tryoutId,
  totalQuestions,
}: {
  tryoutId: string;
  totalQuestions: number;
}) {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { supabase, user: null, attempt: null };
  }

  const { data: existingAttempt } = await supabase
    .from("tryout_attempts")
    .select("id, tryout_id, user_id, status")
    .eq("tryout_id", tryoutId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAttempt) {
    return {
      supabase,
      user,
      attempt: existingAttempt as AttemptRow,
    };
  }

  const { data: createdAttempt, error } = await supabase
    .from("tryout_attempts")
    .insert({
      tryout_id: tryoutId,
      user_id: user.id,
      status: "in_progress",
      total_questions: totalQuestions,
      unanswered_answers: totalQuestions,
    })
    .select("id, tryout_id, user_id, status")
    .single();

  if (error || !createdAttempt) {
    throw new Error(error?.message || "Gagal membuat attempt tryout.");
  }

  return {
    supabase,
    user,
    attempt: createdAttempt as AttemptRow,
  };
}
