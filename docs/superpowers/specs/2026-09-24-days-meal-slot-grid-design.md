# Days view: meal-slot grid — design

Date: 2026-09-24. Baseline version: 2.4.0.

Mockups (round 1, row 1; round 2, row 1 — "1_MealSlot_*" boards):
https://claude.ai/artifact/WYDq9LHqAH6YJQetQpr5Zh

## Why

The current Days view (`DaysBoard`/`DayBand`/`dayMarks.ts`) places one mark
per photo on a 00:00–24:00 axis per day. A busy day makes the band grow a
row taller per overlapping photo, which stretches unpredictably and starts
to read as a bar chart (a count in disguise). This replaces that layout.
`dayWash.ts`'s astronomical gradient and the Days hero are untouched by this
spec — out of scope, decide separately.

## Goal

One row per day, **fixed height regardless of how much was logged**. Columns
are named time-of-day slots. A cell's photos render as a small mosaic whose
grid gets finer as the meal's photo count rises — density is shown as
texture, never as a number, a red color, or a badge.

## Unit: the meal, not the photo

Placing individual photos (the current bug) breaks under a dense burst — 20
photos in one sitting either overflow a cell or force it to grow. The unit
here is one **meal**, i.e. one `EntryGroup` from
`selectFeedSections`/`groupSelectors.ts` (`src/store/selectors/groupSelectors.ts`).
That selector already does exactly the grouping this view needs — respects
`groupingMode`/`rollingWindowMinutes`, applies the tag filter before
grouping, and gives each group `timeFrom`, `timeTo`, and
`photosByEntry: string[][]` (already-resolved photo URIs). **No new
grouping logic is needed** — flatten `photosByEntry` for a group's photo
count and hue/thumbnail source.

## Layout

- One row per `DaySection`, newest first (`selectFeedSections` already
  sorts this way).
- A left label column (~64dp) with the day's label (`dayLabel(dayKey)`).
- Five slot columns, fixed square cells (~52dp, 8dp gutter), pinned header
  row showing the slot names.
- Row height = cell height. It never grows.

### Slot boundaries (new)

Nothing in the codebase currently defines time-of-day zone edges — the
`dayWash.ts` gradient has its own zone edges but they're for color, not
bucketing, and `windowTitle.ts`/`computeWindowTitle` were retired before
being built (see `docs/superpowers/references/2026-09-17-meal-window-naming-reference.md`,
which is unimplemented inspiration, not a spec). This view needs a new
small pure function, e.g. `slotIndexForHour(hour: number): 0-4`, exercised
against the mockup's five bounds as a starting point:

| index | label | bounds |
|---|---|---|
| 0 | Morning | 05:00–08:30 |
| 1 | Midday | 08:30–11:30 |
| 2 | Afternoon | 11:30–16:30 |
| 3 | Evening | 16:30–21:30 |
| 4 | Late | 21:30–05:00 (wraps past midnight) |

These exact hours are a placeholder from the mockup, not a decision — worth
a quick sanity check against real usage (the production screenshots this
redesign started from) before locking them in.

**A meal is placed by its start time** (`slotIndexForHour` on
`group.timeFrom`), so one sitting never splits across two cells even if it
runs long.

## Density: the mosaic

Given a cell's meal-group(s) and their total photo count `n`:

| n | grid |
|---|---|
| 0 | empty cell (`surface` fill, no tiles) |
| 1 | one tile, fills the cell |
| 2–4 | 2×2 |
| 5–9 | 3×3 |
| 10+ | 4×4, capped — show 16 of the photos |

Tile photos in time order; for the capped case, prefer a spread across the
meal's span (first, middle, last) over "first 16", so the sample is
representative — this needs a small helper, not just `.slice(0, 16)`.
`squareGridLayout.ts` already does equal-square tiling for the Wall; check
whether it can be reused or adapted here rather than writing a second
mosaic implementation from scratch.

If two or more meals land in the same slot (e.g. two snacks both "Late"),
sum their photo counts for the density calculation and tile all their
photos together, oldest first.

### Spillover marker

If a meal's `timeTo` crosses its slot's own upper boundary (not relevant to
the last slot, which wraps), show a small dot at the cell's right edge —
**use `pine` (`theme.colors.pine`), not `accent`**. Per `theme.ts`, `accent`
is reserved for interactive/selected state (active tag, selected, thumb);
this dot is purely decorative, the same role `pine`/`sun` already play in
the wash and scrubber ticks. (The round-2 mockup used `accent` for this —
that was a shortcut for the mockup, not a recommendation.)

## States to hit (see the mockup's 5 columns per concept)

- **Empty**: no entries ever. Slot header row + one empty "Today" row +
  the app's existing empty-state treatment (icon + copy), not a bespoke one.
- **Few**: a handful of entries across 1–2 days.
- **Many**: a full history, several days, mixed density per slot.
- **Overdo**: one slot's cell maxes out to the densest 4×4 texture next to
  otherwise-ordinary single-tile cells on the same or an adjacent day. This
  is the case the user specifically wants legible — "when did I overeat" —
  so it deserves a look during implementation with a real dense fixture,
  not just the mock's synthetic burst.
- **Border**: a meal that starts in one slot and runs into the next,
  exercising the spillover marker.

## Interaction

Unchanged from the existing Days spec's principle ("no separate Day
sheet"): tapping opens the Wall. Open question for whoever implements this:
does tapping a **cell** jump to the Wall scrolled to that meal specifically
(nicer, since the grid already knows which meal you tapped), or does the
whole **row** stay the tap target like today's `DayBand` (simpler, reuses
existing day-scroll wiring)? Recommendation: per-cell, since unlike the old
per-photo marks, a cell now always maps to exactly one meal (or an ordered
few) — this is strictly nicer to expose than the current whole-band tap, at
low extra cost (see `entryForPhotoIndex.ts` for the existing "index" pattern
this could mirror, per group instead of per photo).

## Non-goals

No counts, badges, "+N" labels, percentages, or colors that judge a time
(no red). Nothing here should be readable as a calorie or portion score —
the mosaic shows *that* a lot happened, never *how much is too much*.

## Touch points (files likely involved)

- New: a slot-boundary util (pure, testable like `dayFraction`/
  `minuteOfDay` in `dateFormat.ts`), a density-mosaic helper, a `DayGridRow`
  component.
- Replaces: `DayBand.tsx`, `dayMarks.ts` (and its test) — `dayWash.ts` and
  `DaysHero.tsx` are unaffected, out of scope here.
- `DaysBoard.tsx` swaps `DayBand` for the new row component; its `FlatList`
  usage and hero handling stay as-is.
