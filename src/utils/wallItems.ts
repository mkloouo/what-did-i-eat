import { DaySection, EntryGroup } from "../store/selectors/groupSelectors";
import { dayLabel } from "./dateFormat";

export type WallDayItem = { type: "day"; dayKey: string; label: string };
export type WallPieceItem = { type: "piece"; group: EntryGroup };
export type WallItem = WallDayItem | WallPieceItem;

// The Wall is one flat, virtualised list: a day seam item followed by one
// piece item per group in that day, repeated for every day section.
export function buildWallItems(sections: DaySection[]): WallItem[] {
  const items: WallItem[] = [];
  for (const section of sections) {
    items.push({
      type: "day",
      dayKey: section.dayKey,
      label: dayLabel(section.dayKey),
    });
    for (const group of section.groups) {
      items.push({ type: "piece", group });
    }
  }
  return items;
}

// The index of a day's own seam item, for scrolling the list to it.
export function firstItemIndexForDay(
  items: WallItem[],
  dayKey: string,
): number {
  return items.findIndex(
    (item) => item.type === "day" && item.dayKey === dayKey,
  );
}

// Given the indices FlashList currently reports as on screen, finds which
// day's seam governs the topmost of them — the nearest "day" item at or
// before it — so the scrubber can highlight where the user actually is.
export function currentDayFromViewableItems(
  items: WallItem[],
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
