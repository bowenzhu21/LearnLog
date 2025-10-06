"use client";

// ...existing code...
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

// ✅ FIX: always resolve absolute /api/graphql path
const getGraphQLEndpoint = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/graphql`;
  }

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl && process.env.VERCEL_URL) {
    siteUrl = `https://${process.env.VERCEL_URL}`;
  }
  if (!siteUrl) {
    siteUrl = "http://localhost:3000";
  }
  return `${siteUrl}/api/graphql`;
};

export default function RecentLogs() {
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchRecentLogs() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(getGraphQLEndpoint(), {
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
          variables: { first: 3 },
        }),
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`Network error: ${res.status}`);

      const json: { data?: RecentLogsData; errors?: unknown } = await res.json();
      if (json.errors) throw new Error("GraphQL error");

      const edges = json?.data?.learningLogs?.edges ?? [];
      setLogs(edges.map((e) => e.node).slice(0, 3));
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

  useEffect(() => {
    fetchRecentLogs();

    const h = (e: Event) => {
      const customEvent = e as CustomEvent;
      const log = customEvent.detail;
      if (log && log.id && log.title && log.reflection && log.tags && log.createdAt) {
        setLogs((prev) => [log, ...prev].slice(0, 3));
      }
    };

    window.addEventListener("learnlog:created", h);
    return () => window.removeEventListener("learnlog:created", h);
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-white">Recent reflections</h2>
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="glass-panel rounded-xl p-5 shadow-soft animate-pulse">
              <div className="mb-2 h-6 w-2/3 rounded bg-slate-200/70" />
              <div className="mb-1 h-4 w-full rounded bg-slate-200/60" />
              <div className="h-4 w-1/2 rounded bg-slate-200/50" />
            </li>
          ))}
        </ul>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50/80 p-4 text-sm text-red-700">
          <span>Could not load recent logs: {errorMsg}</span>
          <button
            className="self-start rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
            onClick={fetchRecentLogs}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {status === "success" && logs.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white/90 p-4 text-sm text-slate-700">
          No recent reflections yet.
        </div>
      )}

      {/* Logs grid */}
      {status === "success" && logs.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {logs.map((log) => (
            <li key={log.id} className="glass-panel rounded-xl p-5 shadow-soft text-slate-900">
              <span className="block cursor-default rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300/70">
                <article className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="line-clamp-2 text-base font-semibold transition hover:text-indigo-600">
                      {truncate(log.title, 80)}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-700">
                    {truncate(log.reflection, 160)}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {log.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
