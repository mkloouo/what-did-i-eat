# Feed Grid, FAB & Config Menu — Design Update

## Relation to prior design

Amends [2026-09-17-what-did-i-eat-app-design.md](2026-09-17-what-did-i-eat-app-design.md).
Everything in that document still applies except the parts this document
overrides: the Feed card's photo treatment, the Feed header, how a new entry
is started, and how the `bundleByDay` setting is presented. The Config screen
is removed.

## Motivation

The original Feed card showed a single cover photo plus a "+N" badge for
multi-entry groups, and Config lived on its own screen reached via a header
gear icon. In practice this hides most of what a group actually contains and
adds an extra screen + navigation hop for a single boolean setting. This
update replaces the cover-photo-and-badge pattern with an adaptive grid that
shows every photo in a group, moves the primary "add entry" action to a FAB,
and collapses Config into a one-row menu on the Feed header.

## Navigation

Screen count drops from five to four — `Config` is removed and its setting
moves into a header menu:

```
Feed (initial route)
 ├─ NewEntry      (FAB)
 ├─ GroupDetails  (tap a feed card whose group has 2+ entries)
 │   └─ PhotoDetails (tap an entry in the group)
 └─ PhotoDetails  (tap a feed card whose group has exactly 1 entry — skips GroupDetails)
```

`RootStackParamList` (`src/navigation/types.ts`) drops the `Config: undefined`
entry. `RootNavigator.tsx` drops the `Config` `Stack.Screen` and the
`ConfigScreen` import; `src/screens/ConfigScreen.tsx` is deleted.

## Feed header

`Feed`'s `headerLeft` is removed entirely. `headerRight` changes from the
"add" icon to a single "•••" (`ellipsis-horizontal`) `IconButton` that opens
a popover anchored under it. The popover contains exactly one row: an inline
segmented control —

```
Group by:  [ Hour | Day ]
```

— bound directly to `settings.bundleByDay` (`Hour` = false, `Day` = true),
dispatching `setBundleByDay` immediately on tap, same as the old Config
screen's "writes immediately, no save step" behavior. The popover closes on
selection or on tapping outside it. This is a new small component,
`GroupingMenu` (`src/components/GroupingMenu.tsx`) — a `Pressable` "•••"
trigger plus an absolutely-positioned popover `Card`, no navigation and no
third-party menu library needed at this scale.

## FAB

A new `Fab` component (`src/components/Fab.tsx`): a circular
`theme.colors.primary` button, plus icon (`Ionicons "add"`), fixed to the
bottom-right of the screen (`position: 'absolute'`, right/bottom offset =
`theme.spacing.lg`, diameter ~56, `theme.radii.pill`). `FeedScreen` renders
it navigating to `NewEntry`, replacing the old `headerRight` add button.
It is Feed-only, consistent with the rest of the app not having a
persistent tab/action bar.

## Adaptive photo grid

### Selector change

`EntryGroup` (`src/store/selectors/groupSelectors.ts`) replaces
`coverPhotoUri: string` with `photos: string[]` — every photo across every
entry in the group, resolved via `resolvePhotoUri`, in chronological order
(entry order, then photo order within each entry — the same order they were
added). `finalizeGroup` builds this by flat-mapping `entries[].photos`
instead of taking `latest.photos[0]`. The one existing test asserting
`coverPhotoUri` (`groupSelectors.test.ts`) is updated to assert `photos`
instead.

### `PhotoGrid` component

New component, `src/components/PhotoGrid.tsx`, replacing the
`PhotoThumbnail` + badge usage in `FeedScreen`'s card:

```ts
type Props = { photos: string[]; size: number };
```

`size` is the feed card's fixed square photo area (same 72 the card uses
today, kept as a named constant in `FeedScreen`). Layout:

- `columns = Math.ceil(Math.sqrt(photos.length))`
- `rows = Math.ceil(photos.length / columns)`
- each cell is `size / columns` square, `Image` with `resizeMode="cover"`,
  a `theme.spacing.xs`-ish gap between cells (accounted for in cell math so
  the grid still totals `size`)
- cells wrap left-to-right, top-to-bottom in a `flexWrap: 'row'` container;
  the last row is left-aligned (not stretched/centered), so every cell
  keeps the same computed size even when the last row is partial
- `photos.length === 1` renders the single photo filling the full `size ×
  size` area (equivalent to today's single-cell case, no grid math needed)
- no cap on `photos.length` — cells shrink indefinitely as the group grows;
  no overflow badge

`PhotoGrid` is presentational only (no data fetching, no navigation) so it's
independently testable with a plain `photos` array.

### Feed card

`FeedScreen`'s card row changes from `<PhotoThumbnail uri={item.coverPhotoUri} badgeCount={item.entries.length} />`
to `<PhotoGrid photos={item.photos} size={72} />`. Group time, comment
preview (still the latest entry's comment), and the entry-count badge are
unchanged — the badge remains useful since a single entry can itself hold
multiple photos, so entry count and photo count aren't the same number.
`PhotoThumbnail` itself is untouched — `GroupDetailsScreen` and
`NewEntryScreen` keep using it as-is for single-photo display.

## Config screen removal

`src/screens/ConfigScreen.tsx` is deleted. Its only piece of state,
`settings.bundleByDay`, is now written from `GroupingMenu` instead. No
changes to `settingsSlice.ts`, `redux-persist` config, or the `Settings`
type — this is purely a presentation change.

## Design system

No new tokens needed. `GroupingMenu`'s popover reuses `Card` (surface,
radius, padding) and `theme.typography`; the segmented control's active
segment uses `theme.colors.primary` fill with `textOnDark` text, inactive
segment uses `theme.colors.muted` text on `surface`. `Fab` reuses
`theme.colors.primary`, `theme.radii.pill`.

## Testing

- `groupSelectors.test.ts`: update the existing assertion from
  `coverPhotoUri` to `photos`, and add a case covering multi-entry groups
  (photos flattened across entries in order).
- New `PhotoGrid.test.tsx` (or plain unit test of an extracted
  `computeGridLayout(count, size)` helper): column/row counts for 1, 2, 3,
  4, 5, 9, 10 photos, and that cell size shrinks monotonically as count
  grows.
- No new tests for `GroupingMenu`/`Fab` beyond what the removed
  `ConfigScreen` had (a render + tap dispatches `setBundleByDay`) — per the
  original design's stance, no component/e2e tests beyond that in v1.

## Open decisions deliberately deferred (YAGNI)

- No cap/virtualization on grid cell count for very photo-heavy groups —
  acceptable for a personal log; revisit only if it proves unreadable in
  practice.
- `GroupingMenu`'s popover positioning is a simple fixed offset under the
  header icon, not a measured/portal-based popover — fine at this app's
  single-instance-at-a-time scale.
