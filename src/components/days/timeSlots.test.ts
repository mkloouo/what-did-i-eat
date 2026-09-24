import { slotIndexForHour, slotUpperBoundHour, SLOT_LABELS } from "./timeSlots";

describe("slotIndexForHour", () => {
  it("names five slots in the spec's order", () => {
    expect(SLOT_LABELS).toEqual([
      "Morning",
      "Midday",
      "Afternoon",
      "Evening",
      "Late",
    ]);
  });

  it("places a hour at the start of Morning in Morning", () => {
    expect(slotIndexForHour(5)).toBe(0);
  });

  it("places a hour just before Morning's end in Morning", () => {
    expect(slotIndexForHour(8.49)).toBe(0);
  });

  it("places a hour exactly at Morning's end in Midday", () => {
    expect(slotIndexForHour(8.5)).toBe(1);
  });

  it("places a hour just before Midday's end in Midday", () => {
    expect(slotIndexForHour(11.49)).toBe(1);
  });

  it("places a hour exactly at Midday's end in Afternoon", () => {
    expect(slotIndexForHour(11.5)).toBe(2);
  });

  it("places a hour just before Afternoon's end in Afternoon", () => {
    expect(slotIndexForHour(16.49)).toBe(2);
  });

  it("places a hour exactly at Afternoon's end in Evening", () => {
    expect(slotIndexForHour(16.5)).toBe(3);
  });

  it("places a hour just before Evening's end in Evening", () => {
    expect(slotIndexForHour(21.49)).toBe(3);
  });

  it("places a hour exactly at Evening's end in Late", () => {
    expect(slotIndexForHour(21.5)).toBe(4);
  });

  it("places late-night hours in Late", () => {
    expect(slotIndexForHour(23.99)).toBe(4);
  });

  it("places early-morning hours before Morning in Late (wraps past midnight)", () => {
    expect(slotIndexForHour(0)).toBe(4);
    expect(slotIndexForHour(4.99)).toBe(4);
  });
});

describe("slotUpperBoundHour", () => {
  it("returns each non-Late slot's own closing hour", () => {
    expect(slotUpperBoundHour(0)).toBe(8.5);
    expect(slotUpperBoundHour(1)).toBe(11.5);
    expect(slotUpperBoundHour(2)).toBe(16.5);
    expect(slotUpperBoundHour(3)).toBe(21.5);
  });

  it("returns null for Late, which wraps and has no own upper boundary", () => {
    expect(slotUpperBoundHour(4)).toBeNull();
  });
});
