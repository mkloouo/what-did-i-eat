import reducer, { markDefaultTagsSeeded } from "./appMetaSlice";

describe("appMetaSlice", () => {
  it("starts with hasSeededDefaultTags false", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      hasSeededDefaultTags: false,
    });
  });

  it("markDefaultTagsSeeded flips the flag to true", () => {
    const state = reducer(
      { hasSeededDefaultTags: false },
      markDefaultTagsSeeded(),
    );
    expect(state).toEqual({ hasSeededDefaultTags: true });
  });
});
