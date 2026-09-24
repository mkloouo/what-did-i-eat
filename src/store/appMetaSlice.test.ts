import reducer, { markDefaultTagsSeeded, setTimelineView } from "./appMetaSlice";

describe("appMetaSlice", () => {
  it("starts with hasSeededDefaultTags false", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      hasSeededDefaultTags: false,
      timelineView: "wall",
    });
  });

  it("markDefaultTagsSeeded flips the flag to true", () => {
    const state = reducer(
      { hasSeededDefaultTags: false, timelineView: "wall" },
      markDefaultTagsSeeded(),
    );
    expect(state).toEqual({
      hasSeededDefaultTags: true,
      timelineView: "wall",
    });
  });

  it("starts on the Wall view", () => {
    expect(reducer(undefined, { type: "@@INIT" }).timelineView).toBe("wall");
  });

  it("setTimelineView switches to Days", () => {
    const state = reducer(
      { hasSeededDefaultTags: true, timelineView: "wall" },
      setTimelineView("days"),
    );
    expect(state.timelineView).toBe("days");
  });
});
