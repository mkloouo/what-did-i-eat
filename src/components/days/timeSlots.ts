export const SLOT_LABELS = [
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Late",
] as const;

// What the Days header actually prints: its columns are ~50dp wide, which
// cut the full names off mid-word ("Morni…", "After…"). The full names stay
// as each header's accessibility label.
export const SLOT_SHORT_LABELS = ["Morn", "Mid", "Aft", "Eve", "Late"] as const;

export type SlotIndex = 0 | 1 | 2 | 3 | 4;

// Placeholder bounds lifted from the round-2 mockup, not a locked decision
// (see the spec) — a quick sanity check against real usage is worth doing
// before treating these as final. Late wraps past midnight, so it's handled
// as "everything the other four don't claim" rather than a normal range.
const SLOT_BOUNDS: ReadonlyArray<{ start: number; end: number }> = [
  { start: 5, end: 8.5 }, // Morning
  { start: 8.5, end: 11.5 }, // Midday
  { start: 11.5, end: 16.5 }, // Afternoon
  { start: 16.5, end: 21.5 }, // Evening
];

export function slotIndexForHour(hour: number): SlotIndex {
  for (let i = 0; i < SLOT_BOUNDS.length; i++) {
    const { start, end } = SLOT_BOUNDS[i];
    if (hour >= start && hour < end) return i as SlotIndex;
  }
  return 4;
}
