import { squareGridLayout } from "./squareGridLayout";

describe("squareGridLayout", () => {
  it("places a single photo as one full-width tile", () => {
    const result = squareGridLayout([["a"]], 3);

    expect(result.rects).toEqual([{ x: 0, y: 0, width: 1, height: 1 }]);
    expect(result.unitWidth).toBe(3);
    expect(result.unitHeight).toBe(1);
  });

  it("fills a row left to right before wrapping to the next", () => {
    const result = squareGridLayout([["a", "b", "c", "d"]], 3);

    expect(result.rects).toEqual([
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 1 },
      { x: 2, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 1, height: 1 },
    ]);
    expect(result.unitHeight).toBe(2);
  });

  it("flattens photos across entries in order, ignoring entry boundaries", () => {
    const result = squareGridLayout([["a"], ["b"], ["c"]], 2);

    expect(result.rects).toEqual([
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 1, height: 1 },
    ]);
    expect(result.unitWidth).toBe(2);
    expect(result.unitHeight).toBe(2);
  });

  it("skips entries with no photos", () => {
    const result = squareGridLayout([["a"], [], ["b"]], 4);

    expect(result.rects).toEqual([
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 1 },
    ]);
    expect(result.unitHeight).toBe(1);
  });

  it("reports an exact final row with no wasted height", () => {
    const result = squareGridLayout([["a", "b"]], 2);

    expect(result.unitHeight).toBe(1);
  });

  it("produces no rects for an empty group", () => {
    expect(squareGridLayout([], 4)).toEqual({
      rects: [],
      unitWidth: 4,
      unitHeight: 0,
    });
  });
});
