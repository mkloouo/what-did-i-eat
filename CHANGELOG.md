# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

### Fixed

- The on-screen keyboard no longer covers the active text input on the
  Tags, New Entry, and Entry Details screens.
