# Penpot ↔ Implementation Audit — "What Did I Eat"

Date: 2026-09-18
Scope: forensic comparison between the Penpot "What Did I Eat" (Stitch-generated) design
file and the actual Expo/React Native implementation in this repo. This is an audit, not a
redesign — no implementation or design changes were made as part of this pass.

Sources:
- Penpot file: 1 page, 9 real screens, 2 logo assets, 1 embedded developer-reference text
  spec. No components, tokens, or prototype interactions exist anywhere in the file.
- Implementation: 59 source files, 7 screens, 13 reusable components, 4 Redux slices, fully
  offline (no backend/API layer).

---

## 0. Root cause

The Penpot file has **zero shared components, zero color/typography tokens, zero prototype
links**, and its 9 screens were each generated independently (Stitch/AI, `column-reverse`
flex artifacts throughout — an HTML-export signature, not a deliberate reading order).
That single fact explains most of what follows: three unreconciled "timeline" screens, two
competing "Settings" screens, two competing "meal detail" screens for identical data, and a
navigation bar that differs on every screen it appears on. There was never a design system
to drift from.

---

## 1. Canonical screen mapping

| Penpot screen | Implementation | Status |
|---|---|---|
| `Feed & Timeline (Infinite Scroll)` | `FeedScreen` | Partial — structure/grouping/FAB/anchor-card match; tags-on-card, storage sub-bar, per-card context-tags row missing |
| `Journal Timeline (Mosaic View)` | `FeedScreen` (treemap layout setting) | Unclear — plausibly the same screen at a different `photoLayoutAlgorithm`, but Nav differs; mood-tag captions/kebab menu/"Journal filters" don't exist in code |
| `Journal Timeline (Columns Layout)` | `FeedScreen` (masonry layout setting) or nothing | Unclear — flat ungrouped photo grid has no "grouping off" mode in code |
| `Calendar Day & Meal Slots Views` | *(none)* | Missing implementation, or not real — its own header says "Showcase" |
| `Meal Group Detail & Notes` | `GroupDetailsScreen` (+ implies `EntryDetailsScreen`) | Different — per-entry structure matches, but hunger/satiety sliders, layout toggle, "Mindful Environmental Tags" have no code equivalent |
| `Meal Window Detail & Notes` | `EntryDetailsScreen` | Different — comment+tags+location editing matches structurally, but implies a persisted "window" note/tag entity that doesn't exist |
| `Custom Context & Meal Tags Manager` | `TagsScreen` | Partial — CRUD flow matches; categories, search bar, emoji icons, drag-reorder missing |
| `Settings & Preferences` | `SettingsScreen` | Partial, competes with row below |
| `Settings & Auto-Grouping Rules` | `SettingsScreen` | Partial, competes with row above — anti-diet pledge section has zero code equivalent |
| *(no Penpot screen exists)* | `NewEntryScreen` | **Missing design** — the core entry-creation flow is entirely undesigned |
| *(implied only by a "tap to zoom" hint)* | `PhotoDetailsScreen` | Missing design (design implication, never built as a screen) |

---

## 2. Design hallucinations

**2.1 — "Lunch & Afternoon Bites" example is impossible under the design's own algorithm.**
Both meal-detail screens show the identical example: title "Lunch & Afternoon Bites", 3
entries, 12:12 PM–13:15 PM (63 minutes). The real title algorithm
(`src/utils/windowTitle.ts`) is a near-verbatim implementation of the Penpot
developer-reference doc's wording matrix. Under that algorithm, `"[Start] & [Extended]"`
titles only fire when `entryCount === 2` **and** span ≥75 minutes. This example has
`entryCount === 3` and a 63-minute span — under both the code and the design's own written
rule, that combination produces `"Midday Lunch"`, not "Lunch & Afternoon Bites". This is a
**design bug against its own spec**, not an implementation gap.

**2.2 — "Window" treated as a persisted, independently-editable entity.**
`Meal Window Detail & Notes` gives the window its own shared note, context-tag chips, and
location pill, implying "window" is a first-class record. The implementation has no such
entity — a group/window is purely derived (`groupSelectors.ts`, recomputed live from
entries + `rollingWindowMinutes`), never persisted, never itself the target of a
comment/tag write. Every comment/tag/location in the real data model belongs to an
individual `Entry`. A "window note" cannot exist without a real architecture decision
(new Window/Group table, or writing onto one arbitrary constituent entry) that the design
doesn't acknowledge making.

**2.3 — Hunger/Satiety somatic check-in sliders (`Meal Group Detail`).**
Appears nowhere else in the file (not in the dev-reference doc, not in the sibling
`Meal Window Detail` screen for the same data, not in the Tags Manager) and has zero
corresponding field in the implementation's data models. Reads as a one-off elaboration
from independent screen generation, not a reconciled feature.

**2.4 — iOS Photos-album integration** ("iOS Album: 'What Did I Eat'", "Saved in: Photos ›
What Did I Eat"). The implementation copies photos into the app's own private document
directory and never touches the system Photos library. This is a cross-platform Expo app
(Android is a real target — `RECORD_AUDIO` is even declared for Android) — the design
assumes a platform integration and exclusivity that don't exist.

**2.5 — Mood/somatic caption chips on `Journal Timeline (Mosaic View)`** ("Nourishing &
Calm", "Sunlit Break", "Slow Chew"...). Don't match the design's own Tags Manager
vocabulary (only "Plant-rich" overlaps) and no screen establishes an AI-captioning
feature. Flagged, not assumed to be either sample copy or a real undesigned feature.

**2.6 — "Traditional/Fixed Meal Slots" grouping mode.** Fully speced (dev-reference doc
§4, demoed in the showcase screen, present as option C/3 on both Settings screens) with
zero implementation. Not a hallucination by itself, but paired with 2.1, shows real spec
effort sunk into a mode nobody updated the Settings screens to drop.

---

## 3. Implementation hallucinations / misleading signals

1. **`PhotoThumbnail`'s `badgeCount` prop** (`src/components/PhotoThumbnail.tsx:9,12,20-22`)
   — fully renders a "+N" overlay but no caller ever passes it.
2. **`splash-icon.png`** — exists on disk, `app.config.js` has no `splash` key referencing
   it. Cosmetic leftover.
3. **`RECORD_AUDIO` Android permission** declared with zero audio/video capability
   anywhere in the app.
4. **`inspiration.png` / `palette.png`** at repo root — unreferenced by code, almost
   certainly the literal seed images for the Stitch/Penpot generation.
5. **`TAG_ICON_OPTIONS`'s 56-icon Ionicons dump** (car, game-controller, medkit, weather
   icons) reads as a generic icon-kit default, directly contradicting the design's curated
   10-emoji, food-scoped icon picker.

No dead screens, no competing full-screen implementations, no feature flags found.

---

## 4. Missing from implementation

- Third grouping mode ("Traditional/Fixed Meal Slots").
- Tag categories (design has 3; `Tag` model has no category field).
- Tags search bar.
- Tag drag-to-reorder.
- Anti-diet pledge section (evening reflection reminder, satiety check-in toggle, pledge copy).
- "Exclude from Recents" / "Dedicated Device Folder" toggles.
- Counter Badge / Timeline Line visibility toggles (always-on in code today).
- Per-window/per-photo hunger & satiety sliders (if genuinely intended — see 2.3).
- Context-tags row directly on Feed cards.
- "Storage sub-bar" / settings-gear shortcut at the bottom of Feed.
- In-screen photo-layout toggle on the entry/group detail screen itself (exists only as
  two separate global Settings defaults in code, not a per-window override control).
- Any onboarding/education screen for grouping modes (if `Calendar Day & Meal Slots
  Views` is meant to ship — ambiguous).
- An in-app logo/wordmark asset — the design's header treatment has no implementation
  counterpart at all.

## 5. Missing from design

- **The entire entry-creation form (`NewEntryScreen`)** — no Penpot representation
  whatsoever. Camera/library picker, thumbnail row with long-press delete, date/time
  picker (EXIF-inference, future-date clamping), tag multi-select, comment box,
  permission-denial alerts — none of it is designed.
- `PhotoDetailsScreen` — implied only by a "tap to zoom & inspect" hint string, never
  drawn as an actual screen.
- All delete-confirmation dialogs and informational alerts (camera/library unavailable,
  partial/total photo-save failure).
- Permission-denied states for camera, photo library, location.
- The long-press-to-delete-photo interaction (undiscoverable, unvalidated visually).
- The "missing entry" fallback state ("This entry no longer exists.").
- Any empty/loading/error state anywhere — the design file is 100% happy-path; the
  implementation actually has (basic, text-only) empty states for Feed and Tags that have
  zero design counterpart.
- First-run tag-seeding behavior (10 default tags pre-populate on first launch) — no
  design screen acknowledges this as a distinct first-use state.

## 6. Design implications (logically required, built on neither side)

- What happens to entries referencing a deleted tag? (Implementation's actual answer:
  dangling reference, silently filtered, never cleaned up — no design screen acknowledges
  this state exists.)
- What happens when location capture fails? (Design specifies a `📍 Location unlogged`
  fallback string; implementation instead omits the location row entirely — implied by
  the feature, resolved differently on each side, never reconciled.)
- Can new photos be added to an already-"closed" window? (`Meal Group Detail`'s "Add
  another photo to this group" implies yes, but `groupSelectors.ts` recomputes purely from
  timestamps — no manual-override field exists on either side to make this well-defined.)
- Cold-start rehydration: the app genuinely blanks the screen while AsyncStorage/
  redux-persist rehydrates (`PersistGate loading={null}`) — implied by having local
  persistence at all, undesigned on either side.

---

## 7. Internal consistency — design side (highlights)

- **Two competing Settings screens** (~70% overlap, each with a section the other lacks) —
  Ambiguous, can't tell which is current.
- **Two competing meal-detail screens for the identical window** — Ambiguous, likely
  genuinely different unresolved product directions, not variants.
- **Three timeline/journal concepts** — Ambiguous, partially explainable by the
  layout-setting theory in §1 but not fully (Nav bars don't match that theory).
- **Navigation bar differs on every screen** (3 different label sets across 9 screens) —
  Design bug; a bottom-tab bar is by definition one shared control.
- **4 different terms for "window"** (Memory/Group/Cluster/Window) — Design bug.
- **Two logo marks used inconsistently** between sibling detail screens — Design bug or
  Ambiguous if one is meant to replace the other.
- **Tag category named 3 different ways within one screen** — Design bug.
- **"+1 hr" vs "+60m" for the same threshold** — Design bug (the dev-reference doc itself
  is internally consistent; the two detail screens disagree with each other and with it).
- **Raw Google-hosted image URL left as literal text copy** — Legacy/generation artifact,
  not design content.
- **The "Showcase" screen sitting undistinguished from real screens** — Ambiguous.

## 8. Internal consistency — implementation side (highlights)

- **Feed uses raw `ScrollView`; `GroupDetailsScreen` uses `FlatList`** — the screen most
  likely to grow unbounded (Feed, the entire log) is the one not virtualized. Real
  (latent) implementation bug, not cosmetic.
- **Three vocabularies for the same photo-layout concept** (masonry/treemap in code,
  `squarifiedLayout.ts` as a filename, Columns/Mosaic in Settings UI) — technical-only,
  worth cleaning up.
- **`Button` component misfiled under `components/photoLayouts/`** — technical-only,
  structural not visual.
- **Comment empty-state rendered two different ways** for the same field
  (`EntryDetailsScreen` always shows "No comment"; `GroupDetailsScreen` renders nothing) —
  real implementation bug, user-visible.
- **Card shadow applied ad hoc per call site** rather than built into the shared `Card`
  primitive — technical-only today, but a shared-primitive fix would resolve several
  screens' visual inconsistency at once.
- **Two visually identical Settings `SegmentedControl`s** with no visual grouping to
  distinguish them — real implementation bug, confusable in the running app.
- **"Delete" vs "Remove" used interchangeably** for destructive actions — technical-only,
  low severity.

---

## 9. Design system comparison

| | Penpot | Implementation |
|---|---|---|
| Colors | Sampled only (no library): cream `#fbf9f2`, green ink `#2c4434`/`#1b1c18`, brand green `#435c4a`/`#4b6452` | Centralized `theme.ts`, 9 flat tokens, no dark mode |
| Typography | Epilogue (headings) + Karla (UI/body), ad hoc per shape | `theme.ts` title/subtitle/body/caption — no `lineHeight` tokens |
| Radius | pill=9999, cards=32, containers=0 | sm=8, md=12, lg=16, pill=999 — cards are notably smaller-radius in code (12–16) than design (32) |
| Shadows | Consistent soft drop-shadows on cards/buttons/nav | One shared `shadows.card`, applied inconsistently |
| Components/tokens | None exist | Centralized theme file, well-adopted |

## 10. Assets

- Both sides agree: no illustration/empty-state assets exist anywhere.
- No broken/missing-image fallback exists in code (`onError` unhandled everywhere images
  render); naturally can't exist in a design that only shows populated happy-path data.
- Two logo marks in design, used inconsistently; implementation has no in-app logo/
  wordmark asset at all — checked `assets/`, only app-icon-level images exist.
- `inspiration.png`/`palette.png` at repo root are very likely the seed images for the
  Stitch generation — worth keeping as design-intent evidence.

---

## Action items

### A. Design-side decisions needed before any implementation work (priority order)

1. [ ] Pick one Settings screen (`Settings & Preferences` vs `Settings & Auto-Grouping
       Rules`) or explicitly merge them — the anti-diet pledge section and the
       tags-manager link can't both be dropped.
2. [ ] Pick one meal-detail concept (`Meal Group Detail` vs `Meal Window Detail`) — per-
       photo notes + somatic sliders, or one shared window note + tags. These are
       different products, not variants.
3. [ ] Fix the window-naming contradiction (§2.1) — either correct the example screens to
       match the documented algorithm, or deliberately change the algorithm/doc.
4. [ ] Decide whether "window" is a first-class persisted entity or purely derived from
       entries, before any screen implies it has its own editable state.
5. [ ] Decide whether the third grouping mode ("Traditional/Fixed Meal Slots") ships —
       commit to building it, or remove it from the dev-reference doc and both Settings
       mockups.
6. [ ] Design the actual entry-creation flow (`NewEntryScreen` equivalent) — currently
       zero design representation for the app's core interaction.
7. [ ] Reconcile the three timeline/journal concepts against the real
       `photoLayoutAlgorithm` / `groupingMode` settings already in code — two of the three
       may just be the same screen at different settings, wrongly drawn as separate IA.
8. [ ] Confirm or discard the "Showcase" screen and the mood/somatic tag captions — both
       read as generation scratch material rather than shippable UI.
9. [ ] Drop or rewrite the iOS-Photos-album copy — it assumes a platform integration the
       app doesn't (and, given Android support, likely shouldn't) have.
10. [ ] Design the missing states: delete confirmations, permission-denied (camera/
        library/location), photo-load failure, "entry no longer exists", first-run tag
        seeding.
11. [ ] Reconcile the two logo marks (`What Did I Eat Logo` vs `Food Plate Logo`) into one
        consistent usage rule, or retire one.
12. [ ] Unify terminology for the auto-grouped-photos concept to one term (doc's own
        "window" is the most internally consistent candidate) and one tag-category naming
        scheme (currently 2–3 spellings per category on a single screen).

### B. Implementation-side cleanups independent of the design questions above

13. [ ] Switch `FeedScreen` from `ScrollView` to a virtualized list (`FlatList`/
        `SectionList`) — real performance risk as entry count grows, not just style.
14. [ ] Make the comment empty-state consistent between `EntryDetailsScreen` and
        `GroupDetailsScreen` (pick one: always show "No comment" fallback, or never).
15. [ ] Move card shadow into the shared `Card` component instead of ad hoc per call site.
16. [ ] Relocate `Button` out of `components/photoLayouts/` to `components/Button.tsx`.
17. [ ] Consolidate the three independent "photo layout" vocabularies (masonry/treemap,
        `squarifiedLayout`, Columns/Mosaic) to one internal name + one UI label pair.
18. [ ] Visually distinguish the two identical Settings `SegmentedControl`s (grouping/
        labeling), or reconsider whether both need to be independently configurable.
19. [ ] Decide the fate of `PhotoThumbnail`'s unused `badgeCount` prop (wire it up or
        delete it) and the unused `RECORD_AUDIO` Android permission (remove it if no
        audio feature is planned).
20. [ ] Consolidate the three separately-hardcoded "6px dot" pagination-dot
        implementations into the shared `PaginationDots` component.

### C. Deferred — do not act on until (A) is resolved

- Any visual redesign of existing screens.
- Building the third grouping mode, tag categories, or the anti-diet pledge section.
- Building a `NewEntryScreen` design retrofit.

These depend on decisions in section A and should not be started until those are answered,
per the audit's own sequencing constraint (design corrections before implementation
redesign).
