import reducer, { addTag, updateTag, deleteTag } from './tagsSlice';
import { Tag } from '../types/models';

const sampleTag: Tag = { id: 't1', icon: 'restaurant-outline', label: 'Home cooked' };

describe('tagsSlice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({});
  });

  it('addTag stores the tag by id', () => {
    const state = reducer({}, addTag(sampleTag));
    expect(state).toEqual({ t1: sampleTag });
  });

  it('updateTag replaces the tag by id', () => {
    const initial = { t1: sampleTag };
    const updated: Tag = { id: 't1', icon: 'cafe-outline', label: 'Coffee run' };
    const state = reducer(initial, updateTag(updated));
    expect(state.t1).toEqual(updated);
  });

  it('updateTag is a no-op for an unknown id', () => {
    const initial = { t1: sampleTag };
    const state = reducer(initial, updateTag({ id: 'missing', icon: 'cafe-outline', label: 'x' }));
    expect(state).toEqual(initial);
  });

  it('deleteTag removes the tag by id', () => {
    const initial = { t1: sampleTag };
    const state = reducer(initial, deleteTag({ id: 't1' }));
    expect(state).toEqual({});
  });
});
