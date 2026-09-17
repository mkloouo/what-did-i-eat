import reducer, {
  setGroupingMode,
  setRollingWindowMinutes,
  setPhotoLayoutAlgorithm,
} from './settingsSlice';

describe('settingsSlice', () => {
  it('defaults to a 60-minute rolling window and treemap layout', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      groupingMode: 'rolling',
      rollingWindowMinutes: 60,
      photoLayoutAlgorithm: 'treemap',
    });
  });

  it('setGroupingMode switches mode', () => {
    const state = reducer(
      { groupingMode: 'rolling', rollingWindowMinutes: 60, photoLayoutAlgorithm: 'treemap' },
      setGroupingMode('day')
    );
    expect(state.groupingMode).toBe('day');
  });

  it('setRollingWindowMinutes updates the window', () => {
    const state = reducer(
      { groupingMode: 'rolling', rollingWindowMinutes: 60, photoLayoutAlgorithm: 'treemap' },
      setRollingWindowMinutes(120)
    );
    expect(state.rollingWindowMinutes).toBe(120);
  });

  it('setPhotoLayoutAlgorithm switches the algorithm', () => {
    const state = reducer(
      { groupingMode: 'rolling', rollingWindowMinutes: 60, photoLayoutAlgorithm: 'treemap' },
      setPhotoLayoutAlgorithm('masonry')
    );
    expect(state.photoLayoutAlgorithm).toBe('masonry');
  });
});
