# Tabs, Settings & Meal Tags — Design

## Relation to prior design

Amends [2026-09-17-what-did-i-eat-app-design.md](2026-09-17-what-did-i-eat-app-design.md)
and [2026-09-17-feed-grid-fab-config-menu-design.md](2026-09-17-feed-grid-fab-config-menu-design.md).
Everything in those documents still applies except the parts this document
overrides: the app's top-level navigation shell, how `bundleByDay` /
photo-layout settings are presented (`GroupingMenu` is removed), and the
`Entry`/`Settings` data models, which gain new fields. Photo backfill
(editable `createdAt` on New Entry, already implemented) is unaffected.

## Motivation

Three previously-separate asks are combined here because they interlock: a
Settings screen needs somewhere to live (a tab), a Tags screen needs
somewhere to live (a tab), and the rolling-window grouping setting needs a
richer control (a slider) than the header popover has room for. Bundling
them avoids building navigation scaffolding twice.

## Navigation

```
RootStack
 ├─ Tabs (headerShown: false, initial route)
 │   ├─ Feed tab      → FeedScreen (unchanged content)
 │   ├─ Tags tab       → TagsScreen (new)
 │   └─ Settings tab   → SettingsScreen (new)
 ├─ NewEntry      (pushed on top, hides tab bar — unchanged)
 ├─ GroupDetails  (pushed on top, hides tab bar — unchanged)
 └─ PhotoDetails  (pushed on top, hides tab bar — unchanged)
```

The Tab Navigator is nested *inside* the root Stack as its initial route,
not the reverse — `NewEntry`/`GroupDetails`/`PhotoDetails` stay full-screen
stack pushes with no visible tab bar, matching how `PhotoDetails` already
behaves (`headerShown: false` for immersion). `navigation.navigate('NewEntry')`
calls already in `FeedScreen` keep working unchanged: React Navigation
bubbles an unresolved route name up from a child navigator to its parent
stack automatically.

New file `src/navigation/TabNavigator.tsx` using
`@react-navigation/bottom-tabs` (new dependency, `npx expo install
@react-navigation/bottom-tabs`). Tab bar icons (Ionicons, matching existing
usage): Feed = `list-outline` / `list`, Tags = `pricetag-outline` /
`pricetag`, Settings = `settings-outline` / `settings` (outline when
inactive, filled when active — same convention `@expo/vector-icons` names
support elsewhere in the app via `IconButton`).

`RootStackParamList` (`src/navigation/types.ts`) replaces the `Feed:
undefined` entry with `Tabs: undefined`; `RootNavigator.tsx` renders
`TabNavigator` as that route instead of `FeedScreen` directly, and drops the
`GroupingMenu` header wiring (see below).

## Settings

### Data model

`src/types/models.ts`:

```ts
export type GroupingMode = 'rolling' | 'day';

export type Settings = {
  groupingMode: GroupingMode; // default 'rolling'
  rollingWindowMinutes: number; // default 60, range 30-240
  photoLayoutAlgorithm: PhotoLayoutAlgorithm; // unchanged
};
```

`bundleByDay: boolean` is removed. `settingsSlice.ts`: `setBundleByDay`
replaced by `setGroupingMode(mode: GroupingMode)` and
`setRollingWindowMinutes(minutes: number)`. No `redux-persist` migration —
the old persisted `bundleByDay` key is simply absent from the new
`Settings` shape and ignored on rehydration; this is a single-user local
app with no need for migration machinery here.

### Selector change

`src/store/selectors/groupSelectors.ts`: `selectBundleByDay` is replaced by
selectors for `groupingMode` and `rollingWindowMinutes`.
`groupEntriesWithinDay`'s `bundleByDay: boolean` parameter becomes
`groupingMode: GroupingMode, windowMs: number`; the hardcoded
`ONE_HOUR_MS` constant is removed and its one use site
(`gap <= ONE_HOUR_MS`) becomes `gap <= windowMs`, with `windowMs` computed
in `selectFeedSections` as `rollingWindowMinutes * 60_000` and only
consulted when `groupingMode === 'rolling'` (mirrors today's `bundleByDay`
branch exactly, just parameterized).

### Settings screen

New `src/screens/SettingsScreen.tsx`, a plain scrollable screen (no modal,
unlike the removed `GroupingMenu` popover):

- "Grouping" section: existing `SegmentedControl` component, options
  `Rolling window` / `Single day`, bound to `groupingMode`.
- If `groupingMode === 'rolling'`: a slider below it — new dependency
  `@react-native-community/slider` (`npx expo install
  @react-native-community/slider`), range 30-240, step 15, with a label
  showing the current value (e.g. `Window: 60 min`), dispatching
  `setRollingWindowMinutes` on `onSlidingComplete` (not every drag tick, to
  avoid re-running the grouping selector on every pixel of drag).
- "Photo layout" section: the existing Columns/Mosaic `SegmentedControl`,
  moved here verbatim from `GroupingMenu`, bound to `photoLayoutAlgorithm`.

`src/components/GroupingMenu.tsx` is deleted; `FeedScreen`'s
`headerRight` no longer renders it (Feed's tab screen has no header actions
now — title only, matching how the Feed tab needs no popover once Settings
is a full screen).

## Meal tags

### Data model

New type in `src/types/models.ts`:

```ts
export const TAG_ICON_OPTIONS = [
  'restaurant-outline', 'cafe-outline', 'pizza-outline', 'nutrition-outline',
  'ice-cream-outline', 'wine-outline', 'leaf-outline', 'time-outline',
  'walk-outline', 'moon-outline',
] as const; // curated fixed set, not a full icon browser

export type TagIcon = typeof TAG_ICON_OPTIONS[number];

export type Tag = {
  id: string;
  icon: TagIcon;
  label: string; // trimmed, max 3 words, enforced at input time
};
```

`Entry` gains `tagIds: string[]` (new entries always set it, default `[]`).
Existing persisted entries predating this change won't have the field;
every read site accesses it via `entry.tagIds ?? []` rather than a
migration, consistent with how `location: null` is already handled
defensively elsewhere in this codebase.

### Store

New `src/store/tagsSlice.ts`, flat `Record<string, Tag>` dictionary
(mirrors `entriesSlice`): `addTag`, `updateTag`, `deleteTag`. Added to
`rootReducer` in `store.ts` and persisted the same way as `entries`/
`settings`. Deleting a tag does **not** touch any entry's `tagIds` — display
code looks tags up by id and silently skips ids that no longer resolve, so
no cross-slice cleanup reducer is needed.

A validation helper, `src/utils/tagLabel.ts`:

```ts
export function isValidTagLabel(label: string): boolean {
  const trimmed = label.trim();
  return trimmed.length > 0 && trimmed.split(/\s+/).length <= 3;
}
```

### Tags screen

New `src/screens/TagsScreen.tsx`:

- "Add tag" form at the top: a horizontal row of the ten `TAG_ICON_OPTIONS`
  as tappable icons (selected one highlighted with `theme.colors.primary`),
  a label `TextInput`, and a "Save" button disabled until an icon is picked
  and `isValidTagLabel(label)` passes. On save: dispatch `addTag`, clear the
  form.
- Below: a flat, unordered list of existing tags (`Object.values` of the
  slice, no categories/grouping/usage-counts/reordering — intentionally
  simpler than the reference screenshot shown during brainstorming, which
  was inspiration only, not a spec). Each row: icon + label, an edit
  (pencil) `IconButton` that turns the row into the same icon-row +
  label-input form inline (pre-filled, dispatching `updateTag` on save),
  and a delete `IconButton` with a confirmation `Alert` (consistent with
  how `PhotoDetailsScreen` confirms entry deletion today).

### Entry integration

- **New Entry screen** (`src/screens/NewEntryScreen.tsx`): a new state,
  `selectedTagIds: string[]`, and a horizontal row of tag chips (icon +
  label, reading all tags from the store) below the date/time row added for
  backfill, above the comment box. Tapping a chip toggles its id in
  `selectedTagIds`. `handleAdd` includes `tagIds: selectedTagIds` in the
  `addEntry` payload. If no tags exist yet, the row is omitted entirely
  (no "go add a tag" prompt — keeps this screen simple; the Tags tab is
  discoverable on its own).
- **Photo Details screen** (`src/screens/PhotoDetailsScreen.tsx`): the
  footer/overlay (which already shows date/time, place, comment) gains a
  row of the entry's tag chips (icon + label, resolved via
  `entry.tagIds ?? []` looked up against the tags store, skipping unresolved
  ids), rendered only when non-empty. The existing "Edit" action, which
  today only opens the comment text for in-place editing, is extended to
  also show the same tag-chip row from New Entry in toggle mode, saved via
  `updateEntry` alongside the comment on confirm.

## Design system

No new tokens. Tag chips reuse `theme.colors.surface`/`primary`,
`theme.radii.pill`, `theme.typography.caption`, matching the existing
`SegmentedControl` active/inactive treatment. `TagsScreen`'s icon-picker row
and `SettingsScreen`'s slider use `theme.spacing`/`theme.colors` tokens only,
no new ones.

## Testing

- `groupSelectors.test.ts`: update from `bundleByDay` boolean to
  `groupingMode`/`rollingWindowMinutes`, add a case with a non-default
  window size (e.g. 30 min splits what a 60 min window would have joined).
- New `tagLabel.test.ts`: `isValidTagLabel` for 0, 1, 3, 4-word labels and
  whitespace-only input.
- New `tagsSlice.test.ts`: `addTag`/`updateTag`/`deleteTag`, mirroring the
  existing `entriesSlice.test.ts` shape.
- `settingsSlice.test.ts`: update for the new actions.
- No new component/e2e tests for `TabNavigator`, `SettingsScreen`, or
  `TagsScreen` beyond the above, consistent with this app's existing stance
  (unit-test logic, manually verify screens per the user's test-plan
  preference).

## Open decisions deliberately deferred (YAGNI)

- No tag categories, usage counts, or manual reordering (screenshot shown
  during brainstorming was inspiration, not a spec — confirmed with user).
- No cap on how many tags an entry can have, and no cap on total tag count
  before the New Entry/Photo Details chip row needs to scroll or wrap —
  fine at personal-log scale; revisit only if it proves unreadable.
- No migration for pre-existing entries lacking `tagIds` — read-site
  defaulting (`?? []`) is sufficient for a single-user local app.
