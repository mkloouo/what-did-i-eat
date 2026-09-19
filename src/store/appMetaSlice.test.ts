import reducer, {
  markDefaultTagsSeeded,
  setScrubberEnabled,
  setTimelineView,
} from "./appMetaSlice";

describe("appMetaSlice", () => {
  it("starts with hasSeededDefaultTags false", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      hasSeededDefaultTags: false,
      scrubberEnabled: true,
      timelineView: "wall",
    });
  });

  it("markDefaultTagsSeeded flips the flag to true", () => {
    const state = reducer(
      {
        hasSeededDefaultTags: false,
        scrubberEnabled: true,
        timelineView: "wall",
      },
      markDefaultTagsSeeded(),
    );
    expect(state).toEqual({
      hasSeededDefaultTags: true,
      scrubberEnabled: true,
      timelineView: "wall",
    });
  });

  it("starts with the Wall scrubber enabled", () => {
    expect(reducer(undefined, { type: "@@INIT" }).scrubberEnabled).toBe(true);
  });

  it("setScrubberEnabled toggles the flag", () => {
    const state = reducer(
      {
        hasSeededDefaultTags: true,
        scrubberEnabled: true,
        timelineView: "wall",
      },
      setScrubberEnabled(false),
    );
    expect(state).toEqual({
      hasSeededDefaultTags: true,
      scrubberEnabled: false,
      timelineView: "wall",
    });
  });

  it("starts on the Wall view", () => {
    expect(reducer(undefined, { type: "@@INIT" }).timelineView).toBe("wall");
  });

  it("setTimelineView switches to Days", () => {
    const state = reducer(
      {
        hasSeededDefaultTags: true,
        scrubberEnabled: true,
        timelineView: "wall",
      },
      setTimelineView("days"),
    );
    expect(state.timelineView).toBe("days");
  });
});
