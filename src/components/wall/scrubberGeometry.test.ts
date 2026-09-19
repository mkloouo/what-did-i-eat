import { buildScrubberTicks, nearestDayForY } from "./scrubberGeometry";

describe("buildScrubberTicks", () => {
  it("returns no ticks for no days", () => {
    expect(buildScrubberTicks([], 300)).toEqual([]);
  });

  it("puts a single day's tick at the top", () => {
    expect(buildScrubberTicks(["2026-03-05"], 300)).toEqual([
      { dayKey: "2026-03-05", y: 0 },
    ]);
  });

  it("spaces ticks evenly from top to bottom", () => {
    const ticks = buildScrubberTicks(["a", "b", "c"], 300);
    expect(ticks).toEqual([
      { dayKey: "a", y: 0 },
      { dayKey: "b", y: 150 },
      { dayKey: "c", y: 300 },
    ]);
  });
});

describe("nearestDayForY", () => {
  const ticks = [
    { dayKey: "a", y: 0 },
    { dayKey: "b", y: 150 },
    { dayKey: "c", y: 300 },
  ];

  it("returns null for no ticks", () => {
    expect(nearestDayForY([], 100)).toBeNull();
  });

  it("picks the exact tick when y lands on it", () => {
    expect(nearestDayForY(ticks, 150)).toBe("b");
  });

  it("picks the nearer neighbour between two ticks", () => {
    expect(nearestDayForY(ticks, 190)).toBe("b");
    expect(nearestDayForY(ticks, 260)).toBe("c");
  });

  it("clamps to the first tick above the top", () => {
    expect(nearestDayForY(ticks, -50)).toBe("a");
  });

  it("clamps to the last tick below the bottom", () => {
    expect(nearestDayForY(ticks, 400)).toBe("c");
  });
});
