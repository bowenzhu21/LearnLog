"use client";

import type { JSX } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  HABIT_COACH_INITIAL_STATE,
  HABIT_FOCUS_OPTIONS,
  type HabitCoachState,
  type HabitFocus,
} from "./habitCoachConfig";

type HabitCoachCardProps = {
  action: (state: HabitCoachState, formData: FormData) => Promise<HabitCoachState>;
  hasLogs: boolean;
};

const focusButtonClass = (selected: boolean) =>
  [
    "group flex w-full flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition md:w-auto md:min-w-[14rem]",
    selected
      ? "border-white/90 bg-white text-indigo-700 shadow-lg shadow-indigo-200"
      : "border-white/30 bg-white/10 text-white hover:bg-white/20",
  ].join(" ");

const pulseClass = "animate-pulse bg-white/20";

export function HabitCoachCard({ action, hasLogs }: HabitCoachCardProps): JSX.Element {
  const [state, formAction, isPending] = useActionState(action, HABIT_COACH_INITIAL_STATE);
  const [focus, setFocus] = useState<HabitFocus>(HABIT_COACH_INITIAL_STATE.focus);

  useEffect(() => {
    if (state.focus && state.focus !== focus) {
      setFocus(state.focus);
    }
  }, [state.focus, focus]);

  const headline = useMemo(() => {
    switch (state.status) {
      case "success":
        return "Personalized habit sprint";
      case "error":
        return "Habit coach unavailable";
      default:
        return "AI habit coach";
    }
  }, [state.status]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600 via-purple-500 to-rose-500 p-[1px] shadow-lg">
      <div className="relative rounded-3xl bg-white/95 p-6 md:p-8">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex flex-col gap-6">
          <header className="flex flex-col gap-3 text-slate-900">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              AI powered
            </span>
            <h2 className="text-2xl font-semibold leading-tight">{headline}</h2>
            <p className="text-sm text-slate-600">
              Choose a focus area and let the assistant craft three habits plus one accountability move using your recent logs.
            </p>
          </header>

          <form action={formAction} className="flex flex-col gap-6">
            <input type="hidden" name="focus" value={focus} />

            <fieldset className="flex flex-wrap gap-2">
              {HABIT_FOCUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={focusButtonClass(focus === option.value)}
                  onClick={() => setFocus(option.value)}
                  disabled={isPending}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs font-normal opacity-80 group-hover:opacity-100">{option.description}</span>
                </button>
              ))}
            </fieldset>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {state.status === "success" && state.retryIso
                  ? `Model cooling down until ${new Date(state.retryIso).toLocaleTimeString()}`
                  : "Pulls from your latest reflections."}
              </div>
              <button
                type="submit"
                disabled={!hasLogs || isPending}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPending ? "Generating..." : hasLogs ? "Generate habit plan" : "Add logs to enable"}
              </button>
            </div>
          </form>

          <div
            className={[
              "relative overflow-hidden rounded-2xl border border-slate-100 bg-white/60 p-5 text-sm leading-relaxed text-slate-800 shadow-inner",
              isPending ? pulseClass : "",
            ].join(" ")}
          >
            {state.status === "success" ? (
              <pre className="whitespace-pre-wrap font-sans">{state.plan}</pre>
            ) : state.status === "error" ? (
              <p className="font-medium text-rose-600">{state.message}</p>
            ) : hasLogs ? (
              <p>Pick a focus above and the coach will tailor habits around your existing streaks and reflections.</p>
            ) : (
              <p className="text-slate-500">Log at least one learning session to unlock the habit coach.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
