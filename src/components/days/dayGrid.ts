import { DaySection, EntryGroup } from "../../store/selectors/groupSelectors";
import { minuteOfDay } from "../../utils/dateFormat";
import { slotIndexForHour, slotUpperBoundHour, SlotIndex } from "./timeSlots";

export type SlotCell = {
  slotIndex: SlotIndex;
  meals: EntryGroup[];
  photoCount: number;
  hasSpillover: boolean;
};

function hourOf(iso: string): number {
  return minuteOfDay(iso) / 60;
}

function mealHasSpillover(group: EntryGroup, slotIndex: SlotIndex): boolean {
  const upper = slotUpperBoundHour(slotIndex);
  if (upper === null) return false;
  return hourOf(group.timeTo) > upper;
}

function photoCountOf(group: EntryGroup): number {
  return group.photosByEntry.reduce((sum, photos) => sum + photos.length, 0);
}

// One row's worth of data: the day's groups bucketed into the five
// time-of-day slots by `slotIndexForHour` on each meal's *start* time, so a
// long sitting never splits across two cells. `section.groups` arrives
// newest-first from selectFeedSections; iterating a reversed copy keeps
// `meals` (and, via cellPhotos, every photo) in oldest-first order per cell.
export function buildDayGrid(section: DaySection): SlotCell[] {
  const cells: SlotCell[] = [0, 1, 2, 3, 4].map((slotIndex) => ({
    slotIndex: slotIndex as SlotIndex,
    meals: [],
    photoCount: 0,
    hasSpillover: false,
  }));

  const oldestFirst = [...section.groups].reverse();
  for (const group of oldestFirst) {
    const slotIndex = slotIndexForHour(hourOf(group.timeFrom));
    const cell = cells[slotIndex];
    cell.meals.push(group);
    cell.photoCount += photoCountOf(group);
    if (mealHasSpillover(group, slotIndex)) cell.hasSpillover = true;
  }

  return cells;
}

// Every photo across a cell's meal(s), oldest-first — the order the density
// mosaic tiles them in.
export function cellPhotos(cell: SlotCell): string[] {
  const photos: string[] = [];
  for (const group of cell.meals) {
    for (let i = group.entries.length - 1; i >= 0; i--) {
      photos.push(...group.photosByEntry[i]);
    }
  }
  return photos;
}
