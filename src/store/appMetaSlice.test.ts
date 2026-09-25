import reducer, { markDefaultTagsSeeded, setTimelineView } from "./appMetaSlice";

describe("appMetaSlice", () => {
  it("starts with hasSeededDefaultTags false", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      hasSeededDefaultTags: false,
      timelineView: "line",
    });
  });

  it("markDefaultTagsSeeded flips the flag to true", () => {
    const state = reducer(
      { hasSeededDefaultTags: false, timelineView: "line" },
      markDefaultTagsSeeded(),
    );
    expect(state).toEqual({
      hasSeededDefaultTags: true,
      timelineView: "line",
    });
  });

  it("starts on the Line view", () => {
    expect(reducer(undefined, { type: "@@INIT" }).timelineView).toBe("line");
  });

  it("setTimelineView switches to Days", () => {
    const state = reducer(
      { hasSeededDefaultTags: true, timelineView: "line" },
      setTimelineView("days"),
    );
    expect(state.timelineView).toBe("days");
  });
});
