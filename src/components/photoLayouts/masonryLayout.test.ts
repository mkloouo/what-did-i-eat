import {
  masonryLayout,
  COLUMN_WIDTH,
  SUB_TILE_SIZE,
  GAP,
} from "./masonryLayout";

describe("masonryLayout", () => {
  it("gives a single entry with one photo one big square tile", () => {
    const result = masonryLayout([["a"]]);

    expect(result.rects).toEqual([
      { x: 0, y: 0, width: COLUMN_WIDTH, height: COLUMN_WIDTH },
    ]);
    expect(result.unitHeight).toBe(COLUMN_WIDTH);
  });

  it("places each single-photo entry as a big tile in the shorter column", () => {
    const result = masonryLayout([["a"], ["b"]]);

    expect(result.rects).toHaveLength(2);
    expect(result.rects[0]).toEqual({
      x: 0,
      y: 0,
      width: COLUMN_WIDTH,
      height: COLUMN_WIDTH,
    });
    expect(result.rects[1]).toEqual({
      x: COLUMN_WIDTH + GAP,
      y: 0,
      width: COLUMN_WIDTH,
      height: COLUMN_WIDTH,
    });
    expect(result.unitHeight).toBe(COLUMN_WIDTH);
  });

  it("shrinks an entry's extra photos into a sub-grid beneath its big tile, uncapped", () => {
    const result = masonryLayout([["a", "b", "c", "d"]]);

    expect(result.rects).toHaveLength(4);
    expect(result.rects[0]).toEqual({
      x: 0,
      y: 0,
      width: COLUMN_WIDTH,
      height: COLUMN_WIDTH,
    });
    const rowY = COLUMN_WIDTH + GAP;
    expect(result.rects[1]).toEqual({
      x: 0,
      y: rowY,
      width: SUB_TILE_SIZE,
      height: SUB_TILE_SIZE,
    });
    expect(result.rects[2]).toEqual({
      x: SUB_TILE_SIZE + GAP,
      y: rowY,
      width: SUB_TILE_SIZE,
      height: SUB_TILE_SIZE,
    });
    const secondRowY = rowY + SUB_TILE_SIZE + GAP;
    expect(result.rects[3]).toEqual({
      x: 0,
      y: secondRowY,
      width: SUB_TILE_SIZE,
      height: SUB_TILE_SIZE,
    });
    expect(result.unitHeight).toBe(secondRowY + SUB_TILE_SIZE);
  });

  it("sends the next entry to whichever column is currently shorter", () => {
    // entry A (3 photos) makes column 0 taller than column 1 before entry B is placed
    const result = masonryLayout([["a", "b", "c"], ["d"]]);

    expect(result.rects[3]).toEqual({
      x: COLUMN_WIDTH + GAP,
      y: 0,
      width: COLUMN_WIDTH,
      height: COLUMN_WIDTH,
    });
  });

  it("produces no rects for an empty group", () => {
    expect(masonryLayout([])).toEqual({
      rects: [],
      unitWidth: 1000,
      unitHeight: 0,
    });
  });
});
