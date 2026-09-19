import { theme } from "./theme";
import { contrastRatio } from "../utils/contrast";

const { colors, typography, fonts } = theme;

// Text pairs the app draws. Small text needs 4.5:1 (WCAG AA).
const TEXT_PAIRS: Array<[string, string, string]> = [
  ["bone on wall", colors.bone, colors.wall],
  ["bone on seam", colors.bone, colors.seam],
  ["chalk on wall", colors.chalk, colors.wall],
  ["chalk on seam", colors.chalk, colors.seam],
  ["brass on wall", colors.brass, colors.wall],
  ["clay on wall", colors.clay, colors.wall],
  ["clay on seam", colors.clay, colors.seam],
  ["wall on brass", colors.wall, colors.brass],
  ["wall on bone", colors.wall, colors.bone],
  ["wall on clay", colors.wall, colors.clay],
];

describe("theme contrast", () => {
  it.each(TEXT_PAIRS)("%s meets 4.5:1", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("theme typography", () => {
  it("names a per-weight family and never sets fontWeight", () => {
    const families = Object.values(fonts) as string[];
    for (const style of Object.values(typography)) {
      expect(families).toContain(style.fontFamily);
      expect(style).not.toHaveProperty("fontWeight");
    }
  });
});

describe("legacy colour names", () => {
  it("map onto the Wall tokens", () => {
    expect(colors.background).toBe(colors.wall);
    expect(colors.surface).toBe(colors.seam);
    expect(colors.primary).toBe(colors.brass);
    expect(colors.text).toBe(colors.bone);
    expect(colors.textOnDark).toBe(colors.bone);
    expect(colors.muted).toBe(colors.chalk);
    expect(colors.danger).toBe(colors.clay);
    expect(colors.accentDark).toBe(colors.wall);
    expect(colors.secondary).toBe(colors.hairline);
  });
});
