import { buildDayGrid, cellPhotos, cellTargetEntryId } from "./dayGrid";
import { DaySection } from "../../store/selectors/feedSelectors";
import { Entry } from "../../types/models";

function entry(id: string, hour: number, minute: number, uris: string[]): Entry {
  return {
    id,
    createdAt: new Date(2026, 2, 5, hour, minute, 0).toISOString(),
    comment: "",
    location: null,
    photos: uris.map((uri, i) => ({ id: `${id}-p${i}`, uri })),
  };
}

// selectFeedSections hands entries over newest first.
function section(entries: Entry[]): DaySection {
  return { dayKey: "2026-03-05", entries };
}

describe("buildDayGrid", () => {
  it("returns five empty cells for a day with no entries", () => {
    const cells = buildDayGrid(section([]));
    expect(cells.map((c) => c.slotIndex)).toEqual([0, 1, 2, 3, 4]);
    for (const cell of cells) {
      expect(cell.entries).toEqual([]);
      expect(cell.photoCount).toBe(0);
    }
  });

  it("places every entry by its own time, even when entries are close together", () => {
    // 16:20 and 16:40 are twenty minutes apart but straddle the
    // Afternoon/Evening boundary (16:30) — each lands in its own slot.
    const afternoon = entry("a", 16, 20, ["a.jpg"]);
    const evening = entry("b", 16, 40, ["b.jpg"]);
    const cells = buildDayGrid(section([evening, afternoon]));

    expect(cells[2].entries).toEqual([afternoon]);
    expect(cells[3].entries).toEqual([evening]);
  });

  it("keeps a slot's entries and photos oldest first and sums its photos", () => {
    const older = entry("older", 22, 0, ["a.jpg", "b.jpg"]);
    const newer = entry("newer", 23, 0, ["c.jpg"]);
    const cells = buildDayGrid(section([newer, older]));

    expect(cells[4].entries).toEqual([older, newer]);
    expect(cells[4].photoCount).toBe(3);
    expect(cellPhotos(cells[4])).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });
});

describe("cellTargetEntryId", () => {
  it("points at the slot's newest entry", () => {
    const cells = buildDayGrid(
      section([entry("newer", 8, 0, []), entry("older", 7, 0, [])]),
    );
    expect(cellTargetEntryId(cells[0])).toBe("newer");
  });

  it("is null for an empty slot", () => {
    expect(cellTargetEntryId(buildDayGrid(section([]))[1])).toBeNull();
  });
});
