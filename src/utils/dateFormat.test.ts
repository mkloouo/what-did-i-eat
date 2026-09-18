import {
  dayKeyOf,
  dayLabel,
  formatTime,
  formatFullDateTime,
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
