// The Days grid's "Late" slot (see timeSlots.ts) spans 21:30-05:00,
// wrapping past midnight as one continuous late-night stretch. Without a
// matching shift here, an entry logged just after midnight would start a
// new day of its own instead of joining that stretch, showing up as the
// lone, misleadingly "last" entry of an almost-empty new day. So a day, for
// grouping purposes, runs 05:00-05:00 rather than midnight-to-midnight.
const DAY_START_HOUR = 5;

export function dayKeyOf(iso: string): string {
  const d = new Date(iso);
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayLabel(dayKey: string, now: Date = new Date()): string {
  const todayKey = dayKeyOf(now.toISOString());

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = dayKeyOf(yesterday.toISOString());

  if (dayKey === todayKey) return "Today";
  if (dayKey === yesterdayKey) return "Yesterday";

  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

// Same Today/Yesterday special-casing as dayLabel, but an abbreviated month
// ("Sep 22" instead of "September 22") for older days — for callers with a
// narrow, fixed-width label column, like the Days grid's day-label column,
// where the full month name gets clipped.
export function dayLabelShort(dayKey: string, now: Date = new Date()): string {
  const todayKey = dayKeyOf(now.toISOString());

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = dayKeyOf(yesterday.toISOString());

  if (dayKey === todayKey) return "Today";
  if (dayKey === yesterdayKey) return "Yesterday";

  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} m`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} m`;
}

export function minuteOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function dayFraction(iso: string): number {
  return minuteOfDay(iso) / 1440;
}
