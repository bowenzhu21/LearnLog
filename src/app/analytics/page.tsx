import Link from "next/link";

import {
  computeStreaks,
  groupDailyMinutes,
  minutesByTag,
  normalizeDate,
  sumMinutes,
} from "@/lib/analytics";
import { fetchLogsRange } from "./actions";
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
  const rangeKey = clampRange(searchParams?.range);
  const { from, to } = resolveRange(rangeKey);

  const { logs } = await fetchLogsRange({ from, to });
  const totalMinutes = sumMinutes(logs);
  const totalEntries = logs.length;
  const streaks = computeStreaks(logs.map((log) => normalizeDate(log.createdAt)));
  const tags = minutesByTag(logs).slice(0, 10);
  const daily = groupDailyMinutes(logs);
  const sparklinePath = generateSparklinePath(daily);
  const showSummary = searchParams?.summary === "1";
  const summary = showSummary && logs.length > 0 ? await generateWeeklySummary(logs) : null;

  return (
    <main className="min-h-screen bg-app">
      <section className="container mx-auto flex flex-col gap-10 py-16">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-slate-900">Learning analytics</h1>
            <div className="flex gap-3 text-sm text-primary-600">
              <Link
                href="/"
                className="transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Home ↗
              </Link>
              <Link
                href="/logs"
                className="transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Logs ↗
              </Link>
            </div>
          </div>

          <nav className="flex gap-2">
            {(["7d", "30d", "all"] as const).map((key) => (
              <Link
                key={key}
                href={`/analytics?range=${key}${showSummary ? "&summary=1" : ""}`}
                className={`rounded-full border px-4 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${rangeKey === key ? "border-primary-300 bg-primary-50 text-primary-700" : "border-slate-200 text-muted hover:border-primary-200 hover:text-primary-600"}`}
              >
                {key === "7d" ? "Last 7 days" : key === "30d" ? "Last 30 days" : "All time"}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted">Current streak</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{streaks.current} days</p>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted">Longest streak</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{streaks.longest} days</p>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted">Total minutes</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalMinutes}</p>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wide text-muted">Entries</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalEntries}</p>
          </div>
        </section>

        <section className="glass-panel rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Weekly summary</h2>
            <div className="flex gap-2">
              <form className="flex" action="/analytics" method="get">
                <input type="hidden" name="range" value={rangeKey} />
                <input type="hidden" name="summary" value="1" />
                <button
                  type="submit"
                  disabled={logs.length === 0}
                  className="rounded-full border border-primary-300 px-4 py-1 text-sm font-medium text-primary-600 transition hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Generate summary
                </button>
              </form>
              {showSummary ? (
                <Link
                  href={`/analytics?range=${rangeKey}`}
                  className="rounded-full border border-slate-200 px-4 py-1 text-sm text-muted transition hover:border-primary-200 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white/70 p-4 text-sm text-slate-700">
            {logs.length === 0 ? (
              <p className="text-muted">No activity in this range yet. Add a log to generate a summary.</p>
            ) : showSummary ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">{summary}</pre>
            ) : (
              <p className="text-muted">Click generate to synthesize this range into a weekly narrative.</p>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="glass-panel rounded-xl p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Minutes by tag</h2>
            {tags.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No tags recorded in this range.</p>
            ) : (
              <table className="mt-4 w-full table-fixed text-left text-sm text-slate-700">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="w-2/3 pb-2">Tag</th>
                    <th className="w-1/3 pb-2 text-right">Minutes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
              <p className="mt-4 text-sm text-muted">No activity recorded in this range.</p>
            ) : (
              <div className="mt-6 flex flex-col gap-3">
                <svg
                  viewBox="0 0 100 100"
                  className="h-24 w-full text-primary-500"
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
                <div className="grid grid-cols-2 gap-1 text-xs text-muted">
                  <span>Start: {daily[0].day}</span>
                  <span className="text-right">End: {daily[daily.length - 1].day}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
