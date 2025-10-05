import { graphql } from "react-relay";
import { fetchQuery } from "relay-runtime";
import { createServerEnvironment } from "@/relay/serverEnvironment";
import { learningLogItemFragment } from "@/relay/learningLogFragments";
import type { pageQuery } from "@/__generated__/pageQuery.graphql";

const PageQuery = graphql`
  query pageQuery($first: Int!, $after: String) {
    learningLogs(first: $first, after: $after) {
      edges {
        node {
          id
          ...learningLogFragments_learningLogItem
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export default async function Home() {
  // Reference fragment to ensure Relay compiler picks it up in the build.
  void learningLogItemFragment;

  const environment = createServerEnvironment();
  const data = await fetchQuery<pageQuery>(environment, PageQuery, { first: 12 }).toPromise();
  const edges = data?.learningLogs?.edges ?? [];
  const logs = edges
    .map((edge) => edge?.node ?? null)
    .filter((node): node is NonNullable<typeof node> => Boolean(node));

  return (
    <main className="min-h-screen bg-app">
      <section className="container mx-auto flex flex-col gap-12 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
            LearnLog: capture what you learn.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Reflect on key insights, track the time you invest, and tag everything so future you
            can build on today{"'"}s breakthroughs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {logs.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-left">
              <h2 className="text-xl font-medium text-slate-900">No reflections yet</h2>
              <p className="mt-2 text-muted">
                Add your first learning log using the GraphQL mutation to see it surface here.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <article key={log.id} className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">{log.title}</h2>
                  <span className="text-sm text-muted">
                    {new Date(log.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-700 leading-relaxed max-h-32 overflow-hidden">
                  {log.reflection}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                    {log.timeSpent} min
                  </span>
                  {log.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {tag}
                    </span>
                  ))}
                  {log.sourceUrl ? (
                    <a
                      href={log.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-primary-600 hover:text-primary-700"
                    >
                      Source ↗
                    </a>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
