# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
