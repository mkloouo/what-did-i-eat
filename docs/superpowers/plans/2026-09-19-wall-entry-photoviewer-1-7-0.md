# Entry Page and Photo Viewer (1.7.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Entry page and the photo viewer into the Wall's look — a custom header, a hero photo with a thumbnail strip replacing the photo collage, relabeled detail rows, and Delete moved to the bottom in clay — with the photo viewer restyled dark but otherwise unchanged.

**Architecture:** No new pure logic and no new native dependency. Both screens are presentational rewrites on top of components and tokens that already exist (`TagChip`, `IconButton`, `PaginationDots`, `Button`, `theme`, `expo-image`). Task 1 rewrites the Entry page; Task 2 restyles the photo viewer; Task 3 bumps the version. Each is independently testable by compiling and running the existing suite — this codebase does not unit-test screen JSX (see `src/**/*.test.*`: only pure logic is tested), so verification here is `npx tsc --noEmit` + `npx jest` (no regressions) plus a manual test plan at the end.

**Tech Stack:** Expo SDK 57, React Native 0.86, React Navigation 7 (native stack), Redux Toolkit, `expo-image`, `@expo/vector-icons` (Ionicons), `react-native-image-viewing`.

**Spec:** `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md`. This is plan 3 of 6 (version 1.7.0). Plan 1 (1.5.0) and plan 2 (1.6.0, `docs/superpowers/plans/2026-09-19-wall-feed-1-6-0.md`) are complete and merged into this branch.

## Decision carried over from planning

The spec's Entry page section ("a large square photo, then thumbnails ... dimmed, with '1 of N'") and its Settings table (`entryPhotoLayoutAlgorithm`: "same control, On one meal") don't fit together literally — the first describes a hero+strip layout, the second implies the existing `PhotoStack` collage still drives "one meal" tiling. Resolved with the user: **build the hero+thumbnail-strip layout as written**. `entryPhotoLayoutAlgorithm` is not read by `EntryDetailsScreen` after this plan; its setting row and its fate are entirely 1.8.0's decision, untouched here.

## Global Constraints

- Branch is `wall-redesign`. Never work on `main`.
- Theme tokens (from 1.5.0, unchanged): `theme.colors.{wall,seam,hairline,bone,chalk,brass,clay}`, `theme.fonts.{regular,medium,semibold,bold}`, `theme.typography.{title,subtitle,body,caption,time}`, `theme.spacing.{xs:4,sm:8,md:16,lg:24,xl:32}`, `theme.radii.{sm:2,md:3,lg:4,pill:999}`. Never use `fontWeight`; always a `fontFamily` from `theme.fonts`. Use the direct token names (`colors.wall`, `colors.bone`, ...), never the legacy aliases (`colors.background`, `colors.textOnDark`, ...) — those exist only so screens this plan doesn't touch keep working, and are deleted in 2.0.0.
- The entry's hero photo and its thumbnail strip render through `expo-image`'s `Image`, not `PhotoStack` — `PhotoStack` stays exactly as-is, used only by the Wall's collage (`WallPiece`).
- Photos run edge to edge: the hero photo has no horizontal padding and no border radius. Text never sits on top of a photograph — no scrims, no overlaid badges, no overflow pills. Dimming an unselected thumbnail via `opacity` is not a badge and is fine.
- Nothing in this plan counts, scores, streaks, or colors a time as good or bad.
- No new native dependency in this plan.
- Run `npx tsc --noEmit` and `npx jest` yourself after every task. Do not start dev servers and do not drive the app — Metro is already running for the user against the existing dev client; nothing in this plan needs a new native build.
- Baseline right now (verified before writing this plan): `npx tsc --noEmit` is clean, `npx jest` is 19 suites / 124 tests passing. No task in this plan adds or removes a test file, so both counts must be unchanged after every task.
- Version bump touches `package.json`, `app.config.js` and `CHANGELOG.md`, in its own commit worded `bump to vX.Y.Z`, separate from feature commits. No git tags, no EAS builds, no GitHub releases.
- Commit messages end with the line `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` — copy this exact literal text, never substitute a different model name.
- Code style matches the surrounding files: 2-space indent, double quotes, semicolons, `PascalCase` component filenames, `camelCase` util filenames.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/navigation/RootNavigator.tsx` | `EntryDetails` hides the native stack header — the screen now draws its own | 1 |
| `src/screens/EntryDetailsScreen.tsx` | Full rewrite: custom header (back/Edit/Cancel/Save + date+time), hero photo + thumbnail strip with "N of M", comment, tags with an inline "+ tag" add flow, Taken/Place/Photos detail rows, Delete in clay at the bottom | 1 |
| `src/components/IconButton.tsx` | Default `color` moves off the legacy `textOnDark` alias onto `colors.bone` | 1 |
| `src/screens/PhotoDetailsScreen.tsx` | Recolored onto direct Wall tokens; still a pure zoom/swipe viewer, no structural change | 2 |
| `src/components/PaginationDots.tsx` | Default colors move off the legacy `muted`/`textOnDark` aliases onto `colors.chalk`/`colors.bone` | 2 |
| `package.json`, `app.config.js`, `CHANGELOG.md` | Bump to 1.7.0 | 3 |

---

### Task 1: Entry page

**Files:**
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/screens/EntryDetailsScreen.tsx`
- Modify: `src/components/IconButton.tsx`

**Interfaces:**
- Consumes: `TagChip` (icon/label/selected/onPress, unchanged since 1.6.0), `IconButton` (name/onPress/accessibilityLabel/color), `Button` (label/onPress, unchanged), `resolvePhotoUri`/`deletePhotoFile` (unchanged), `formatFullDateTime`/`formatTime`/`dayLabel`/`dayKeyOf` (unchanged, all already exported from `src/utils/dateFormat.ts`), `updateEntryComment`/`updateEntryTags`/`deleteEntry` (unchanged), `theme`.
- Produces: `EntryDetailsScreen()` unchanged export name/signature — nothing else in the app imports from this file besides `RootNavigator`.

- [ ] **Step 1: Hide the native header for this screen**

In `src/navigation/RootNavigator.tsx`, replace:

```tsx
      <Stack.Screen
        name="EntryDetails"
        component={EntryDetailsScreen}
        options={{ title: "Entry" }}
      />
```

with:

```tsx
      <Stack.Screen
        name="EntryDetails"
        component={EntryDetailsScreen}
        options={{ headerShown: false }}
      />
```

- [ ] **Step 2: Move `IconButton`'s default color off the legacy alias**

In `src/components/IconButton.tsx`, replace:

```tsx
  color = theme.colors.textOnDark,
```

with:

```tsx
  color = theme.colors.bone,
```

- [ ] **Step 3: Rewrite the Entry screen**

Replace the full contents of `src/screens/EntryDetailsScreen.tsx`:

```tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  updateEntryComment,
  updateEntryTags,
  deleteEntry,
} from "../store/entriesSlice";
import { deletePhotoFile, resolvePhotoUri } from "../storage/photoStorage";
import {
  formatFullDateTime,
  formatTime,
  dayLabel,
  dayKeyOf,
} from "../utils/dateFormat";
import { TagChip } from "../components/TagChip";
import { IconButton } from "../components/IconButton";
import { Button } from "../components/photoLayouts/Button";
import { Tag } from "../types/models";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "EntryDetails">;
type Route = RouteProp<RootStackParamList, "EntryDetails">;

export function EntryDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId } = route.params;
  const insets = useSafeAreaInsets();

  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.entries[entryId]);
  const allTags = useAppSelector((state) => state.tags);

  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? "");
  const [draftTagIds, setDraftTagIds] = useState<string[]>(
    entry?.tagIds ?? [],
  );
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // The built-in "scroll focused input into view" behavior doesn't
  // reliably reveal this input (last in a long, variable-height scroll
  // above it: photos + tags). It's the last thing in the content, so
  // scrolling all the way to the end always reveals it regardless of what
  // sits above. The delay lets KeyboardAvoidingView's resize settle first.
  function handleCommentFocus() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function startEdit() {
    if (!entry) return;
    setDraftComment(entry.comment);
    setDraftTagIds(entry.tagIds ?? []);
    setShowTagPicker(false);
    setIsEditing(true);
  }

  function cancelEdit() {
    setShowTagPicker(false);
    setIsEditing(false);
  }

  function saveEdits() {
    if (!entry) return;
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    dispatch(updateEntryTags({ id: entry.id, tagIds: draftTagIds }));
    setShowTagPicker(false);
    setIsEditing(false);
  }

  function toggleDraftTag(id: string) {
    setDraftTagIds((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
    );
  }

  function confirmDelete() {
    if (!entry) return;
    Alert.alert(
      "Delete entry?",
      "This removes the photo(s) and comment permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Promise.allSettled(
              entry.photos.map((photo) => deletePhotoFile(photo.uri)),
            );
            dispatch(deleteEntry({ id: entry.id }));
            navigation.goBack();
          },
        },
      ],
    );
  }

  if (!entry) {
    return (
      <View
        style={[
          styles.missing,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate("Home")} />
      </View>
    );
  }

  const resolvedTags = (entry.tagIds ?? [])
    .map((id) => allTags[id])
    .filter((tag): tag is Tag => Boolean(tag));
  const draftTags = draftTagIds
    .map((id) => allTags[id])
    .filter((tag): tag is Tag => Boolean(tag));
  const unselectedTags = Object.values(allTags).filter(
    (tag) => !draftTagIds.includes(tag.id),
  );
  const photoUris = entry.photos.map((photo) => resolvePhotoUri(photo.uri));
  const heroIndex = Math.min(activePhotoIndex, photoUris.length - 1);
  const heroUri = photoUris[heroIndex];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + theme.spacing.sm },
        ]}
      >
        {isEditing ? (
          <Pressable onPress={cancelEdit} style={styles.headerSideButton}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
        ) : (
          <IconButton
            name="chevron-back-outline"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
          />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {dayLabel(dayKeyOf(entry.createdAt))} · {formatTime(entry.createdAt)}
        </Text>
        <Pressable
          onPress={isEditing ? saveEdits : startEdit}
          style={styles.headerSideButton}
        >
          <Text style={styles.headerAction}>
            {isEditing ? "Save" : "Edit"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <Pressable
          onPress={() =>
            navigation.navigate("PhotoDetails", {
              entryId: entry.id,
              photoIndex: heroIndex,
            })
          }
        >
          <Image
            source={{ uri: heroUri }}
            style={styles.hero}
            contentFit="cover"
          />
        </Pressable>

        {photoUris.length > 1 ? (
          <View style={styles.thumbSection}>
            <Text style={styles.photoCount}>
              {heroIndex + 1} of {photoUris.length}
            </Text>
            <ScrollView
              horizontal
              style={styles.thumbScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
            >
              {photoUris.map((uri, index) => (
                <Pressable
                  key={uri + index}
                  onPress={() => setActivePhotoIndex(index)}
                >
                  <Image
                    source={{ uri }}
                    style={[
                      styles.thumb,
                      index === heroIndex
                        ? styles.thumbActive
                        : styles.thumbDimmed,
                    ]}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {isEditing ? (
          <TextInput
            style={styles.commentInput}
            value={draftComment}
            onChangeText={setDraftComment}
            onFocus={handleCommentFocus}
            multiline
            placeholder="Comment"
            placeholderTextColor={theme.colors.chalk}
          />
        ) : (
          <Text style={styles.comment}>{entry.comment || "No comment"}</Text>
        )}

        {isEditing ? (
          <View style={styles.tagRow}>
            {draftTags.map((tag) => (
              <TagChip
                key={tag.id}
                icon={tag.icon}
                label={tag.label}
                selected
                onPress={() => toggleDraftTag(tag.id)}
              />
            ))}
            {unselectedTags.length > 0 ? (
              <Pressable
                onPress={() => setShowTagPicker((current) => !current)}
                style={styles.addTagChip}
              >
                <Ionicons
                  name="add-outline"
                  size={14}
                  color={theme.colors.chalk}
                />
                <Text style={styles.addTagLabel}>Add tag</Text>
              </Pressable>
            ) : null}
          </View>
        ) : resolvedTags.length > 0 ? (
          <View style={styles.tagRow}>
            {resolvedTags.map((tag) => (
              <TagChip key={tag.id} icon={tag.icon} label={tag.label} />
            ))}
          </View>
        ) : null}

        {isEditing && showTagPicker && unselectedTags.length > 0 ? (
          <View style={styles.tagRow}>
            {unselectedTags.map((tag) => (
              <TagChip
                key={tag.id}
                icon={tag.icon}
                label={tag.label}
                onPress={() => toggleDraftTag(tag.id)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.detailList}>
          <DetailRow
            label="Taken"
            value={formatFullDateTime(entry.createdAt)}
          />
          {entry.location?.placeName ? (
            <DetailRow label="Place" value={entry.location.placeName} />
          ) : null}
          <DetailRow
            label="Photos"
            value={`${entry.photos.length} photo${
              entry.photos.length === 1 ? "" : "s"
            }`}
          />
        </View>

        <Pressable onPress={confirmDelete} style={styles.deleteRow}>
          <Text style={styles.deleteLabel}>Delete entry</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type DetailRowProps = { label: string; value: string };

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.wall,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  headerSideButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minWidth: 60,
  },
  headerAction: {
    ...theme.typography.subtitle,
    color: theme.colors.brass,
  },
  headerTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.bone,
    flex: 1,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  hero: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: theme.colors.seam,
  },
  thumbSection: {
    gap: theme.spacing.xs,
  },
  photoCount: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    paddingHorizontal: theme.spacing.md,
  },
  thumbScroll: {
    flexGrow: 0,
  },
  thumbRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.seam,
  },
  thumbActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: theme.colors.hairline,
  },
  thumbDimmed: {
    opacity: 0.5,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.bone,
    paddingHorizontal: theme.spacing.md,
  },
  commentInput: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 96,
    textAlignVertical: "top",
    color: theme.colors.bone,
    ...theme.typography.body,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  addTagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  addTagLabel: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
  },
  detailList: {
    marginHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  detailLabel: {
    ...theme.typography.body,
    color: theme.colors.chalk,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
  deleteRow: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  deleteLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.clay,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.wall,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
});
```

Notes on choices this step makes that the spec left open:
- Tapping a thumbnail swaps the hero photo in place (`activePhotoIndex`); tapping the hero photo is what opens the full-screen zoom viewer (`PhotoDetails`), at whichever index is currently active.
- The thumbnail strip and the "N of M" caption sit inside the page's normal `md` margins, not edge to edge — edge-to-edge is reserved for the hero photo itself, which is the piece playing the Wall's "photo is the interface" role on this screen.
- The "+ tag" control is a small pill (a plus glyph + "Add tag", `seam` background) that toggles a row of the remaining unselected tags below it; it disappears once every tag is already on the entry. This isn't a `TagChip` instance because `TagChip`'s `icon` prop is typed to `TagIcon` (the tag-icon-picker's fixed glyph set, from `TAG_ICON_OPTIONS` in `src/types/models.ts`), which does not include `"add-outline"`.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the test suite**

Run: `npx jest`
Expected: 19 suites / 124 tests passing — unchanged from baseline (no test file touched by this task).

- [ ] **Step 6: Commit**

```bash
git add src/navigation/RootNavigator.tsx src/screens/EntryDetailsScreen.tsx src/components/IconButton.tsx
git commit -m "feat: restyle the Entry page for the Wall

Custom header (back/Edit/Cancel/Save + date and time), a hero photo with
a thumbnail strip replacing the photo collage, an inline \"+ tag\" add
flow while editing, Taken/Place/Photos detail rows, and Delete moved to
the bottom in clay.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Photo viewer

**Files:**
- Modify: `src/screens/PhotoDetailsScreen.tsx`
- Modify: `src/components/PaginationDots.tsx`

**Interfaces:**
- Consumes: `PaginationDots` (count/activeIndex/dotColor/activeDotColor, unchanged signature), `Button` (unchanged), `theme`.
- Produces: `PhotoDetailsScreen()` unchanged export name/signature; `PaginationDots` keeps the same prop names, only its two default values change.

- [ ] **Step 1: Move `PaginationDots`'s defaults off the legacy aliases**

In `src/components/PaginationDots.tsx`, replace:

```tsx
  dotColor = theme.colors.muted,
  activeDotColor = theme.colors.textOnDark,
```

with:

```tsx
  dotColor = theme.colors.chalk,
  activeDotColor = theme.colors.bone,
```

- [ ] **Step 2: Recolor the photo viewer**

In `src/screens/PhotoDetailsScreen.tsx`, replace the `styles` block:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  topBarButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.accentDark,
  },
  topBarButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  footer: {
    backgroundColor: theme.colors.accentDark,
    padding: theme.spacing.md,
  },
  dotsWrapper: {
    marginBottom: theme.spacing.sm,
  },
  footerMeta: {
    ...theme.typography.caption,
    color: theme.colors.textOnDark,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
```

with:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  topBarButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.wall,
  },
  topBarButtonText: {
    color: theme.colors.bone,
    ...theme.typography.subtitle,
  },
  footer: {
    backgroundColor: theme.colors.wall,
    padding: theme.spacing.md,
  },
  dotsWrapper: {
    marginBottom: theme.spacing.sm,
  },
  footerMeta: {
    ...theme.typography.caption,
    color: theme.colors.bone,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.wall,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
});
```

The full-bleed backdrop (`container`) stays literal `"#000"`, not `theme.colors.wall` — a photo viewer wants true black behind the image, and this was already independent of the legacy palette before this change.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run the test suite**

Run: `npx jest`
Expected: 19 suites / 124 tests passing — unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/screens/PhotoDetailsScreen.tsx src/components/PaginationDots.tsx
git commit -m "fix: restyle the photo viewer onto direct Wall tokens

Same pure zoom-and-swipe viewer, no structural change — only the close
button, footer bar and pagination dots move off the legacy color aliases.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Version bump

**Files:**
- Modify: `package.json`
- Modify: `app.config.js`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the finished states of Task 1 and Task 2 (this task only describes them in the changelog; it changes no code).

- [ ] **Step 1: Bump `package.json`**

In `package.json`, replace:

```json
  "version": "1.6.0",
```

with:

```json
  "version": "1.7.0",
```

- [ ] **Step 2: Bump `app.config.js`**

In `app.config.js`, replace:

```js
    version: '1.6.0',
```

with:

```js
    version: '1.7.0',
```

- [ ] **Step 3: Add the CHANGELOG entry**

In `CHANGELOG.md`, replace:

```markdown
## [Unreleased]

## [1.6.0] - 2026-09-19
```

with:

```markdown
## [Unreleased]

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
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the test suite**

Run: `npx jest`
Expected: 19 suites / 124 tests passing — unchanged.

- [ ] **Step 6: Commit**

```bash
git add package.json app.config.js CHANGELOG.md
git commit -m "bump to v1.7.0

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Manual test plan (give this to the user after Task 3)

On the existing dev client, over the same LAN Metro session used for 1.5.0/1.6.0:

1. From the Wall, tap any single-photo entry. Confirm: no native header — a custom bar with a back chevron, "Today · <time>" (or the day's name for older entries), and "Edit" on the right, all in Wall colors. The photo fills edge to edge with square corners, no card, no shadow.
2. Tap the back chevron — returns to the Wall at the same scroll position.
3. Open a multi-photo entry. Confirm a thumbnail strip appears below the hero photo with a "1 of N" caption, the first thumbnail highlighted and the rest dimmed. Tap a different thumbnail — the hero photo and the caption update; the dimming swaps to the newly active thumbnail.
4. Tap the hero photo — opens the full-screen zoom/swipe viewer at the same photo you had selected, restyled with the Wall's dark palette (wall-colored close button and footer bar, bone text). Swipe between photos and confirm the pagination dots and footer date/place still work, then tap Close.
5. Back on the Entry page, tap "Edit". Confirm the header's right button becomes "Save" and the left button becomes "Cancel". Tag chips for the entry's current tags appear, each still tappable to remove; a "+ tag" pill appears if any tags aren't on the entry yet.
6. Tap "+ tag" — a row of the remaining tags appears below; tap one to add it (it moves up into the selected row); if every tag is now selected, the "+ tag" pill itself disappears.
7. Edit the comment, then tap "Save". Confirm the header returns to Back/Edit and the new comment, tags and detail rows below (Taken / Place, if the entry has a location / Photos) all reflect the edit.
8. Tap "Edit" then "Cancel" — confirm nothing you typed or toggled is kept.
9. Scroll to the bottom and tap "Delete entry" (clay text). Confirm the existing confirmation alert appears, and confirming it removes the entry and returns to the Wall.
10. Open an entry with no location set — confirm the "Place" row is simply absent (no empty row, no placeholder), while "Taken" and "Photos" are still there.
