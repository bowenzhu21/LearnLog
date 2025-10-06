import { minutesByTag, sumMinutes, type Log } from "@/lib/analytics";
import {
  currentRetryIso,
  getOpenAIClient,
  isQuotaError,
  markQuotaRetry,
  shouldThrottleOpenAI,
} from "@/lib/openaiClient";

const MODEL = "gpt-4o-mini";

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
    `Summarize the following ${logs.length} entries into a concise, engaging weekly reflection (3-5 sentences).`,
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

export async function generateWeeklySummary(logs: Log[]): Promise<string> {
  if (logs.length === 0) {
    return "No learning activity recorded for this range.";
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("generateWeeklySummary error: missing OPENAI_API_KEY");
    return "Summary unavailable (API error).";
  }

  if (shouldThrottleOpenAI()) {
    return buildFallbackSummary(logs, "quota exceeded", currentRetryIso());
  }

  try {
    const client = getOpenAIClient();
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
      const retryIso = markQuotaRetry();
      const message = `generateWeeklySummary quota error - using fallback summary until ${retryIso}.`;
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
