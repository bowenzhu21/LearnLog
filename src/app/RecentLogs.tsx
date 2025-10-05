"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecentLog = {
  id: string;
  title: string;
  reflection: string;
  tags: string[];
  createdAt: string;
};

type RecentLogsData = {
  learningLogs: { edges: { node: RecentLog }[] };
};

const truncate = (value: string, length: number) => {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}…`;
};

export default function RecentLogs() {
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRecentLogs = async () => {
    setStatus('loading');
    setErrorMsg(null);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query RecentLogs($first: Int!) {
              learningLogs(first: $first) {
                edges {
                  node {
                    id
                    title
                    reflection
                    tags
                    createdAt
                  }
                }
              }
            }
          `,
          variables: { first: 5 },
        }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const json: { data?: RecentLogsData; errors?: unknown } = await res.json();
      if (json.errors) throw new Error("GraphQL error");
      const edges = json?.data?.learningLogs?.edges ?? [];
      setLogs(edges.map((e) => e.node));
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchRecentLogs();
    const h = (e: CustomEvent<RecentLog>) => {
      setLogs((prev) => [e.detail, ...prev].slice(0, 5));
    };
    window.addEventListener('learnlog:created', h as EventListener);
    return () => window.removeEventListener('learnlog:created', h as EventListener);
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Recent reflections</h2>
        <Link
          href="/logs"
          className="text-sm font-medium text-primary-600 transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          data-testid="recent-logs-view-all"
        >
          View all →
        </Link>
      </div>
      {status === 'loading' && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="glass-panel rounded-xl p-5 shadow-soft animate-pulse bg-slate-100">
              <div className="h-6 w-2/3 bg-slate-300 rounded mb-2" />
              <div className="h-4 w-full bg-slate-200 rounded mb-1" />
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
            </li>
          ))}
        </ul>
      )}
      {status === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex flex-col gap-2">
          <span>Could not load recent logs: {errorMsg}</span>
          <button
            className="self-start rounded bg-red-600 px-3 py-1 text-white text-xs font-medium hover:bg-red-700"
            onClick={fetchRecentLogs}
          >
            Retry
          </button>
        </div>
      )}
      {status === 'success' && logs.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm text-slate-700">
          No recent reflections yet.
        </div>
      )}
      {status === 'success' && logs.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {logs.map((log) => (
            <li key={log.id} className="glass-panel rounded-xl p-5 shadow-soft">
              <Link
                href={`/logs/${log.id}`}
                className="block focus:outline-none focus:ring-2 rounded-lg"
              >
                <article className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-base font-semibold text-slate-900 transition hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white line-clamp-2">
                      {truncate(log.title, 80)}
                    </span>
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}