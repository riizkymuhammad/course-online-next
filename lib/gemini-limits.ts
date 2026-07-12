export type GeminiRateLimitMetric = {
  key: "rpm" | "tpm" | "rpd";
  label: string;
  shortLabel: string;
  value: number | null;
  unit: string;
  description: string;
};

export type GeminiLimitSummary = {
  apiKeyConfigured: boolean;
  model: string;
  usageTier: string;
  metrics: GeminiRateLimitMetric[];
  configuredMetricCount: number;
  activeLimitUrl: string;
  docsUrl: string;
};

export const GEMINI_GENERATION_MODEL = "gemini-2.5-flash";

const activeLimitUrl = "https://aistudio.google.com/app/apikey";
const docsUrl = "https://ai.google.dev/gemini-api/docs/rate-limits";

function readPositiveInteger(name: string) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
}

export function getGeminiLimitSummary(): GeminiLimitSummary {
  const metrics: GeminiRateLimitMetric[] = [
    {
      key: "rpm",
      label: "Requests per minute",
      shortLabel: "RPM",
      value: readPositiveInteger("GEMINI_RATE_LIMIT_RPM"),
      unit: "request/menit",
      description: "Batas request dalam 1 menit.",
    },
    {
      key: "tpm",
      label: "Tokens per minute",
      shortLabel: "TPM",
      value: readPositiveInteger("GEMINI_RATE_LIMIT_TPM"),
      unit: "token input/menit",
      description: "Batas token input dalam 1 menit.",
    },
    {
      key: "rpd",
      label: "Requests per day",
      shortLabel: "RPD",
      value: readPositiveInteger("GEMINI_RATE_LIMIT_RPD"),
      unit: "request/hari",
      description: "Batas request harian.",
    },
  ];

  return {
    apiKeyConfigured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()),
    model: GEMINI_GENERATION_MODEL,
    usageTier: process.env.GEMINI_USAGE_TIER?.trim() || "Belum diatur",
    metrics,
    configuredMetricCount: metrics.filter((metric) => metric.value !== null).length,
    activeLimitUrl,
    docsUrl,
  };
}
