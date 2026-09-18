// EXIF date/time tags use "YYYY:MM:DD HH:MM:SS" (local time, no timezone),
// which `new Date(...)` cannot parse directly.
const EXIF_DATE_PATTERN = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

export function parseExifDateTime(
  value: string | undefined | null,
): Date | null {
  if (!value) return null;
  const match = EXIF_DATE_PATTERN.exec(value.trim());
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
