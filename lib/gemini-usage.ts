import type { LanguageModelUsage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeminiUsageSnapshot } from "@/lib/gemini-limits";
import { createAdminClient } from "@/lib/supabase/admin";

type GeminiUsageFeature = "course-generate" | "tryout-generate" | (string & {});

type GeminiUsageLogRow = {
  request_count: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  created_at: string | null;
};

type RecordGeminiUsageInput = {
  feature: GeminiUsageFeature;
  model: string;
  usage?: LanguageModelUsage;
  resourceId?: string | null;
  resourceTitle?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export const emptyGeminiUsageSnapshot: GeminiUsageSnapshot = {
  sourceReady: false,
  requestCountLastMinute: 0,
  inputTokensLastMinute: 0,
  outputTokensLastMinute: 0,
  totalTokensLastMinute: 0,
  requestCountToday: 0,
  inputTokensToday: 0,
  outputTokensToday: 0,
  totalTokensToday: 0,
  lastLoggedAt: null,
  errorMessage: null,
};

function normalizeCount(value: number | undefined | null) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value ?? 0));
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function sumRows(rows: GeminiUsageLogRow[]) {
  return rows.reduce(
    (total, row) => ({
      requestCount: total.requestCount + normalizeCount(row.request_count),
      inputTokens: total.inputTokens + normalizeCount(row.input_tokens),
      outputTokens: total.outputTokens + normalizeCount(row.output_tokens),
      totalTokens: total.totalTokens + normalizeCount(row.total_tokens),
    }),
    {
      requestCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    }
  );
}

function getLastLoggedAt(rows: GeminiUsageLogRow[]) {
  return rows
    .map((row) => row.created_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

export async function recordGeminiUsage(input: RecordGeminiUsageInput) {
  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  const inputTokens = normalizeCount(input.usage?.inputTokens);
  const outputTokens = normalizeCount(input.usage?.outputTokens);
  const totalTokens = normalizeCount(input.usage?.totalTokens ?? inputTokens + outputTokens);

  const { error } = await supabase.from("gemini_usage_logs").insert({
    feature: input.feature,
    model: input.model,
    request_count: 1,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    resource_id: input.resourceId ?? null,
    resource_title: input.resourceTitle ?? null,
    user_id: input.userId ?? null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.warn("[gemini-usage] Gagal mencatat penggunaan Gemini:", error.message);
  }
}

export async function getGeminiUsageSnapshot(
  supabase: SupabaseClient | null
): Promise<GeminiUsageSnapshot> {
  if (!supabase) {
    return {
      ...emptyGeminiUsageSnapshot,
      errorMessage: "SUPABASE_SERVICE_ROLE_KEY belum tersedia untuk membaca log penggunaan.",
    };
  }

  const today = startOfToday();
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const { data, error } = await supabase
    .from("gemini_usage_logs")
    .select("request_count, input_tokens, output_tokens, total_tokens, created_at")
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return {
      ...emptyGeminiUsageSnapshot,
      errorMessage: error.message,
    };
  }

  const rows = ((data as GeminiUsageLogRow[] | null) ?? []).map((row) => ({
    request_count: row.request_count,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    total_tokens: row.total_tokens,
    created_at: row.created_at,
  }));
  const rowsLastMinute = rows.filter((row) => {
    if (!row.created_at) return false;
    return new Date(row.created_at).getTime() >= oneMinuteAgo.getTime();
  });
  const todayTotals = sumRows(rows);
  const minuteTotals = sumRows(rowsLastMinute);

  return {
    sourceReady: true,
    requestCountLastMinute: minuteTotals.requestCount,
    inputTokensLastMinute: minuteTotals.inputTokens,
    outputTokensLastMinute: minuteTotals.outputTokens,
    totalTokensLastMinute: minuteTotals.totalTokens,
    requestCountToday: todayTotals.requestCount,
    inputTokensToday: todayTotals.inputTokens,
    outputTokensToday: todayTotals.outputTokens,
    totalTokensToday: todayTotals.totalTokens,
    lastLoggedAt: getLastLoggedAt(rows),
    errorMessage: null,
  };
}
