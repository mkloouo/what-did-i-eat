# Days View, Header Toggle and Merge-Window Preview (1.9.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Days view — one astronomical-wash band per day with photo marks at their true time — as a second way to see the same timeline, reached via a `Wall | Days` toggle in Home's header, plus a live merge-window preview in Settings.

**Architecture:** Pure logic (time-of-day fraction, the wash's gradient stops, per-day mark layout, the merge-window preview's clustering) is written and tested first, entirely independent of React Native — mirroring how 1.6.0 built the Wall. `Home` (the `WallScreen` component — the route is still named `"Home"`) becomes a shell that owns the `Wall | Days` toggle and renders one of two bodies: the existing Wall feed, extracted unchanged into its own `WallFeed` component, or the new `DaysBoard`. Tapping a day's band on Days switches back to Wall and scrolls to that day, reusing the exact same per-day scroll-to-index logic the Scrubber already uses — no new scrolling mechanism.

**Tech Stack:** Expo SDK 57, React Native 0.86, React Navigation 7, Redux Toolkit, `expo-linear-gradient` (installed since 1.5.0, unused until now), `expo-image`, `@shopify/flash-list` (Wall only — Days uses a plain `FlatList`, since a handful of day-bands doesn't need FlashList's virtualization).

**Spec:** `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md`, "Days view", "Settings" (the live mini-band line) and "Navigation" (`Home`'s toggle) sections. This is plan 5 of 6 in the original step numbering (version 1.9.0). Plans 1-4 (1.5.0-1.8.0) and the unplanned 1.7.1/1.8.1 refinements are complete and merged into `wall-redesign`.

## Decisions this plan makes (spec doesn't spell these out)

- **The wash's exact colors and zone boundaries.** The spec says "night, dawn, day, dusk, night" reusing "the time-of-day boundaries already in `windowTitle.ts`" — but `windowTitle.ts` was deleted in 1.6.0 (Task 1 there retired invented meal titles along with it). This plan defines fresh boundaries: night 00:00-05:00, a warm dawn glow peaking at 06:00, day 07:00-18:00, a warm dusk glow peaking at 19:00, night 20:00-24:00 — using colors derived from the existing palette (`#12160F`, darker than `wall`, for night; `#2A3428`, a lifted warm green, for day; `#4A3B28`, a muted brass, for the dawn/dusk glow), so every band starts and ends on the same night tone. This is a decorative, purely visual choice — easy to retune later without touching anything else, since it's isolated in one pure function.
- **One mark per photo**, positioned by its own entry's time of day (photos don't carry their own timestamp — only their entry does). A group with several close-in-time entries (or one entry with several photos) stacks its marks vertically rather than overlapping them, reading "Groups inside the rolling window stack" as marks stacking, not as a separate visual grouping construct.
- **No live-updating "now" marker.** It's computed once at render time from `Date.now()`, matching this app's general lack of urgency/ticking-clock chrome. If a user leaves the Days view open across a real clock update, the marker is stale until the next re-render (e.g. switching tabs and back) — an accepted, minor simplification.
- **The merge-window preview clusters the user's most recent 10 entries by elapsed-gap alone**, independent of day boundaries — a decorative visualization of "these would merge," not a re-implementation of `groupSelectors.ts`'s day-scoped grouping (which stays exactly as it is). Entries render as small dots, and each resulting cluster gets a shared pill background — directly answering the spec's "the current window highlighted."
- **Days has no hero photo and no per-mark tap** — tapping anywhere on a day's band opens the Wall scrolled to that day, matching the spec's explicit "No hero photo in this view, since the Wall is one tap away."

## Global Constraints

- Branch is `wall-redesign`. Never work on `main`.
- Theme tokens: `theme.colors.{wall,seam,hairline,bone,chalk,brass,clay}`, `theme.fonts.{regular,medium,semibold,bold}`, `theme.typography.{title,subtitle,body,caption,time}`, `theme.spacing.{xs:4,sm:8,md:16,lg:24,xl:32}`, `theme.radii.{sm:2,md:3,lg:4,pill:999}`. Never use `fontWeight`; always a `fontFamily` from `theme.fonts`. Direct token names only, never legacy aliases.
- Nothing in this plan counts, scores, streaks, colors a time as good or bad, or otherwise judges it. The wash is astronomical, never evaluative.
- `appMeta.timelineView` is optional in practice even though its TypeScript type isn't: `redux-persist` replaces the whole `appMeta` object on load, so an existing install's persisted blob won't have this key until it's been set once. Every read of it must be `state.appMeta.timelineView ?? "wall"` — never trust it raw. This is the exact same pattern `scrubberEnabled` already uses in `WallScreen.tsx`.
- `expo-linear-gradient`'s `colors`/`locations` props are typed as non-empty tuples (`readonly [T, T, ...T[]]`), not plain arrays — a function returning them needs an explicit tuple return type, or TypeScript will reject passing its result to `<LinearGradient>`. The prop names are `start`/`end` (each `{x,y}`), not `startPoint`/`endPoint`.
- No new native dependency — `expo-linear-gradient` is already installed.
- Run `npx tsc --noEmit` and `npx jest` yourself after every task. Do not start dev servers and do not drive the app — Metro is already running for the user; nothing in this plan needs a new native build.
- Baseline right now (verified before writing this plan): `npx tsc --noEmit` clean, `npx jest` 18 suites / 124 tests passing.
- Version bump touches `package.json`, `app.config.js` and `CHANGELOG.md`, in its own commit worded `bump to vX.Y.Z`, separate from feature commits. No git tags, no EAS builds, no GitHub releases.
- Commit messages end with the exact literal line `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` — never substitute a different model name, regardless of which model actually writes the commit.
- Code style matches the surrounding files: 2-space indent, double quotes, semicolons, `PascalCase` component filenames, `camelCase` util filenames.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/utils/dateFormat.ts` (+ `.test.ts`) | Adds `minuteOfDay`/`dayFraction` | 1 |
| `src/components/days/dayWash.ts` (+ test) | The wash's gradient color/location stops | 1 |
| `src/components/days/dayMarks.ts` (+ test) | Lays out one mark per photo, stacked within a group | 1 |
| `src/types/models.ts` | Adds `TimelineView = "wall" \| "days"` | 2 |
| `src/store/appMetaSlice.ts` (+ test) | Adds `timelineView` + `setTimelineView` | 2 |
| `src/store/selectors/groupSelectors.test.ts` | Fixture gains `timelineView` (type now requires it) | 2 |
| `src/components/days/DayBand.tsx` | One day: `DaySeam` label + gradient wash + marks + now-marker | 3 |
| `src/components/days/DaysBoard.tsx` | The Days body: a `FlatList` of `DayBand` | 4 |
| `src/components/wall/WallFeed.tsx` | The Wall body, extracted unchanged from `WallScreen.tsx` (FlashList + Scrubber), plus a pending-scroll handoff | 5 |
| `src/screens/WallScreen.tsx` | Becomes Home's shell: title, `Wall \| Days` toggle, settings icon, tag rail, conditional body, capture button | 6 |
| `src/components/settings/mergeWindowPreview.ts` (+ test) | Clusters recent entries by elapsed gap for the preview | 7 |
| `src/components/settings/MergeWindowPreview.tsx` | Renders the clustered dots | 7 |
| `src/screens/SettingsScreen.tsx` | Renders `MergeWindowPreview` under the rolling-window slider | 7 |
| `package.json`, `app.config.js`, `CHANGELOG.md` | Bump to 1.9.0 | 8 |

---

### Task 1: Days pure logic

**Files:**
- Modify: `src/utils/dateFormat.ts`
- Modify: `src/utils/dateFormat.test.ts`
- Create: `src/components/days/dayWash.ts`, `src/components/days/dayWash.test.ts`
- Create: `src/components/days/dayMarks.ts`, `src/components/days/dayMarks.test.ts`

**Interfaces:**
- Produces: `minuteOfDay(iso: string): number`, `dayFraction(iso: string): number` (both in `dateFormat.ts`, alongside the existing exports there); `dayWashGradient(): { colors: readonly [string, string, ...string[]]; locations: readonly [number, number, ...number[]] }`; `buildDayMarks(section: DaySection): DayMark[]` where `DayMark = { uri: string; x: number; stack: number }`. Tasks 3 and 4 consume all of these.
- Consumes: `DaySection`/`EntryGroup` from `src/store/selectors/groupSelectors.ts` (unchanged).

- [ ] **Step 1: Write the failing tests for `minuteOfDay`/`dayFraction`**

In `src/utils/dateFormat.test.ts`, add `minuteOfDay` and `dayFraction` to the import at the top:

```ts
import {
  dayKeyOf,
  dayLabel,
  formatTime,
  formatFullDateTime,
  formatDuration,
  minuteOfDay,
  dayFraction,
} from "./dateFormat";
```

Then add this `describe` block at the end of the file:

```ts

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
```

Run: `npx jest src/utils/dateFormat.test.ts`
Expected: FAIL — `minuteOfDay`/`dayFraction` are not exported from `./dateFormat`.

- [ ] **Step 2: Implement `minuteOfDay`/`dayFraction`**

In `src/utils/dateFormat.ts`, add at the end of the file:

```ts

export function minuteOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function dayFraction(iso: string): number {
  return minuteOfDay(iso) / 1440;
}
```

Run: `npx jest src/utils/dateFormat.test.ts` — expect PASS.

- [ ] **Step 3: Write the failing tests for `dayWashGradient`**

Create `src/components/days/dayWash.test.ts`:

```ts
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
```

Run: `npx jest src/components/days/dayWash.test.ts`
Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 4: Implement `dayWashGradient`**

Create `src/components/days/dayWash.ts`:

```ts
const NIGHT = "#12160F";
const DAY = "#2A3428";
const GLOW = "#4A3B28";

export type DayWashGradient = {
  colors: readonly [string, string, ...string[]];
  locations: readonly [number, number, ...number[]];
};

// A smooth astronomical wash across the day — night, a warm dawn, day, a
// warm dusk, night again — used as the Days view's band backdrop. Purely
// decorative: it never counts, scores, or judges a time.
export function dayWashGradient(): DayWashGradient {
  return {
    colors: [NIGHT, NIGHT, GLOW, DAY, DAY, GLOW, NIGHT, NIGHT],
    locations: [
      0,
      5 / 24,
      6 / 24,
      7 / 24,
      18 / 24,
      19 / 24,
      20 / 24,
      1,
    ],
  };
}
```

Run: `npx jest src/components/days/dayWash.test.ts` — expect PASS.

- [ ] **Step 5: Write the failing tests for `buildDayMarks`**

Create `src/components/days/dayMarks.test.ts`:

```ts
import { buildDayMarks } from "./dayMarks";
import { DaySection } from "../../store/selectors/groupSelectors";

function section(groups: DaySection["groups"]): DaySection {
  return { dayKey: "2026-03-05", groups };
}

describe("buildDayMarks", () => {
  it("gives one mark per photo, positioned by its entry's time of day", () => {
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e1",
              createdAt: new Date(2026, 2, 5, 12, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p1", uri: "a.jpg" }],
            },
          ],
          photosByEntry: [["a.jpg"]],
        },
      ]),
    );

    expect(marks).toEqual([{ uri: "a.jpg", x: 0.5, stack: 0 }]);
  });

  it("stacks every mark in a group instead of overlapping them", () => {
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e1",
              createdAt: new Date(2026, 2, 5, 8, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [
                { id: "p1", uri: "a.jpg" },
                { id: "p2", uri: "b.jpg" },
              ],
            },
            {
              id: "e2",
              createdAt: new Date(2026, 2, 5, 8, 5, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p3", uri: "c.jpg" }],
            },
          ],
          photosByEntry: [["a.jpg", "b.jpg"], ["c.jpg"]],
        },
      ]),
    );

    expect(marks.map((m) => m.stack)).toEqual([0, 1, 2]);
    expect(marks.map((m) => m.uri)).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("resets the stack for each new group", () => {
    const marks = buildDayMarks(
      section([
        {
          id: "g1",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e1",
              createdAt: new Date(2026, 2, 5, 8, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p1", uri: "a.jpg" }],
            },
          ],
          photosByEntry: [["a.jpg"]],
        },
        {
          id: "g2",
          dayKey: "2026-03-05",
          timeFrom: "",
          timeTo: "",
          entries: [
            {
              id: "e2",
              createdAt: new Date(2026, 2, 5, 19, 0, 0).toISOString(),
              comment: "",
              location: null,
              photos: [{ id: "p2", uri: "b.jpg" }],
            },
          ],
          photosByEntry: [["b.jpg"]],
        },
      ]),
    );

    expect(marks.map((m) => m.stack)).toEqual([0, 0]);
  });

  it("produces no marks for a day with no groups", () => {
    expect(buildDayMarks(section([]))).toEqual([]);
  });
});
```

Run: `npx jest src/components/days/dayMarks.test.ts`
Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 6: Implement `buildDayMarks`**

Create `src/components/days/dayMarks.ts`:

```ts
import { DaySection } from "../../store/selectors/groupSelectors";
import { dayFraction } from "../../utils/dateFormat";

export type DayMark = { uri: string; x: number; stack: number };

// One mark per photo, positioned by its own entry's time of day (photos
// don't carry their own timestamp). Entries bundled into the same
// rolling-window group sit close in time, so their marks stack vertically
// instead of overlapping — DayBand turns `stack` into a pixel offset.
export function buildDayMarks(section: DaySection): DayMark[] {
  const marks: DayMark[] = [];
  for (const group of section.groups) {
    let stack = 0;
    for (let i = 0; i < group.entries.length; i++) {
      const entry = group.entries[i];
      const photos = group.photosByEntry[i] ?? [];
      for (const uri of photos) {
        marks.push({ uri, x: dayFraction(entry.createdAt), stack });
        stack++;
      }
    }
  }
  return marks;
}
```

Run: `npx jest src/components/days/dayMarks.test.ts` — expect PASS.

- [ ] **Step 7: Type-check and run the full suite**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npx jest` — expect 20 suites / 135 tests passing (2 new suites — `dayWash.test.ts`, `dayMarks.test.ts` — and 11 more tests than the 124 baseline: 3 for minuteOfDay/dayFraction, 4 for dayWashGradient, 4 for buildDayMarks).

- [ ] **Step 8: Commit**

```bash
git add src/utils/dateFormat.ts src/utils/dateFormat.test.ts src/components/days/dayWash.ts src/components/days/dayWash.test.ts src/components/days/dayMarks.ts src/components/days/dayMarks.test.ts
git commit -m "feat: add the Days view's pure layout logic

Time-of-day fraction, the wash's gradient stops, and per-day mark
layout — all pure, all tested, no React Native involved yet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `timelineView` state

**Files:**
- Modify: `src/types/models.ts`
- Modify: `src/store/appMetaSlice.ts`
- Modify: `src/store/appMetaSlice.test.ts`
- Modify: `src/store/selectors/groupSelectors.test.ts`

**Interfaces:**
- Produces: `TimelineView = "wall" | "days"` (in `models.ts`); `setTimelineView(view: TimelineView)` action; `AppMetaState.timelineView: TimelineView`, defaulting to `"wall"` for fresh installs. Task 6 reads this with the `?? "wall"` fallback and dispatches `setTimelineView`.

- [ ] **Step 1: Add the `TimelineView` type**

In `src/types/models.ts`, replace:

```ts
export type GroupingMode = "rolling" | "day";
```

with:

```ts
export type GroupingMode = "rolling" | "day";

export type TimelineView = "wall" | "days";
```

- [ ] **Step 2: Write the failing tests**

Replace the full contents of `src/store/appMetaSlice.test.ts`:

```ts
import reducer, {
  markDefaultTagsSeeded,
  setScrubberEnabled,
  setTimelineView,
} from "./appMetaSlice";

describe("appMetaSlice", () => {
  it("starts with hasSeededDefaultTags false", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      hasSeededDefaultTags: false,
      scrubberEnabled: true,
      timelineView: "wall",
    });
  });

  it("markDefaultTagsSeeded flips the flag to true", () => {
    const state = reducer(
      {
        hasSeededDefaultTags: false,
        scrubberEnabled: true,
        timelineView: "wall",
      },
      markDefaultTagsSeeded(),
    );
    expect(state).toEqual({
      hasSeededDefaultTags: true,
      scrubberEnabled: true,
      timelineView: "wall",
    });
  });

  it("starts with the Wall scrubber enabled", () => {
    expect(reducer(undefined, { type: "@@INIT" }).scrubberEnabled).toBe(true);
  });

  it("setScrubberEnabled toggles the flag", () => {
    const state = reducer(
      {
        hasSeededDefaultTags: true,
        scrubberEnabled: true,
        timelineView: "wall",
      },
      setScrubberEnabled(false),
    );
    expect(state).toEqual({
      hasSeededDefaultTags: true,
      scrubberEnabled: false,
      timelineView: "wall",
    });
  });

  it("starts on the Wall view", () => {
    expect(reducer(undefined, { type: "@@INIT" }).timelineView).toBe("wall");
  });

  it("setTimelineView switches to Days", () => {
    const state = reducer(
      {
        hasSeededDefaultTags: true,
        scrubberEnabled: true,
        timelineView: "wall",
      },
      setTimelineView("days"),
    );
    expect(state.timelineView).toBe("days");
  });
});
```

Run: `npx jest src/store/appMetaSlice.test.ts`
Expected: FAIL — `setTimelineView` is not exported, and the default-state assertions include a `timelineView` key the reducer doesn't produce yet.

- [ ] **Step 3: Implement it**

Replace the full contents of `src/store/appMetaSlice.ts`:

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimelineView } from "../types/models";

export type AppMetaState = {
  hasSeededDefaultTags: boolean;
  // Wall's day scrubber. Not a Settings row (the spec keeps Settings at
  // exactly five), so it lives here like other persisted UI state that
  // isn't a real user-facing setting.
  scrubberEnabled: boolean;
  // Home's Wall/Days toggle — same reasoning as scrubberEnabled above.
  timelineView: TimelineView;
};

const initialState: AppMetaState = {
  hasSeededDefaultTags: false,
  scrubberEnabled: true,
  timelineView: "wall",
};

const appMetaSlice = createSlice({
  name: "appMeta",
  initialState,
  reducers: {
    markDefaultTagsSeeded(state) {
      state.hasSeededDefaultTags = true;
    },
    setScrubberEnabled(state, action: PayloadAction<boolean>) {
      state.scrubberEnabled = action.payload;
    },
    setTimelineView(state, action: PayloadAction<TimelineView>) {
      state.timelineView = action.payload;
    },
  },
});

export const { markDefaultTagsSeeded, setScrubberEnabled, setTimelineView } =
  appMetaSlice.actions;
export default appMetaSlice.reducer;
```

Run: `npx jest src/store/appMetaSlice.test.ts` — expect PASS.

- [ ] **Step 4: Fix `groupSelectors.test.ts`'s fixture**

`AppMetaState` now requires `timelineView`, so the `RootState` literal this test file builds no longer type-checks. In `src/store/selectors/groupSelectors.test.ts`, replace:

```ts
    appMeta: { hasSeededDefaultTags: true, scrubberEnabled: false },
```

with:

```ts
    appMeta: {
      hasSeededDefaultTags: true,
      scrubberEnabled: false,
      timelineView: "wall",
    },
```

- [ ] **Step 5: Type-check and run the full suite**

Run: `npx tsc --noEmit` — expect no errors (this step's Step 4 fix is exactly what clears the type error `AppMetaState` would otherwise cause here).
Run: `npx jest` — expect 20 suites / 137 tests passing (2 more than Task 1's 135: `appMetaSlice.test.ts` gained 2 new cases, one test file's fixture changed but no test count change from that).

- [ ] **Step 6: Commit**

```bash
git add src/types/models.ts src/store/appMetaSlice.ts src/store/appMetaSlice.test.ts src/store/selectors/groupSelectors.test.ts
git commit -m "feat: add timelineView to appMeta

Home's Wall/Days toggle persists here, alongside the scrubber's own
enabled flag, for the same reason: it's UI state, not a Settings row.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `DayBand`

**Files:**
- Create: `src/components/days/DayBand.tsx`

**Interfaces:**
- Consumes: `DaySection` (from `groupSelectors.ts`, unchanged), `buildDayMarks`/`DayMark` (Task 1), `dayWashGradient` (Task 1), `dayFraction` (Task 1), `DaySeam` (unchanged, from `../wall/DaySeam`).
- Produces: `DayBand({ section, label, isToday, onPress }: Props)`. Task 4 renders one per day.

- [ ] **Step 1: Write the component**

Create `src/components/days/DayBand.tsx`:

```tsx
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { DaySection } from "../../store/selectors/groupSelectors";
import { buildDayMarks } from "./dayMarks";
import { dayWashGradient } from "./dayWash";
import { dayFraction } from "../../utils/dateFormat";
import { DaySeam } from "../wall/DaySeam";
import { theme } from "../../theme/theme";

const TODAY_MARK_SIZE = 48;
const PAST_MARK_SIZE = 28;
const MARK_GAP = 4;

type Props = {
  section: DaySection;
  label: string;
  isToday: boolean;
  onPress: (dayKey: string) => void;
};

// One day: its name (DaySeam, matching the Wall's own day headers), a
// smooth astronomical wash, and a mark per photo at its true time. Tapping
// anywhere on the band opens the Wall scrolled to this day — there's no
// separate Day sheet, and no hero photo, since the Wall is one tap away.
export function DayBand({ section, label, isToday, onPress }: Props) {
  const marks = buildDayMarks(section);
  const markSize = isToday ? TODAY_MARK_SIZE : PAST_MARK_SIZE;
  const maxStack = marks.reduce((max, mark) => Math.max(max, mark.stack), 0);
  const bandHeight = MARK_GAP + (maxStack + 1) * (markSize + MARK_GAP);
  const wash = dayWashGradient();
  const nowX = isToday ? dayFraction(new Date().toISOString()) : null;

  return (
    <Pressable onPress={() => onPress(section.dayKey)}>
      <DaySeam label={label} />
      <View style={[styles.band, { height: bandHeight }]}>
        <LinearGradient
          colors={wash.colors}
          locations={wash.locations}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {marks.map((mark, index) => (
          <Image
            key={`${mark.uri}-${index}`}
            source={{ uri: mark.uri }}
            style={[
              styles.mark,
              {
                width: markSize,
                height: markSize,
                left: `${mark.x * 100}%`,
                marginLeft: -markSize / 2,
                bottom: MARK_GAP + mark.stack * (markSize + MARK_GAP),
              },
            ]}
            contentFit="cover"
          />
        ))}
        {nowX !== null ? (
          <View style={[styles.now, { left: `${nowX * 100}%` }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  band: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
  },
  mark: {
    position: "absolute",
    backgroundColor: theme.colors.seam,
  },
  now: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: theme.colors.bone,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 3: Run the test suite**

Run: `npx jest` — expect 20 suites / 137 tests passing — unchanged (this task touches no test file).

- [ ] **Step 4: Commit**

```bash
git add src/components/days/DayBand.tsx
git commit -m "feat: add the DayBand component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `DaysBoard`

**Files:**
- Create: `src/components/days/DaysBoard.tsx`

**Interfaces:**
- Consumes: `DaySection[]` (from `selectFeedSections`, unchanged), `DayBand` (Task 3), `dayKeyOf`/`dayLabel` (unchanged, from `../../utils/dateFormat`).
- Produces: `DaysBoard({ sections, onPressDay }: Props)`. Task 6 renders this as Days' body.

- [ ] **Step 1: Write the component**

Create `src/components/days/DaysBoard.tsx`:

```tsx
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { DaySection } from "../../store/selectors/groupSelectors";
import { dayKeyOf, dayLabel } from "../../utils/dateFormat";
import { DayBand } from "./DayBand";
import { theme } from "../../theme/theme";

type Props = {
  sections: DaySection[];
  onPressDay: (dayKey: string) => void;
};

// The Days body: one DayBand per day, newest first (sections already arrive
// sorted that way from selectFeedSections). A plain FlatList is enough —
// there are far fewer day-bands than Wall pieces, so FlashList's
// virtualization isn't needed here.
export function DaysBoard({ sections, onPressDay }: Props) {
  const todayKey = dayKeyOf(new Date().toISOString());

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.dayKey}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <DayBand
          section={item}
          label={dayLabel(item.dayKey)}
          isToday={item.dayKey === todayKey}
          onPress={onPressDay}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 3: Run the test suite**

Run: `npx jest` — expect 20 suites / 137 tests passing — unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/days/DaysBoard.tsx
git commit -m "feat: add the DaysBoard component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Extract `WallFeed`

**Files:**
- Create: `src/components/wall/WallFeed.tsx`

**Interfaces:**
- Consumes: `WallItem`, `firstItemIndexForDay`, `currentDayFromViewableItems` (unchanged, from `../../utils/wallItems`); `WallPiece`, `DaySeam`, `Scrubber` (all unchanged); `Tag` (from `../../types/models`).
- Produces: `WallFeed({ items, dayKeys, tagsById, wallColumns, scrubberEnabled, onPressEntry, pendingScrollDayKey, onScrolledToDay }: Props)` — everything `WallScreen.tsx`'s current FlashList+Scrubber block does today, unchanged, plus one new behavior: when `pendingScrollDayKey` becomes non-null, it scrolls to that day once (the same way the Scrubber already does) and calls `onScrolledToDay()`. Task 6 renders this as Wall's body and supplies `pendingScrollDayKey` when a Days tap asks to jump to a day.

This task is a pure extraction — the FlashList/Scrubber code and its behavior are unchanged from `WallScreen.tsx`'s current implementation, just moved into their own file with one addition (the pending-scroll effect). Nothing in `WallScreen.tsx` is edited yet — Task 6 does that, once this file exists to import.

- [ ] **Step 1: Write the component**

Create `src/components/wall/WallFeed.tsx`:

```tsx
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  FlashList,
  FlashListRef,
  ListRenderItemInfo,
  ViewToken,
} from "@shopify/flash-list";
import { WallPiece } from "./WallPiece";
import { DaySeam } from "./DaySeam";
import { Scrubber } from "./Scrubber";
import {
  WallItem,
  firstItemIndexForDay,
  currentDayFromViewableItems,
} from "../../utils/wallItems";
import { Tag } from "../../types/models";
import { theme } from "../../theme/theme";

type Props = {
  items: WallItem[];
  dayKeys: string[];
  tagsById: Record<string, Tag>;
  wallColumns: number;
  scrubberEnabled: boolean;
  onPressEntry: (entryId: string) => void;
  // Set by a Days-view tap asking to jump to a day; cleared via
  // onScrolledToDay once this feed has scrolled there.
  pendingScrollDayKey: string | null;
  onScrolledToDay: () => void;
};

export function WallFeed({
  items,
  dayKeys,
  tagsById,
  wallColumns,
  scrubberEnabled,
  onPressEntry,
  pendingScrollDayKey,
  onScrolledToDay,
}: Props) {
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const listRef = useRef<FlashListRef<WallItem>>(null);

  function scrollToDay(dayKey: string) {
    const index = firstItemIndexForDay(items, dayKey);
    if (index < 0) return;
    // Not animated: the Scrubber calls this to track a drag in progress,
    // so the list should jump to each new target immediately. An animated
    // scroll interpolates over time, and a drag can re-target this well
    // before the previous animation finishes — repeatedly interrupting and
    // re-easing is what made the scrubber visibly fight itself.
    listRef.current?.scrollToIndex({ index, animated: false }).catch(() => {
      // The row may not have a measured position yet on the first attempt —
      // one retry after a frame is enough for FlashList to have settled.
      requestAnimationFrame(() => {
        listRef.current
          ?.scrollToIndex({ index, animated: false })
          .catch(() => {});
      });
    });
  }

  useEffect(() => {
    if (!pendingScrollDayKey) return;
    scrollToDay(pendingScrollDayKey);
    onScrolledToDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScrollDayKey, items]);

  function handleViewableItemsChanged({
    viewableItems,
  }: {
    viewableItems: ViewToken<WallItem>[];
  }) {
    const indices = viewableItems
      .map((token) => token.index)
      .filter((index): index is number => index !== null);
    setActiveDayKey(currentDayFromViewableItems(items, indices));
  }

  function renderItem({ item }: ListRenderItemInfo<WallItem>) {
    if (item.type === "day") {
      return <DaySeam label={item.label} />;
    }
    return (
      <WallPiece
        group={item.group}
        tagsById={tagsById}
        wallColumns={wallColumns}
        onPressEntry={onPressEntry}
      />
    );
  }

  return (
    <View style={styles.body}>
      <FlashList
        ref={listRef}
        style={styles.list}
        data={items}
        // The custom Scrubber is the Wall's scroll indicator when it's
        // on; the native one would just double up on the same edge.
        // Falls back to the native one if the Scrubber's ever off.
        showsVerticalScrollIndicator={!scrubberEnabled}
        keyExtractor={(item) =>
          item.type === "day" ? `day-${item.dayKey}` : item.group.id
        }
        getItemType={(item) => item.type}
        renderItem={renderItem}
        onViewableItemsChanged={handleViewableItemsChanged}
        contentContainerStyle={styles.listContent}
        // Off: it's meant for chat-like screens where content is
        // prepended above/below an anchor. Enabled (FlashList's
        // default), it reacts to redux-persist's entries hydrating
        // just after mount — data going empty-to-populated reads as
        // "content added above" — by reserving blank leading space
        // meant to hold scroll position for a scroll that never
        // happened.
        maintainVisibleContentPosition={{ disabled: true }}
      />
      {scrubberEnabled ? (
        <Scrubber
          dayKeys={dayKeys}
          activeDayKey={activeDayKey}
          onSelectDay={scrollToDay}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    flexDirection: "row",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: **one error is expected and fine** — `src/screens/WallScreen.tsx` still has its own copy of this exact FlashList code, which is harmless duplication but does NOT itself produce a type error (both copies independently compile). If `tsc` reports anything, it should only be about files this task didn't touch; if it's clean, that's fine too. Note what you see in your report either way — don't try to fix `WallScreen.tsx` in this task, Task 6 replaces it wholesale.

- [ ] **Step 3: Run the test suite**

Run: `npx jest` — expect 20 suites / 137 tests passing — unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/wall/WallFeed.tsx
git commit -m "feat: extract WallFeed from WallScreen

Same FlashList/Scrubber body as before, unchanged, now its own component
so Home can put it behind a Wall/Days toggle — plus a pending-scroll
handoff for when a Days tap asks to jump to a day, using the exact same
scroll-to-index logic the Scrubber already relies on.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `WallScreen` becomes Home's shell

**Files:**
- Modify: `src/screens/WallScreen.tsx`

**Interfaces:**
- Consumes: `WallFeed` (Task 5), `DaysBoard` (Task 4), `setTimelineView` (Task 2), `TimelineView` (Task 2), `SegmentedControl` (unchanged, from `../components/SegmentedControl`), `TagFilterRail` (unchanged).
- Produces: `WallScreen()` unchanged export name/signature — still the `"Home"` route's component.

- [ ] **Step 1: Rewrite the screen**

Replace the full contents of `src/screens/WallScreen.tsx`:

```tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { selectFeedSections } from "../store/selectors/groupSelectors";
import { setTimelineView } from "../store/appMetaSlice";
import { buildWallItems } from "../utils/wallItems";
import { WallFeed } from "../components/wall/WallFeed";
import { TagFilterRail } from "../components/wall/TagFilterRail";
import { DaysBoard } from "../components/days/DaysBoard";
import { SegmentedControl } from "../components/SegmentedControl";
import { TimelineView } from "../types/models";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export function WallScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [pendingScrollDayKey, setPendingScrollDayKey] = useState<
    string | null
  >(null);

  const sections = useAppSelector((state) =>
    selectFeedSections(state, activeTagId),
  );
  const tagsById = useAppSelector((state) => state.tags);
  const wallColumns = useAppSelector((state) => state.settings.wallColumns);
  // redux-persist replaces the whole appMeta object on load, so an existing
  // install without this key would read undefined — never trust it raw.
  const scrubberEnabled = useAppSelector(
    (state) => state.appMeta.scrubberEnabled ?? true,
  );
  const timelineView = useAppSelector(
    (state) => state.appMeta.timelineView ?? "wall",
  );

  const items = useMemo(() => buildWallItems(sections), [sections]);
  const dayKeys = useMemo(
    () => sections.map((section) => section.dayKey),
    [sections],
  );

  function goToWallDay(dayKey: string) {
    setPendingScrollDayKey(dayKey);
    dispatch(setTimelineView("wall"));
  }

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}
      >
        <Text style={styles.title} numberOfLines={1}>
          What did I eat
        </Text>
        <View style={styles.headerControls}>
          <View style={styles.toggleWrap}>
            <SegmentedControl
              value={timelineView}
              options={[
                { value: "wall", label: "Wall" },
                { value: "days", label: "Days" },
              ]}
              onChange={(value) =>
                dispatch(setTimelineView(value as TimelineView))
              }
            />
          </View>
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={styles.settingsButton}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={theme.colors.chalk}
            />
          </Pressable>
        </View>
      </View>

      <TagFilterRail activeTagId={activeTagId} onSelect={setActiveTagId} />

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Nothing {timelineView === "wall" ? "on the wall" : "here"} yet
          </Text>
          <Text style={styles.emptyBody}>
            Photograph the next thing you eat.
          </Text>
        </View>
      ) : timelineView === "wall" ? (
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
        />
      ) : (
        <DaysBoard sections={sections} onPressDay={goToWallDay} />
      )}

      <Pressable
        onPress={() => navigation.navigate("NewEntry")}
        style={[
          styles.captureButton,
          { marginBottom: insets.bottom + theme.spacing.md },
        ]}
      >
        <Ionicons name="camera" size={17} color={theme.colors.wall} />
        <Text style={styles.captureLabel}>Hang a new one</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.wall,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.subtitle,
    color: theme.colors.bone,
    flexShrink: 1,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  toggleWrap: {
    width: 140,
  },
  settingsButton: {
    padding: theme.spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.bone,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.chalk,
    textAlign: "center",
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    height: 48,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.bone,
  },
  captureLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.wall,
  },
});
```

Note: `toggleWrap`'s fixed `width: 140` exists because `SegmentedControl` has no `style` prop of its own (it always fills whatever width its parent gives it) — wrapping it in a fixed-width `View` is how every other place sizes it inside a row-flex header, since the header would otherwise give the control no explicit width to divide between its two segments.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit` — expect no errors (this clears the "expected" note from Task 5's Step 2, since the old duplicate FlashList code is now gone from this file).

- [ ] **Step 3: Run the test suite**

Run: `npx jest` — expect 20 suites / 137 tests passing — unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/screens/WallScreen.tsx
git commit -m "feat: add the Days view and a Wall/Days toggle to Home

Home's header gains a Wall/Days segmented control next to the settings
icon. Days renders one astronomical-wash band per day with a mark per
photo at its true time; tapping a band switches back to Wall scrolled to
that day, reusing the exact scroll-to-index logic the Scrubber already
uses. The Wall body itself (WallFeed) is unchanged from before this plan.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Merge-window preview in Settings

**Files:**
- Create: `src/components/settings/mergeWindowPreview.ts`, `src/components/settings/mergeWindowPreview.test.ts`
- Create: `src/components/settings/MergeWindowPreview.tsx`
- Modify: `src/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `Entry` (from `../../types/models`), `selectEntriesSortedByDate` (unchanged, from `../../store/selectors/groupSelectors`).
- Produces: `previewGroups(entries: Entry[], rollingWindowMinutes: number): Entry[][]`; `MergeWindowPreview({ rollingWindowMinutes }: Props)`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/settings/mergeWindowPreview.test.ts`:

```ts
import { previewGroups } from "./mergeWindowPreview";
import { Entry } from "../../types/models";

function entry(id: string, iso: string): Entry {
  return { id, createdAt: iso, comment: "", location: null, photos: [] };
}

describe("previewGroups", () => {
  it("returns no groups for no entries", () => {
    expect(previewGroups([], 60)).toEqual([]);
  });

  it("puts entries closer together than the window in one group", () => {
    const a = entry("a", new Date(2026, 2, 5, 12, 0, 0).toISOString());
    const b = entry("b", new Date(2026, 2, 5, 12, 10, 0).toISOString());
    const groups = previewGroups([a, b], 60);
    expect(groups).toEqual([[a, b]]);
  });

  it("splits entries further apart than the window into separate groups", () => {
    const a = entry("a", new Date(2026, 2, 5, 8, 0, 0).toISOString());
    const b = entry("b", new Date(2026, 2, 5, 12, 0, 0).toISOString());
    const groups = previewGroups([a, b], 60);
    expect(groups).toEqual([[a], [b]]);
  });

  it("chains three close-together entries into one group", () => {
    const a = entry("a", new Date(2026, 2, 5, 8, 0, 0).toISOString());
    const b = entry("b", new Date(2026, 2, 5, 8, 20, 0).toISOString());
    const c = entry("c", new Date(2026, 2, 5, 8, 40, 0).toISOString());
    const groups = previewGroups([a, b, c], 30);
    expect(groups).toEqual([[a, b, c]]);
  });
});
```

Run: `npx jest src/components/settings/mergeWindowPreview.test.ts`
Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 2: Implement `previewGroups`**

Create `src/components/settings/mergeWindowPreview.ts`:

```ts
import { Entry } from "../../types/models";

// Clusters entries by elapsed gap alone, ascending by time, ignoring day
// boundaries — a decorative preview of the rolling-window control, not a
// re-implementation of groupSelectors.ts's actual day-scoped grouping.
export function previewGroups(
  entries: Entry[],
  rollingWindowMinutes: number,
): Entry[][] {
  if (entries.length === 0) return [];

  const windowMs = rollingWindowMinutes * 60_000;
  const groups: Entry[][] = [];
  let current: Entry[] = [entries[0]];

  for (let i = 1; i < entries.length; i++) {
    const prev = current[current.length - 1];
    const gap =
      new Date(entries[i].createdAt).getTime() -
      new Date(prev.createdAt).getTime();
    if (gap <= windowMs) {
      current.push(entries[i]);
    } else {
      groups.push(current);
      current = [entries[i]];
    }
  }
  groups.push(current);
  return groups;
}
```

Run: `npx jest src/components/settings/mergeWindowPreview.test.ts` — expect PASS.

- [ ] **Step 3: Write the component**

Create `src/components/settings/MergeWindowPreview.tsx`:

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppSelector } from "../../store/hooks";
import { selectEntriesSortedByDate } from "../../store/selectors/groupSelectors";
import { previewGroups } from "./mergeWindowPreview";
import { theme } from "../../theme/theme";

const PREVIEW_COUNT = 10;

type Props = {
  rollingWindowMinutes: number;
};

// A live preview of the merge window: the user's most recent entries as
// dots, clustered into the pills they'd actually merge into at the
// current slider value. Updates on every drag, since rollingWindowMinutes
// is passed straight from Settings' own live state.
export function MergeWindowPreview({ rollingWindowMinutes }: Props) {
  const sorted = useAppSelector(selectEntriesSortedByDate);
  const recent = sorted.slice(-PREVIEW_COUNT);

  if (recent.length < 2) {
    return <Text style={styles.hint}>Log a few meals to preview this.</Text>;
  }

  const groups = previewGroups(recent, rollingWindowMinutes);

  return (
    <View style={styles.row}>
      {groups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.group}>
          {group.map((entry) => (
            <View key={entry.id} style={styles.dot} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.seam,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.brass,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    marginTop: theme.spacing.sm,
  },
});
```

- [ ] **Step 4: Wire it into Settings**

In `src/screens/SettingsScreen.tsx`, replace:

```tsx
import { formatDuration } from "../utils/dateFormat";
```

with:

```tsx
import { formatDuration } from "../utils/dateFormat";
import { MergeWindowPreview } from "../components/settings/MergeWindowPreview";
```

Then replace:

```tsx
          <Slider
            minimumValue={30}
            maximumValue={240}
            step={15}
            value={rollingWindowMinutes}
            minimumTrackTintColor={theme.colors.brass}
            maximumTrackTintColor={theme.colors.chalk}
            onValueChange={(value) => dispatch(setRollingWindowMinutes(value))}
          />
        </View>
      ) : null}
```

with:

```tsx
          <Slider
            minimumValue={30}
            maximumValue={240}
            step={15}
            value={rollingWindowMinutes}
            minimumTrackTintColor={theme.colors.brass}
            maximumTrackTintColor={theme.colors.chalk}
            onValueChange={(value) => dispatch(setRollingWindowMinutes(value))}
          />
          <MergeWindowPreview rollingWindowMinutes={rollingWindowMinutes} />
        </View>
      ) : null}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 6: Run the full suite**

Run: `npx jest` — expect 21 suites / 141 tests passing (1 more suite, 4 more tests than the 137 baseline).

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/mergeWindowPreview.ts src/components/settings/mergeWindowPreview.test.ts src/components/settings/MergeWindowPreview.tsx src/screens/SettingsScreen.tsx
git commit -m "feat: add a live merge-window preview to Settings

Shows the most recent entries as dots, clustered into the pills they'd
actually merge into at the current slider value — updates live as you
drag, same as the slider itself has since 1.7.1.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Version bump

**Files:**
- Modify: `package.json`
- Modify: `app.config.js`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the finished states of Tasks 1-7 (this task only describes them in the changelog; it changes no code).

- [ ] **Step 1: Bump `package.json`**

In `package.json`, replace:

```json
  "version": "1.8.1",
```

with:

```json
  "version": "1.9.0",
```

- [ ] **Step 2: Bump `app.config.js`**

In `app.config.js`, replace:

```js
    version: '1.8.1',
```

with:

```js
    version: '1.9.0',
```

- [ ] **Step 3: Add the CHANGELOG entry**

In `CHANGELOG.md`, replace:

```markdown
## [Unreleased]

## [1.8.1] - 2026-09-19
```

with:

```markdown
## [Unreleased]

## [1.9.0] - 2026-09-19

Step 5 of the Wall redesign. Same dev build as 1.5.0 — no native changes.

### Added

- Days: a second way to see your timeline, one astronomical-wash band per
  day with a mark for every photo at its true time of day. Reach it with
  a new Wall/Days toggle in Home's header; tapping a day's band switches
  back to Wall, scrolled to that day.
- Settings' merge-window slider now shows a live preview: your most
  recent entries as dots, grouped into the pills they'd actually merge
  into at the current window.

## [1.8.1] - 2026-09-19
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 5: Run the test suite**

Run: `npx jest` — expect 21 suites / 141 tests passing — unchanged.

- [ ] **Step 6: Commit**

```bash
git add package.json app.config.js CHANGELOG.md
git commit -m "bump to v1.9.0

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Manual test plan (give this to the user after Task 8)

On the existing dev client, over the same LAN Metro session:

1. On the Wall, confirm a new `Wall | Days` toggle sits in the header, between the title and the settings icon. Tap "Days".
2. Confirm one band per day, newest first, each with a smooth dark-to-lighter-to-dark wash running left to right (midnight on the left, noon in the middle, midnight again on the right) and a day-name header above it matching the Wall's own day headers.
3. Confirm photo marks sit at roughly the right spot along today's band (e.g. a lunch photo sits noticeably right-of-center) and that today's marks are visibly bigger than past days' marks. Confirm today's band shows a thin vertical line at roughly the current time.
4. Log (or find) two photos taken close together — confirm their marks stack vertically instead of overlapping.
5. Tap anywhere on a day's band — confirm it switches back to Wall, already scrolled to that day.
6. Apply a tag filter on the Wall, then switch to Days — confirm only matching photos' marks remain, and confirm switching back to Wall keeps the same filter active.
7. Open Settings — confirm a row of dots appears under the merge-window slider (if you have at least two logged entries), grouped into small pill backgrounds. Drag the slider and confirm the grouping updates live — widening the window should merge previously-separate dots into one pill.
