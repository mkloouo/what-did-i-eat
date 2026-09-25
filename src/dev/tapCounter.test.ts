import { createTapCounter } from "./tapCounter";

describe("createTapCounter", () => {
  it("fires on the required number of quick taps", () => {
    const tap = createTapCounter(3, 1000);
    expect(tap(0)).toBe(false);
    expect(tap(500)).toBe(false);
    expect(tap(900)).toBe(true);
  });

  it("starts over when a gap is longer than allowed", () => {
    const tap = createTapCounter(3, 1000);
    tap(0);
    tap(500);
    expect(tap(2000)).toBe(false);
    expect(tap(2500)).toBe(false);
    expect(tap(3000)).toBe(true);
  });

  it("starts over after firing", () => {
    const tap = createTapCounter(2, 1000);
    tap(0);
    expect(tap(100)).toBe(true);
    expect(tap(200)).toBe(false);
    expect(tap(300)).toBe(true);
  });
});
