
"use server";

import { prisma } from "@/lib/prisma";
import type { Log } from "@/lib/analytics";

type FetchLogsRangeArgs = {
  from?: string;
  to?: string;
};

export async function fetchLogsRange({ from, to }: FetchLogsRangeArgs): Promise<{ logs: Log[] }> {
  const inclusiveTo = to
    ? (() => {
        const end = new Date(to);
        if (Number.isNaN(end.getTime())) {
          return null;
        }
        const nextDay = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        return nextDay;
      })()
    : null;

  const where =
    from || inclusiveTo
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(inclusiveTo ? { lt: inclusiveTo } : {}),
          },
        }
      : {};

  const records = await prisma.learningLog.findMany({
    where,
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  const logs: Log[] = records.map((record) => ({
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    timeSpent: record.timeSpent,
    tags: record.tags ?? [],
    title: record.title,
    reflection: record.reflection,
  }));

  return { logs };
}
