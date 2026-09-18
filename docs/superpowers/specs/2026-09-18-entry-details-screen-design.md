# Entry Details Screen — Design

## Context

Today, tapping into a single entry (either directly from the feed, for a
single-entry group, or from `GroupDetailsScreen`'s list) opens
`PhotoDetailsScreen`: a full-screen `ImageViewing` gallery whose header and
footer overlay *also* carry all of the entry's editing UI — comment editing,
tag editing, and whole-entry delete — on top of the immersive photo view.
There's no dedicated place to see/edit an entry's metadata without being
inside the zoom/swipe photo viewer, and no intermediate screen between "list
of entries" and "full-screen photo."

This design splits that into two purposes:

1. A new **`EntryDetailsScreen`** — a normal (non-immersive) screen showing
   an entry's photos (as a stack/grid), date, location, tags, and comment,
   with editing and delete living here.
2. **`PhotoDetailsScreen`** — kept, but reduced to a pure full-screen
   zoom/swipe photo viewer with no editing capability.

Resulting flow: `Feed → (multiple entries →) single entry → photo tap →
photo viewer` (matching the user's stated target flow), with the "single
entry" step always being `EntryDetailsScreen`, even for single-entry groups.

## Out of scope

- Per-photo delete (still doesn't exist — only whole-entry delete does, and
  that's unchanged).
- Location editing (location is still write-once at entry creation via
  `NewEntryScreen`; `EntryDetailsScreen` only displays it).
- Any change to `FeedScreen`'s card rendering, `GroupDetailsScreen`'s list
  rendering, or the window-title/newest-first work from the prior design.

## Navigation changes

`src/navigation/types.ts`:

```ts
export type RootStackParamList = {
  Tabs: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  EntryDetails: { entryId: string };
  PhotoDetails: { entryId: string; photoIndex: number };
};
```

- `RootNavigator.tsx`: register `EntryDetailsScreen` under `EntryDetails`,
  themed like other stack screens (not `headerShown: false` — it uses the
  native header, unlike `PhotoDetails`).
- `FeedScreen.openGroup`: when `group.entries.length === 1`, navigate to
  `EntryDetails` with that entry's id (previously navigated straight to
  `PhotoDetails`). The `entries.length > 1` branch (→ `GroupDetails`) is
  unchanged.
- `GroupDetailsScreen`: its per-entry `Pressable` navigates to
  `EntryDetails` with that entry's id (previously navigated to
  `PhotoDetails` with `photoIndex: 0`). Nothing else in this screen changes.
- `EntryDetailsScreen` → `PhotoDetails`: tapping a photo in the `PhotoStack`
  navigates to `PhotoDetails` with `{ entryId, photoIndex: <tapped index> }`.
  `PhotoDetails`'s own shape/params are unchanged.

## `EntryDetailsScreen`

New file `src/screens/EntryDetailsScreen.tsx`, registered with a themed
native header (`headerStyle`/`headerTintColor` inherited from
`RootNavigator`'s existing `screenOptions`, same as `GroupDetails`).

### Header

Set via `navigation.setOptions({ headerRight })`, toggling with local
`isEditing` state:

- **View mode**: two `IconButton`s — pencil (`accessibilityLabel="Edit
  entry"`, enters edit mode) and trash (`accessibilityLabel="Delete entry"`,
  opens the same confirm `Alert` entry-delete flow `PhotoDetailsScreen` has
  today — text: "Delete entry?" / "This removes the photo(s) and comment
  permanently.").
- **Edit mode**: plain text "Cancel" and "Save" pressables, styled like
  `PhotoDetailsHeader`'s existing "Close"/"Delete" text buttons today
  (`topBarButtonText`-equivalent styling, reused/copied into this screen).

### Body (scroll view)

In order:

1. `PhotoStack` showing all of the entry's photos, passed as a single-entry
   `photosByEntry` array (`[entry.photos.map(p => resolvePhotoUri(p.uri))]`)
   with the user's configured `photoLayoutAlgorithm` (same selector
   `FeedScreen` already reads: `state.settings.photoLayoutAlgorithm`). Each
   tile is individually tappable, navigating to `PhotoDetails` at that
   photo's flat index — see `PhotoStack` interface change below.

   `PhotoStack` gains a new optional prop, `onPhotoPress?: (index: number)
   => void`. When provided, each tile's `View` (in `PhotoStack.tsx`'s
   `photos.map(...)`) is wrapped in a `Pressable` calling `onPhotoPress
   (index)` instead of being a plain `View`; when omitted (as in
   `FeedScreen`'s existing usage, where the whole card is one tap target),
   behavior is unchanged. This is the one interface change to an existing
   shared component in this design — `FeedScreen`'s call site is unaffected
   since it doesn't pass the new prop.
2. Full date/time: `formatFullDateTime(entry.createdAt)`.
3. Location, if present: `entry.location.placeName`.
4. Tags:
   - View mode: read-only row of `TagChip`s for the entry's resolved tags
     (or nothing if none).
   - Edit mode: the full tag picker — every tag in `state.tags` rendered as
     a selectable `TagChip`, exactly like `PhotoDetailsFooter`'s existing
     edit-mode tag row today.
5. Comment:
   - View mode: plain `Text` (`entry.comment || "No comment"`).
   - Edit mode: multiline `TextInput`, same styling as
     `PhotoDetailsFooter.editInput` today.

### State & data flow

Local component state: `isEditing: boolean`, `draftComment: string`,
`draftTagIds: string[]` — direct port of `PhotoDetailsFooter`'s existing
state, just living in this screen instead. `Save` dispatches
`updateEntryComment` + `updateEntryTags`, then sets `isEditing` to `false`.
`Cancel` resets the drafts from the current entry and sets `isEditing` to
`false`. No autosave.

### Delete

Same sequence `PhotoDetailsHeader.confirmDelete` runs today: `Promise
.allSettled` over `deletePhotoFile` for each photo, then `dispatch
(deleteEntry({ id }))`, then **`navigation.goBack()`** (not `navigate
("Tabs")` — this pops back to whatever presented `EntryDetails`:
`GroupDetails`, which will simply no longer list the deleted entry since it
filters `entryIds` against live redux state, or `Feed` directly for a
former single-entry group).

### Missing entry

Same fallback pattern `PhotoDetailsScreen` has today: if `state.entries
[entryId]` is undefined (e.g. deleted from another screen while this one
was already on the stack), render a "This entry no longer exists." message
with a "Back" button to `Tabs`.

## `PhotoDetailsScreen` simplification

- **`PhotoDetailsHeader`**: drop the "Delete" button, its `confirmDelete`
  function, and the now-unused `deletePhotoFile`/`deleteEntry` imports.
  Keep only "Close" (`navigation.goBack()`).
- **`PhotoDetailsFooter`**: drop `isEditing`/`draftComment`/`draftTagIds`
  state, the tag-picker row, the `TextInput`, the Save/Cancel buttons, and
  the `updateEntryComment`/`updateEntryTags`/`TagChip` imports. Keep the
  dots (photo-position indicator, unchanged) and a caption showing
  `formatFullDateTime(entry.createdAt)` + `entry.location?.placeName` (both
  already rendered today) — no tags in this caption.
- Component structure (`PhotoDetailsHeader`/`PhotoDetailsFooter` as
  separate components with stable identity via `useCallback`, per the
  existing code comments explaining why) is unchanged — same rationale
  still applies now with a smaller footer.
- `route.params` shape (`{ entryId, photoIndex }`) is unchanged.

## Testing

This codebase doesn't unit-test screens (existing convention — only pure
logic: selectors, layout math, slices). `EntryDetailsScreen` and the
trimmed `PhotoDetailsScreen` get no new test files; no existing pure-logic
module changes as part of this work, so no test updates are needed there
either.

Verification: `tsc --noEmit` and `npx jest` (full suite, unaffected but run
as a regression check) must both stay clean. Manual verification of the new
flow (Feed → entry → photo, edit/delete, single-entry-group shortcut) is
left to the user per their standing testing-preference — this design will
ship with a step-by-step manual test plan instead of the agent driving the
app interactively.
