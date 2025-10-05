import * as Sentry from "@sentry/nextjs";
import { NextRequest } from "next/server";
import { createYoga } from "graphql-yoga";
import { schema } from "../../../../graphql/schema";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  context: async () => ({ prisma }),
  fetchAPI: { Request, Response },
  maskedErrors: process.env.NODE_ENV === "production",
  logging: {
    debug(...args) {
      if (args[1]?.variables) {
        const redacted = { ...args[1].variables };
        if (redacted.reflection) redacted.reflection = "[REDACTED]";
        args[1].variables = redacted;
      }
      Sentry.addBreadcrumb({
        category: "graphql",
        message: JSON.stringify(args),
        level: "debug",
      });
    },
    info(...args) {
      Sentry.addBreadcrumb({
        category: "graphql",
        message: JSON.stringify(args),
        level: "info",
      });
    },
    warn(...args) {
      Sentry.addBreadcrumb({
        category: "graphql",
        message: JSON.stringify(args),
        level: "warning",
      });
    },
    error(...args) {
      Sentry.captureException(args[0]);
    },
  },
});

export async function GET(request: NextRequest) {
  try {
    return await yoga.fetch(request);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    return await yoga.fetch(request);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
