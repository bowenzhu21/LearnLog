import Link from "next/link";
import { graphql } from "react-relay";
import { fetchQuery } from "relay-runtime";

import { createServerEnvironment } from "@/relay/serverEnvironment";
import type { page_LogDetailPageQuery } from "@/__generated__/page_LogDetailPageQuery.graphql";

const logDetailQuery = graphql`
  query page_LogDetailPageQuery($id: ID!) {
    node(id: $id) {
      __typename
      ... on LearningLog {
        id
        title
        reflection
        tags
        timeSpent
        sourceUrl
        createdAt
      }
    }
  }
`;

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const environment = createServerEnvironment();
  const data = await fetchQuery<page_LogDetailPageQuery>(environment, logDetailQuery, {
    id,
  }).toPromise();

  const node = data?.node;

  if (!node || node.__typename !== "LearningLog") {
    return (
      <div className="min-h-screen bg-app py-12">
        <div className="container mx-auto max-w-3xl">
          <article className="glass-panel rounded-xl p-8 shadow-soft text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Not found</h1>
            <p className="mt-3 text-sm text-muted">We couldn&apos;t locate that learning log.</p>
            <Link
              href="/logs"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              ← Back to logs
            </Link>
          </article>
        </div>
      </div>
    );
  }

  const log = node;
  const createdAt = new Date(log.createdAt);

  return (
    <div className="min-h-screen bg-app py-12">
      <div className="container mx-auto max-w-3xl">
        <article className="glass-panel rounded-xl p-8 shadow-soft">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-wide text-primary-500">Learning Log</p>
            <h1 className="text-3xl font-semibold text-slate-900">{log.title}</h1>
            <p className="text-sm text-muted">
              {createdAt.toLocaleString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <p className="mt-6 text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
            {log.reflection}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
              {log.timeSpent} min
            </span>
            {log.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                #{tag}
              </span>
            ))}
          </div>

          {log.sourceUrl ? (
            <a
              href={log.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View source ↗
            </a>
          ) : null}

          <Link
            href="/logs"
            className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to logs
          </Link>
        </article>
      </div>
    </div>
  );
}
