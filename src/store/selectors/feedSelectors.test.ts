import { selectFeedSections } from "./feedSelectors";
import { RootState } from "../rootState";
import { Entry } from "../../types/models";

function entry(id: string, iso: string): Entry {
  return {
    id,
    createdAt: iso,
    comment: `comment-${id}`,
    location: null,
    photos: [{ id: `${id}-photo`, uri: `${id}.jpg` }],
  };
}

function stateFrom(entries: Entry[]): RootState {
  const entriesById = Object.fromEntries(entries.map((e) => [e.id, e]));
  return {
    entries: entriesById,
    settings: {
      wallColumns: 4,
      inferDateFromFirstImportedPhoto: false,
      captureLocation: true,
    },
    tags: {},
    appMeta: {
      hasSeededDefaultTags: true,
      timelineView: "line",
    },
  };
}

const ids = (entries: Entry[]) => entries.map((e) => e.id);

describe("selectFeedSections", () => {
  it("returns no sections when there are no entries", () => {
    expect(selectFeedSections(stateFrom([]))).toEqual([]);
  });

  it("lists a day's entries newest first, never merged, whatever the gaps", () => {
    const e1 = entry("a", "2026-03-05T08:00:00");
    const e2 = entry("b", "2026-03-05T08:10:00");
    const e3 = entry("c", "2026-03-05T20:00:00");
    const sections = selectFeedSections(stateFrom([e2, e3, e1]));

    expect(sections).toHaveLength(1);
    expect(ids(sections[0].entries)).toEqual(["c", "b", "a"]);
  });

  it("creates separate day sections, newest day first", () => {
    const e1 = entry("a", "2026-03-04T12:00:00");
    const e2 = entry("b", "2026-03-05T12:00:00");
    const sections = selectFeedSections(stateFrom([e1, e2]));

    expect(sections.map((s) => s.dayKey)).toEqual(["2026-03-05", "2026-03-04"]);
    expect(ids(sections[0].entries)).toEqual(["b"]);
    expect(ids(sections[1].entries)).toEqual(["a"]);
  });
});

describe("selectFeedSections with a tag filter", () => {
  it("drops entries that don't carry the filtered tag", () => {
    const e1 = { ...entry("a", "2026-03-05T12:00:00"), tagIds: ["coffee"] };
    const e2 = { ...entry("b", "2026-03-05T20:00:00"), tagIds: ["dinner"] };
    const sections = selectFeedSections(stateFrom([e1, e2]), "coffee");

    expect(sections).toHaveLength(1);
    expect(ids(sections[0].entries)).toEqual(["a"]);
  });

  it("drops a day entirely when none of its entries match", () => {
    const e1 = { ...entry("a", "2026-03-04T12:00:00"), tagIds: ["dinner"] };
    const e2 = { ...entry("b", "2026-03-05T12:00:00"), tagIds: ["coffee"] };
    const sections = selectFeedSections(stateFrom([e1, e2]), "coffee");

    expect(sections.map((s) => s.dayKey)).toEqual(["2026-03-05"]);
  });

  it("never matches an entry with no tags", () => {
    const state = stateFrom([entry("a", "2026-03-05T12:00:00")]);
    expect(selectFeedSections(state, "coffee")).toEqual([]);
  });

  it("returns every entry when no tag is selected", () => {
    const e1 = { ...entry("a", "2026-03-05T12:00:00"), tagIds: ["coffee"] };
    const state = stateFrom([e1]);
    expect(selectFeedSections(state, null)).toEqual(selectFeedSections(state));
  });
});
