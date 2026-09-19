# Wall redesign with a Daybands view — design

Date: 2026-09-19. Baseline version: 1.4.1.

Mockups (row B is Wall, row A is Daybands):
https://claude.ai/artifact/Xou8Wf3UHnhvq8zYsSue2q

## Goal

Restyle the whole app in the **Wall** direction, where the photograph is the
interface, and add **Days**, a second timeline view taken from the
**Daybands** direction. Timeline, tags and the six existing settings all stay.
The data model does not change.

The README's thesis still governs every screen: no calories, no goals, no
guilt. Nothing in this redesign counts, scores, streaks or colours a time as
good or bad.

## Decisions

- Wall is the app. Daybands is one extra view of the same timeline, drawn in
  Wall's palette and type, not its own look.
- A `Wall | Days` toggle in the Home header, beside the settings icon, switches
  views. The choice is stored in `appMeta.timelineView`, not in Settings, so
  Settings keeps exactly its six settings.
- A rolling-window group with several entries renders as **one piece** with
  each entry's time and comment listed beneath it.
- Native dependencies are fine. All of them land in step 1.5.0 so there is one
  new dev build up front and every later step is JavaScript only.
- The dev build is built locally and served over the LAN. Android is assumed
  because it is the platform every past build here targeted.
- All work is on the `wall-redesign` branch.
- Versions: a minor bump per finished step, 2.0.0 when the redesign is done.
  No git tags, no EAS cloud builds, no GitHub releases. A bump touches
  `package.json`, `app.config.js` and `CHANGELOG.md`, in its own commit worded
  `bump to vX.Y.Z`, separate from feature commits.

## Non-goals

Data model changes, new settings, light mode (Wall is dark only), iOS builds,
any counting or scoring, cloud anything.

## Visual system

Tokens replace the old palette in `theme.ts`. `shadows.card` is removed.

| token | hex | job |
|---|---|---|
| wall | `#1C2320` | page ground |
| seam | `#252D29` | inactive chips, segmented tracks, dividers |
| bone | `#EDE8DC` | primary text, primary button |
| chalk | `#949E97` | secondary text |
| brass | `#B08A4A` | the one accent: active tag, tag text, selected, thumb |
| clay | `#DE7B73` | delete only; lightened from the mockup's `#C86A63` to pass 4.5:1 on wall and seam |
| hairline | `#3A443E` | dividers, scrubber ticks, raised outlines |

Contrast is checked while building, clay at small sizes first.

Type is **Instrument Sans** only, in four weights (400, 500, 600, 700). Custom
fonts on Android need one family name per weight, so `theme.typography` names
`InstrumentSans_400Regular` and so on instead of using `fontWeight`. Times use
tabular figures. Whether Instrument Sans ships them is verified in step 1.5.0;
if it does not, that step chooses the fallback.

Photo rules: photos run edge to edge with 2px seams and square corners. There
are no cards and no shadows. Text never sits on top of a photograph, so no
scrims, no overlaid badges, no overflow pills. `PhotoStack` gets seam-size and
corner-radius parameters instead of a rewrite, so masonry and mosaic keep
working and the layout settings mean what they meant before.

## Navigation

- **Home** is the timeline. The header holds the title, the `Wall | Days`
  toggle and a settings icon. Below it sits the tag rail.
- **Entry** is the one-meal page.
- **Photo viewer** stays a pure zoom and swipe viewer, restyled dark.
- **Capture** is the current New Entry flow, restyled in place.
- **Settings** opens from the header icon and holds the six settings plus an
  "Edit tags" row.
- **Tags** opens from Settings and from the "Edit" link on the tag rail.

Removed: the tab navigator, the Group screen, the FAB, cards and shadows.
`DayDivider`, `CountBadge`, `PaginationDots` and `PhotoCarousel` are deletion
candidates, confirmed against actual usage at plan time.

## Wall view

**Piece.** The group's photos tile as one block using the existing masonry or
mosaic layout. Under it is a label list, newest entry first. Each row has the
entry's time, its comment capped at two lines, and its tags as brass text. More
than three entries collapse the rest into a "+N more" line that expands in
place. Place lives on the Entry page, so a label carries three facts: time,
comment, tags.

**Taps.** Tapping a photo opens that entry, through a small tested helper that
maps the flat photo index back to its entry. Tapping a label row opens that
entry too. There is no Group screen.

**Day seams.** A day's name with a hairline. No count.

**Tag filter.** The rail shows tags as icon-only chips. Selecting one expands
it to icon and label in brass. One tag is active at a time. The filter is
applied to entries **before** grouping, so a filtered wall regroups the
matching entries and everything else disappears. Day seams stay so the user
keeps their place. Wall and Days share the filter. It is UI state and is not
persisted.

**Scrubber.** A 6px rail on the right edge shows a tick per day and a thumb for
the viewport. It is draggable. While dragging, a day label follows the thumb,
and the list scrolls to that day. The per-day offsets it uses are the same ones
the Days-to-Wall jump uses.

**Empty state.** An invitation, not a dead end: what to do next, plus the
capture button.

**Performance.** The wall is a virtualised list, not a plain `ScrollView`,
because full-width photos over a long history are heavy. Photos render through
`expo-image` for caching and memory behaviour. Scrolling to a day needs a
fallback for rows not yet measured.

## Days view

- One band per day, newest first, covering the **full 00:00 to 24:00**. The
  mockup started at 05:00, which would have pushed a 01:00 snack off the edge.
- The band's ground is a smooth wash: night, dawn, day, dusk, night. Its zone
  edges reuse the time-of-day boundaries already in `windowTitle.ts`. The wash
  is astronomical and never evaluative.
- Marks are photo thumbnails at their true position. Today's band is taller
  with 48px marks, past days use 28px. Groups inside the rolling window stack.
  Today shows a now marker.
- Tapping a day's band switches to the Wall, scrolled to that day. There is no
  separate Day sheet.
- The tag filter applies. Marks that do not match disappear.
- No hero photo in this view, since the Wall is one tap away. This is an
  assumption for review.
- Never: counts, streaks, red, or any label that judges a time.

## Settings

The same six settings, re-labelled from the Wall mockup:

| setting | new copy |
|---|---|
| `groupingMode` | "What counts as one meal": Photos close in time / A whole day |
| `rollingWindowMinutes` | "Merge photos taken within", shown as `1 h 30 m`; range and step unchanged |
| `photoLayoutAlgorithm` | "How a multi-photo meal tiles", On the wall |
| `entryPhotoLayoutAlgorithm` | same control, On one meal |
| `inferDateFromFirstImportedPhoto` | "Use the photo's own date" |
| `captureLocation` | "Save where you were" |

From step 1.9.0 the merge control has a live mini-band drawn from the user's
recent entries, with the current window highlighted.

## Entry page

Header with back, date and time, and Edit. A large square photo, then thumbnails
of the entry's other photos dimmed, with "1 of N". Then the comment, tags with a
"+ tag" control while editing, and detail rows for Taken (the entry's own
time), Place and Photos. Delete sits at the bottom in clay. Editing keeps the
current inline edit behaviour.

## Capture and Tags

Restyled in place with the same flows. No structural change.

## Data and state

`Entry`, `Tag` and `Settings` are unchanged. `appMeta` gains an optional
`timelineView: "wall" | "days"`. `redux-persist` replaces the whole `appMeta`
object on load, so existing installs will not have the key; the selector
defaults to `"wall"` and never trusts the state. Grouping gains an optional tag
filter applied before grouping. `EntryGroup.title` and
`computeWindowTitle` are retired once the Group screen is gone; the time-of-day
edges stay.

## Native dependencies and the dev build

Added in step 1.5.0 with `npx expo install` so versions match Expo 57:

- `expo-font` and `@expo-google-fonts/instrument-sans`
- `expo-splash-screen`, so the native splash stays up while fonts load
- `expo-system-ui`, which Android needs for a dark `userInterfaceStyle`
- `expo-linear-gradient` for the band wash
- `expo-image` for photo caching
- a virtualised list, `@shopify/flash-list`, if it is compatible with this
  React Native version; otherwise the built-in `FlatList`

The Expo v57 docs are read before any of this is written, per AGENTS.md. The
`development` profile in `eas.json` is built locally with
`npx eas-cli build --platform android --profile development --local
--non-interactive`, and the APK is served over the LAN with `uv run python -m
http.server` from its folder so the phone can download and install it. It
installs beside a release build because of the `.dev` package suffix. Landing
order in 1.5.0: install packages, build and install the dev client, and only
then write code that imports them, so the current dev client keeps working
until then.

## Testing

Pure logic is written test-first: time to band position, band zone segments,
photo index to entry, filter then group, and the `timelineView` default. I run
the type-check and jest. Everything visual is checked by the user on the dev
client, and each step ends with a concrete test plan.

## Steps

| version | scope |
|---|---|
| 1.5.0 | Wall look everywhere: tokens, fonts, shared components. All native deps and the single dev build. Tabs still in place. |
| 1.6.0 | Home replaces the tabs. Wall feed, tag rail, seams and the draggable scrubber replace Feed and the Group screen. |
| 1.7.0 | Entry page and photo viewer. |
| 1.8.0 | Capture, Settings and Tags restyled. |
| 1.9.0 | Days view, header toggle, and the live band preview in Settings. |
| 2.0.0 | Cleanup of removed files, docs, README and CHANGELOG. |

## Risks

- Wall performance with long histories. Mitigated by virtualisation and
  `expo-image`.
- Existing installs missing `timelineView`. Mitigated by the selector default.
- Scrolling to a day in a variable-height list. Mitigated by a measured-offset
  cache with a retry.
- Instrument Sans tabular figures. Checked in 1.5.0.
- Contrast of clay and chalk at small sizes. Checked while building.
