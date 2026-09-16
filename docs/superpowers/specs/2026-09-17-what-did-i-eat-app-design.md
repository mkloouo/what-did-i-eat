# What Did I Eat — App Design

## Vision

A personal, local-only food-photo journal. The point is to shift attention away
from calorie/weight tracking and toward simple conscious awareness of what was
eaten, without guilt-tripping or precise calculation. The atomic action is:
take/pick a photo (or several), write a short comment, done. Photos never sit
in the system camera roll — the app manages its own private photo storage.

Source requirements: [README.md](../../../README.md).

## Scope

- Fully offline, local-only. No backend, no accounts, no sync.
- iOS + Android via Expo (managed workflow), TypeScript.
- Five screens: Config, Feed, New Entry, Group Details, Photo Details.
- Out of scope for v1: cloud sync, multi-user, calorie/nutrition data of any
  kind, editing photos (crop/filter), Detox/e2e testing.

## Data model

```ts
type Photo = {
  id: string;
  uri: string; // local file under FileSystem.documentDirectory + 'photos/'
};

type Location = {
  latitude: number;
  longitude: number;
  placeName: string | null; // reverse-geocoded; null if geocoding failed/denied
};

type Entry = {
  id: string;
  createdAt: string; // ISO 8601
  comment: string;
  location: Location | null; // null if permission denied or lookup failed
  photos: Photo[]; // at least 1
};

type Settings = {
  bundleByDay: boolean; // default false
};
```

Entries are stored as a flat, unordered dictionary (`Record<string, Entry>`)
in Redux state; all ordering/grouping is computed by selectors, never stored.

## State management

Redux Toolkit, two slices:

- `entriesSlice`: `addEntry`, `updateEntry` (comment/photos), `deleteEntry`.
- `settingsSlice`: `setBundleByDay`.

`redux-persist` persists both slices to AsyncStorage. Only entry *metadata*
(id, timestamps, comment, location, photo URIs) is persisted this way — the
actual photo bytes live on the filesystem, referenced by URI. If persisted
state fails to load (corrupt storage, first launch), the app falls back to an
empty state rather than crashing.

### Derived grouping (selectors, not stored)

Given the sorted (by `createdAt`) entry list and `settings.bundleByDay`:

1. Partition entries into day buckets by local calendar date. Each day bucket
   renders under a `DayDivider` in the Feed.
2. Within a day bucket:
   - If `bundleByDay` is **true**: the whole day's entries form a single
     group.
   - If `bundleByDay` is **false** (default): entries merge into a group via
     a **rolling 1-hour window** — entry *N* joins the current group if its
     `createdAt` is within 1 hour of entry *N-1*'s `createdAt` (not the
     group's first entry); otherwise it starts a new group. This means a
     group's effective span can exceed 1 hour if photos keep arriving inside
     the window, and the group's displayed time is always its **latest**
     entry's time.
3. Each computed group is: `{ id, dayKey, entries: Entry[], groupTime: string, coverPhotoUri: string }`.
   `coverPhotoUri` is the first photo of the group's **latest** entry.

This selector is the one piece of genuinely tricky logic in the app and gets
dedicated unit tests (see Testing).

## Navigation

React Navigation, single **native stack** (no tab bar — screens form a linear
flow, not parallel destinations):

```
Feed (initial route)
 ├─ Config        (header gear icon)
 ├─ NewEntry      (header plus icon)
 ├─ GroupDetails  (tap a feed card whose group has 2+ entries)
 │   └─ PhotoDetails (tap an entry in the group)
 └─ PhotoDetails  (tap a feed card whose group has exactly 1 entry — skips GroupDetails)
```

`PhotoDetails` always receives an `entryId` (plus which photo index to open
on, for multi-photo entries) — it never depends on how it was reached.

## Screens

### 1. Config
Single flat toggle: "Bundle by day." Bound directly to `settings.bundleByDay`,
writes immediately on toggle (no separate save step).

### 2. Feed
`SectionList` — one section per day (header = `DayDivider`, e.g. "Today",
"Yesterday", or a formatted date), section data = that day's computed groups,
newest day first, newest group first within a day. Each group renders as a
flat card: cover photo (large, square-ish), group time, comment preview
(latest entry's comment, truncated), and an entry-count badge when the group
has more than one entry. Empty state (no entries yet) shows friendly
placeholder copy instead of an empty list. Header icons: gear (→ Config),
plus (→ NewEntry).

### 3. New Entry
- Buttons to take a photo (camera) or pick from library (`allowsMultipleSelection: true`).
- Horizontal thumbnail strip of photos added so far, each removable; users can
  mix camera shots and library picks before submitting.
- Comment `TextInput` (multiline, optional — not required to submit).
- "Add" button, disabled until at least one photo is present. On submit:
  1. Copy every selected photo's file into `documentDirectory/photos/<uuid>.jpg`
     via `expo-file-system` (so the entry never depends on a cache/gallery
     path that could disappear).
  2. If location permission is granted, fetch current position once
     (`expo-location`) and reverse-geocode it; on any failure/denial, store
     `location: null` and proceed — never blocks saving.
  3. Dispatch `addEntry`, navigate back to Feed.

### 4. Group Details
Scrollable list of the group's entries, each rendered as: large square cover
photo (entry's first photo) + comment text, with a small "+N photos" badge if
the entry has more than one photo. Tapping an entry opens `PhotoDetails` for
that entry (starting at its first photo).

### 5. Photo Details
Full-screen photo viewer, zoomable (pinch-to-zoom), and swipeable between
photos when the entry has more than one. Footer/overlay shows: formatted
date/time, place name (or nothing if `location` is null), and the comment.
Header actions: Edit (opens comment text for editing in place — photos
themselves are not editable in v1) and Delete (removes the whole entry, with
a confirmation prompt, then navigates back).

## Design system

Palette (from `palette.png`):

| Token | Hex | Role |
|---|---|---|
| `background` | `#DFD9E2` (Lavender) | page background |
| `surface` | near-white tint | cards, inputs |
| `primary` | `#2A7F62` (Jungle Teal) | primary actions (Add, FAB, active states) |
| `secondary` | `#C3ACCE` (Lilac) | badges, secondary accents |
| `muted` | `#89909F` (Lavender Grey) | secondary text, dividers, inactive icons |
| `accentDark` | `#538083` (Pine Blue) | header surfaces, dark-on-light contrast elements |

Flat design language (per `inspiration.png`'s style, not its literal content):
no shadows or gradients, solid fills, rounded rectangles (~12–16px radius),
bold system-font sans-serif type, flat icon set via `@expo/vector-icons`
(Ionicons or Feather, filled style).

A small `theme.ts` (colors, spacing scale, radii, type scale) backs a handful
of reusable primitives: `Button`, `IconButton`, `Card`, `PhotoThumbnail`,
`DayDivider`. No third-party UI component library — the README explicitly
asks for a custom design system.

## Permissions & error handling

- Camera / photo library permission requested at point of use (New Entry);
  if denied, that specific action (camera or library) is unavailable but the
  other remains usable, with an inline message explaining why.
- Location permission requested at point of use (New Entry, on first submit);
  denial or lookup failure never blocks saving — `location` is simply `null`.
- Photo copy failure (disk full, etc.) surfaces an alert and the entry is not
  created without at least one successfully saved photo.
- Corrupt/unreadable persisted state on launch falls back to an empty app
  state rather than crashing.

## Testing

- Jest unit tests for the grouping selector: rolling 1-hour window behavior
  (join vs. new group, `groupTime` = latest entry), day-bundling toggle
  behavior, day-divider partitioning, and the single-entry-group vs.
  multi-entry-group distinction used for navigation.
- Jest unit tests for both Redux slices (add/update/delete entry, toggle
  setting) and for the redux-persist config (serialization round-trip of
  `Entry`/`Settings` shapes).
- No component/e2e/Detox tests in v1 — personal app, not worth the setup cost.
  Manual verification happens via a test plan handed to the user (per their
  stated preference, the app is not run/driven automatically as part of this
  work).

## Open decisions deliberately deferred (YAGNI)

- No editing of which photos belong to an entry after creation (only the
  comment is editable) — reduces v1 scope; can be added later if it turns out
  to matter in practice.
- No search/filter on the Feed — pure chronological scroll is enough for a
  personal log at this stage.
