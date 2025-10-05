import Link from "next/link";

import { prisma } from "@/lib/prisma";

type RecentLog = {
  id: string;
  title: string;
  reflection: string;
  tags: string[];
  createdAt: Date;
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const truncate = (value: string, length: number) => {
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length).trim()}…`;
};

export default async function RecentLogs() {
  const logs = await prisma.learningLog.findMany({
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: 5,
  });

  if (logs.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Recent reflections</h2>
        <Link
          href="/logs"
          className="text-sm font-medium text-primary-600 transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          View all ↗
        </Link>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {logs.map((log) => (
          <li key={log.id} className="glass-panel rounded-xl p-5 shadow-soft">
            <article className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/logs/${encodeURIComponent(log.id)}`}
                  className="text-base font-semibold text-slate-900 transition hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white line-clamp-2"
                >
                  {truncate(log.title, 80)}
                </Link>
                <time className="shrink-0 text-xs text-muted" dateTime={log.createdAt.toISOString()}>
                  {formatDate(log.createdAt)}
                </time>
              </div>

              <p className="text-sm leading-relaxed text-slate-700 line-clamp-3">
                {truncate(log.reflection, 160)}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-muted">
                {log.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
