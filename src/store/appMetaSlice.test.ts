import reducer, {
  markDefaultTagsSeeded,
  setScrubberEnabled,
} from "./appMetaSlice";

describe("appMetaSlice", () => {
  it("starts with hasSeededDefaultTags false", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      hasSeededDefaultTags: false,
      scrubberEnabled: true,
    });
  });

  it("markDefaultTagsSeeded flips the flag to true", () => {
    const state = reducer(
      { hasSeededDefaultTags: false, scrubberEnabled: true },
      markDefaultTagsSeeded(),
    );
    expect(state).toEqual({ hasSeededDefaultTags: true, scrubberEnabled: true });
  });

  it("starts with the Wall scrubber enabled", () => {
    expect(reducer(undefined, { type: "@@INIT" }).scrubberEnabled).toBe(true);
  });

  it("setScrubberEnabled toggles the flag", () => {
    const state = reducer(
      { hasSeededDefaultTags: true, scrubberEnabled: true },
      setScrubberEnabled(false),
    );
    expect(state).toEqual({ hasSeededDefaultTags: true, scrubberEnabled: false });
  });
});
