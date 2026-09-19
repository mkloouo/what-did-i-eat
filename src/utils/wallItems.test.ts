import {
  buildWallItems,
  firstItemIndexForDay,
  currentDayFromViewableItems,
} from "./wallItems";
import { DaySection, EntryGroup } from "../store/selectors/groupSelectors";

function group(id: string, dayKey: string): EntryGroup {
  return { id, dayKey, entries: [], timeFrom: "", timeTo: "", photosByEntry: [] };
}

describe("buildWallItems", () => {
  it("returns one day item followed by one piece item per group", () => {
    const sections: DaySection[] = [
      {
        dayKey: "2026-03-05",
        groups: [group("g1", "2026-03-05"), group("g2", "2026-03-05")],
      },
    ];

    const items = buildWallItems(sections);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ type: "day", dayKey: "2026-03-05" });
    expect(items[1]).toMatchObject({ type: "piece", group: sections[0].groups[0] });
    expect(items[2]).toMatchObject({ type: "piece", group: sections[0].groups[1] });
  });

  it("emits a day item even for a day with no groups", () => {
    const sections: DaySection[] = [{ dayKey: "2026-03-05", groups: [] }];
    expect(buildWallItems(sections)).toEqual([
      { type: "day", dayKey: "2026-03-05", label: expect.any(String) },
    ]);
  });

  it("keeps sections in the order given, one day item per section", () => {
    const sections: DaySection[] = [
      { dayKey: "2026-03-05", groups: [group("g1", "2026-03-05")] },
      { dayKey: "2026-03-04", groups: [group("g2", "2026-03-04")] },
    ];

    const items = buildWallItems(sections);

    expect(items.map((i) => i.type)).toEqual(["day", "piece", "day", "piece"]);
    expect((items[0] as { dayKey: string }).dayKey).toBe("2026-03-05");
    expect((items[2] as { dayKey: string }).dayKey).toBe("2026-03-04");
  });
});

describe("firstItemIndexForDay", () => {
  const sections: DaySection[] = [
    { dayKey: "2026-03-05", groups: [group("g1", "2026-03-05")] },
    {
      dayKey: "2026-03-04",
      groups: [group("g2", "2026-03-04"), group("g3", "2026-03-04")],
    },
  ];
  const items = buildWallItems(sections);

  it("finds the index of a day's seam item", () => {
    expect(firstItemIndexForDay(items, "2026-03-04")).toBe(2);
  });

  it("returns -1 for a day that isn't in the list", () => {
    expect(firstItemIndexForDay(items, "2026-03-01")).toBe(-1);
  });
});

describe("currentDayFromViewableItems", () => {
  const sections: DaySection[] = [
    {
      dayKey: "2026-03-05",
      groups: [group("g1", "2026-03-05"), group("g1b", "2026-03-05")],
    },
    { dayKey: "2026-03-04", groups: [group("g2", "2026-03-04")] },
  ];
  const items = buildWallItems(sections);
  // items: [0]=day 03-05, [1]=piece g1, [2]=piece g1b, [3]=day 03-04, [4]=piece g2

  it("returns the day governing the topmost viewable index", () => {
    expect(currentDayFromViewableItems(items, [2, 3])).toBe("2026-03-05");
  });

  it("returns the day item itself when it's what's viewable", () => {
    expect(currentDayFromViewableItems(items, [3, 4])).toBe("2026-03-04");
  });

  it("returns null when nothing is viewable", () => {
    expect(currentDayFromViewableItems(items, [])).toBeNull();
  });

  it("returns null when the viewable range starts before any day item", () => {
    expect(currentDayFromViewableItems([], [0])).toBeNull();
  });
});
