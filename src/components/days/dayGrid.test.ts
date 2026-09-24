import { buildDayGrid, cellPhotos } from "./dayGrid";
import { DaySection, EntryGroup } from "../../store/selectors/groupSelectors";

function iso(hour: number, minute: number): string {
  return new Date(2026, 2, 5, hour, minute, 0).toISOString();
}

function group(
  id: string,
  timeFrom: string,
  timeTo: string,
  photosByEntry: string[][],
): EntryGroup {
  const entries = photosByEntry.map((photos, i) => ({
    id: `${id}-e${i}`,
    createdAt: timeFrom,
    comment: "",
    location: null,
    photos: photos.map((uri, j) => ({ id: `${id}-e${i}-p${j}`, uri })),
  }));
  return { id, dayKey: "2026-03-05", entries, timeFrom, timeTo, photosByEntry };
}

function section(groups: EntryGroup[]): DaySection {
  return { dayKey: "2026-03-05", groups };
}

describe("buildDayGrid", () => {
  it("returns five empty cells for a day with no groups", () => {
    const cells = buildDayGrid(section([]));
    expect(cells).toHaveLength(5);
    expect(cells.map((c) => c.slotIndex)).toEqual([0, 1, 2, 3, 4]);
    for (const cell of cells) {
      expect(cell.meals).toEqual([]);
      expect(cell.photoCount).toBe(0);
      expect(cell.hasSpillover).toBe(false);
    }
  });

  it("places a meal by its start time, into that slot only", () => {
    const g = group("g1", iso(12, 0), iso(12, 10), [["a.jpg"]]);
    const cells = buildDayGrid(section([g]));
    expect(cells[2].meals).toEqual([g]); // Afternoon
    expect(cells[2].photoCount).toBe(1);
    expect(cells[0].meals).toEqual([]);
  });

  it("sums photo counts and tiles all photos oldest-first when two meals share a slot", () => {
    const older = group("older", iso(22, 0), iso(22, 5), [["a.jpg", "b.jpg"]]);
    const newer = group("newer", iso(23, 0), iso(23, 5), [["c.jpg"]]);
    // section.groups arrives newest-first from selectFeedSections
    const cells = buildDayGrid(section([newer, older]));
    expect(cells[4].meals).toEqual([older, newer]);
    expect(cells[4].photoCount).toBe(3);
    expect(cellPhotos(cells[4])).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("flags spillover when a meal's end time crosses its own slot's upper boundary", () => {
    const spills = group("s", iso(7, 0), iso(9, 0), [["a.jpg"]]); // Morning -> Midday
    const cells = buildDayGrid(section([spills]));
    expect(cells[0].hasSpillover).toBe(true);
  });

  it("does not flag spillover when a meal ends within its own slot", () => {
    const tidy = group("t", iso(7, 0), iso(7, 30), [["a.jpg"]]);
    const cells = buildDayGrid(section([tidy]));
    expect(cells[0].hasSpillover).toBe(false);
  });

  it("never flags spillover for the wrapping Late slot", () => {
    const late = group("l", iso(23, 0), iso(23, 59), [["a.jpg"]]);
    const cells = buildDayGrid(section([late]));
    expect(cells[4].hasSpillover).toBe(false);
  });
});

describe("cellPhotos", () => {
  it("flattens a single meal's photos oldest-entry-first", () => {
    // entries/photosByEntry are newest-first, per EntryGroup's convention
    const g: EntryGroup = {
      id: "g1",
      dayKey: "2026-03-05",
      timeFrom: iso(8, 0),
      timeTo: iso(8, 10),
      entries: [
        { id: "e2", createdAt: iso(8, 5), comment: "", location: null, photos: [{ id: "p3", uri: "c.jpg" }] },
        { id: "e1", createdAt: iso(8, 0), comment: "", location: null, photos: [{ id: "p1", uri: "a.jpg" }, { id: "p2", uri: "b.jpg" }] },
      ],
      photosByEntry: [["c.jpg"], ["a.jpg", "b.jpg"]],
    };
    const cells = buildDayGrid(section([g]));
    expect(cellPhotos(cells[0])).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });
});
