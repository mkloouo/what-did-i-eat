import {
  buildLineItems,
  firstItemIndexForDay,
  itemIndexForEntry,
  currentDayFromViewableItems,
  lineItemKey,
  LineEntryItem,
} from "./lineItems";
import { DaySection } from "../store/selectors/feedSelectors";
import { Entry } from "../types/models";

function entry(id: string, hour: number, minute: number, day = 5): Entry {
  return {
    id,
    createdAt: new Date(2026, 2, day, hour, minute).toISOString(),
    comment: "",
    location: null,
    photos: [],
  };
}

// Sections hold entries newest first, as selectFeedSections returns them.
function section(dayKey: string, entries: Entry[]): DaySection {
  return { dayKey, entries };
}

describe("buildLineItems", () => {
  it("emits a day item, then one entry item per entry", () => {
    const items = buildLineItems([
      section("2026-03-05", [entry("b", 12, 30), entry("a", 12, 0)]),
    ]);
    expect(items.map((i) => i.type)).toEqual(["day", "entry", "entry"]);
    expect(items[0]).toMatchObject({ type: "day", dayKey: "2026-03-05" });
  });

  it("joins entries within the break threshold with one spine", () => {
    const items = buildLineItems([
      section("2026-03-05", [
        entry("c", 13, 0),
        entry("b", 12, 0),
        entry("a", 11, 30),
      ]),
    ]).filter((i): i is LineEntryItem => i.type === "entry");

    expect(items.map((i) => [i.joinsNewer, i.joinsOlder])).toEqual([
      [false, true],
      [true, true],
      [true, false],
    ]);
  });

  it("breaks the spine and labels the gap when entries are over an hour apart", () => {
    const items = buildLineItems([
      section("2026-03-05", [entry("b", 20, 1), entry("a", 18, 8)]),
    ]);

    expect(items.map((i) => i.type)).toEqual(["day", "entry", "gap", "entry"]);
    expect(items[2]).toMatchObject({ type: "gap", label: "1 h 53 m earlier" });
    expect(items[1]).toMatchObject({ joinsNewer: false, joinsOlder: false });
    expect(items[3]).toMatchObject({ joinsNewer: false, joinsOlder: false });
  });

  it("never joins or labels across days", () => {
    const items = buildLineItems([
      section("2026-03-05", [entry("b", 0, 10, 5)]),
      section("2026-03-04", [entry("a", 23, 50, 4)]),
    ]);

    expect(items.map((i) => i.type)).toEqual(["day", "entry", "day", "entry"]);
    expect(items[1]).toMatchObject({ joinsNewer: false, joinsOlder: false });
  });

  it("gives every item a unique key", () => {
    const items = buildLineItems([
      section("2026-03-05", [entry("b", 20, 0), entry("a", 8, 0)]),
    ]);
    const keys = items.map(lineItemKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("item lookups", () => {
  const items = buildLineItems([
    section("2026-03-05", [entry("c", 20, 0), entry("b", 8, 0)]),
    section("2026-03-04", [entry("a", 12, 0, 4)]),
  ]);
  // [0]=day 03-05, [1]=c, [2]=gap, [3]=b, [4]=day 03-04, [5]=a

  it("finds a day's seam item", () => {
    expect(firstItemIndexForDay(items, "2026-03-04")).toBe(4);
    expect(firstItemIndexForDay(items, "2026-03-01")).toBe(-1);
  });

  it("finds an entry's row", () => {
    expect(itemIndexForEntry(items, "b")).toBe(3);
    expect(itemIndexForEntry(items, "missing")).toBe(-1);
  });

  it("returns the day governing the topmost viewable index", () => {
    expect(currentDayFromViewableItems(items, [3, 4])).toBe("2026-03-05");
    expect(currentDayFromViewableItems(items, [4, 5])).toBe("2026-03-04");
  });

  it("returns null when nothing is viewable", () => {
    expect(currentDayFromViewableItems(items, [])).toBeNull();
    expect(currentDayFromViewableItems([], [0])).toBeNull();
  });
});
