import reducer, {
  markDefaultTagsSeeded,
  setScrubberEnabled,
} from "./appMetaSlice";

describe("appMetaSlice", () => {
  it("starts with hasSeededDefaultTags false", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      hasSeededDefaultTags: false,
      scrubberEnabled: false,
    });
  });

  it("markDefaultTagsSeeded flips the flag to true", () => {
    const state = reducer(
      { hasSeededDefaultTags: false, scrubberEnabled: false },
      markDefaultTagsSeeded(),
    );
    expect(state).toEqual({ hasSeededDefaultTags: true, scrubberEnabled: false });
  });

  it("starts with the Wall scrubber disabled — it's rough with few days logged", () => {
    expect(reducer(undefined, { type: "@@INIT" }).scrubberEnabled).toBe(
      false,
    );
  });

  it("setScrubberEnabled toggles the flag", () => {
    const state = reducer(
      { hasSeededDefaultTags: true, scrubberEnabled: false },
      setScrubberEnabled(true),
    );
    expect(state).toEqual({ hasSeededDefaultTags: true, scrubberEnabled: true });
  });
});
