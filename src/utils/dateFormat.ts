import i18n from "../i18n";

// The Days grid's "Late" slot (see timeSlots.ts) spans 21:30-05:00,
// wrapping past midnight as one continuous late-night stretch. Without a
// matching shift here, an entry logged just after midnight would start a
// new day of its own instead of joining that stretch, showing up as the
// lone, misleadingly "last" entry of an almost-empty new day. So a day, for
// grouping purposes, runs 05:00-05:00 rather than midnight-to-midnight.
const DAY_START_HOUR = 5;

// Dates and times follow the app's language (which may differ from the
// device's when picked manually in Settings), not the device locale.
function locale(): string {
  return i18n.language || "en";
}

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

  if (dayKey === todayKey) return i18n.t("dates.today");
  if (dayKey === yesterdayKey) return i18n.t("dates.yesterday");

  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale(), {
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

  if (dayKey === todayKey) return i18n.t("dates.today");
  if (dayKey === yesterdayKey) return i18n.t("dates.yesterday");

  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale(), {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale(), {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(locale(), {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return i18n.t("dates.durationMinutes", { mins });
  if (mins === 0) return i18n.t("dates.durationHours", { hours });
  return i18n.t("dates.durationHoursMinutes", { hours, mins });
}

export function minuteOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function dayFraction(iso: string): number {
  return minuteOfDay(iso) / 1440;
}
