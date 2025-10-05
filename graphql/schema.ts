import { readFileSync } from "node:fs";
import { GraphQLError } from "graphql";
import { createSchema } from "graphql-yoga";
import type { LearningLog as LearningLogModel, Prisma, PrismaClient } from "@prisma/client";

import { asLearningLogId, fromGlobalId } from "@/lib/globalId";
import {
  learningLogCreateSchema,
  learningLogUpdateSchema,
  mapZodIssuesToFieldErrors,
} from "@/lib/validation";

type YogaContext = {
  prisma: PrismaClient;
};

type LearningLogFilterInput = {
  tagsAny?: string[] | null;
  tagsAll?: string[] | null;
  q?: string | null;
  from?: string | null;
  to?: string | null;
} | null;

const typeDefs = readFileSync(new URL("./schema.graphql", import.meta.url), "utf8");

const parseDate = (value: string, fieldName: "from" | "to"): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new GraphQLError(`Invalid ${fieldName} date`);
  }
  return date;
};

const buildWhere = (filter: LearningLogFilterInput): Prisma.LearningLogWhereInput => {
  if (!filter) {
    return {};
  }

  const clauses: Prisma.LearningLogWhereInput[] = [];

  if (Array.isArray(filter.tagsAny) && filter.tagsAny.length > 0) {
    clauses.push({ tags: { hasSome: filter.tagsAny } });
  }

  if (Array.isArray(filter.tagsAll) && filter.tagsAll.length > 0) {
    clauses.push({ tags: { hasEvery: filter.tagsAll } });
  }

  if (typeof filter.q === "string" && filter.q.trim()) {
    const q = filter.q.trim();
    clauses.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { reflection: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (filter.from) {
    clauses.push({ createdAt: { gte: parseDate(filter.from, "from") } });
  }

  if (filter.to) {
    clauses.push({ createdAt: { lte: parseDate(filter.to, "to") } });
  }

  if (clauses.length === 0) {
    return {};
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return { AND: clauses };
};

const encodeCursor = (id: string): string => Buffer.from(id, "utf8").toString("base64");

const decodeCursor = (cursor: string): string => {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    if (!decoded) {
      throw new GraphQLError("Invalid cursor");
    }
    return decoded;
  } catch {
    throw new GraphQLError("Invalid cursor");
  }
};

const mapLearningLog = (log: LearningLogModel) => ({
  id: asLearningLogId(log.id),
  title: log.title,
  reflection: log.reflection,
  tags: log.tags ?? [],
  timeSpent: log.timeSpent,
  sourceUrl: log.sourceUrl ?? null,
  createdAt: log.createdAt.toISOString(),
});

type ValidationIssues = Parameters<typeof mapZodIssuesToFieldErrors>[0];

const throwValidationError = (issues: ValidationIssues): never => {
  throw new GraphQLError("VALIDATION_ERROR", {
    extensions: {
      code: "VALIDATION_ERROR",
      fields: mapZodIssuesToFieldErrors(issues),
    },
  });
};

export const schema = createSchema<YogaContext>({
  typeDefs,
  resolvers: {
    Node: {
  __resolveType: (obj: unknown) => {
        if (obj && typeof obj === "object" && "title" in obj) {
          return "LearningLog";
        }
        return null;
      },
    },
    Query: {
      node: async (_root, { id }: { id: string }, { prisma }) => {
        let resolvedId: { typename: string; id: string };
        try {
          resolvedId = fromGlobalId(id);
        } catch {
          throw new GraphQLError("Malformed global ID");
        }

        if (resolvedId.typename !== "LearningLog") {
          return null;
        }

        const log = await prisma.learningLog.findUnique({ where: { id: resolvedId.id } });
        if (!log) {
          return null;
        }

        return mapLearningLog(log);
      },
      learningLogs: async (
        _root,
        args: { first: number; after?: string | null; filter?: LearningLogFilterInput },
        { prisma },
      ) => {
        const { first, after = null, filter = null } = args;

        if (typeof first !== "number" || first <= 0) {
          throw new GraphQLError("`first` must be a positive integer");
        }

        const cursorId = after ? decodeCursor(after) : undefined;

        const records = await prisma.learningLog.findMany({
          where: buildWhere(filter),
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
          ],
          take: first + 1,
          skip: after ? 1 : 0,
          ...(cursorId ? { cursor: { id: cursorId } } : {}),
        });

        const hasNextPage = records.length > first;
        const slice = hasNextPage ? records.slice(0, first) : records;

        const edges = slice.map((log) => ({
          node: mapLearningLog(log),
          cursor: encodeCursor(log.id),
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage: Boolean(after),
            startCursor: edges.length ? edges[0].cursor : null,
            endCursor: edges.length ? edges[edges.length - 1].cursor : null,
          },
        };
      },
    },
    Mutation: {
      createLearningLog: async (
        _root,
        { input }: { input: Record<string, unknown> },
        { prisma },
      ) => {
        const validation = learningLogCreateSchema.safeParse({
          title: input.title,
          reflection: input.reflection,
          tags: input.tags,
          timeSpent: input.timeSpent,
          sourceUrl: input.sourceUrl ?? undefined,
        });

        if (!validation.success) {
          throwValidationError(validation.error.issues);
        }

        const payload = validation.data;
        if (!payload) {
          throw new Error("Validation payload missing");
        }
        const log = await prisma.learningLog.create({
          data: {
            title: payload.title,
            reflection: payload.reflection,
            tags: payload.tags,
            timeSpent: payload.timeSpent,
            sourceUrl: payload.sourceUrl ?? null,
          },
        });

        return { log: mapLearningLog(log) };
      },
      updateLearningLog: async (
        _root,
        { input }: { input: Record<string, unknown> },
        { prisma },
      ) => {
        const updateInput: Record<string, unknown> = { id: input.id };

        if (Object.prototype.hasOwnProperty.call(input, "title")) {
          updateInput.title = input.title;
        }
        if (Object.prototype.hasOwnProperty.call(input, "reflection")) {
          updateInput.reflection = input.reflection;
        }
        if (Object.prototype.hasOwnProperty.call(input, "tags")) {
          updateInput.tags = input.tags;
        }
        if (Object.prototype.hasOwnProperty.call(input, "timeSpent")) {
          updateInput.timeSpent = input.timeSpent;
        }
        if (Object.prototype.hasOwnProperty.call(input, "sourceUrl")) {
          updateInput.sourceUrl = input.sourceUrl ?? undefined;
        }

        const validation = learningLogUpdateSchema.safeParse(updateInput);

        if (!validation.success) {
          throwValidationError(validation.error.issues);
        }

        const payload = validation.data;
        if (!payload) {
          throw new Error("Validation payload missing");
        }
        const { typename, id } = fromGlobalId(payload.id);
        if (typename !== "LearningLog") {
          throw new GraphQLError("Unsupported node type");
        }

        const data: Prisma.LearningLogUpdateInput = {};

        if (payload.title !== undefined) {
          data.title = payload.title;
        }
        if (payload.reflection !== undefined) {
          data.reflection = payload.reflection;
        }
        if (payload.tags !== undefined) {
          data.tags = payload.tags;
        }
        if (payload.timeSpent !== undefined) {
          data.timeSpent = payload.timeSpent;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "sourceUrl")) {
          data.sourceUrl = payload.sourceUrl ?? null;
        }

        const log = await prisma.learningLog.update({
          where: { id },
          data,
        });

        return { log: mapLearningLog(log) };
      },
      deleteLearningLog: async (
        _root,
        { input }: { input: { id: string } },
        { prisma },
      ) => {
        let resolvedId: { typename: string; id: string };
        try {
          resolvedId = fromGlobalId(input.id);
        } catch {
          throw new GraphQLError("Malformed global ID");
        }

        if (resolvedId.typename !== "LearningLog") {
          throw new GraphQLError("Unsupported node type");
        }

        await prisma.learningLog.delete({ where: { id: resolvedId.id } });

        return { deletedId: input.id };
      },
    },
  },
});

export type { YogaContext };
