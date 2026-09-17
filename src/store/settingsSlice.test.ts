import reducer, {
  setGroupingMode,
  setRollingWindowMinutes,
  setPhotoLayoutAlgorithm,
  setInferDateFromFirstImportedPhoto,
} from './settingsSlice';

const baseState = {
  groupingMode: 'rolling' as const,
  rollingWindowMinutes: 60,
  photoLayoutAlgorithm: 'treemap' as const,
  inferDateFromFirstImportedPhoto: false,
};

describe('settingsSlice', () => {
  it('defaults to a 60-minute rolling window, treemap layout, and inferred-date off', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(baseState);
  });

  it('setGroupingMode switches mode', () => {
    const state = reducer(baseState, setGroupingMode('day'));
    expect(state.groupingMode).toBe('day');
  });

  it('setRollingWindowMinutes updates the window', () => {
    const state = reducer(baseState, setRollingWindowMinutes(120));
    expect(state.rollingWindowMinutes).toBe(120);
  });

  it('setPhotoLayoutAlgorithm switches the algorithm', () => {
    const state = reducer(baseState, setPhotoLayoutAlgorithm('masonry'));
    expect(state.photoLayoutAlgorithm).toBe('masonry');
  });

  it('setInferDateFromFirstImportedPhoto toggles the flag', () => {
    const state = reducer(baseState, setInferDateFromFirstImportedPhoto(true));
    expect(state.inferDateFromFirstImportedPhoto).toBe(true);
  });
});
