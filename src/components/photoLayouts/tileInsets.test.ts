import { tileInsets } from "./tileInsets";

describe("tileInsets", () => {
  const seam = 2;

  it("leaves a lone tile flush on every side", () => {
    expect(tileInsets({ x: 0, y: 0, width: 4, height: 3 }, 4, 3, seam)).toEqual(
      { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
    );
  });

  it("insets only the shared edge between two side-by-side tiles", () => {
    const left = tileInsets({ x: 0, y: 0, width: 2, height: 3 }, 4, 3, seam);
    const right = tileInsets({ x: 2, y: 0, width: 2, height: 3 }, 4, 3, seam);
    expect(left).toEqual({
      paddingTop: 0,
      paddingRight: 1,
      paddingBottom: 0,
      paddingLeft: 0,
    });
    expect(right).toEqual({
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 1,
    });
  });

  it("makes the gap between neighbours equal the seam", () => {
    const left = tileInsets({ x: 0, y: 0, width: 2, height: 3 }, 4, 3, seam);
    const right = tileInsets({ x: 2, y: 0, width: 2, height: 3 }, 4, 3, seam);
    expect(left.paddingRight + right.paddingLeft).toBe(seam);
  });

  it("insets top and bottom for a tile in the middle of a column", () => {
    expect(tileInsets({ x: 0, y: 1, width: 4, height: 1 }, 4, 3, seam)).toEqual(
      { paddingTop: 1, paddingRight: 0, paddingBottom: 1, paddingLeft: 0 },
    );
  });

  it("gives zero insets when the seam is zero", () => {
    expect(tileInsets({ x: 1, y: 1, width: 1, height: 1 }, 4, 3, 0)).toEqual({
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    });
  });
});
