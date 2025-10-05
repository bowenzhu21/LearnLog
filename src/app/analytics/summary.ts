
import { minutesByTag, sumMinutes, type Log } from "@/lib/analytics";

const MODEL = "gpt-4o-mini";

const buildPrompt = (logs: Log[]): string => {
  const totalMinutes = sumMinutes(logs);
  const entries = logs.length;
  const tags = minutesByTag(logs);
  const topTagLines = tags
    .slice(0, 5)
    .map((tag) => `- ${tag.tag}: ${tag.minutes} minutes`)
    .join("\n");

  const lines = logs
    .slice(0, 40)
    .map(
      (log) =>
        `Title: ${log.title ?? "(untitled)"}\nDate: ${log.createdAt}\nMinutes: ${log.timeSpent}\nTags: ${log.tags.join(", " )}\nReflection: ${log.reflection ?? ""}`
    )
    .join("\n\n---\n\n");

  return `You are a concise learning coach. Summarize the user's week of learning into 150-200 words using markdown bullet sections. Highlight themes, note 3-5 takeaways, list top tags by time, and suggest two focused next steps. Keep an encouraging, pragmatic tone.

Context:
- Total entries: ${entries}
- Total minutes: ${totalMinutes}
- Top tags (minutes):
${topTagLines || "- none"}

Logs:
${lines}`;
};

const buildHeuristicSummary = (logs: Log[]): string => {
  const totalMinutes = sumMinutes(logs);
  const entries = logs.length;
  const tags = minutesByTag(logs);
  const topTags = tags.slice(0, 3);

  const tagLine =
    topTags.length > 0
      ? topTags.map((tag) => `• ${tag.tag}: ${tag.minutes} min`).join("\n")
      : "• No dominant tags logged";

  return [
    "**Weekly Snapshot**",
    `• Captured ${entries} learning sessions totalling ${totalMinutes} minutes.`,
    tagLine,
    "",
    "**Highlights & Takeaways**",
    "• Consistent progress across your top topics — reflect on what moved the needle most.",
    "• Capture a quick summary for each session so future you can revisit the insights.",
    "",
    "**Next Week Ideas**",
    "• Double down on the tag with the most minutes to deepen expertise.",
    "• Schedule one focused session on a lesser-used tag to keep breadth in your routine.",
  ].join("\n");
};

export async function generateWeeklySummary(logs: Log[]): Promise<string> {
  if (logs.length === 0) {
    return "No learning activity recorded for this range.";
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildHeuristicSummary(logs);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are an encouraging learning coach who writes concise weekly summaries." },
          { role: "user", content: buildPrompt(logs) },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No summary returned");
    }
    return content.trim();
  } catch (error) {
    console.error("generateWeeklySummary fallback", error);
    return buildHeuristicSummary(logs);
  }
}

