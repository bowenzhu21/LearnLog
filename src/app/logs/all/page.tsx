import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/analytics";

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

export default async function AllLogsPage() {
  const records = await prisma.learningLog.findMany({
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  const hasLogs = records.length > 0;
  const uniqueDays = hasLogs
    ? new Set(records.map((entry) => normalizeDate(entry.createdAt))).size
    : 0;

  return (
    <div className="relative min-h-screen py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{ backgroundImage: "var(--gradient-accent)" }}
      />
      <div className="container relative mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-white">All learning logs</h1>
          <p className="text-sm text-slate-200/80">
            {hasLogs
              ? `Showing ${records.length} entr${records.length === 1 ? "y" : "ies"} across ${uniqueDays} day${
                  uniqueDays === 1 ? "" : "s"
                }.`
              : "No logs recorded yet. Capture reflections from the home page to see them here."}
          </p>
        </header>

        {!hasLogs ? null : (
          <ul className="grid gap-4">
            {records.map((log) => (
              <li key={log.id} className="glass-panel rounded-xl p-6 shadow-soft">
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{log.title}</h2>
                    <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{log.reflection}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      {log.timeSpent} min
                    </span>
                    {(log.tags ?? []).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {log.sourceUrl ? (
                    <a
                      href={log.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Source ↗
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
