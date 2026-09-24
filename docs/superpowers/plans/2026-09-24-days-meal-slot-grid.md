# Days meal-slot grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Days view's per-photo `DayBand` timeline with a fixed-height, one-row-per-day grid of five time-of-day slot cells, each showing its meal(s) as a density mosaic.

**Architecture:** Two new pure-logic modules (`timeSlots.ts` for slot boundaries, `dayGrid.ts` for bucketing a `DaySection`'s `EntryGroup`s into five `SlotCell`s) replace `dayMarks.ts`. A `mosaicSample.ts` pure module picks the mosaic's column count and a representative photo sample. Three new presentational components (`DayGridCell`, `DayGridRow`, `SlotHeaderRow`) replace `DayBand`, reusing `squareGridLayout`/`tileInsets` from the Wall's own `PhotoStack` mosaic rather than a second tiling implementation. `DaysBoard` swaps in the new row and adds a pinned slot-name header via `FlatList`'s `stickyHeaderIndices`. Tapping a cell now jumps the Wall to that specific meal (not just the day), which needs one more pure lookup (`firstItemIndexForGroup`) and a second pending-scroll channel through `WallFeed`/`WallScreen`, mirroring the existing day-scroll wiring.

**Tech Stack:** React Native (Expo ~57), TypeScript, Redux Toolkit, Jest (pure-function unit tests only — this codebase never renders components in tests; see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-09-24-days-meal-slot-grid-design.md`

## Global Constraints

- Row height is fixed regardless of how much was logged in a day — never grows per-photo like the old `DayBand`. (Spec "Goal".)
- The unit placed into a cell is one **meal** (`EntryGroup` from `selectFeedSections`), never an individual photo. (Spec "Unit: the meal, not the photo".)
- A meal is placed by `slotIndexForHour` on `group.timeFrom`, never split across cells. (Spec "Slot boundaries".)
- Density is shown only as mosaic texture (1 / 2×2 / 3×3 / 4×4-capped-at-16) — never a count, badge, "+N" label, or a color that judges a time. No red anywhere. (Spec "Density"/"Non-goals".)
- The capped 16-photo case samples a spread (first/middle/last), never a naive `.slice(0, 16)`. (Spec "Density".)
- The spillover marker uses `theme.colors.pine`, never `accent` — `accent` is reserved for interactive/selected state per `theme.ts`. (Spec "Spillover marker".)
- This codebase's test convention: only pure functions (`utils/`, `store/selectors/`, and colocated helpers like `dayMarks.ts`) get `*.test.ts` files; components (`.tsx`) are never rendered in tests. Every task below keeps new logic in a pure, colocated, tested module and leaves components as thin renderers, matching this convention — do not introduce `@testing-library/react-native` or similar.
- `dayWash.ts` and `DaysHero.tsx` are unaffected by this plan — out of scope.

## Review Focus

- A meal whose photo count sits exactly on a density-tier boundary (1, 4, 5, 9, 10 photos) — off-by-one in `densityColumns` would misclassify the tile grid the spec's table names exactly. Covered in Task 3.
- A meal starting exactly on a slot boundary hour (05:00, 08:30, 11:30, 16:30, 21:30) — off-by-one in `slotIndexForHour` would silently misfile a meal into the wrong column. Covered in Task 1.
- Two meals landing in the same slot (e.g. two "Late" snacks) — the spec requires their photo counts summed and all their photos tiled together oldest-first, not just the first meal shown. Covered in Task 2.
- A meal that starts in one slot and its `timeTo` crosses into the next — the spillover dot, and specifically that it never fires for the wrapping Late slot (index 4), which has no "own upper boundary" to cross. Covered in Task 2.
- A day with zero groups — every one of the five cells must render as the plain empty `surface` fill with no tiles, not crash on an empty mosaic. Covered in Task 2 (grid data) and Task 5 (cell rendering with `columns === 0`).

---

### Task 1: Slot-boundary util

**Files:**
- Create: `src/components/days/timeSlots.ts`
- Test: `src/components/days/timeSlots.test.ts`

**Interfaces:**
- Consumes: nothing (first task, no dependencies).
- Produces: `SLOT_LABELS: readonly ["Morning", "Midday", "Afternoon", "Evening", "Late"]`, `type SlotIndex = 0 | 1 | 2 | 3 | 4`, `slotIndexForHour(hour: number): SlotIndex`, `slotUpperBoundHour(slotIndex: SlotIndex): number | null` (the decimal hour a slot's own window closes at; `null` for the wrapping Late slot, which has none). `hour` is a decimal hour in `[0, 24)`, e.g. `8.5` for 08:30 — callers derive it from `minuteOfDay(iso) / 60` (Task 2 does this).

- [ ] **Step 1: Write the failing test**

```ts
// src/components/days/timeSlots.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/days/timeSlots.test.ts`
Expected: FAIL — `Cannot find module './timeSlots'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/days/timeSlots.ts
export const SLOT_LABELS = [
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Late",
] as const;

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

export function slotUpperBoundHour(slotIndex: SlotIndex): number | null {
  return slotIndex === 4 ? null : SLOT_BOUNDS[slotIndex].end;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/days/timeSlots.test.ts`
Expected: PASS, 15/15.

- [ ] **Step 5: Commit**

```bash
git add src/components/days/timeSlots.ts src/components/days/timeSlots.test.ts
git commit -m "feat: add slotIndexForHour for the Days meal-slot grid"
```

---

### Task 2: Day-grid bucketing (replaces `dayMarks.ts`)

**Files:**
- Create: `src/components/days/dayGrid.ts`
- Test: `src/components/days/dayGrid.test.ts`
- Delete: `src/components/days/dayMarks.ts`, `src/components/days/dayMarks.test.ts` (this task is their direct replacement — `DayBand.tsx`, the only importer, is replaced in Task 6, so removing them here is safe once this task's grep confirms no other importer)

**Interfaces:**
- Consumes: `DaySection`, `EntryGroup` from `../../store/selectors/groupSelectors` (exact shape: `EntryGroup = { id, dayKey, entries: Entry[], timeFrom: string, timeTo: string, photosByEntry: string[][] }`, `DaySection = { dayKey, groups: EntryGroup[] }`; `entries`/`photosByEntry` within a group are newest-first — index 0 is the newest entry); `minuteOfDay(iso: string): number` from `../../utils/dateFormat`; `slotIndexForHour`, `slotUpperBoundHour`, `SlotIndex` from `./timeSlots` (Task 1).
- Produces: `type SlotCell = { slotIndex: SlotIndex; meals: EntryGroup[]; photoCount: number; hasSpillover: boolean }`, `buildDayGrid(section: DaySection): SlotCell[]` (always exactly 5 cells, indices 0-4, `meals` oldest-first), `cellPhotos(cell: SlotCell): string[]` (every photo across the cell's meals, oldest-first, flattened). Task 5 (`DayGridCell`) consumes `SlotCell` and `cellPhotos`; Task 6 (`DayGridRow`) consumes `buildDayGrid`.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/days/dayGrid.test.ts
import { buildDayGrid, cellPhotos } from "./dayGrid";
import { DaySection, EntryGroup } from "../../store/selectors/groupSelectors";

function iso(hour: number, minute: number): string {
  return new Date(2026, 2, 5, hour, minute, 0).toISOString();
}

function group(
  id: string,
  timeFrom: string,
  timeTo: string,
  photosByEntry: string[][],
): EntryGroup {
  const entries = photosByEntry.map((photos, i) => ({
    id: `${id}-e${i}`,
    createdAt: timeFrom,
    comment: "",
    location: null,
    photos: photos.map((uri, j) => ({ id: `${id}-e${i}-p${j}`, uri })),
  }));
  return { id, dayKey: "2026-03-05", entries, timeFrom, timeTo, photosByEntry };
}

function section(groups: EntryGroup[]): DaySection {
  return { dayKey: "2026-03-05", groups };
}

describe("buildDayGrid", () => {
  it("returns five empty cells for a day with no groups", () => {
    const cells = buildDayGrid(section([]));
    expect(cells).toHaveLength(5);
    expect(cells.map((c) => c.slotIndex)).toEqual([0, 1, 2, 3, 4]);
    for (const cell of cells) {
      expect(cell.meals).toEqual([]);
      expect(cell.photoCount).toBe(0);
      expect(cell.hasSpillover).toBe(false);
    }
  });

  it("places a meal by its start time, into that slot only", () => {
    const g = group("g1", iso(12, 0), iso(12, 10), [["a.jpg"]]);
    const cells = buildDayGrid(section([g]));
    expect(cells[2].meals).toEqual([g]); // Afternoon
    expect(cells[2].photoCount).toBe(1);
    expect(cells[0].meals).toEqual([]);
  });

  it("sums photo counts and tiles all photos oldest-first when two meals share a slot", () => {
    const older = group("older", iso(22, 0), iso(22, 5), [["a.jpg", "b.jpg"]]);
    const newer = group("newer", iso(23, 0), iso(23, 5), [["c.jpg"]]);
    // section.groups arrives newest-first from selectFeedSections
    const cells = buildDayGrid(section([newer, older]));
    expect(cells[4].meals).toEqual([older, newer]);
    expect(cells[4].photoCount).toBe(3);
    expect(cellPhotos(cells[4])).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("flags spillover when a meal's end time crosses its own slot's upper boundary", () => {
    const spills = group("s", iso(7, 0), iso(9, 0), [["a.jpg"]]); // Morning -> Midday
    const cells = buildDayGrid(section([spills]));
    expect(cells[0].hasSpillover).toBe(true);
  });

  it("does not flag spillover when a meal ends within its own slot", () => {
    const tidy = group("t", iso(7, 0), iso(7, 30), [["a.jpg"]]);
    const cells = buildDayGrid(section([tidy]));
    expect(cells[0].hasSpillover).toBe(false);
  });

  it("never flags spillover for the wrapping Late slot", () => {
    const late = group("l", iso(23, 0), iso(23, 59), [["a.jpg"]]);
    const cells = buildDayGrid(section([late]));
    expect(cells[4].hasSpillover).toBe(false);
  });
});

describe("cellPhotos", () => {
  it("flattens a single meal's photos oldest-entry-first", () => {
    // entries/photosByEntry are newest-first, per EntryGroup's convention
    const g: EntryGroup = {
      id: "g1",
      dayKey: "2026-03-05",
      timeFrom: iso(8, 0),
      timeTo: iso(8, 10),
      entries: [
        { id: "e2", createdAt: iso(8, 5), comment: "", location: null, photos: [{ id: "p3", uri: "c.jpg" }] },
        { id: "e1", createdAt: iso(8, 0), comment: "", location: null, photos: [{ id: "p1", uri: "a.jpg" }, { id: "p2", uri: "b.jpg" }] },
      ],
      photosByEntry: [["c.jpg"], ["a.jpg", "b.jpg"]],
    };
    const cells = buildDayGrid(section([g]));
    expect(cellPhotos(cells[0])).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/days/dayGrid.test.ts`
Expected: FAIL — `Cannot find module './dayGrid'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/days/dayGrid.ts
import { DaySection, EntryGroup } from "../../store/selectors/groupSelectors";
import { minuteOfDay } from "../../utils/dateFormat";
import { slotIndexForHour, slotUpperBoundHour, SlotIndex } from "./timeSlots";

export type SlotCell = {
  slotIndex: SlotIndex;
  meals: EntryGroup[];
  photoCount: number;
  hasSpillover: boolean;
};

function hourOf(iso: string): number {
  return minuteOfDay(iso) / 60;
}

function mealHasSpillover(group: EntryGroup, slotIndex: SlotIndex): boolean {
  const upper = slotUpperBoundHour(slotIndex);
  if (upper === null) return false;
  return hourOf(group.timeTo) > upper;
}

function photoCountOf(group: EntryGroup): number {
  return group.photosByEntry.reduce((sum, photos) => sum + photos.length, 0);
}

// One row's worth of data: the day's groups bucketed into the five
// time-of-day slots by `slotIndexForHour` on each meal's *start* time, so a
// long sitting never splits across two cells. `section.groups` arrives
// newest-first from selectFeedSections; iterating a reversed copy keeps
// `meals` (and, via cellPhotos, every photo) in oldest-first order per cell.
export function buildDayGrid(section: DaySection): SlotCell[] {
  const cells: SlotCell[] = [0, 1, 2, 3, 4].map((slotIndex) => ({
    slotIndex: slotIndex as SlotIndex,
    meals: [],
    photoCount: 0,
    hasSpillover: false,
  }));

  const oldestFirst = [...section.groups].reverse();
  for (const group of oldestFirst) {
    const slotIndex = slotIndexForHour(hourOf(group.timeFrom));
    const cell = cells[slotIndex];
    cell.meals.push(group);
    cell.photoCount += photoCountOf(group);
    if (mealHasSpillover(group, slotIndex)) cell.hasSpillover = true;
  }

  return cells;
}

// Every photo across a cell's meal(s), oldest-first — the order the density
// mosaic tiles them in.
export function cellPhotos(cell: SlotCell): string[] {
  const photos: string[] = [];
  for (const group of cell.meals) {
    for (let i = group.entries.length - 1; i >= 0; i--) {
      photos.push(...group.photosByEntry[i]);
    }
  }
  return photos;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/days/dayGrid.test.ts`
Expected: PASS, 8/8.

- [ ] **Step 5: Delete the replaced module and commit**

```bash
git rm src/components/days/dayMarks.ts src/components/days/dayMarks.test.ts
git add src/components/days/dayGrid.ts src/components/days/dayGrid.test.ts
git commit -m "feat: replace per-photo dayMarks with slot-bucketed dayGrid"
```

---

### Task 3: Mosaic density + spread-sample helpers

**Files:**
- Create: `src/components/days/mosaicSample.ts`
- Test: `src/components/days/mosaicSample.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `densityColumns(photoCount: number): number` (0 for 0 photos, 1 for 1, 2 for 2-4, 3 for 5-9, 4 for 10+), `sampleSpread<T>(items: T[], max: number): T[]` (returns `items` unchanged if `items.length <= max`; otherwise `max` evenly spread items including the first and last, order preserved). Task 5 (`DayGridCell`) consumes both.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/days/mosaicSample.test.ts
import { densityColumns, sampleSpread } from "./mosaicSample";

describe("densityColumns", () => {
  it("returns 0 for an empty cell", () => {
    expect(densityColumns(0)).toBe(0);
  });

  it("returns 1 for a single photo", () => {
    expect(densityColumns(1)).toBe(1);
  });

  it("returns 2 for the 2-4 range, including both ends", () => {
    expect(densityColumns(2)).toBe(2);
    expect(densityColumns(4)).toBe(2);
  });

  it("returns 3 for the 5-9 range, including both ends", () => {
    expect(densityColumns(5)).toBe(3);
    expect(densityColumns(9)).toBe(3);
  });

  it("returns 4 for 10 and for anything above it", () => {
    expect(densityColumns(10)).toBe(4);
    expect(densityColumns(40)).toBe(4);
  });
});

describe("sampleSpread", () => {
  it("returns the input unchanged when it already fits", () => {
    expect(sampleSpread(["a", "b", "c"], 16)).toEqual(["a", "b", "c"]);
  });

  it("keeps the first and last item when sampling down", () => {
    const items = Array.from({ length: 20 }, (_, i) => String(i));
    const sampled = sampleSpread(items, 16);
    expect(sampled).toHaveLength(16);
    expect(sampled[0]).toBe("0");
    expect(sampled[sampled.length - 1]).toBe("19");
  });

  it("preserves the original order and never repeats an item", () => {
    const items = Array.from({ length: 20 }, (_, i) => String(i));
    const sampled = sampleSpread(items, 16);
    const asNumbers = sampled.map(Number);
    for (let i = 1; i < asNumbers.length; i++) {
      expect(asNumbers[i]).toBeGreaterThan(asNumbers[i - 1]);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/days/mosaicSample.test.ts`
Expected: FAIL — `Cannot find module './mosaicSample'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/days/mosaicSample.ts

// How many columns (and rows) the density mosaic subdivides into for a
// given photo count — texture, not a number the user reads. Matches the
// spec's table: 0 empty, 1 full tile, 2-4 a 2x2, 5-9 a 3x3, 10+ a
// 4x4 capped at 16 photos (sampleSpread below picks which 16).
export function densityColumns(photoCount: number): number {
  if (photoCount <= 0) return 0;
  if (photoCount === 1) return 1;
  if (photoCount <= 4) return 2;
  if (photoCount <= 9) return 3;
  return 4;
}

// Picks `max` items spread across `items`, always keeping the first and
// last, so a capped mosaic reads as representative of the whole burst
// instead of just its opening seconds.
export function sampleSpread<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  if (max <= 1) return items.slice(0, max);

  const result: T[] = [];
  for (let i = 0; i < max; i++) {
    const index = Math.round((i * (items.length - 1)) / (max - 1));
    result.push(items[index]);
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/days/mosaicSample.test.ts`
Expected: PASS, 10/10.

- [ ] **Step 5: Commit**

```bash
git add src/components/days/mosaicSample.ts src/components/days/mosaicSample.test.ts
git commit -m "feat: add density-column and spread-sample helpers for the meal mosaic"
```

---

### Task 4: Per-meal scroll target lookup

**Files:**
- Modify: `src/utils/wallItems.ts`
- Test: `src/utils/wallItems.test.ts` (existing file — add cases, don't replace it)

**Interfaces:**
- Consumes: `WallItem`, `WallPieceItem` (existing types in this file: `WallItem = WallDayItem | WallPieceItem`, `WallPieceItem = { type: "piece"; group: EntryGroup }`).
- Produces: `firstItemIndexForGroup(items: WallItem[], groupId: string): number` (mirrors the existing `firstItemIndexForDay`; returns `-1` if not found). Task 8 (`WallFeed`) consumes this.

- [ ] **Step 1: Read the existing test file to match its fixture style**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head -1 || true` then open `src/utils/wallItems.test.ts` and note its existing `buildWallItems`/fixture helpers before adding to it — this step has no pass/fail check, it's context-gathering before Step 2.

- [ ] **Step 2: Add the failing test**

Append to `src/utils/wallItems.test.ts` (inside the existing file, alongside its other `describe` blocks — do not remove any existing test):

```ts
import { firstItemIndexForGroup } from "./wallItems";
// (add this import alongside the file's existing imports at the top)

describe("firstItemIndexForGroup", () => {
  it("finds the index of the piece item for a given group id", () => {
    const items: WallItem[] = [
      { type: "day", dayKey: "2026-03-05", label: "Today" },
      { type: "piece", group: { id: "g1", dayKey: "2026-03-05", entries: [], timeFrom: "", timeTo: "", photosByEntry: [] } },
      { type: "piece", group: { id: "g2", dayKey: "2026-03-05", entries: [], timeFrom: "", timeTo: "", photosByEntry: [] } },
    ];
    expect(firstItemIndexForGroup(items, "g2")).toBe(2);
  });

  it("returns -1 when no piece has that group id", () => {
    const items: WallItem[] = [
      { type: "day", dayKey: "2026-03-05", label: "Today" },
    ];
    expect(firstItemIndexForGroup(items, "missing")).toBe(-1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/utils/wallItems.test.ts`
Expected: FAIL — `firstItemIndexForGroup is not a function` (or `is not exported`).

- [ ] **Step 4: Add the implementation**

Append to `src/utils/wallItems.ts` (below the existing `firstItemIndexForDay`):

```ts
// The index of a specific meal's own piece item, for scrolling the Wall
// straight to it — the per-cell tap target the Days grid uses, since
// (unlike the old per-photo marks) a cell always maps to exactly one meal.
export function firstItemIndexForGroup(
  items: WallItem[],
  groupId: string,
): number {
  return items.findIndex(
    (item) => item.type === "piece" && item.group.id === groupId,
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/utils/wallItems.test.ts`
Expected: PASS, all cases including the 2 new ones green.

- [ ] **Step 6: Commit**

```bash
git add src/utils/wallItems.ts src/utils/wallItems.test.ts
git commit -m "feat: add firstItemIndexForGroup for per-meal Wall scroll targeting"
```

---

### Task 5: `DayGridCell` component

**Files:**
- Create: `src/components/days/DayGridCell.tsx`

No test file — per this codebase's convention (see Global Constraints), components are not rendered in tests; the mosaic math it calls (`densityColumns`, `sampleSpread`, `squareGridLayout`, `tileInsets`) is already covered by Tasks 3 and the existing `squareGridLayout.test.ts`/`tileInsets.test.ts`. Verified by typecheck (Step 2).

**Interfaces:**
- Consumes: `SlotCell`, `cellPhotos` from `./dayGrid` (Task 2); `densityColumns`, `sampleSpread` from `./mosaicSample` (Task 3); `squareGridLayout` from `../photoLayouts/squareGridLayout` (existing); `tileInsets` from `../photoLayouts/tileInsets` (existing); `theme` from `../../theme/theme`.
- Produces: `DayGridCell` component, props `{ cell: SlotCell; size: number; onPress: () => void }`. Task 6 (`DayGridRow`) consumes this.

- [ ] **Step 1: Write the component**

```tsx
// src/components/days/DayGridCell.tsx
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { SlotCell, cellPhotos } from "./dayGrid";
import { densityColumns, sampleSpread } from "./mosaicSample";
import { squareGridLayout } from "../photoLayouts/squareGridLayout";
import { tileInsets } from "../photoLayouts/tileInsets";
import { theme } from "../../theme/theme";

const MAX_TILES = 16;
const SEAM = 2;

type Props = {
  cell: SlotCell;
  size: number;
  onPress: () => void;
};

// One slot's mosaic: density shown purely as texture — how finely the
// fixed-size cell subdivides — never a count, a badge, or a color that
// judges a time. `size` is always the same square; a busy meal never grows
// the cell, it only makes the grid inside it finer (up to 4x4, capped at 16
// photos via a spread sample rather than "first 16").
export function DayGridCell({ cell, size, onPress }: Props) {
  const columns = densityColumns(cell.photoCount);
  const hasMeal = cell.meals.length > 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={!hasMeal}
      accessibilityRole="button"
      accessibilityLabel={
        hasMeal ? "Open this meal on the Wall" : "No meal in this slot"
      }
      style={[styles.cell, { width: size, height: size }]}
    >
      {columns > 0 ? (
        <MosaicTiles
          photos={sampleSpread(cellPhotos(cell), MAX_TILES)}
          columns={columns}
          size={size}
        />
      ) : null}
      {cell.hasSpillover ? <View style={styles.spillDot} /> : null}
    </Pressable>
  );
}

function MosaicTiles({
  photos,
  columns,
  size,
}: {
  photos: string[];
  columns: number;
  size: number;
}) {
  // squareGridLayout is fed a fixed `columns` and a photo count that never
  // exceeds columns*columns (sampleSpread already capped it), so its rects
  // never spill past `columns` rows — safe to treat the grid as a fixed
  // columns x columns square rather than squareGridLayout's own
  // (variable-height) unitHeight.
  const layout = squareGridLayout([photos], columns);
  const tileSize = size / columns;

  return (
    <>
      {photos.map((uri, index) => {
        const rect = layout.rects[index];
        const insets = tileInsets(rect, columns, columns, SEAM);
        return (
          <View
            key={uri + index}
            style={[
              styles.tile,
              {
                left: (rect.x / columns) * size,
                top: (rect.y / columns) * size,
                width: tileSize,
                height: tileSize,
                ...insets,
              },
            ]}
          >
            <Image source={{ uri }} style={styles.image} contentFit="cover" />
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  tile: {
    position: "absolute",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  spillDot: {
    position: "absolute",
    right: 3,
    top: "50%",
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.pine,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (the file has no other importers yet, so this only checks the file compiles against its own consumed types).

- [ ] **Step 3: Commit**

```bash
git add src/components/days/DayGridCell.tsx
git commit -m "feat: add DayGridCell mosaic renderer"
```

---

### Task 6: `SlotHeaderRow` + `DayGridRow` (replaces `DayBand.tsx`)

**Files:**
- Create: `src/components/days/DayGridRow.tsx`
- Create: `src/components/days/SlotHeaderRow.tsx`
- Delete: `src/components/days/DayBand.tsx`

No test files (component layer — see Global Constraints). Verified by typecheck; `DaysBoard.tsx` (Task 7) is the only importer of `DayBand.tsx`, and Task 7 updates it in the same pass, so deleting it here is safe once Task 7 immediately follows.

**Interfaces:**
- Consumes: `DaySection` from `../../store/selectors/groupSelectors`; `buildDayGrid` from `./dayGrid` (Task 2); `DayGridCell` from `./DayGridCell` (Task 5); `SLOT_LABELS` from `./timeSlots` (Task 1); `theme`.
- Produces: `DayGridRow` component (props `{ section: DaySection; label: string; onPressCell: (groupId: string) => void }`), `SlotHeaderRow` component (no props), and the shared layout constants `CELL_SIZE`, `GUTTER`, `LABEL_WIDTH` (exported from `DayGridRow.tsx`, imported by `SlotHeaderRow.tsx` so the header's columns line up with every row's cells). Task 7 (`DaysBoard`) consumes both components.

- [ ] **Step 1: Write `DayGridRow.tsx`**

```tsx
// src/components/days/DayGridRow.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/groupSelectors";
import { buildDayGrid } from "./dayGrid";
import { DayGridCell } from "./DayGridCell";
import { theme } from "../../theme/theme";

export const CELL_SIZE = 52;
export const GUTTER = 8;
export const LABEL_WIDTH = 64;

type Props = {
  section: DaySection;
  label: string;
  onPressCell: (groupId: string) => void;
};

// One day, one row, fixed height — it never grows for a busier day. Each of
// the five slot cells shows its meal(s) as a density mosaic (DayGridCell);
// tapping a cell jumps the Wall to that specific meal, since a cell always
// maps to exactly one meal (or an ordered few, oldest tapped first).
export function DayGridRow({ section, label, onPressCell }: Props) {
  const cells = buildDayGrid(section);

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.cells}>
        {cells.map((cell) => (
          <DayGridCell
            key={cell.slotIndex}
            cell={cell}
            size={CELL_SIZE}
            onPress={() => {
              const target = cell.meals[0];
              if (target) onPressCell(target.id);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    marginBottom: GUTTER,
    gap: GUTTER,
  },
  labelCol: {
    width: LABEL_WIDTH,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
  },
  cells: {
    flexDirection: "row",
    gap: GUTTER,
  },
});
```

- [ ] **Step 2: Write `SlotHeaderRow.tsx`**

```tsx
// src/components/days/SlotHeaderRow.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SLOT_LABELS } from "./timeSlots";
import { CELL_SIZE, GUTTER, LABEL_WIDTH } from "./DayGridRow";
import { theme } from "../../theme/theme";

// The pinned header above every day row, naming the five time-of-day slot
// columns so they stay legible while the board scrolls (DaysBoard makes
// this row sticky via FlatList's stickyHeaderIndices).
export function SlotHeaderRow() {
  return (
    <View style={styles.row}>
      <View style={styles.labelCol} />
      <View style={styles.cells}>
        {SLOT_LABELS.map((slotLabel) => (
          <Text key={slotLabel} style={styles.slot} numberOfLines={1}>
            {slotLabel}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.daylight,
    gap: GUTTER,
  },
  labelCol: {
    width: LABEL_WIDTH,
  },
  cells: {
    flexDirection: "row",
    gap: GUTTER,
  },
  slot: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
    width: CELL_SIZE,
    textAlign: "center",
  },
});
```

- [ ] **Step 3: Delete `DayBand.tsx`**

```bash
git rm src/components/days/DayBand.tsx
```

(`DaysBoard.tsx` still imports it at this point — Task 7 fixes that in the very next task, so `npx tsc --noEmit` is expected to fail between Task 6 and Task 7. Do not run the typecheck gate until Task 7 is also done; this task's own gate is Step 4 below, on the two new files only.)

- [ ] **Step 4: Typecheck the two new files in isolation**

Run: `npx tsc --noEmit --skipLibCheck src/components/days/DayGridRow.tsx src/components/days/SlotHeaderRow.tsx`
Expected: no errors reported for either file (unrelated pre-existing errors from `DaysBoard.tsx`'s now-dangling `DayBand` import may appear if this invocation pulls in the whole program — if so, confirm by name that every reported error's file is `DaysBoard.tsx`, not `DayGridRow.tsx`/`SlotHeaderRow.tsx`, and proceed; Task 7 resolves it).

- [ ] **Step 5: Commit**

```bash
git add src/components/days/DayGridRow.tsx src/components/days/SlotHeaderRow.tsx
git commit -m "feat: add DayGridRow and SlotHeaderRow, remove DayBand"
```

---

### Task 7: `DaysBoard.tsx` — pinned header, hero, new rows

**Files:**
- Modify: `src/components/days/DaysBoard.tsx` (full rewrite of its body)

No test file (component layer).

**Interfaces:**
- Consumes: `DayGridRow`, `SlotHeaderRow` (Task 6); `DaysHero` (existing, unmodified); `DaySection`, `Entry` types; `dayLabel` from `../../utils/dateFormat`.
- Produces: `DaysBoard` component with a new prop shape — `onPressDay` is replaced by `onPressCell: (groupId: string) => void` (the whole-band tap target is gone; every tap is now per-cell). Task 8 (`WallScreen`) is this component's only consumer and is updated in the same task-loop iteration's next task to match.

- [ ] **Step 1: Rewrite the file**

```tsx
// src/components/days/DaysBoard.tsx
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/groupSelectors";
import { Entry } from "../../types/models";
import { dayLabel } from "../../utils/dateFormat";
import { DayGridRow } from "./DayGridRow";
import { SlotHeaderRow } from "./SlotHeaderRow";
import { DaysHero } from "./DaysHero";
import { theme } from "../../theme/theme";

type Row =
  | { type: "hero"; entry: Entry }
  | { type: "header" }
  | { type: "day"; section: DaySection };

type Props = {
  sections: DaySection[];
  latestEntry: Entry | null;
  onPressCell: (groupId: string) => void;
  onPressEntry: (entryId: string) => void;
};

// The Days body: an optional hero for your latest meal, a pinned row naming
// the five slot columns, then one fixed-height DayGridRow per day, newest
// first (sections already arrive sorted that way from selectFeedSections).
export function DaysBoard({
  sections,
  latestEntry,
  onPressCell,
  onPressEntry,
}: Props) {
  const rows: Row[] = [];
  if (latestEntry) rows.push({ type: "hero", entry: latestEntry });
  rows.push({ type: "header" });
  for (const section of sections) rows.push({ type: "day", section });

  const headerIndex = rows.findIndex((row) => row.type === "header");

  return (
    <FlatList
      data={rows}
      keyExtractor={(row, index) =>
        row.type === "day" ? row.section.dayKey : `${row.type}-${index}`
      }
      stickyHeaderIndices={[headerIndex]}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        if (item.type === "hero") {
          return (
            <DaysHero
              entry={item.entry}
              onPress={() => onPressEntry(item.entry.id)}
            />
          );
        }
        if (item.type === "header") {
          return <SlotHeaderRow />;
        }
        return (
          <DayGridRow
            section={item.section}
            label={dayLabel(item.section.dayKey)}
            onPressCell={onPressCell}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only in `src/screens/WallScreen.tsx` (it still calls `<DaysBoard onPressDay={goToWallDay} ...>`, a prop `DaysBoard` no longer accepts — Task 8 fixes this next). Confirm every reported error's file is `WallScreen.tsx`; if any other file errors, stop and fix before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/components/days/DaysBoard.tsx
git commit -m "feat: rewrite DaysBoard around the meal-slot grid with a pinned header"
```

---

### Task 8: Wire per-meal scroll-to-Wall through `WallFeed`/`WallScreen`

**Files:**
- Modify: `src/components/wall/WallFeed.tsx`
- Modify: `src/screens/WallScreen.tsx`

No test file (component layer); `firstItemIndexForGroup` (Task 4) already covers the lookup logic this wiring calls.

**Interfaces:**
- Consumes: `firstItemIndexForGroup` from `../../utils/wallItems` (Task 4); `DaysBoard`'s new `onPressCell` prop (Task 7).
- Produces: `WallFeed` gains `pendingScrollGroupId: string | null` and `onScrolledToGroup: () => void` props, alongside the existing day-scroll pair (mirrors it exactly rather than replacing it, since the Scrubber's drag-to-day jump still needs the day path). `WallScreen` wires `DaysBoard`'s `onPressCell` to a new `goToWallMeal` that sets `pendingScrollGroupId` and switches `timelineView` to `"wall"`, same shape as the existing `goToWallDay`.

- [ ] **Step 1: Add the group-scroll props to `WallFeed.tsx`**

In `src/components/wall/WallFeed.tsx`, change the import and `Props` type:

```tsx
import {
  WallItem,
  firstItemIndexForDay,
  firstItemIndexForGroup,
  currentDayFromViewableItems,
} from "../../utils/wallItems";
```

```tsx
type Props = {
  items: WallItem[];
  dayKeys: string[];
  tagsById: Record<string, Tag>;
  wallColumns: number;
  scrubberEnabled: boolean;
  onPressEntry: (entryId: string) => void;
  // Set by a Days-view day-row tap asking to jump to a day; cleared via
  // onScrolledToDay once this feed has scrolled there.
  pendingScrollDayKey: string | null;
  onScrolledToDay: () => void;
  // Set by a Days-view cell tap asking to jump to one specific meal;
  // cleared via onScrolledToGroup the same way.
  pendingScrollGroupId: string | null;
  onScrolledToGroup: () => void;
};
```

- [ ] **Step 2: Thread the new props through the component and generalize the mount-time scroll**

Change the function signature:

```tsx
export function WallFeed({
  items,
  dayKeys,
  tagsById,
  wallColumns,
  scrubberEnabled,
  onPressEntry,
  pendingScrollDayKey,
  onScrolledToDay,
  pendingScrollGroupId,
  onScrolledToGroup,
}: Props) {
```

Replace the existing `initialScrollIndex` state and the mount `useEffect` (the block right after `scrollToDay`'s definition) with:

```tsx
  // A Days-view tap always mounts this feed fresh, so the jump is handled
  // by FlashList's initial layout rather than an imperative scroll: a
  // scrollToIndex fired on mount lands before FlashList has measured
  // anything, and it never renders the rows at the new offset — the
  // screen stays blank until the user scrolls. Read once, at mount, so
  // clearing the pending values below doesn't change what FlashList got.
  // A group target (a specific meal, from a cell tap) takes priority over
  // a day target (a whole-row tap) if somehow both were set.
  const [initialScrollIndex] = useState(() => {
    if (pendingScrollGroupId) {
      const index = firstItemIndexForGroup(items, pendingScrollGroupId);
      if (index >= 0) return index;
    }
    if (pendingScrollDayKey) {
      const index = firstItemIndexForDay(items, pendingScrollDayKey);
      if (index >= 0) return index;
    }
    return undefined;
  });

  useEffect(() => {
    if (pendingScrollDayKey) onScrolledToDay();
    if (pendingScrollGroupId) onScrolledToGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only in `src/screens/WallScreen.tsx` (it now passes `WallFeed` too few props, and still passes `DaysBoard` the old `onPressDay`). Confirm every reported error's file is `WallScreen.tsx`.

- [ ] **Step 4: Update `WallScreen.tsx`**

Add a second pending-scroll state next to the existing one:

```tsx
  const [pendingScrollDayKey, setPendingScrollDayKey] = useState<string | null>(
    null,
  );
  const [pendingScrollGroupId, setPendingScrollGroupId] = useState<
    string | null
  >(null);
```

Add `goToWallMeal` next to the existing `goToWallDay`:

```tsx
  function goToWallDay(dayKey: string) {
    setPendingScrollDayKey(dayKey);
    dispatch(setTimelineView("wall"));
  }

  function goToWallMeal(groupId: string) {
    setPendingScrollGroupId(groupId);
    dispatch(setTimelineView("wall"));
  }
```

Update the `WallFeed` element to pass the two new props:

```tsx
        <WallFeed
          items={items}
          dayKeys={dayKeys}
          tagsById={tagsById}
          wallColumns={wallColumns}
          scrubberEnabled={scrubberEnabled}
          onPressEntry={(entryId) =>
            navigation.navigate("EntryDetails", { entryId })
          }
          pendingScrollDayKey={pendingScrollDayKey}
          onScrolledToDay={() => setPendingScrollDayKey(null)}
          pendingScrollGroupId={pendingScrollGroupId}
          onScrolledToGroup={() => setPendingScrollGroupId(null)}
        />
```

Update the `DaysBoard` element — replace `onPressDay={goToWallDay}` with the new per-cell prop:

```tsx
        <DaysBoard
          sections={sections}
          latestEntry={latestEntry}
          onPressCell={goToWallMeal}
          onPressEntry={(entryId) =>
            navigation.navigate("EntryDetails", { entryId })
          }
        />
```

- [ ] **Step 5: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors anywhere.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: every suite green, including the pre-existing ones untouched by this plan (confirms nothing else broke).

- [ ] **Step 7: Commit**

```bash
git add src/components/wall/WallFeed.tsx src/screens/WallScreen.tsx
git commit -m "feat: jump the Wall to a specific meal on Days grid cell tap"
```

---

## Post-plan manual check (not a task — for the human tester)

`slotIndexForHour`'s bounds (05:00/08:30/11:30/16:30/21:30) are a placeholder lifted from the mockup (see spec) — worth a quick sanity check against real logged data once the grid is visible, before treating them as final. If they need to move, only `SLOT_BOUNDS` in `timeSlots.ts` changes.
