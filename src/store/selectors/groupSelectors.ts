import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../rootState";
import { Entry, GroupingMode } from "../../types/models";
import { dayKeyOf } from "../../utils/dateFormat";
import { resolvePhotoUri } from "../../storage/photoStorage";

export type EntryGroup = {
  id: string;
  dayKey: string;
  entries: Entry[];
  timeFrom: string;
  timeTo: string;
  photosByEntry: string[][];
};

export type DaySection = {
  dayKey: string;
  groups: EntryGroup[];
};

const selectEntriesById = (state: RootState) => state.entries;
const selectGroupingMode = (state: RootState) => state.settings.groupingMode;
const selectRollingWindowMinutes = (state: RootState) =>
  state.settings.rollingWindowMinutes;
// The active tag filter isn't part of redux state — it's UI state owned by
// the Wall screen — so it arrives as this selector's own second argument
// instead of being read off `state`.
const selectTagFilter = (_state: RootState, tagId: string | null = null) =>
  tagId;

export const selectEntriesSortedByDate = createSelector(
  [selectEntriesById],
  (entriesById): Entry[] =>
    Object.values(entriesById).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
);

function finalizeGroup(entries: Entry[], dayKey: string): EntryGroup {
  const first = entries[0];
  const last = entries[entries.length - 1];

  return {
    id: `${dayKey}-${entries[0].id}`,
    dayKey,
    entries: [...entries].reverse(),
    timeFrom: first.createdAt,
    timeTo: last.createdAt,
    photosByEntry: [...entries]
      .reverse()
      .map((entry) => entry.photos.map((photo) => resolvePhotoUri(photo.uri))),
  };
}

function groupEntriesWithinDay(
  entries: Entry[],
  groupingMode: GroupingMode,
  windowMs: number,
  dayKey: string,
): EntryGroup[] {
  if (entries.length === 0) return [];

  if (groupingMode === "day") {
    return [finalizeGroup(entries, dayKey)];
  }

  const groups: EntryGroup[] = [];
  let current: Entry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = current[current.length - 1];
    const candidate = entries[i];
    const gap =
      new Date(candidate.createdAt).getTime() -
      new Date(prev.createdAt).getTime();

    if (gap <= windowMs) {
      current.push(candidate);
    } else {
      groups.push(finalizeGroup(current, dayKey));
      current = [candidate];
    }
  }
  groups.push(finalizeGroup(current, dayKey));
  return groups;
}

// The Days view's hero: your single most recent entry, independent of any
// tag filter (the filter is Wall-only UI state, never applied to the hero).
export const selectLatestEntry = createSelector(
  [selectEntriesSortedByDate],
  (sorted): Entry | null => sorted[sorted.length - 1] ?? null,
);

export const selectFeedSections = createSelector(
  [
    selectEntriesSortedByDate,
    selectGroupingMode,
    selectRollingWindowMinutes,
    selectTagFilter,
  ],
  (sortedEntries, groupingMode, rollingWindowMinutes, tagId): DaySection[] => {
    // The filter runs before grouping, so a filtered wall regroups exactly
    // the matching entries instead of leaving a gap inside an old group.
    const entries = tagId
      ? sortedEntries.filter((entry) => (entry.tagIds ?? []).includes(tagId))
      : sortedEntries;

    const windowMs = rollingWindowMinutes * 60_000;
    const byDay = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = dayKeyOf(entry.createdAt);
      const list = byDay.get(key) ?? [];
      list.push(entry);
      byDay.set(key, list);
    }

    const dayKeys = Array.from(byDay.keys()).sort().reverse();

    return dayKeys.map((dayKey) => {
      const dayEntries = byDay.get(dayKey)!;
      const groups = groupEntriesWithinDay(
        dayEntries,
        groupingMode,
        windowMs,
        dayKey,
      ).reverse();
      return { dayKey, groups };
    });
  },
);
