import { selectFeedSections } from './groupSelectors';
import { RootState } from '../rootState';
import { Entry } from '../../types/models';
import { resolvePhotoUri } from '../../storage/photoStorage';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///doc/',
}));

function entry(id: string, iso: string, photoUri = `${id}.jpg`): Entry {
  return {
    id,
    createdAt: iso,
    comment: `comment-${id}`,
    location: null,
    photos: [{ id: `${id}-photo`, uri: photoUri }],
  };
}

function stateFrom(entries: Entry[], bundleByDay = false): RootState {
  const entriesById = Object.fromEntries(entries.map((e) => [e.id, e]));
  return { entries: entriesById, settings: { bundleByDay, photoLayoutAlgorithm: 'treemap' } };
}

describe('selectFeedSections', () => {
  it('returns no sections when there are no entries', () => {
    expect(selectFeedSections(stateFrom([]))).toEqual([]);
  });

  it('puts entries within 1 hour of each other into one group', () => {
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:45:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections).toHaveLength(1);
    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e2.createdAt);
    expect(sections[0].groups[0].photosByEntry).toEqual([
      [resolvePhotoUri(e1.photos[0].uri)],
      [resolvePhotoUri(e2.photos[0].uri)],
    ]);
  });

  it('keeps each entry\'s photos in their own sub-array, in entry then photo order', () => {
    const e1: Entry = {
      id: 'a',
      createdAt: '2026-03-05T12:00:00.000Z',
      comment: 'comment-a',
      location: null,
      photos: [
        { id: 'a-1', uri: 'a-1.jpg' },
        { id: 'a-2', uri: 'a-2.jpg' },
      ],
    };
    const e2 = entry('b', '2026-03-05T12:30:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups[0].photosByEntry).toEqual([
      [resolvePhotoUri('a-1.jpg'), resolvePhotoUri('a-2.jpg')],
      [resolvePhotoUri(e2.photos[0].uri)],
    ]);
  });

  it('splits entries into separate groups when the gap exceeds 1 hour', () => {
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T13:01:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(2);
  });

  it('extends the rolling window from the last entry, not the first', () => {
    // a -> b is 55 min (merge), b -> c is 55 min (merge): total span 110 min but one group
    const e1 = entry('a', '2026-03-05T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:55:00.000Z');
    const e3 = entry('c', '2026-03-05T13:50:00.000Z');
    const state = stateFrom([e1, e2, e3]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e3.createdAt);
  });

  it('bundles the whole day into one group when bundleByDay is true, regardless of gaps', () => {
    const e1 = entry('a', '2026-03-05T08:00:00.000Z');
    const e2 = entry('b', '2026-03-05T20:00:00.000Z');
    const state = stateFrom([e1, e2], true);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e2.createdAt);
  });

  it('creates separate day sections, newest day first', () => {
    const e1 = entry('a', '2026-03-04T12:00:00.000Z');
    const e2 = entry('b', '2026-03-05T12:00:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections).toHaveLength(2);
    expect(sections[0].groups[0].entries[0].id).toBe('b');
    expect(sections[1].groups[0].entries[0].id).toBe('a');
  });

  it('orders groups within a day newest first', () => {
    const e1 = entry('a', '2026-03-05T08:00:00.000Z');
    const e2 = entry('b', '2026-03-05T20:00:00.000Z'); // >1hr gap from a -> separate group
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(2);
    expect(sections[0].groups[0].entries[0].id).toBe('b');
    expect(sections[0].groups[1].entries[0].id).toBe('a');
  });
});
