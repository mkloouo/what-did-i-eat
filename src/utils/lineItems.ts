import { DaySection } from "../store/selectors/feedSelectors";
import { Entry } from "../types/models";
import { dayLabel, formatDuration } from "./dateFormat";

// Entries further apart than this break the Line's spine and get a
// "… earlier" label between them; closer ones stay joined by one line.
export const LINE_BREAK_MINUTES = 60;

type LineDayItem = { type: "day"; dayKey: string; label: string };
type LineGapItem = { type: "gap"; key: string; label: string };
export type LineEntryItem = {
  type: "entry";
  entry: Entry;
  // Whether the spine runs up to the entry above (newer) / down to the
  // entry below (older) — false at a day's edge or across a long gap.
  joinsNewer: boolean;
  joinsOlder: boolean;
};
export type LineItem = LineDayItem | LineGapItem | LineEntryItem;

function minutesBetween(newer: Entry, older: Entry): number {
  return Math.round(
    (new Date(newer.createdAt).getTime() - new Date(older.createdAt).getTime()) /
      60_000,
  );
}

// The Line is one flat, virtualised list: per day, a seam item, then one
// item per entry (newest first), with a gap item wherever two neighbouring
// entries are more than LINE_BREAK_MINUTES apart.
export function buildLineItems(sections: DaySection[]): LineItem[] {
  const items: LineItem[] = [];
  for (const section of sections) {
    items.push({
      type: "day",
      dayKey: section.dayKey,
      label: dayLabel(section.dayKey),
    });
    const { entries } = section;
    for (let i = 0; i < entries.length; i++) {
      const newer = entries[i - 1];
      const older = entries[i + 1];
      const joinsNewer =
        newer !== undefined &&
        minutesBetween(newer, entries[i]) <= LINE_BREAK_MINUTES;
      const joinsOlder =
        older !== undefined &&
        minutesBetween(entries[i], older) <= LINE_BREAK_MINUTES;

      if (newer !== undefined && !joinsNewer) {
        items.push({
          type: "gap",
          key: `gap-${entries[i].id}`,
          label: `${formatDuration(minutesBetween(newer, entries[i]))} earlier`,
        });
      }
      items.push({ type: "entry", entry: entries[i], joinsNewer, joinsOlder });
    }
  }
  return items;
}

export function lineItemKey(item: LineItem): string {
  if (item.type === "day") return `day-${item.dayKey}`;
  if (item.type === "gap") return item.key;
  return item.entry.id;
}

// The index of a day's own seam item, for scrolling the list to it.
export function firstItemIndexForDay(
  items: LineItem[],
  dayKey: string,
): number {
  return items.findIndex(
    (item) => item.type === "day" && item.dayKey === dayKey,
  );
}

// The index of one entry's row — the Days grid's cell tap scrolls there.
export function itemIndexForEntry(items: LineItem[], entryId: string): number {
  return items.findIndex(
    (item) => item.type === "entry" && item.entry.id === entryId,
  );
}

// Given the indices FlashList currently reports as on screen, finds which
// day's seam governs the topmost of them — the nearest "day" item at or
// before it — so the scrubber can highlight where the user actually is.
export function currentDayFromViewableItems(
  items: LineItem[],
  viewableIndices: number[],
): string | null {
  if (viewableIndices.length === 0) return null;
  const topIndex = Math.min(...viewableIndices);
  for (let i = topIndex; i >= 0; i--) {
    const item = items[i];
    if (item?.type === "day") return item.dayKey;
  }
  return null;
}
