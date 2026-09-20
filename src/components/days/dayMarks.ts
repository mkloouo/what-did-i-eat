import { DaySection } from "../../store/selectors/groupSelectors";
import { dayFraction } from "../../utils/dateFormat";

export type DayMark = { uri: string; x: number; stack: number };

// Two marks closer together than this fraction of the band's width would
// overlap, so the later one moves up a row. Tuned for Today's 48px marks on
// a phone-width band; past days' smaller marks just stack a touch eagerly.
const MIN_MARK_GAP = 0.12;

// One mark per photo, positioned by its own entry's time of day (photos
// don't carry their own timestamp). Marks stack by TIME PROXIMITY, not by
// group: a greedy lane assignment over the marks in time order, so photos
// hours apart share the bottom row even when a grouping mode (like "A whole
// day") bundles them into one group. DayBand turns `stack` into a pixel
// offset.
export function buildDayMarks(
  section: DaySection,
  minGap: number = MIN_MARK_GAP,
): DayMark[] {
  const placed: { uri: string; x: number }[] = [];
  for (const group of section.groups) {
    for (let i = 0; i < group.entries.length; i++) {
      const entry = group.entries[i];
      const photos = group.photosByEntry[i] ?? [];
      for (const uri of photos) {
        placed.push({ uri, x: dayFraction(entry.createdAt) });
      }
    }
  }

  // Array.prototype.sort is stable, so photos sharing a time keep their order.
  placed.sort((a, b) => a.x - b.x);

  const laneEnds: number[] = [];
  return placed.map(({ uri, x }) => {
    let lane = laneEnds.findIndex((end) => x - end >= minGap);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(x);
    } else {
      laneEnds[lane] = x;
    }
    return { uri, x, stack: lane };
  });
}
