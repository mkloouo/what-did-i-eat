import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../rootState';
import { Entry } from '../../types/models';
import { dayKeyOf } from '../../utils/dateFormat';
import { resolvePhotoUri } from '../../storage/photoStorage';

const ONE_HOUR_MS = 60 * 60 * 1000;

export type EntryGroup = {
  id: string;
  dayKey: string;
  entries: Entry[];
  timeFrom: string;
  timeTo: string;
  photos: string[];
};

export type DaySection = {
  dayKey: string;
  groups: EntryGroup[];
};

const selectEntriesById = (state: RootState) => state.entries;
const selectBundleByDay = (state: RootState) => state.settings.bundleByDay;

export const selectEntriesSortedByDate = createSelector([selectEntriesById], (entriesById): Entry[] =>
  Object.values(entriesById).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
);

function finalizeGroup(entries: Entry[], dayKey: string): EntryGroup {
  const first = entries[0];
  const last = entries[entries.length - 1];

  return {
    id: `${dayKey}-${entries[0].id}`,
    dayKey,
    entries,
    timeFrom: first.createdAt,
    timeTo: last.createdAt,
    photos: entries.flatMap((entry) => entry.photos.map((photo) => resolvePhotoUri(photo.uri))),
  };
}

function groupEntriesWithinDay(entries: Entry[], bundleByDay: boolean, dayKey: string): EntryGroup[] {
  if (entries.length === 0) return [];

  if (bundleByDay) {
    return [finalizeGroup(entries, dayKey)];
  }

  const groups: EntryGroup[] = [];
  let current: Entry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = current[current.length - 1];
    const candidate = entries[i];
    const gap = new Date(candidate.createdAt).getTime() - new Date(prev.createdAt).getTime();

    if (gap <= ONE_HOUR_MS) {
      current.push(candidate);
    } else {
      groups.push(finalizeGroup(current, dayKey));
      current = [candidate];
    }
  }
  groups.push(finalizeGroup(current, dayKey));
  return groups;
}

export const selectFeedSections = createSelector(
  [selectEntriesSortedByDate, selectBundleByDay],
  (sortedEntries, bundleByDay): DaySection[] => {
    const byDay = new Map<string, Entry[]>();
    for (const entry of sortedEntries) {
      const key = dayKeyOf(entry.createdAt);
      const list = byDay.get(key) ?? [];
      list.push(entry);
      byDay.set(key, list);
    }

    const dayKeys = Array.from(byDay.keys()).sort().reverse();

    return dayKeys.map((dayKey) => {
      const dayEntries = byDay.get(dayKey)!;
      const groups = groupEntriesWithinDay(dayEntries, bundleByDay, dayKey).reverse();
      return { dayKey, groups };
    });
  }
);
