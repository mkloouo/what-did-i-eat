import { dayWashGradient } from "./dayWash";

describe("dayWashGradient", () => {
  it("has the same number of colors as locations, at least two of each", () => {
    const wash = dayWashGradient();
    expect(wash.colors.length).toBe(wash.locations.length);
    expect(wash.colors.length).toBeGreaterThanOrEqual(2);
  });

  it("starts at location 0 and ends at location 1", () => {
    const { locations } = dayWashGradient();
    expect(locations[0]).toBe(0);
    expect(locations[locations.length - 1]).toBe(1);
  });

  it("locations are strictly ascending", () => {
    const { locations } = dayWashGradient();
    for (let i = 1; i < locations.length; i++) {
      expect(locations[i]).toBeGreaterThan(locations[i - 1]);
    }
  });

  it("starts and ends on the same night color, so bands read as one continuous cycle", () => {
    const { colors } = dayWashGradient();
    expect(colors[0]).toBe(colors[colors.length - 1]);
  });
});
