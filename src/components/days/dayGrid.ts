import { DaySection } from "../../store/selectors/feedSelectors";
import { Entry } from "../../types/models";
import { minuteOfDay } from "../../utils/dateFormat";
import { slotIndexForHour, SlotIndex } from "./timeSlots";

export type SlotCell = {
  slotIndex: SlotIndex;
  // Oldest first.
  entries: Entry[];
  photoCount: number;
};

// One row's worth of data: the day's entries bucketed into the five
// time-of-day slots, each by its own time — so what a cell shows never
// depends on how close together entries were. `section.entries` arrives
// newest-first from selectFeedSections; iterating a reversed copy keeps
// each cell's entries (and, via cellPhotos, every photo) oldest-first.
export function buildDayGrid(section: DaySection): SlotCell[] {
  const cells: SlotCell[] = [0, 1, 2, 3, 4].map((slotIndex) => ({
    slotIndex: slotIndex as SlotIndex,
    entries: [],
    photoCount: 0,
  }));

  for (const entry of [...section.entries].reverse()) {
    const cell = cells[slotIndexForHour(minuteOfDay(entry.createdAt) / 60)];
    cell.entries.push(entry);
    cell.photoCount += entry.photos.length;
  }

  return cells;
}

// Every photo across a cell's entries, oldest-first — the order the density
// mosaic tiles them in. Stored (relative) paths; the cell resolves them.
export function cellPhotos(cell: SlotCell): string[] {
  return cell.entries.flatMap((entry) => entry.photos.map((p) => p.uri));
}

// Where a cell tap lands on the Line: the slot's newest entry, which the
// Line (newest first) shows at the top of the slot, with the rest below it.
export function cellTargetEntryId(cell: SlotCell): string | null {
  return cell.entries[cell.entries.length - 1]?.id ?? null;
}
