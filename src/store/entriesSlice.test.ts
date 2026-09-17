import reducer, { addEntry, updateEntryComment, updateEntryTags, deleteEntry } from './entriesSlice';
import { Entry } from '../types/models';

const sampleEntry: Entry = {
  id: 'e1',
  createdAt: '2026-03-05T12:00:00.000Z',
  comment: 'Lunch',
  location: null,
  photos: [{ id: 'p1', uri: 'file:///doc/photos/p1.jpg' }],
};

describe('entriesSlice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({});
  });

  it('addEntry stores the entry by id', () => {
    const state = reducer({}, addEntry(sampleEntry));
    expect(state).toEqual({ e1: sampleEntry });
  });

  it('updateEntryComment updates only the comment', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryComment({ id: 'e1', comment: 'Dinner instead' }));
    expect(state.e1.comment).toBe('Dinner instead');
    expect(state.e1.photos).toBe(sampleEntry.photos);
  });

  it('updateEntryComment is a no-op for an unknown id', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryComment({ id: 'missing', comment: 'x' }));
    expect(state).toEqual(initial);
  });

  it('updateEntryTags updates only the tag ids', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryTags({ id: 'e1', tagIds: ['t1', 't2'] }));
    expect(state.e1.tagIds).toEqual(['t1', 't2']);
    expect(state.e1.comment).toBe(sampleEntry.comment);
  });

  it('updateEntryTags is a no-op for an unknown id', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, updateEntryTags({ id: 'missing', tagIds: ['t1'] }));
    expect(state).toEqual(initial);
  });

  it('deleteEntry removes the entry by id', () => {
    const initial = { e1: sampleEntry };
    const state = reducer(initial, deleteEntry({ id: 'e1' }));
    expect(state).toEqual({});
  });
});
