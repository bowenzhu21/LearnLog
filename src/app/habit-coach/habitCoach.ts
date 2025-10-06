import { minutesByTag, sumMinutes, type Log } from "@/lib/analytics";
import {
  currentRetryIso,
  getOpenAIClient,
  isQuotaError,
  markQuotaRetry,
  shouldThrottleOpenAI,
} from "@/lib/openaiClient";
import {
  HABIT_COACH_INITIAL_STATE,
  getHabitFocusConfig,
  type HabitCoachState,
  type HabitFocus,
} from "./habitCoachConfig";

const MODEL = "gpt-4o-mini";

const MAX_LOG_LINES = 40;

const formatTopTags = (logs: Log[]): string => {
  const tags = minutesByTag(logs).slice(0, 5);
  if (tags.length === 0) {
    return "None logged.";
  }
  return tags.map((tag) => `${tag.tag}: ${tag.minutes} min`).join(", ");
};

const buildHabitPrompt = (logs: Log[], focus: HabitFocus): string => {
  const config = getHabitFocusConfig(focus);
  const totalMinutes = sumMinutes(logs);
  const entries = logs.length;
  const reflections = logs
    .slice(0, MAX_LOG_LINES)
    .map((log, index) => {
      const title = log.title?.trim();
      const label = title && title.length > 0 ? title : `Entry ${index + 1}`;
      const minutes = Number.isFinite(log.timeSpent) ? log.timeSpent : 0;
      const reflection = log.reflection?.trim() || "No reflection captured.";
      return `- ${label} (${minutes} min, tags: ${log.tags.join(", ") || "none"}): ${reflection}`;
    })
    .join("\n");

  return [
    "You are an expert habit coach for dedicated learners.",
    `Focus: ${config.label}. ${config.promptDirective}`,
    "Use the learner's recent activity to create a concise custom plan.",
    "Plan requirements:",
    "1. Start with an empathetic, one-sentence observation about their current pattern.",
    "2. Provide exactly three numbered habit recommendations. Each should include the trigger, the action, and the benefit.",
    "3. Add a final **Accountability move** line with one concrete practice to keep them on track.",
    "4. Keep the tone direct, supportive, and motivating. Use markdown for clarity.",
    "",
    `Entries analysed: ${entries}`,
    `Total minutes: ${totalMinutes}`,
    `Top tags by minutes: ${formatTopTags(logs)}`,
    "",
    "Recent reflections:",
    reflections || "- No reflections provided.",
  ].join("\n");
};

const buildFallbackPlan = (logs: Log[], focus: HabitFocus, retryIso?: string): string => {
  const config = getHabitFocusConfig(focus);
  const totalMinutes = sumMinutes(logs);
  const entries = logs.length;
  const topTag = minutesByTag(logs)[0]?.tag ?? "your primary tag";

  const header = retryIso
    ? `Summary unavailable (quota exceeded - retry after ${retryIso}). Here's a quick coach note.`
    : "Here's a quick coach note to keep you moving.";

  const habitLines = config.fallbackHabits.map((habit, index) => `${index + 1}. ${habit}`).join("\n");

  return [
    `**Habit coach: ${config.label}**`,
    header,
    "",
    `You logged ${entries} sessions for ${totalMinutes} minutes. Focus more time on **${topTag}** to make progress visible.`,
    "",
    "**Habits to try**",
    habitLines,
    "",
    `**Accountability move**\n- ${config.fallbackAccountability}`,
  ].join("\n");
};

export async function requestHabitPlan(
  logs: Log[],
  _prevState: HabitCoachState,
  formData: FormData
): Promise<HabitCoachState> {
  "use server";

  const focusInput = (formData.get("focus") as HabitFocus | null) ?? "consistency";
  const focus = (["consistency", "balance", "momentum"] as const).includes(focusInput as HabitFocus)
    ? (focusInput as HabitFocus)
    : "consistency";

  if (logs.length === 0) {
    return {
      status: "error",
      focus,
      message: "Add a few learning logs to unlock a personalized habit plan.",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "error",
      focus,
      message: "Habit coach unavailable (missing OPENAI_API_KEY).",
    };
  }

  if (shouldThrottleOpenAI()) {
    return {
      status: "success",
      focus,
      retryIso: currentRetryIso(),
      plan: buildFallbackPlan(logs, focus, currentRetryIso()),
    };
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.65,
      messages: [
        {
          role: "system",
          content: "You are an encouraging but pragmatic habit coach helping lifelong learners stay on track.",
        },
        { role: "user", content: buildHabitPrompt(logs, focus) },
      ],
    });

    const plan = response.choices[0]?.message?.content?.trim();
    if (!plan) {
      throw new Error("No habit plan returned");
    }

    return {
      status: "success",
      focus,
      retryIso: currentRetryIso(),
      plan,
    };
  } catch (error) {
    if (isQuotaError(error)) {
      const retryIso = markQuotaRetry();
      const normalizedError =
        error && typeof error === "object" && "message" in error
          ? (error as { message?: string }).message
          : String(error);
      console.warn(`requestHabitPlan quota error - serving fallback until ${retryIso}. Details: ${normalizedError}`);
      return {
        status: "success",
        focus,
        retryIso,
        plan: buildFallbackPlan(logs, focus, retryIso),
      };
    }

    console.error("requestHabitPlan error", error);
    return {
      status: "error",
      focus,
      message: "Habit plan unavailable (AI error).",
    };
  }
}

export { HABIT_COACH_INITIAL_STATE };

