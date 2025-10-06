import OpenAI from "openai";

let cachedClient: OpenAI | null = null;
let quotaRetryAt: number | null = null;

export const RETRY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export const getOpenAIClient = (): OpenAI => {
  if (!cachedClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
};

export const isQuotaError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const candidate = error as {
    status?: number;
    code?: string;
    error?: { code?: string; type?: string };
  };
  if (candidate.status === 429) {
    return true;
  }
  if (candidate.code === "insufficient_quota") {
    return true;
  }
  if (candidate.error && (candidate.error.code === "insufficient_quota" || candidate.error.type === "insufficient_quota")) {
    return true;
  }
  return false;
};

export const shouldThrottleOpenAI = (): boolean => {
  if (!quotaRetryAt) {
    return false;
  }
  if (Date.now() < quotaRetryAt) {
    return true;
  }
  quotaRetryAt = null;
  return false;
};

export const markQuotaRetry = (): string => {
  quotaRetryAt = Date.now() + RETRY_COOLDOWN_MS;
  return new Date(quotaRetryAt).toISOString();
};

export const currentRetryIso = (): string | undefined =>
  quotaRetryAt ? new Date(quotaRetryAt).toISOString() : undefined;

