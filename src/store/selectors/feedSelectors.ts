import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../rootState";
import { Entry } from "../../types/models";
import { dayKeyOf } from "../../utils/dateFormat";

// One calendar day's entries, newest first. Entries are never merged into
// meals any more — the Line and the Days grid both work entry by entry.
export type DaySection = {
  dayKey: string;
  entries: Entry[];
};

const selectEntriesById = (state: RootState) => state.entries;
// The active tag filter isn't part of redux state — it's UI state owned by
// the Home screen — so it arrives as this selector's own second argument
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

export const selectFeedSections = createSelector(
  [selectEntriesSortedByDate, selectTagFilter],
  (sortedEntries, tagId): DaySection[] => {
    const entries = tagId
      ? sortedEntries.filter((entry) => (entry.tagIds ?? []).includes(tagId))
      : sortedEntries;

    const byDay = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = dayKeyOf(entry.createdAt);
      const list = byDay.get(key) ?? [];
      list.push(entry);
      byDay.set(key, list);
    }

    const dayKeys = Array.from(byDay.keys()).sort().reverse();

    return dayKeys.map((dayKey) => ({
      dayKey,
      entries: [...byDay.get(dayKey)!].reverse(),
    }));
  },
);
