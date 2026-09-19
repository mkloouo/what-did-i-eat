import { Entry } from "../types/models";

// PhotoStack flattens `photosByEntry` (one sub-array per entry) into a
// single list for layout. Given the flat index of a tapped photo, walks
// the same per-entry lengths to find which entry it came from.
export function entryForPhotoIndex(
  photosByEntry: string[][],
  entries: Entry[],
  flatIndex: number,
): Entry | undefined {
  if (flatIndex < 0) return undefined;
  let remaining = flatIndex;
  for (let i = 0; i < photosByEntry.length; i++) {
    const count = photosByEntry[i].length;
    if (remaining < count) return entries[i];
    remaining -= count;
  }
  return undefined;
}
