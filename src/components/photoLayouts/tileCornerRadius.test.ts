import { tileCornerRadius } from "./tileCornerRadius";

describe("tileCornerRadius", () => {
  const UNIT = 1000;
  const OUTER = 16;
  const INNER = 12;

  it("rounds only the top-left corner for a tile at the top-left of the collage", () => {
    const result = tileCornerRadius(
      { x: 0, y: 0, width: 400, height: 400 },
      UNIT,
      UNIT,
      OUTER,
      INNER,
    );
    expect(result).toEqual({
      borderTopLeftRadius: OUTER,
      borderTopRightRadius: INNER,
      borderBottomLeftRadius: INNER,
      borderBottomRightRadius: INNER,
    });
  });

  it("rounds only the bottom-right corner for a tile at the bottom-right of the collage", () => {
    const result = tileCornerRadius(
      { x: 600, y: 600, width: 400, height: 400 },
      UNIT,
      UNIT,
      OUTER,
      INNER,
    );
    expect(result).toEqual({
      borderTopLeftRadius: INNER,
      borderTopRightRadius: INNER,
      borderBottomLeftRadius: INNER,
      borderBottomRightRadius: OUTER,
    });
  });

  it("rounds both top corners for a full-width tile spanning the top edge", () => {
    const result = tileCornerRadius(
      { x: 0, y: 0, width: UNIT, height: 400 },
      UNIT,
      UNIT,
      OUTER,
      INNER,
    );
    expect(result).toEqual({
      borderTopLeftRadius: OUTER,
      borderTopRightRadius: OUTER,
      borderBottomLeftRadius: INNER,
      borderBottomRightRadius: INNER,
    });
  });

  it("rounds no corners for an interior tile touching no edge", () => {
    const result = tileCornerRadius(
      { x: 300, y: 300, width: 200, height: 200 },
      UNIT,
      UNIT,
      OUTER,
      INNER,
    );
    expect(result).toEqual({
      borderTopLeftRadius: INNER,
      borderTopRightRadius: INNER,
      borderBottomLeftRadius: INNER,
      borderBottomRightRadius: INNER,
    });
  });

  it("rounds all four corners for a tile that fills the whole collage (single photo)", () => {
    const result = tileCornerRadius(
      { x: 0, y: 0, width: UNIT, height: UNIT },
      UNIT,
      UNIT,
      OUTER,
      INNER,
    );
    expect(result).toEqual({
      borderTopLeftRadius: OUTER,
      borderTopRightRadius: OUTER,
      borderBottomLeftRadius: OUTER,
      borderBottomRightRadius: OUTER,
    });
  });

  it("treats a shorter masonry column that falls short of unitHeight as not touching the bottom", () => {
    // e.g. masonryLayout's unitHeight is the taller column's height; a
    // shorter column's last tile ends above that, so it shouldn't round.
    const result = tileCornerRadius(
      { x: 0, y: 500, width: 400, height: 400 },
      UNIT,
      1000,
      OUTER,
      INNER,
    );
    expect(result.borderBottomLeftRadius).toBe(INNER);
    expect(result.borderBottomRightRadius).toBe(INNER);
  });
});
