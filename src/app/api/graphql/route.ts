import { createYoga } from "graphql-yoga";
import { schema } from "../../../../graphql/schema";
import { prisma } from "@/lib/prisma";

const yoga = createYoga({
  schema,
  context: () => ({ prisma }),
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { yoga as GET, yoga as POST, yoga as OPTIONS };
