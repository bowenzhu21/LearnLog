import OpenAI from "openai";

import { minutesByTag, sumMinutes, type Log } from "@/lib/analytics";

let cachedClient: OpenAI | null = null;
let skipUntilMillis = 0;

const MODEL = "gpt-4o-mini";
const RETRY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

const getClient = (): OpenAI => {
  if (!cachedClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
};

const buildPrompt = (logs: Log[]): string => {
  const totalMinutes = sumMinutes(logs);
  const reflections =
    logs
      .slice(0, 50)
      .map((log, index) => {
        const title = log.title?.trim();
        const label = title && title.length > 0 ? title : `Entry ${index + 1}`;
        const minutes = Number.isFinite(log.timeSpent) ? log.timeSpent : 0;
        const reflection = log.reflection?.trim() || "No reflection provided.";
        return `- ${label} (${minutes} min): ${reflection}`;
      })
      .join("\n") || "- No reflections recorded.";

  return [
    "You are a helpful assistant summarizing learning reflections.",
    `Summarize the following ${logs.length} entries into a concise, engaging weekly reflection (3–5 sentences).`,
    "Highlight key themes, what the person learned, and any progress patterns.",
    `Total time: ${totalMinutes} minutes.`,
    "Reflections:",
    reflections,
  ].join("\n");
};

const buildFallbackSummary = (logs: Log[], reason: string, nextRetryIso?: string): string => {
  const totalMinutes = sumMinutes(logs);
  const entries = logs.length;
  const tagLines = minutesByTag(logs)
    .slice(0, 3)
    .map((tag) => `• ${tag.tag}: ${tag.minutes} min`)
    .join("\n");
  const reflections = logs
    .slice(0, 3)
    .map((log, index) => {
      const title = log.title?.trim() || `Entry ${index + 1}`;
      return `• ${title}: ${log.reflection?.trim() || "No reflection captured."}`;
    })
    .join("\n");

  const retryLine = nextRetryIso ? `• Next retry: ${nextRetryIso}` : "";

  return [
    `Summary unavailable (${reason}). Falling back to an automatic recap.`,
    "",
    `• Sessions: ${entries}`,
    `• Total minutes: ${totalMinutes}`,
    retryLine,
    tagLines ? `• Top tags:\n${tagLines}` : "• Top tags: not enough data",
    reflections ? `\nHighlights:\n${reflections}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const isQuotaError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const candidate = error as { status?: number; code?: string; error?: { code?: string; type?: string } };
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

export async function generateWeeklySummary(logs: Log[]): Promise<string> {
  if (logs.length === 0) {
    return "No learning activity recorded for this range.";
  }

  const now = Date.now();
  if (skipUntilMillis && now < skipUntilMillis) {
    return buildFallbackSummary(logs, "quota exceeded", new Date(skipUntilMillis).toISOString());
  }

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are a helpful assistant summarizing learning reflections." },
        { role: "user", content: buildPrompt(logs) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No summary returned");
    }
    return content.trim();
  } catch (error) {
    if (isQuotaError(error)) {
      skipUntilMillis = Date.now() + RETRY_COOLDOWN_MS;
      const retryIso = new Date(skipUntilMillis).toISOString();
      const message = `generateWeeklySummary quota error – using fallback summary until ${retryIso}.`;
      const normalizedError =
        error && typeof error === "object" && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      console.warn(`${message} Details: ${normalizedError}`);
      return buildFallbackSummary(logs, "quota exceeded", retryIso);
    }

    console.error("generateWeeklySummary error", error);
    return "Summary unavailable (API error).";
  }
}
