# What Did I Eat

## Vision

The purpose of this project is to shift my mind off of unnecessary things, like calories and weight tracking and just add some conscious thought to the food tracking. What food do I eat?

While I am working on making this more of a natural process (eating) instead of an addictive, disease-like state (emotional over-eating), I don't want to:
- guilt-trip myself which happens when you go over your desired calorie goals
- overcomplicate things with precise calculations

So, I thought it would be great to just track the food and what did I eat exactly. I started with taking a photo and having those in phone gallery seemed stupid, so I thought it would be great to:
- have those photos auto-group (with app storing them into a dedicated folder)
- have by day grouping
- have comments under each photo / photo group for the additional explanations on what was eaten

That's pretty much it.

## UI

The app is "the Wall": a dark, flat, no-shadow design system (bone text,
brass accent, Instrument Sans) where the photos are the interface, not a
list of cards.

**Home** is a single scrolling wall of edge-to-edge photo pieces, grouped
into meals by a rolling time window (default: photos within the same hour
join the last group; configurable in Settings). A meal with several
entries tiles all its photos as one piece, with time, comment and tags
underneath. A tag filter rail below the header narrows the wall to one
tag at a time, and a draggable day scrubber on the right edge jumps
straight to a day.

A `Wall | Days` toggle in Home's header swaps the wall for **Days**: one
astronomical-wash band per day (night/dawn/day/dusk/night), with a mark
for every photo at its true time. Tapping a day's band switches back to
Wall, scrolled to that day.

Settings and Tags are reached from a settings icon in Home's header
(there's no tab bar). Settings holds the rolling-window length (with a
live preview of how recent entries would cluster), photos-per-row for the
wall grid, whether to infer a photo's date from its own EXIF data, and
whether to save location with new entries.

**New entry**: take or pick photos, write a comment, tag it, save.

**Entry details**: the full-size photos, date/time, place, tags and
comment for one entry, reached by tapping a piece on the Wall; tapping a
photo there opens a plain pinch-to-zoom/swipe viewer.

## Tech side

Should be done with react native + react navigation + redux toolkit (if needed) + any other lib

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — free to use, modify, and share for noncommercial purposes.
