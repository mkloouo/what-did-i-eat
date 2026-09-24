# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2.0.0] - 2026-09-24

The Wall redesign is done. Same dev build as 1.5.0 — no native changes.

### Removed

- The old tab bar, Feed screen, Group Details screen and invented meal
  window titles — all replaced by Home (the Wall) across 1.6.0-1.9.0.
- The masonry/mosaic photo layout choice, replaced in 1.7.1 by a fixed,
  user-configurable column grid.

### Changed

- README's UI section rewritten to describe the Wall and Days views
  instead of the pre-redesign four-page tab layout it still described.

## [1.4.2] - 2026-09-24

### Added

- Split the Feed FAB into two stacked buttons: a camera button that opens a
  new entry with the camera launched immediately, and an add button that
  opens a blank new entry as before.

### Changed

- Gave the Feed and Tags tab screens friendlier titles ("What did I eat?"
  and "Let's organize a bit") while keeping short labels on the tab bar
  itself.
- Memoized derived Redux selectors (`Object.values(state.tags)` in the Tags
  and New Entry screens, and the entry-lookup-by-ids in Group Details) with
  `createSelector` so they stop returning a new array reference on every
  render.

## [1.9.0] - 2026-09-19

Step 5 of the Wall redesign. Same dev build as 1.5.0 — no native changes.

### Added

- Days: a second way to see your timeline, one astronomical-wash band per
  day with a mark for every photo at its true time of day. Reach it with
  a new Wall/Days toggle in Home's header; tapping a day's band switches
  back to Wall, scrolled to that day.
- Settings' merge-window slider now shows a live preview: your most
  recent entries as dots, grouped into the pills they'd roughly merge
  into at the current window.

## [1.8.1] - 2026-09-19

Bugfix follow-up. Same dev build as 1.5.0 — no native changes.

### Fixed

- The photo viewer's swipe between photos no longer hitches partway
  through the gesture.
- Pinching to zoom now zooms toward wherever you're actually pinching,
  instead of always toward the center of the photo.

## [1.8.0] - 2026-09-19

Step 4 of the Wall redesign. Same dev build as 1.5.0 — no native changes.

### Changed

- Settings is restyled for the Wall, with every setting's copy updated:
  "What counts as one meal", "Merge photos taken within" (now shown as
  e.g. "1 h 30 m"), "Photos per row", "Use the photo's own date" and
  "Save where you were". A new "Edit tags" row opens the Tags screen.
- The Wall's tag rail gained a matching Edit button, and now always shows
  (previously it hid itself entirely with no tags yet).
- Tags and Capture (New Entry) are restyled onto the Wall's tokens, with
  no change to either flow. Tags' add/edit form is no longer boxed in a
  card — cards are gone everywhere now.

## [1.7.1] - 2026-09-19

Follow-up to the Wall redesign. Same dev build as 1.5.0 — no native changes.

### Changed

- The Wall's photo layout is now a fixed grid of equal squares instead of a
  masonry/mosaic choice. How many photos wide it runs is a new "Photos per
  row" slider in Settings (3–10, default 4), replacing the old "Photo
  layout" and "Entry page photo layout" switches — the second was already
  dead code since 1.7.0 gave the Entry page its own layout.
- Settings sliders (rolling window, and the new columns slider) now update
  live as you drag, instead of only when you release.

## [1.7.0] - 2026-09-19

Step 3 of the Wall redesign. Same dev build as 1.5.0 — no native changes.

### Changed

- The Entry page: a custom header (back, date and time, Edit), a large
  hero photo with a thumbnail strip for entries with more than one photo,
  and Taken/Place/Photos detail rows, replacing the old photo collage and
  icon-button header.
- Editing an entry's tags now has an inline "+ tag" control instead of
  showing every tag at once.
- Delete moved to the bottom of the Entry page, in clay, instead of a
  header icon.
- The photo viewer is restyled dark to match the Wall; it is still the
  same pure zoom-and-swipe viewer.

## [1.6.0] - 2026-09-19

Step 2 of the Wall redesign. Same dev build as 1.5.0 — no native changes.

### Added

- The Wall: a single scrolling feed of edge-to-edge photo pieces, replacing
  the tab bar's Feed screen and the separate Group Details screen. A meal
  with several entries now tiles all its photos as one piece with each
  entry's time, comment, and tags listed underneath, collapsing beyond
  three into a "+N more" line that expands in place.
- A tag filter rail below the header: tap a tag to show only matching
  meals, regrouped around the gaps left by everything else; tap it again
  to clear the filter.
- A draggable day scrubber on the right edge, showing a tick per day and
  letting you jump straight to one.
- Settings and Tags are now reached from a settings icon in the Wall's
  header, instead of a bottom tab bar.

### Changed

- The app no longer invents a name for a window of eating (no more
  "Leisurely Grazing Window" or "Night Owl Kitchen") — the photos and your
  own words are the whole of it.
- Removed the tab bar and the floating "+" button; capture is a single
  "Hang a new one" bar at the bottom of the Wall.

## [1.5.0] - 2026-09-19

Step 1 of the Wall redesign. Needs a new dev build.

### Added

- Native modules for the whole redesign: fonts, splash screen, system UI,
  linear gradient, expo-image and FlashList.
- Contrast tests for every text and background colour pair the app draws.

### Changed

- The whole app now wears the Wall look: dark green-black ground, bone text, a
  brass accent, Instrument Sans everywhere, no shadows.
- Photo collages sit flush to their edges with a 2px seam and square corners.
- Buttons, tag chips and segmented controls restyled for the dark ground.
- The app opens on a dark splash and stays on it until the font has loaded.
- Reformatted everything with prettier.
- Aligned Banner bottom padding to similar from the other feed elements.

## [v1.4.1] - 2026-09-18

### Changed

- Reformatted everything with prettier.
- Aligned Banner bottom padding to similar from the other feed elements.

## [1.4.0] - 2026-09-18

### Added

- Setting to use a different photo layout on the Entry page than on the
  Feed.
- Setting to turn off saving your location with new entries.

### Changed

- Deduplicated count-badge styling into a shared `CountBadge` component (feed
  entry-count pill and photo `+N` overflow pill previously duplicated the
  same inline styles).
- Tightened `Card`'s `style` prop typing to `StyleProp<ViewStyle>`.
- Added accessibility labels/roles to icon-only controls (`Fab`, and the
  edit/delete `IconButton`s in the Tags screen).
- Replaced the photo-viewer-does-everything entry screen with a dedicated
  Entry Details screen (photos, date, location, tags, comment, edit,
  delete) reached from Feed and Group Details; tapping a photo from there
  opens a now-simplified pure viewer (zoom/swipe only).
- Development and preview builds now use a distinct `.dev` bundle
  ID/package and app name ("What Did I Eat (Dev)"), so they can be
  installed alongside a production build without conflicting.
- Designer polish pass on the Entries and Entry Detail screens: Entries
  cards now show a swipeable photo carousel (instead of a single
  photo+badge), tag chips, and a bold time/comment hierarchy; tag chips
  everywhere now use a tinted brand-green background instead of
  near-white; Entry Detail's date/location merged into one row with
  icons.
- Feed screen's timeline is now one continuous dashed line running down
  the whole list (day dividers redesigned as pills sitting on the line),
  instead of a separate dash boxed inside each card. Added a "No rules.
  Just notice." banner, always shown between the first and second day
  sections.
- Entries list: tapping a photo now opens the entry, photos are a touch
  smaller, and each row now shows its photo on the left with the time and
  tags on the right.
- Entry page title now shows the entry's time, e.g. "2:30 PM Record".
- Tags screen redesigned: tags now show as icon + label chips, with a
  "Select" mode for deleting several at once and tap-to-edit; many more
  icons to choose from.
- Feed timeline polish: day labels now sit at the left edge, spacing
  between days is more even, and the dashed line reaches the bottom of
  the screen.

### Fixed

- The on-screen keyboard no longer covers the active text input on the
  Tags, New Entry, and Entry Details screens.
- Feed cards: the dashed timeline line now reaches all the way to the
  bottom time label instead of stopping partway down; photo collage
  corners touching the card's edge now match the card's own corner
  radius.
- Some older entries' photos could show up blank/gray instead of the
  actual picture; fixed.
