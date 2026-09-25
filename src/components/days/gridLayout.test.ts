import { computeCellSize, LABEL_WIDTH, GUTTER } from "./gridLayout";

describe("computeCellSize", () => {
  it("returns the spec's ~52dp baseline for the width it was designed around", () => {
    // 2*16 padding + 64 label + 8 gap + 5*52 cells + 4*8 gaps = 396
    expect(computeCellSize(396, 16)).toBe(52);
  });

  it("shrinks cells to fit a narrower phone instead of overflowing the screen", () => {
    const size = computeCellSize(360, 16);
    expect(size).toBeLessThan(52);
    const rowWidth = 2 * 16 + LABEL_WIDTH + GUTTER + 5 * size + 4 * GUTTER;
    expect(rowWidth).toBeLessThanOrEqual(360);
  });

  it("grows cells to fill a wide screen like an iPad", () => {
    // iPad Pro 13" portrait is 1032pt wide.
    const size = computeCellSize(1032, 16);
    const rowWidth = 2 * 16 + LABEL_WIDTH + GUTTER + 5 * size + 4 * GUTTER;
    expect(size).toBeGreaterThan(52);
    expect(rowWidth).toBeLessThanOrEqual(1032);
    expect(1032 - rowWidth).toBeLessThan(5);
  });

  it("never shrinks below a minimum tappable size", () => {
    expect(computeCellSize(200, 16)).toBeGreaterThanOrEqual(36);
  });
});
