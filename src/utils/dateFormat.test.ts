import {
  dayKeyOf,
  dayLabel,
  formatTime,
  formatFullDateTime,
  formatDuration,
  minuteOfDay,
  dayFraction,
} from "./dateFormat";

describe("dayKeyOf", () => {
  it("returns a YYYY-MM-DD key in local time", () => {
    expect(dayKeyOf("2026-03-05T14:30:00.000Z")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("groups two timestamps on the same local day under the same key", () => {
    const morning = new Date(2026, 2, 5, 8, 0, 0).toISOString();
    const evening = new Date(2026, 2, 5, 21, 0, 0).toISOString();
    expect(dayKeyOf(morning)).toBe(dayKeyOf(evening));
  });

  it("gives different keys for different local days", () => {
    const day1 = new Date(2026, 2, 5, 23, 59, 0).toISOString();
    const day2 = new Date(2026, 2, 6, 0, 1, 0).toISOString();
    expect(dayKeyOf(day1)).not.toBe(dayKeyOf(day2));
  });
});

describe("dayLabel", () => {
  const now = new Date(2026, 2, 5, 12, 0, 0);

  it('labels today as "Today"', () => {
    expect(dayLabel(dayKeyOf(now.toISOString()), now)).toBe("Today");
  });

  it('labels yesterday as "Yesterday"', () => {
    const yesterday = new Date(2026, 2, 4, 9, 0, 0);
    expect(dayLabel(dayKeyOf(yesterday.toISOString()), now)).toBe("Yesterday");
  });

  it("labels older days with a formatted date", () => {
    const older = new Date(2026, 1, 20, 9, 0, 0);
    const label = dayLabel(dayKeyOf(older.toISOString()), now);
    expect(label).not.toBe("Today");
    expect(label).not.toBe("Yesterday");
    expect(label.length).toBeGreaterThan(0);
  });
});

describe("formatTime / formatFullDateTime", () => {
  it("formatTime returns a non-empty string", () => {
    expect(formatTime("2026-03-05T14:30:00.000Z").length).toBeGreaterThan(0);
  });

  it("formatFullDateTime returns a non-empty string", () => {
    expect(
      formatFullDateTime("2026-03-05T14:30:00.000Z").length,
    ).toBeGreaterThan(0);
  });
});

describe("formatDuration", () => {
  it("renders a sub-hour duration as minutes only", () => {
    expect(formatDuration(30)).toBe("30 m");
    expect(formatDuration(45)).toBe("45 m");
  });

  it("renders an exact hour without a minutes part", () => {
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(240)).toBe("4 h");
  });

  it("renders an hour-plus-minutes duration as both parts", () => {
    expect(formatDuration(90)).toBe("1 h 30 m");
    expect(formatDuration(135)).toBe("2 h 15 m");
  });
});

describe("minuteOfDay / dayFraction", () => {
  it("gives 0 at local midnight", () => {
    const midnight = new Date(2026, 2, 5, 0, 0, 0).toISOString();
    expect(minuteOfDay(midnight)).toBe(0);
    expect(dayFraction(midnight)).toBe(0);
  });

  it("gives 720 minutes / 0.5 at local noon", () => {
    const noon = new Date(2026, 2, 5, 12, 0, 0).toISOString();
    expect(minuteOfDay(noon)).toBe(720);
    expect(dayFraction(noon)).toBe(0.5);
  });

  it("gives 1439 minutes / just under 1 at 23:59", () => {
    const lastMinute = new Date(2026, 2, 5, 23, 59, 0).toISOString();
    expect(minuteOfDay(lastMinute)).toBe(1439);
    expect(dayFraction(lastMinute)).toBeCloseTo(1439 / 1440);
  });
});
