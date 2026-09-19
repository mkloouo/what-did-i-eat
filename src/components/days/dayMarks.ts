import { DaySection } from "../../store/selectors/groupSelectors";
import { dayFraction } from "../../utils/dateFormat";

export type DayMark = { uri: string; x: number; stack: number };

// One mark per photo, positioned by its own entry's time of day (photos
// don't carry their own timestamp). Entries bundled into the same
// rolling-window group sit close in time, so their marks stack vertically
// instead of overlapping — DayBand turns `stack` into a pixel offset.
export function buildDayMarks(section: DaySection): DayMark[] {
  const marks: DayMark[] = [];
  for (const group of section.groups) {
    let stack = 0;
    for (let i = 0; i < group.entries.length; i++) {
      const entry = group.entries[i];
      const photos = group.photosByEntry[i] ?? [];
      for (const uri of photos) {
        marks.push({ uri, x: dayFraction(entry.createdAt), stack });
        stack++;
      }
    }
  }
  return marks;
}
