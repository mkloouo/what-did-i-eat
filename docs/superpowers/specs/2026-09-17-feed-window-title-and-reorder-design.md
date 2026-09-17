# Feed Window Titles & Newest-First Ordering — Design

## Context

Feed cards currently show an entry-count badge plus the first (chronologically
oldest) entry's comment as the card's headline, with a timeline rail showing
`timeFrom` (oldest) on top and `timeTo` (newest) on the bottom. The comment is
also the primary driver of "entries[0]" ordering, which in turn decides which
photo `PhotoStack` renders as its full-width primary tile.

This design does two things:

1. Replaces the card's headline with a dynamically generated "window title"
   (e.g. "Morning Breakfast", "Midday Quick Bite") instead of the comment,
   inspired by the reference doc at
   `docs/superpowers/references/2026-09-17-meal-window-naming-reference.md`.
2. Reverses entry/timeline ordering within a group so the newest entry comes
   first throughout, rather than the oldest.

The comment/tags themselves are unaffected — they continue to display exactly
where they already do today, in `GroupDetailsScreen` and `PhotoDetailsScreen`.

## Out of scope

- The reference doc's location-pill formatting (its section 3) — not designed
  here, no location signal is currently surfaced on feed cards.
- The reference doc's "ambiguous/non-traditional times" bucket (its section
  2.3, e.g. "Workdesk Grazing", "Sunday Feast") — these need signals (day of
  week, location, historical pattern) this app doesn't compute; deferred.
- Any change to `GroupingMode` (`'rolling' | 'day'`) itself, or a new
  "Traditional Meal Slots" mode the reference doc alludes to.

## Window title algorithm

A new pure function `computeWindowTitle(input)` in a new
`src/utils/windowTitle.ts`:

```ts
type WindowTitleInput = {
  entryCount: number;
  timeFromIso: string; // chronologically earliest entry's createdAt
  timeToIso: string;   // chronologically latest entry's createdAt
};

function computeWindowTitle(input: WindowTitleInput): string;
```

### Time buckets

Eight buckets, chosen by which one contains `timeFromIso`'s local
time-of-day. Each has a **period label** (used to compose short/extended
titles) and a **base title** (used as-is otherwise). The last bucket wraps
past midnight.

| Start–End (local) | Period label | Meal noun | Base title |
| --- | --- | --- | --- |
| 05:00–08:30 | Early Morning | Awakening | Early Morning Awakening |
| 08:30–11:30 | Morning | Breakfast | Morning Breakfast |
| 11:30–14:00 | Midday | Lunch | Midday Lunch |
| 14:00–16:30 | Afternoon | Coffee | Afternoon Bite & Coffee |
| 16:30–18:30 | Late Afternoon | Grazing | Late Afternoon Grazing |
| 18:30–21:30 | Evening | Dinner | Evening Dinner |
| 21:30–00:00 | Late Evening | Nibble | Late Evening Nibble |
| 00:00–05:00 | Night | Kitchen | Night Owl Kitchen |

Boundaries are `[start, end)`, in the device's local time zone (matching how
the rest of the app already renders times, e.g. `formatTime`/`dayLabel`).

### Precedence rules

Given `durationMs = timeToIso - timeFromIso` and the bucket containing
`timeFromIso` (`startBucket`):

1. **`entryCount === 1` OR `durationMs <= 15 * 60_000`** →
   `"{startBucket.periodLabel} Quick Bite"` (e.g. "Midday Quick Bite").
2. **`durationMs >= 75 * 60_000` AND `entryCount >= 3`** →
   the fixed string `"Leisurely Grazing Window"`.
3. **`durationMs >= 75 * 60_000` AND `entryCount === 2`** →
   `"{startBucket.mealNoun} & {endBucket.periodLabel} Bites"`, where
   `endBucket` is the bucket containing `timeToIso` (e.g. "Lunch & Afternoon
   Bites").
4. Otherwise → `startBucket.baseTitle` (e.g. "Morning Breakfast").

This is a deliberately clean reinterpretation of the reference doc's
intentionally loose marketing copy, not a literal reproduction of its
inconsistent examples — matching how prior feed-card work in this project
was told explicitly not to chase pixel-perfect fidelity to a reference.

### Wiring

- `groupSelectors.ts`'s `EntryGroup` type gains a `title: string` field.
- `finalizeGroup` calls `computeWindowTitle({ entryCount: entries.length,
  timeFromIso: first.createdAt, timeToIso: last.createdAt })` and stores the
  result.
- `FeedScreen.tsx` renders `item.title` in place of the current
  `item.entries[0].comment || "No comment"` line. The entry-count badge next
  to it is unchanged.

## Newest-first ordering

Within `finalizeGroup`, `timeFrom`/`timeTo` continue to be computed from the
chronologically-ascending input array's first/last element (unchanged
semantics: `timeFrom` is always the oldest, `timeTo` always the newest,
regardless of storage order). What changes:

- The `entries` field stored on `EntryGroup`, and the `photosByEntry` derived
  from it, are reversed to newest-first before being returned.
- Consequences that fall out of this automatically, with no further code
  changes: `PhotoStack`'s primary (full-width) tile becomes the newest photo
  (since `photosByEntry[0]` is now the newest entry's photos), and
  `GroupDetailsScreen` lists entries newest-first (since `FeedScreen.openGroup`
  passes `group.entries.map((e) => e.id)` through unchanged).
- `FeedScreen.tsx`'s timeline rail swaps its render order: `timeTo` (newest)
  renders first/top, then the dash, then `timeFrom` (oldest) at the bottom.
  The underlying field names/semantics are unchanged — only which one is
  rendered on top.

### Test impact

`groupSelectors.test.ts` has several existing assertions that expect
`entries.map(e => e.id)` in chronological-ascending order (e.g.
`['a', 'b']`, `['a', 'b', 'c']`) — these need updating to expect
newest-first order (e.g. `['b', 'a']`) as part of this change, alongside
new tests for `computeWindowTitle`.

## Testing

- `src/utils/windowTitle.test.ts` (new): unit tests for
  `computeWindowTitle` covering each bucket's base title, the Quick Bite rule
  (single entry, and multi-entry short span), the Leisurely Grazing Window
  rule, the two-entry extended rule, and a boundary case at a bucket edge.
- `groupSelectors.test.ts`: update existing order assertions to newest-first;
  add assertions that `EntryGroup.title` is populated and that
  `timeFrom`/`timeTo` remain oldest/newest respectively even though `entries`
  is now reversed.
- No new tests for `FeedScreen.tsx` itself — this codebase doesn't unit-test
  screens (see existing convention: only pure logic — selectors, layout math,
  slices — is tested).
