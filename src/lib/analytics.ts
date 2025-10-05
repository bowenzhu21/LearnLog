export type Log = {
  id: string;
  createdAt: string;
  timeSpent: number;
  tags: string[];
  title?: string;
  reflection?: string;
};

export const normalizeDate = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);
  const utcYear = date.getUTCFullYear();
  const utcMonth = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const utcDay = `${date.getUTCDate()}`.padStart(2, "0");
  return `${utcYear}-${utcMonth}-${utcDay}`;
};

export const sumMinutes = (logs: Log[]): number =>
  logs.reduce((total, log) => total + (Number.isFinite(log.timeSpent) ? log.timeSpent : 0), 0);

export const minutesByTag = (logs: Log[]): Array<{ tag: string; minutes: number }> => {
  const totals = new Map<string, number>();

  for (const log of logs) {
    const minutes = Number.isFinite(log.timeSpent) ? log.timeSpent : 0;
    for (const tag of log.tags ?? []) {
      if (!tag) {
        continue;
      }
      const normalized = tag.trim();
      if (!normalized) {
        continue;
      }
      totals.set(normalized, (totals.get(normalized) ?? 0) + minutes);
    }
  }

  return Array.from(totals.entries())
    .map(([tag, minutes]) => ({ tag, minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.tag.localeCompare(b.tag));
};

export const groupDailyMinutes = (logs: Log[]): Array<{ day: string; minutes: number }> => {
  const totals = new Map<string, number>();

  for (const log of logs) {
    const day = normalizeDate(log.createdAt);
    const minutes = Number.isFinite(log.timeSpent) ? log.timeSpent : 0;
    totals.set(day, (totals.get(day) ?? 0) + minutes);
  }

  return Array.from(totals.entries())
    .map(([day, minutes]) => ({ day, minutes }))
    .sort((a, b) => a.day.localeCompare(b.day));
};

export const computeStreaks = (days: string[]): { current: number; longest: number } => {
  if (days.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sortedDays = Array.from(new Set(days)).sort();
  let current = 1;
  let longest = 1;

  for (let index = 1; index < sortedDays.length; index += 1) {
    const previous = new Date(sortedDays[index - 1]);
    const currentDate = new Date(sortedDays[index]);

    const diff = (currentDate.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current += 1;
    } else {
      longest = Math.max(longest, current);
      current = 1;
    }
  }

  longest = Math.max(longest, current);

  const today = normalizeDate(new Date());
  const lastRecorded = sortedDays[sortedDays.length - 1];
  if (lastRecorded !== today && normalizeDate(new Date(Date.now() - 86_400_000)) !== lastRecorded) {
    current = 0;
  }

  return { current, longest };
};
