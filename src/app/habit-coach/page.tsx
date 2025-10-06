import Link from "next/link";
import type { JSX } from "react";

import { minutesByTag, sumMinutes } from "@/lib/analytics";
import { HabitCoachCard } from "./HabitCoachCard";
import { fetchHabitCoachLogs } from "./actions";
import { requestHabitPlan } from "./habitCoach";
import type { HabitCoachState } from "./habitCoachConfig";

export default async function HabitCoachPage(): Promise<JSX.Element> {
  const logs = await fetchHabitCoachLogs();
  const totalMinutes = sumMinutes(logs);
  const totalEntries = logs.length;
  const topTags = minutesByTag(logs).slice(0, 3);
  const habitCoachAction = async (prevState: HabitCoachState, formData: FormData) => {
    "use server";
    const latestLogs = await fetchHabitCoachLogs();
    return requestHabitPlan(latestLogs, prevState, formData);
  };

  return (
    <main className="relative min-h-screen bg-app">
      <div
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen"
        style={{ backgroundImage: "var(--gradient-accent)" }}
      />
      <section className="container relative mx-auto flex flex-col gap-12 py-16">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-indigo-200/80">AI habit coach</p>
              <h1 className="text-3xl font-semibold text-white">Design your next learning sprint</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Pick a focus, and the coach will translate your recent reflections into three specific habits and one
                accountability move. Solid logs produce sharper advice, so keep capturing those sessions.
              </p>
            </div>
            <Link
              href="/logs/all"
              className="rounded-full border border-indigo-200/70 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-200 hover:bg-indigo-500/30 hover:text-white"
            >
              View all logs
            </Link>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-panel rounded-xl bg-white/95 p-6 shadow-soft text-slate-900">
            <p className="text-xs uppercase tracking-wide text-indigo-500">Entries reviewed</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalEntries}</p>
            <p className="mt-1 text-xs text-slate-600">
              Pulls from the past 30 days. Add more logs to unlock deeper guidance.
            </p>
          </div>
          <div className="glass-panel rounded-xl bg-white/95 p-6 shadow-soft text-slate-900">
            <p className="text-xs uppercase tracking-wide text-indigo-500">Total minutes</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalMinutes}</p>
            <p className="mt-1 text-xs text-slate-600">The coach calibrates intensity based on your logged effort.</p>
          </div>
          <div className="glass-panel rounded-xl bg-white/95 p-6 shadow-soft text-slate-900">
            <p className="text-xs uppercase tracking-wide text-indigo-500">Top tags</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {topTags.length > 0 ? (
                topTags.map((tag) => (
                  <li key={tag.tag} className="flex items-center justify-between gap-2 rounded bg-slate-100 px-3 py-2">
                    <span className="font-medium text-slate-900">#{tag.tag}</span>
                    <span className="text-xs text-slate-600">{tag.minutes} min</span>
                  </li>
                ))
              ) : (
                <li className="rounded bg-slate-100 px-3 py-2 text-xs text-slate-600">Log some sessions to reveal trends.</li>
              )}
            </ul>
          </div>
        </div>

        <HabitCoachCard action={habitCoachAction} hasLogs={logs.length > 0} />
      </section>
    </main>
  );
}
