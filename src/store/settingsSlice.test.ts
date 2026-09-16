import reducer, { setBundleByDay } from './settingsSlice';

describe('settingsSlice', () => {
  it('defaults bundleByDay to false', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ bundleByDay: false });
  });

  it('setBundleByDay toggles the flag', () => {
    const state = reducer({ bundleByDay: false }, setBundleByDay(true));
    expect(state.bundleByDay).toBe(true);
  });
});
