import { Entry } from "../../types/models";

// Clusters entries by elapsed gap alone, ascending by time, ignoring day
// boundaries — a decorative preview of the rolling-window control, not a
// re-implementation of groupSelectors.ts's actual day-scoped grouping.
export function previewGroups(
  entries: Entry[],
  rollingWindowMinutes: number,
): Entry[][] {
  if (entries.length === 0) return [];

  const windowMs = rollingWindowMinutes * 60_000;
  const groups: Entry[][] = [];
  let current: Entry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = current[current.length - 1];
    const gap =
      new Date(entries[i].createdAt).getTime() -
      new Date(prev.createdAt).getTime();
    if (gap <= windowMs) {
      current.push(entries[i]);
    } else {
      groups.push(current);
      current = [entries[i]];
    }
  }
  groups.push(current);
  return groups;
}
