import { squarifiedLayout } from "./squarifiedLayout";

function area(rect: { width: number; height: number }) {
  return rect.width * rect.height;
}

describe("squarifiedLayout", () => {
  it("gives a single photo the whole square", () => {
    const result = squarifiedLayout([["a"]]);

    expect(result.unitWidth).toBe(1000);
    expect(result.unitHeight).toBe(1000);
    expect(result.rects).toEqual([{ x: 0, y: 0, width: 1000, height: 1000 }]);
  });

  it("splits two equal-weight entry-first photos into two equal-area bands", () => {
    const result = squarifiedLayout([["a"], ["b"]]);

    expect(result.rects).toHaveLength(2);
    expect(area(result.rects[0])).toBeCloseTo(area(result.rects[1]), 5);
    expect(area(result.rects[0]) + area(result.rects[1])).toBeCloseTo(
      1000 * 1000,
      5,
    );
  });

  it("always tiles the full square exactly, for any entry/photo shape", () => {
    const cases: string[][][] = [
      [["a", "b"], ["c", "d", "e", "f"], ["g"]],
      [["a"], ["b"], ["c"]],
      [["a", "b", "c", "d"], ["e"], ["f", "g", "h"]],
    ];

    for (const photosByEntry of cases) {
      const result = squarifiedLayout(photosByEntry);
      const totalPhotos = photosByEntry.flat().length;

      expect(result.rects).toHaveLength(totalPhotos);
      const totalArea = result.rects.reduce((sum, r) => sum + area(r), 0);
      expect(totalArea).toBeCloseTo(1000 * 1000, 3);

      for (const rect of result.rects) {
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(1000 + 1e-6);
        expect(rect.y + rect.height).toBeLessThanOrEqual(1000 + 1e-6);
      }
    }
  });

  it("gives an entry's first photo 3x the area of its other photos", () => {
    const result = squarifiedLayout([["a", "b"]]);

    expect(area(result.rects[0])).toBeCloseTo(area(result.rects[1]) * 3, 5);
  });

  it("produces no rects for an empty group", () => {
    expect(squarifiedLayout([])).toEqual({
      rects: [],
      unitWidth: 1000,
      unitHeight: 1000,
    });
  });
});
