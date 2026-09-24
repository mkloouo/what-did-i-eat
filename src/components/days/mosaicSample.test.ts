import { densityColumns, sampleSpread } from "./mosaicSample";

describe("densityColumns", () => {
  it("returns 0 for an empty cell", () => {
    expect(densityColumns(0)).toBe(0);
  });

  it("returns 1 for a single photo", () => {
    expect(densityColumns(1)).toBe(1);
  });

  it("returns 2 for the 2-4 range, including both ends", () => {
    expect(densityColumns(2)).toBe(2);
    expect(densityColumns(4)).toBe(2);
  });

  it("returns 3 for the 5-9 range, including both ends", () => {
    expect(densityColumns(5)).toBe(3);
    expect(densityColumns(9)).toBe(3);
  });

  it("returns 4 for 10 and for anything above it", () => {
    expect(densityColumns(10)).toBe(4);
    expect(densityColumns(40)).toBe(4);
  });
});

describe("sampleSpread", () => {
  it("returns the input unchanged when it already fits", () => {
    expect(sampleSpread(["a", "b", "c"], 16)).toEqual(["a", "b", "c"]);
  });

  it("keeps the first and last item when sampling down", () => {
    const items = Array.from({ length: 20 }, (_, i) => String(i));
    const sampled = sampleSpread(items, 16);
    expect(sampled).toHaveLength(16);
    expect(sampled[0]).toBe("0");
    expect(sampled[sampled.length - 1]).toBe("19");
  });

  it("preserves the original order and never repeats an item", () => {
    const items = Array.from({ length: 20 }, (_, i) => String(i));
    const sampled = sampleSpread(items, 16);
    const asNumbers = sampled.map(Number);
    for (let i = 1; i < asNumbers.length; i++) {
      expect(asNumbers[i]).toBeGreaterThan(asNumbers[i - 1]);
    }
  });
});
