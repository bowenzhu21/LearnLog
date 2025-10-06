export type HabitFocus = "consistency" | "balance" | "momentum";

type HabitFocusConfig = {
  value: HabitFocus;
  label: string;
  description: string;
  promptDirective: string;
  fallbackHabits: string[];
  fallbackAccountability: string;
};

export type HabitCoachState =
  | { status: "idle"; focus: HabitFocus }
  | { status: "success"; focus: HabitFocus; plan: string; retryIso?: string }
  | { status: "error"; focus: HabitFocus; message: string };

export const HABIT_COACH_INITIAL_STATE: HabitCoachState = {
  status: "idle",
  focus: "consistency",
};

export const HABIT_FOCUS_OPTIONS: HabitFocusConfig[] = [
  {
    value: "consistency",
    label: "Improve consistency",
    description: "Establish a steady cadence and reduce skipped sessions.",
    promptDirective:
      "Prioritize reliable routines, stacked triggers, and realistic minimum goals that keep momentum even on busy days.",
    fallbackHabits: [
      "Anchor a 20-minute study block to an existing routine (e.g., right after breakfast).",
      "Set a daily 'minimum viable session' of 10 minutes to keep the streak alive.",
      "Reserve one weekly review slot to scan reflections and plan the next focus tag.",
    ],
    fallbackAccountability: "Share a weekly progress snapshot with a friend or mentor every Friday.",
  },
  {
    value: "balance",
    label: "Avoid burnout",
    description: "Keep learning sustainable and protect energy.",
    promptDirective:
      "Focus on sustainable pacing, deliberate recovery, and variety so the learner stays energized without overloading.",
    fallbackHabits: [
      "Cap intense sessions at 45 minutes and follow with a 10-minute cool-down reflection.",
      "Pair deep-focus days with lighter 'maintenance' sessions on a different tag.",
      "Schedule one no-study evening per week to recharge and celebrate wins.",
    ],
    fallbackAccountability: "Log energy levels beside each session and review the pattern every Sunday.",
  },
  {
    value: "momentum",
    label: "Build momentum",
    description: "Accelerate progress and celebrate wins.",
    promptDirective:
      "Emphasize compounding progress, visible milestones, and fast feedback loops that keep motivation high.",
    fallbackHabits: [
      "Kick off each session by previewing yesterday's reflection and choosing one quick win.",
      "Create a three-step roadmap for your top tag and tick one step every week.",
      "Close sessions with a 2-sentence highlight to reinforce progress.",
    ],
    fallbackAccountability: "Track milestone completions in a visible progress bar and review it every Monday.",
  },
];

export const getHabitFocusConfig = (value: HabitFocus): HabitFocusConfig => {
  const config = HABIT_FOCUS_OPTIONS.find((option) => option.value === value);
  if (!config) {
    throw new Error(`Unknown habit focus: ${value}`);
  }
  return config;
};

