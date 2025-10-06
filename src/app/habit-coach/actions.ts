"use server";

import { Prisma } from "@prisma/client";

import type { Log } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

const COACH_LOOKBACK_DAYS = 30;
const MAX_LOGS = 80;

export async function fetchHabitCoachLogs(): Promise<Log[]> {
  const cutoff = new Date(Date.now() - COACH_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  try {
    const records = await prisma.learningLog.findMany({
      where: {
        createdAt: {
          gte: cutoff,
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: MAX_LOGS,
    });

    return records.map((record) => ({
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      timeSpent: record.timeSpent,
      tags: record.tags ?? [],
      title: record.title,
      reflection: record.reflection,
    }));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001")
    ) {
      console.warn("fetchHabitCoachLogs database unavailable, returning empty logs", error);
      return [];
    }
    throw error;
  }
}

