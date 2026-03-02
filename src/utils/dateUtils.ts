const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export function getWorkingDays(start: string, end: string): string[] {
  const days: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  while (current <= endDate) {
    days.push(formatISO(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatJapaneseDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DAY_NAMES[d.getDay()];
  return `${month}月${day}日（${dow}）`;
}

/**
 * Group dates into ISO-week buckets.
 * Returns array of arrays, each sub-array is one week's dates.
 * Week starts on Monday (ISO standard).
 */
export function getWeekBuckets(dates: string[]): string[][] {
  if (dates.length === 0) return [];
  const buckets: string[][] = [];
  let currentBucket: string[] = [];
  let currentWeek = -1;

  for (const iso of dates) {
    const d = new Date(iso + 'T00:00:00');
    // ISO week number approximation: use Monday-based week boundary
    // getDay(): 0=Sun..6=Sat → Monday=1
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day; // days since Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    const weekKey = monday.getTime();

    if (weekKey !== currentWeek) {
      if (currentBucket.length > 0) buckets.push(currentBucket);
      currentBucket = [];
      currentWeek = weekKey;
    }
    currentBucket.push(iso);
  }
  if (currentBucket.length > 0) buckets.push(currentBucket);
  return buckets;
}

export function generateId(): string {
  return crypto.randomUUID();
}
