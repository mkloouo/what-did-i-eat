import { theme } from "./theme";
import { contrastRatio } from "../utils/contrast";

const { colors, typography, fonts } = theme;

// Text pairs the app draws. Small text needs 4.5:1 (WCAG AA). `pine` is
// deliberately excluded — it's decorative only (gradients, ticks, markers),
// never text or a fill with text on it. See theme.ts.
const TEXT_PAIRS: Array<[string, string, string]> = [
  ["ink on daylight", colors.ink, colors.daylight],
  ["ink on surface", colors.ink, colors.surface],
  ["graphite on daylight", colors.graphite, colors.daylight],
  ["graphite on surface", colors.graphite, colors.surface],
  ["accent on daylight", colors.accent, colors.daylight],
  ["clay on daylight", colors.clay, colors.daylight],
  ["clay on surface", colors.clay, colors.surface],
  ["chipText on chip", colors.chipText, colors.chip],
  ["daylight on ink", colors.daylight, colors.ink],
  ["clayOnDark on ink", colors.clayOnDark, colors.ink],
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
