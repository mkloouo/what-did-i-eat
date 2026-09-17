import reducer, { setBundleByDay, setPhotoLayoutAlgorithm } from './settingsSlice';

describe('settingsSlice', () => {
  it('defaults bundleByDay to false and photoLayoutAlgorithm to treemap', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      bundleByDay: false,
      photoLayoutAlgorithm: 'treemap',
    });
  });

  it('setBundleByDay toggles the flag', () => {
    const state = reducer(
      { bundleByDay: false, photoLayoutAlgorithm: 'treemap' },
      setBundleByDay(true)
    );
    expect(state.bundleByDay).toBe(true);
  });

  it('setPhotoLayoutAlgorithm switches the algorithm', () => {
    const state = reducer(
      { bundleByDay: false, photoLayoutAlgorithm: 'treemap' },
      setPhotoLayoutAlgorithm('masonry')
    );
    expect(state.photoLayoutAlgorithm).toBe('masonry');
  });
});
