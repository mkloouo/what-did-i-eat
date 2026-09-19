import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#1C2320", "#1C2320")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#EDE8DC", "#1C2320")).toBeCloseTo(
      contrastRatio("#1C2320", "#EDE8DC"),
      10,
    );
  });

  it("accepts lowercase and 3-digit hex", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
  });

  it("rejects malformed input", () => {
    expect(() => contrastRatio("red", "#000")).toThrow("Invalid hex colour");
  });
});
