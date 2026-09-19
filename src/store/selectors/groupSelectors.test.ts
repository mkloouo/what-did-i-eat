import { selectFeedSections } from "./groupSelectors";
import { RootState } from "../rootState";
import { Entry, GroupingMode } from "../../types/models";
import { resolvePhotoUri } from "../../storage/photoStorage";

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///doc/",
}));

function entry(id: string, iso: string, photoUri = `${id}.jpg`): Entry {
  return {
    id,
    createdAt: iso,
    comment: `comment-${id}`,
    location: null,
    photos: [{ id: `${id}-photo`, uri: photoUri }],
  };
}

function stateFrom(
  entries: Entry[],
  groupingMode: GroupingMode = "rolling",
  rollingWindowMinutes = 60,
): RootState {
  const entriesById = Object.fromEntries(entries.map((e) => [e.id, e]));
  return {
    entries: entriesById,
    settings: {
      groupingMode,
      rollingWindowMinutes,
      wallColumns: 4,
      inferDateFromFirstImportedPhoto: false,
      captureLocation: true,
    },
    tags: {},
    appMeta: {
      hasSeededDefaultTags: true,
      scrubberEnabled: false,
      timelineView: "wall",
    },
  };
}

describe("selectFeedSections", () => {
  it("returns no sections when there are no entries", () => {
    expect(selectFeedSections(stateFrom([]))).toEqual([]);
  });

  it("puts entries within the rolling window of each other into one group", () => {
    const e1 = entry("a", "2026-03-05T12:00:00.000Z");
    const e2 = entry("b", "2026-03-05T12:45:00.000Z");
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections).toHaveLength(1);
    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(["b", "a"]);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e2.createdAt);
    expect(sections[0].groups[0].photosByEntry).toEqual([
      [resolvePhotoUri(e2.photos[0].uri)],
      [resolvePhotoUri(e1.photos[0].uri)],
    ]);
  });

  it("keeps each entry's photos in their own sub-array, in entry then photo order", () => {
    const e1: Entry = {
      id: "a",
      createdAt: "2026-03-05T12:00:00.000Z",
      comment: "comment-a",
      location: null,
      photos: [
        { id: "a-1", uri: "a-1.jpg" },
        { id: "a-2", uri: "a-2.jpg" },
      ],
    };
    const e2 = entry("b", "2026-03-05T12:30:00.000Z");
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups[0].photosByEntry).toEqual([
      [resolvePhotoUri(e2.photos[0].uri)],
      [resolvePhotoUri("a-1.jpg"), resolvePhotoUri("a-2.jpg")],
    ]);
  });

  it("splits entries into separate groups when the gap exceeds the rolling window", () => {
    const e1 = entry("a", "2026-03-05T12:00:00.000Z");
    const e2 = entry("b", "2026-03-05T13:01:00.000Z");
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(2);
  });

  it("extends the rolling window from the last entry, not the first", () => {
    // a -> b is 55 min (merge), b -> c is 55 min (merge): total span 110 min but one group
    const e1 = entry("a", "2026-03-05T12:00:00.000Z");
    const e2 = entry("b", "2026-03-05T12:55:00.000Z");
    const e3 = entry("c", "2026-03-05T13:50:00.000Z");
    const state = stateFrom([e1, e2, e3]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e3.createdAt);
  });

  it("uses a configurable window instead of a fixed hour", () => {
    const e1 = entry("a", "2026-03-05T12:00:00.000Z");
    const e2 = entry("b", "2026-03-05T12:40:00.000Z"); // 40 min gap

    expect(
      selectFeedSections(stateFrom([e1, e2], "rolling", 30))[0].groups,
    ).toHaveLength(2);
    expect(
      selectFeedSections(stateFrom([e1, e2], "rolling", 60))[0].groups,
    ).toHaveLength(1);
  });

  it('bundles the whole day into one group when groupingMode is "day", regardless of gaps', () => {
    const e1 = entry("a", "2026-03-05T08:00:00.000Z");
    const e2 = entry("b", "2026-03-05T20:00:00.000Z");
    const state = stateFrom([e1, e2], "day");

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(["b", "a"]);
    expect(sections[0].groups[0].timeFrom).toBe(e1.createdAt);
    expect(sections[0].groups[0].timeTo).toBe(e2.createdAt);
  });

  it("creates separate day sections, newest day first", () => {
    const e1 = entry("a", "2026-03-04T12:00:00.000Z");
    const e2 = entry("b", "2026-03-05T12:00:00.000Z");
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections).toHaveLength(2);
    expect(sections[0].groups[0].entries[0].id).toBe("b");
    expect(sections[1].groups[0].entries[0].id).toBe("a");
  });

  it("orders groups within a day newest first", () => {
    const e1 = entry("a", "2026-03-05T08:00:00.000Z");
    const e2 = entry("b", "2026-03-05T20:00:00.000Z"); // >1hr gap from a -> separate group
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups).toHaveLength(2);
    expect(sections[0].groups[0].entries[0].id).toBe("b");
    expect(sections[0].groups[1].entries[0].id).toBe("a");
  });
});

describe("selectFeedSections with a tag filter", () => {
  it("drops entries that don't carry the filtered tag", () => {
    const e1 = { ...entry("a", "2026-03-05T12:00:00.000Z"), tagIds: ["coffee"] };
    const e2 = { ...entry("b", "2026-03-05T20:00:00.000Z"), tagIds: ["dinner"] };
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state, "coffee");

    expect(sections).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual(["a"]);
  });

  it("regroups remaining entries once non-matching ones are removed", () => {
    const e1 = { ...entry("a", "2026-03-05T12:00:00.000Z"), tagIds: ["coffee"] };
    const e2 = { ...entry("b", "2026-03-05T12:30:00.000Z"), tagIds: ["dinner"] };
    const e3 = { ...entry("c", "2026-03-05T13:00:00.000Z"), tagIds: ["coffee"] };
    const state = stateFrom([e1, e2, e3], "rolling", 60);

    // Unfiltered, a/b/c are each within 60 min of a neighbour: one group.
    expect(
      selectFeedSections(state).flatMap((s) => s.groups),
    ).toHaveLength(1);

    // Filtered to "coffee", b drops out, leaving a and c 60 min apart —
    // still one group, not a gap where b used to be.
    const sections = selectFeedSections(state, "coffee");
    expect(sections[0].groups).toHaveLength(1);
    expect(sections[0].groups[0].entries.map((e) => e.id)).toEqual([
      "c",
      "a",
    ]);
  });

  it("never matches an entry with no tags", () => {
    const e1 = entry("a", "2026-03-05T12:00:00.000Z");
    const state = stateFrom([e1]);

    expect(selectFeedSections(state, "coffee")).toEqual([]);
  });

  it("returns every entry when no tag is selected", () => {
    const e1 = { ...entry("a", "2026-03-05T12:00:00.000Z"), tagIds: ["coffee"] };
    const state = stateFrom([e1]);

    expect(selectFeedSections(state, null)).toEqual(selectFeedSections(state));
  });
});
