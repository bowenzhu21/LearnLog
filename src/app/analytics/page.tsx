import Link from "next/link";

import {
  computeStreaks,
  groupDailyMinutes,
  minutesByTag,
  normalizeDate,
  sumMinutes,
} from "@/lib/analytics";
import { fetchLogsRange } from "./actions";
import { LearningTips } from "./LearningTips";
import { generateWeeklySummary } from "./summary";

const clampRange = (range: string | undefined) => (range && ["7d", "30d", "all"].includes(range) ? range : "7d");

const resolveRange = (range: string) => {
  if (range === "all") {
    return {};
  }

  const now = new Date();
  const days = range === "30d" ? 29 : 6;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: normalizeDate(start),
    to: normalizeDate(now),
  };
};

const generateSparklinePath = (points: Array<{ day: string; minutes: number }>): string => {
  if (points.length === 0) {
    return "";
  }

  const values = points.map((point) => point.minutes);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const verticalRange = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const normalizedY = (point.minutes - min) / verticalRange;
      const y = 100 - normalizedY * 100;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { range?: string; summary?: string };
}) {
  // Next.js 15: await searchParams before using
  const awaitedParams = searchParams ? await searchParams : {};
  const rangeKey = clampRange(awaitedParams.range);
  const { from, to } = resolveRange(rangeKey);

  const { logs } = await fetchLogsRange({ from, to });
  const totalMinutes = sumMinutes(logs);
  const totalEntries = logs.length;
  const streaks = computeStreaks(logs.map((log) => normalizeDate(log.createdAt)));
  const tags = minutesByTag(logs).slice(0, 10);
  const daily = groupDailyMinutes(logs);
  const sparklinePath = generateSparklinePath(daily);
  const showSummary = awaitedParams.summary === "1";
  const summary = showSummary && logs.length > 0 ? await generateWeeklySummary(logs) : null;
  const summaryTitle =
    rangeKey === "7d"
      ? "Weekly summary (AI-powered)"
      : rangeKey === "30d"
      ? "30-day summary (AI-powered)"
      : "All-time summary (AI-powered)";

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen" style={{ backgroundImage: "var(--gradient-accent)" }} />
      <section className="page-shell relative">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-200/80">Analytics</p>
              <h1 className="text-3xl font-semibold text-white">Learning analytics</h1>
            </div>
          </div>

          <nav className="flex gap-2">
            {(["7d", "30d", "all"] as const).map((key) => (
              <Link
                key={key}
                href={`/analytics?range=${key}${showSummary ? "&summary=1" : ""}`}
                className={`rounded-full border px-4 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  rangeKey === key
                    ? "border-indigo-300 bg-indigo-500/20 text-indigo-100 shadow-sm"
                    : "border-white/30 text-slate-200 hover:border-indigo-200 hover:text-white"
                }`}
              >
                {key === "7d" ? "Last 7 days" : key === "30d" ? "Last 30 days" : "All time"}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-black">Current streak</p>
            <p className="mt-2 text-3xl font-semibold text-black">{streaks.current} days</p>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-black">Longest streak</p>
            <p className="mt-2 text-3xl font-semibold text-black">{streaks.longest} days</p>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-black">Total minutes</p>
            <p className="mt-2 text-3xl font-semibold text-black">{totalMinutes}</p>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-black">Entries</p>
            <p className="mt-2 text-3xl font-semibold text-black">{totalEntries}</p>
          </div>
        </section>

        <section className="glass-panel rounded-xl p-6 shadow-soft text-slate-900">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">{summaryTitle}</h2>
            <div className="flex gap-2">
              <form className="flex" action="/analytics" method="get">
                <input type="hidden" name="range" value={rangeKey} />
                <input type="hidden" name="summary" value="1" />
                <button
                  type="submit"
                  disabled={logs.length === 0}
                  className="rounded-full border border-indigo-300 px-4 py-1 text-sm font-medium text-indigo-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Generate summary
                </button>
              </form>
              {showSummary ? (
                <Link
                  href={`/analytics?range=${rangeKey}`}
                  className="rounded-full border border-slate-200 px-4 py-1 text-sm text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white/70 p-4 text-sm text-slate-700">
            {logs.length === 0 ? (
              <p className="text-slate-600">No activity in this range yet. Add a log to generate a summary.</p>
            ) : showSummary ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">{summary}</pre>
            ) : (
              <p className="text-slate-600">Click generate to synthesize this range into a narrative.</p>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Minutes by tag</h2>
            {tags.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No tags recorded in this range.</p>
            ) : (
              <table className="mt-4 w-full table-fixed text-left text-sm text-slate-700">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-2/3 pb-2">Tag</th>
                    <th className="w-1/3 pb-2 text-right">Minutes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tags.map((tag) => (
                    <tr key={tag.tag}>
                      <td className="py-2">#{tag.tag}</td>
                      <td className="py-2 text-right font-medium">{tag.minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Daily minutes</h2>
            {daily.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No activity recorded in this range.</p>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                <svg
                  viewBox="0 0 100 100"
                  className="h-24 w-full text-indigo-500"
                  preserveAspectRatio="none"
                >
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                  <span>Start: {daily[0].day}</span>
                  <span className="text-right">End: {daily[daily.length - 1].day}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <LearningTips />
      </section>
    </main>
  );
}
