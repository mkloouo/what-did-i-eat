# Capture, Settings and Tags (1.8.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Capture (New Entry), Settings and Tags screens onto the Wall's design tokens, relabel Settings per the spec's copy table, and wire up the two navigation entry points into Tags that don't exist yet ("Edit tags" in Settings, an "Edit" affordance on the Wall's tag rail).

**Architecture:** One small pure helper (`formatDuration`) is written test-first. Everything else is a presentational restyle of three existing screens plus two small shared components — no data flow, no new screens, no new navigation routes (`Tags` and `Settings` already exist in `RootStackParamList`). Two now-dead components (`Card`, `CountBadge`) are deleted as part of the screens that were their only consumers.

**Tech Stack:** Expo SDK 57, React Native 0.86, React Navigation 7 (native stack), Redux Toolkit, `@react-native-community/slider`, `@expo/vector-icons` (Ionicons).

**Spec:** `docs/superpowers/specs/2026-09-19-wall-daybands-redesign-design.md`. This is plan 4 of 6 in the original step numbering (version 1.8.0) plus the unplanned 1.7.1 grid/columns refinement that already shipped. Plans 1-3 (1.5.0, 1.6.0, 1.7.0) and the 1.7.1 refinement are complete and merged into `wall-redesign`.

## Decisions this plan makes (spec doesn't spell these out)

- **Settings' native header stays.** The spec restyled the Entry page's header into a custom in-screen header (1.7.0) but never says to do that everywhere — "Settings opens from the header icon" and "Capture is the current New Entry flow, restyled in place" both read as keeping the existing `RootNavigator` native stack header (already styled via `screenOptions`, just off the legacy `accentDark`/`textOnDark` aliases). Only its two legacy alias references move to direct tokens; the native header itself is untouched.
- **`Card` is deleted.** It was the last actual "card" component in the app (background box, radius, padding) — the spec's Navigation section says cards are removed outright ("Removed: ... cards and shadows"), and `Card` had exactly one caller (`TagsScreen`'s add/edit form), replaced here with a plain section separated by a hairline rule, matching the Entry page's own divider convention.
- **The Wall's tag rail always renders now**, even with zero tags, because it's the only way a first-time user would discover the new "Edit tags" entry point from the Wall itself (Settings' own "Edit tags" row is the other, always-available path). Previously the whole rail returned `null` with no tags.
- **`PhotoThumbnail`'s dead `badgeCount` prop and `CountBadge` are deleted.** Nothing in the app has ever passed `badgeCount` to `PhotoThumbnail` (grepped: its one caller, `NewEntryScreen`, never does) — the spec already flagged `CountBadge` as a deletion candidate "confirmed against actual usage at plan time," and this is that confirmation.
- **The Capture screen's photo-viewer dot indicator is replaced with the shared `PaginationDots` component** (already used by the photo viewer, already on Wall tokens since 1.7.0) instead of its own duplicate inline dot-row implementation — a straightforward DRY cleanup while this file is already being touched for its colors.

## Global Constraints

- Branch is `wall-redesign`. Never work on `main`.
- Theme tokens: `theme.colors.{wall,seam,hairline,bone,chalk,brass,clay}`, `theme.fonts.{regular,medium,semibold,bold}`, `theme.typography.{title,subtitle,body,caption,time}`, `theme.spacing.{xs:4,sm:8,md:16,lg:24,xl:32}`, `theme.radii.{sm:2,md:3,lg:4,pill:999}`. Never use `fontWeight`; always a `fontFamily` from `theme.fonts`. Use the direct token names, never the legacy aliases (`colors.background`, `colors.text`, `colors.textOnDark`, `colors.muted`, `colors.accentDark`, `colors.primary`, `colors.secondary`, `colors.danger`) — this plan is the last one that still has legacy-alias usages to clean up in the files it touches.
- No cards, no shadows. No text over a photograph.
- Nothing in this plan counts, scores, streaks, or colors a time as good or bad.
- No new native dependency.
- Settings' five settings (post-1.7.1: `groupingMode`, `rollingWindowMinutes`, `wallColumns`, `inferDateFromFirstImportedPhoto`, `captureLocation`) get new copy per the spec's Settings table; none of their underlying behavior, ranges, or steps change.
- Run `npx tsc --noEmit` and `npx jest` yourself after every task. Do not start dev servers and do not drive the app — Metro is already running for the user; nothing in this plan needs a new native build.
- Baseline right now (verified before writing this plan): `npx tsc --noEmit` clean, `npx jest` 18 suites / 121 tests passing.
- Version bump touches `package.json`, `app.config.js` and `CHANGELOG.md`, in its own commit worded `bump to vX.Y.Z`, separate from feature commits. No git tags, no EAS builds, no GitHub releases.
- Commit messages end with the exact literal line `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` — never substitute a different model name, regardless of which model actually writes the commit.
- Code style matches the surrounding files: 2-space indent, double quotes, semicolons, `PascalCase` component filenames, `camelCase` util filenames.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/utils/dateFormat.ts` (+ `.test.ts`) | Adds `formatDuration(minutes): string`, e.g. `90 → "1 h 30 m"` | 1 |
| `src/screens/SettingsScreen.tsx` | Full rewrite: direct tokens, new copy, "Edit tags" row | 2 |
| `src/navigation/RootNavigator.tsx` | `screenOptions`' two legacy alias references move to direct tokens | 2 |
| `src/screens/TagsScreen.tsx` | Full rewrite: direct tokens, `Card` removed, clay-colored Delete | 3 |
| `src/components/wall/TagFilterRail.tsx` | Gains a trailing "Edit tags" affordance; no longer hides itself at zero tags | 3 |
| `src/components/Card.tsx` | Deleted — no longer used anywhere | 3 |
| `src/screens/NewEntryScreen.tsx` | Direct tokens; dot indicator replaced by `PaginationDots` | 4 |
| `src/components/PhotoThumbnail.tsx` | Direct tokens; drops the unused `badgeCount`/`CountBadge` | 4 |
| `src/components/CountBadge.tsx` | Deleted — no longer used anywhere | 4 |
| `package.json`, `app.config.js`, `CHANGELOG.md` | Bump to 1.8.0 | 5 |

---

### Task 1: `formatDuration`

**Files:**
- Modify: `src/utils/dateFormat.ts`
- Modify: `src/utils/dateFormat.test.ts`

**Interfaces:**
- Produces: `formatDuration(minutes: number): string`, exported alongside `dayKeyOf`/`dayLabel`/`formatTime`/`formatFullDateTime`. Task 2 imports and calls it as `formatDuration(rollingWindowMinutes)`.

- [ ] **Step 1: Write the failing tests**

In `src/utils/dateFormat.test.ts`, add `formatDuration` to the import at the top:

```ts
import {
  dayKeyOf,
  dayLabel,
  formatTime,
  formatFullDateTime,
  formatDuration,
} from "./dateFormat";
```

Then add this new `describe` block at the end of the file:

```ts

describe("formatDuration", () => {
  it("renders a sub-hour duration as minutes only", () => {
    expect(formatDuration(30)).toBe("30 m");
    expect(formatDuration(45)).toBe("45 m");
  });

  it("renders an exact hour without a minutes part", () => {
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(240)).toBe("4 h");
  });

  it("renders an hour-plus-minutes duration as both parts", () => {
    expect(formatDuration(90)).toBe("1 h 30 m");
    expect(formatDuration(135)).toBe("2 h 15 m");
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx jest src/utils/dateFormat.test.ts`
Expected: FAIL — `formatDuration` is not exported from `./dateFormat`.

- [ ] **Step 3: Implement it**

In `src/utils/dateFormat.ts`, add at the end of the file:

```ts

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} m`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} m`;
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npx jest src/utils/dateFormat.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Run the full suite and type-check**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npx jest` — expect 18 suites / 125 tests passing (4 more than the 121 baseline).

- [ ] **Step 6: Commit**

```bash
git add src/utils/dateFormat.ts src/utils/dateFormat.test.ts
git commit -m "feat: add formatDuration for Settings' merge-window copy

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Settings screen

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `formatDuration` (Task 1), `SegmentedControl` (unchanged, already on direct tokens since 1.5.0), `setGroupingMode`/`setRollingWindowMinutes`/`setWallColumns`/`setInferDateFromFirstImportedPhoto`/`setCaptureLocation` (unchanged action creators from `settingsSlice`).
- Produces: `SettingsScreen()` unchanged export name/signature. Navigates to the existing `"Tags"` route.

- [ ] **Step 1: Rewrite the Settings screen**

Replace the full contents of `src/screens/SettingsScreen.tsx`:

```tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  StyleSheet,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setGroupingMode,
  setRollingWindowMinutes,
  setWallColumns,
  setInferDateFromFirstImportedPhoto,
  setCaptureLocation,
} from "../store/settingsSlice";
import { SegmentedControl } from "../components/SegmentedControl";
import { theme } from "../theme/theme";
import { GroupingMode } from "../types/models";
import { formatDuration } from "../utils/dateFormat";

type Nav = NativeStackNavigationProp<RootStackParamList, "Settings">;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const groupingMode = useAppSelector((state) => state.settings.groupingMode);
  const rollingWindowMinutes = useAppSelector(
    (state) => state.settings.rollingWindowMinutes,
  );
  const wallColumns = useAppSelector((state) => state.settings.wallColumns);
  const inferDateFromFirstImportedPhoto = useAppSelector(
    (state) => state.settings.inferDateFromFirstImportedPhoto,
  );
  const captureLocation = useAppSelector(
    (state) => state.settings.captureLocation,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>What counts as one meal</Text>
      <SegmentedControl
        value={groupingMode}
        options={[
          { value: "rolling", label: "Photos close in time" },
          { value: "day", label: "A whole day" },
        ]}
        onChange={(value) => dispatch(setGroupingMode(value as GroupingMode))}
      />

      {groupingMode === "rolling" ? (
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>
            Merge photos taken within: {formatDuration(rollingWindowMinutes)}
          </Text>
          <Slider
            minimumValue={30}
            maximumValue={240}
            step={15}
            value={rollingWindowMinutes}
            minimumTrackTintColor={theme.colors.brass}
            maximumTrackTintColor={theme.colors.chalk}
            onValueChange={(value) => dispatch(setRollingWindowMinutes(value))}
          />
        </View>
      ) : null}

      <Text style={[styles.label, styles.secondLabel]}>
        Photos per row: {wallColumns}
      </Text>
      <Slider
        minimumValue={3}
        maximumValue={10}
        step={1}
        value={wallColumns}
        minimumTrackTintColor={theme.colors.brass}
        maximumTrackTintColor={theme.colors.chalk}
        onValueChange={(value) => dispatch(setWallColumns(value))}
      />

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.label}>Use the photo&apos;s own date</Text>
          <Text style={styles.toggleHint}>
            When importing from the gallery, set the entry's date from the first
            photo you pick — handy for backfilling old meals.
          </Text>
        </View>
        <Switch
          value={inferDateFromFirstImportedPhoto}
          onValueChange={(value) => {
            dispatch(setInferDateFromFirstImportedPhoto(value));
          }}
          trackColor={{ true: theme.colors.brass }}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.label}>Save where you were</Text>
          <Text style={styles.toggleHint}>
            When off, new entries are saved without capturing your current
            location.
          </Text>
        </View>
        <Switch
          value={captureLocation}
          onValueChange={(value) => {
            dispatch(setCaptureLocation(value));
          }}
          trackColor={{ true: theme.colors.brass }}
        />
      </View>

      <Pressable
        style={styles.navRow}
        onPress={() => navigation.navigate("Tags")}
        accessibilityRole="button"
        accessibilityLabel="Edit tags"
      >
        <Text style={styles.navLabel}>Edit tags</Text>
        <Ionicons
          name="chevron-forward-outline"
          size={18}
          color={theme.colors.chalk}
        />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.wall,
  },
  content: {
    padding: theme.spacing.md,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    marginBottom: theme.spacing.sm,
  },
  secondLabel: {
    marginTop: theme.spacing.lg,
  },
  sliderRow: {
    marginTop: theme.spacing.md,
  },
  sliderLabel: {
    ...theme.typography.body,
    color: theme.colors.bone,
    marginBottom: theme.spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleHint: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    marginTop: theme.spacing.xs,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  navLabel: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
});
```

- [ ] **Step 2: Move `RootNavigator`'s screen chrome off the legacy aliases**

In `src/navigation/RootNavigator.tsx`, replace:

```tsx
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.accentDark },
        headerTintColor: theme.colors.textOnDark,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
```

with:

```tsx
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.wall },
        headerTintColor: theme.colors.bone,
        contentStyle: { backgroundColor: theme.colors.wall },
      }}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run the test suite**

Run: `npx jest`
Expected: 18 suites / 125 tests passing — unchanged from Task 1 (no test file touched here).

- [ ] **Step 5: Commit**

```bash
git add src/screens/SettingsScreen.tsx src/navigation/RootNavigator.tsx
git commit -m "feat: restyle Settings for the Wall and add an Edit tags row

New copy for all five settings per the design spec, direct Wall tokens
throughout, and a new \"Edit tags\" row linking to the Tags screen — the
only way to reach it, until this plan's next task adds a second from the
Wall's own tag rail. RootNavigator's shared header chrome moves off its
last two legacy color aliases.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Tags screen and the Wall's Edit-tags entry point

**Files:**
- Modify: `src/screens/TagsScreen.tsx`
- Modify: `src/components/wall/TagFilterRail.tsx`
- Delete: `src/components/Card.tsx`

**Interfaces:**
- Consumes: `TagChip`, `Button` (both unchanged, already on direct tokens). Navigates to the existing `"Tags"` route from `TagFilterRail`.
- Produces: `TagsScreen()` and `TagFilterRail()` unchanged export names/signatures/props.

- [ ] **Step 1: Rewrite the Tags screen**

Replace the full contents of `src/screens/TagsScreen.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { addTag, updateTag, deleteTag } from "../store/tagsSlice";
import { generateId } from "../utils/id";
import { isValidTagLabel } from "../utils/tagLabel";
import { Tag, TagIcon, TAG_ICON_OPTIONS } from "../types/models";
import { TagChip } from "../components/TagChip";
import { Button } from "../components/photoLayouts/Button";
import { theme } from "../theme/theme";

export function TagsScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const tags = useAppSelector((state) => Object.values(state.tags));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftIcon, setDraftIcon] = useState<TagIcon | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function startAdd() {
    setEditingId("new");
    setDraftIcon(null);
    setDraftLabel("");
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setDraftIcon(tag.icon);
    setDraftLabel(tag.label);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftIcon(null);
    setDraftLabel("");
  }

  function saveDraft() {
    if (!draftIcon || !isValidTagLabel(draftLabel)) return;
    const label = draftLabel.trim();
    if (editingId === "new") {
      dispatch(addTag({ id: generateId(), icon: draftIcon, label }));
    } else if (editingId) {
      dispatch(updateTag({ id: editingId, icon: draftIcon, label }));
    }
    cancelEdit();
  }

  function startSelecting() {
    setIsSelecting(true);
    setSelectedIds([]);
  }

  function cancelSelecting() {
    setIsSelecting(false);
    setSelectedIds([]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
    );
  }

  function confirmDeleteSelected() {
    Alert.alert(
      "Delete tags?",
      `${selectedIds.length} tag${selectedIds.length === 1 ? "" : "s"} will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            selectedIds.forEach((id) => dispatch(deleteTag({ id })));
            cancelSelecting();
          },
        },
      ],
    );
  }

  function handleTagPress(tag: Tag) {
    if (isSelecting) {
      toggleSelected(tag.id);
    } else {
      startEdit(tag);
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isSelecting ? (
          <View style={styles.headerButtonRow}>
            <Pressable onPress={cancelSelecting} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmDeleteSelected}
              disabled={selectedIds.length === 0}
              style={styles.headerButton}
            >
              <Text
                style={[
                  styles.headerButtonText,
                  styles.headerButtonTextDanger,
                  selectedIds.length === 0 && styles.headerButtonTextDisabled,
                ]}
              >
                Delete{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={startSelecting} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Select</Text>
          </Pressable>
        ),
    });
  }, [navigation, isSelecting, selectedIds]);

  const isEditingForm = editingId !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>
            {editingId === "new"
              ? "Add a tag"
              : editingId
                ? "Edit tag"
                : "Tags"}
          </Text>
          {isEditingForm ? (
            <>
              <View style={styles.iconRow}>
                {TAG_ICON_OPTIONS.map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => setDraftIcon(icon)}
                    style={styles.iconOption}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={
                        draftIcon === icon
                          ? theme.colors.brass
                          : theme.colors.chalk
                      }
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. Home cooked"
                placeholderTextColor={theme.colors.chalk}
                value={draftLabel}
                onChangeText={setDraftLabel}
              />
              <View style={styles.formButtons}>
                <Button label="Cancel" variant="danger" onPress={cancelEdit} />
                <Button
                  label="Save"
                  onPress={saveDraft}
                  disabled={!draftIcon || !isValidTagLabel(draftLabel)}
                />
              </View>
            </>
          ) : (
            <Button label="Add tag" onPress={startAdd} />
          )}
        </View>

        {tags.length === 0 ? (
          <Text style={styles.empty}>
            No tags yet — add your first one above.
          </Text>
        ) : (
          <View style={styles.chipsWrap}>
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                icon={tag.icon}
                label={tag.label}
                selected={isSelecting && selectedIds.includes(tag.id)}
                onPress={() => handleTagPress(tag)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.wall,
  },
  content: {
    padding: theme.spacing.md,
  },
  headerButtonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  headerButtonText: {
    color: theme.colors.bone,
    ...theme.typography.subtitle,
  },
  headerButtonTextDanger: {
    color: theme.colors.clay,
  },
  headerButtonTextDisabled: {
    opacity: 0.5,
  },
  form: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    marginBottom: theme.spacing.sm,
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  iconOption: {
    padding: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.bone,
    marginBottom: theme.spacing.sm,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  empty: {
    ...theme.typography.body,
    color: theme.colors.chalk,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
});
```

This drops the `Card` import and wrapper — the add/edit form is now a plain section closed off by a hairline rule (`styles.form`) instead of a background box, and the "Delete" header action is now clay-colored (`headerButtonTextDanger`), matching the Entry page's delete-in-clay convention. The `input`'s background moves from the legacy `colors.background` (which was literally the same value as the page background it sat on, so the field had no visible box at all) to `colors.seam`, matching every other text input built during this redesign.

- [ ] **Step 2: Add the Wall's Edit-tags entry point**

Replace the full contents of `src/components/wall/TagFilterRail.tsx`:

```tsx
import React from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useAppSelector } from "../../store/hooks";
import { TagChip } from "../TagChip";
import { theme } from "../../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

type Props = {
  activeTagId: string | null;
  onSelect: (tagId: string | null) => void;
};

// One tag is active at a time; tapping the active tag clears the filter.
// The trailing Edit button always shows, even with no tags yet, since it's
// how a first-time user reaches the Tags screen to create one.
export function TagFilterRail({ activeTagId, onSelect }: Props) {
  const navigation = useNavigation<Nav>();
  const tags = useAppSelector((state) => Object.values(state.tags));

  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {tags.map((tag) => {
        const selected = tag.id === activeTagId;
        return (
          <TagChip
            key={tag.id}
            icon={tag.icon}
            label={tag.label}
            selected={selected}
            iconOnly
            onPress={() => onSelect(selected ? null : tag.id)}
          />
        );
      })}
      <Pressable
        onPress={() => navigation.navigate("Tags")}
        accessibilityRole="button"
        accessibilityLabel="Edit tags"
        style={styles.editButton}
      >
        <Ionicons name="pencil-outline" size={14} color={theme.colors.chalk} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Left unstyled, a ScrollView doesn't size itself to content in a flex
  // column the way a plain View does — it expands to claim the remaining
  // vertical space like a flex:1 sibling would. flexGrow: 0 pins the rail
  // to its content's own height (the chip row).
  scroll: {
    flexGrow: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.seam,
    justifyContent: "center",
    alignItems: "center",
  },
});
```

This drops the earlier `if (tags.length === 0) return null;` guard — `WallScreen` already renders `<TagFilterRail />` unconditionally above its item list, so nothing in `WallScreen.tsx` needs to change for the rail to now always show at least the Edit button.

- [ ] **Step 3: Delete the now-unused `Card` component**

Run: `rm src/components/Card.tsx`

- [ ] **Step 4: Confirm nothing else references `Card`**

Run: `grep -rn "components/Card" src`
Expected: no output.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Run the test suite**

Run: `npx jest`
Expected: 18 suites / 125 tests passing — unchanged (no test file touched, and `Card`/`TagFilterRail` never had tests).

- [ ] **Step 7: Commit**

```bash
git add src/screens/TagsScreen.tsx src/components/wall/TagFilterRail.tsx
git rm src/components/Card.tsx
git commit -m "feat: restyle Tags and add an Edit-tags entry point on the Wall

Card is gone (the app's last actual card component) — the tag form is now
a plain section closed off by a hairline rule. The tag rail gains a
trailing Edit button that opens the Tags screen, and no longer hides
itself when there are no tags yet, since that button is how a first-time
user would discover tag creation from the Wall at all.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Capture screen

**Files:**
- Modify: `src/screens/NewEntryScreen.tsx`
- Modify: `src/components/PhotoThumbnail.tsx`
- Delete: `src/components/CountBadge.tsx`

**Interfaces:**
- Consumes: `PaginationDots` (unchanged signature: `count`, `activeIndex`, optional `dotColor`/`activeDotColor` — this task uses only `count`/`activeIndex`, relying on its existing direct-token defaults from 1.7.0).
- Produces: `NewEntryScreen()` and `PhotoThumbnail()` unchanged export names; `PhotoThumbnail` drops its optional `badgeCount` prop (dead — its one caller, this same file, never passed it).

- [ ] **Step 1: Simplify `PhotoThumbnail`**

Replace the full contents of `src/components/PhotoThumbnail.tsx`:

```tsx
import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  uri: string;
  size?: number;
};

export function PhotoThumbnail({ uri, size = 96 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.seam,
  },
});
```

This drops the `borderRadius` the old `image` style had — every other photo tile in this redesign (the Wall's grid, the Entry page's hero and thumbnail strip) is square-cornered, and this capture-flow thumbnail grid is the same kind of thing.

- [ ] **Step 2: Delete the now-unused `CountBadge`**

Run: `rm src/components/CountBadge.tsx`

- [ ] **Step 3: Confirm nothing else references `CountBadge`**

Run: `grep -rn "CountBadge" src`
Expected: no output.

- [ ] **Step 4: Add the `PaginationDots` import**

In `src/screens/NewEntryScreen.tsx`, replace:

```tsx
import { PhotoThumbnail } from "../components/PhotoThumbnail";
import { formatFullDateTime } from "../utils/dateFormat";
```

with:

```tsx
import { PhotoThumbnail } from "../components/PhotoThumbnail";
import { PaginationDots } from "../components/PaginationDots";
import { formatFullDateTime } from "../utils/dateFormat";
```

- [ ] **Step 5: Replace the viewer footer's dot row**

In `src/screens/NewEntryScreen.tsx`'s `ViewerFooter`, replace:

```tsx
      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((photo, index) => (
            <View
              key={photo.id}
              style={[styles.dot, index === imageIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
```

with:

```tsx
      <View style={styles.dotsWrapper}>
        <PaginationDots count={photos.length} activeIndex={imageIndex} />
      </View>
```

(`PaginationDots` already renders nothing when `count <= 1`, so the surrounding `photos.length > 1` guard this replaces is no longer needed.)

- [ ] **Step 6: Fix the two placeholder text colors**

In `src/screens/NewEntryScreen.tsx`, there are two occurrences of `placeholderTextColor={theme.colors.muted}` (one on the viewer's comment input, one on the main comment input). Replace both with `placeholderTextColor={theme.colors.chalk}`.

- [ ] **Step 7: Replace the styles block**

Replace the full `styles = StyleSheet.create({...})` block at the end of `src/screens/NewEntryScreen.tsx`:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  pickerRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pickerButton: {
    flex: 1,
  },
  thumbnailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  thumbnailWrapper: {},
  hint: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  dateTimeRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dateTimeLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  iosPicker: {
    marginBottom: theme.spacing.md,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    minHeight: 96,
    textAlignVertical: "top",
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  viewerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  viewerTopBarButton: {
    padding: theme.spacing.sm,
  },
  viewerTopBarButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  viewerRemoveText: {
    color: theme.colors.danger,
  },
  viewerFooter: {
    backgroundColor: theme.colors.accentDark,
    padding: theme.spacing.md,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.muted,
  },
  dotActive: {
    backgroundColor: theme.colors.textOnDark,
  },
  viewerCommentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 64,
    textAlignVertical: "top",
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
    backgroundColor: theme.colors.wall,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  pickerRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pickerButton: {
    flex: 1,
  },
  thumbnailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  thumbnailWrapper: {},
  hint: {
    ...theme.typography.caption,
    color: theme.colors.chalk,
    marginBottom: theme.spacing.md,
  },
  dateTimeRow: {
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dateTimeLabel: {
    ...theme.typography.body,
    color: theme.colors.bone,
  },
  iosPicker: {
    marginBottom: theme.spacing.md,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  commentInput: {
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    minHeight: 96,
    textAlignVertical: "top",
    ...theme.typography.body,
    color: theme.colors.bone,
    marginBottom: theme.spacing.md,
  },
  viewerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  viewerTopBarButton: {
    padding: theme.spacing.sm,
  },
  viewerTopBarButtonText: {
    color: theme.colors.bone,
    ...theme.typography.subtitle,
  },
  viewerRemoveText: {
    color: theme.colors.clay,
  },
  viewerFooter: {
    backgroundColor: theme.colors.wall,
    padding: theme.spacing.md,
  },
  dotsWrapper: {
    marginBottom: theme.spacing.sm,
  },
  viewerCommentInput: {
    backgroundColor: theme.colors.seam,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 64,
    textAlignVertical: "top",
    ...theme.typography.body,
    color: theme.colors.bone,
  },
});
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Run the test suite**

Run: `npx jest`
Expected: 18 suites / 125 tests passing — unchanged.

- [ ] **Step 10: Commit**

```bash
git add src/screens/NewEntryScreen.tsx src/components/PhotoThumbnail.tsx
git rm src/components/CountBadge.tsx
git commit -m "fix: restyle Capture onto direct Wall tokens

Same flows, no structural change beyond swapping the viewer footer's
duplicate dot-row for the shared PaginationDots component. CountBadge and
PhotoThumbnail's dead badgeCount prop are gone — nothing ever passed it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Version bump

**Files:**
- Modify: `package.json`
- Modify: `app.config.js`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the finished states of Tasks 1-4 (this task only describes them in the changelog; it changes no code).

- [ ] **Step 1: Bump `package.json`**

In `package.json`, replace:

```json
  "version": "1.7.1",
```

with:

```json
  "version": "1.8.0",
```

- [ ] **Step 2: Bump `app.config.js`**

In `app.config.js`, replace:

```js
    version: '1.7.1',
```

with:

```js
    version: '1.8.0',
```

- [ ] **Step 3: Add the CHANGELOG entry**

In `CHANGELOG.md`, replace:

```markdown
## [Unreleased]

## [1.7.1] - 2026-09-19
```

with:

```markdown
## [Unreleased]

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
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the test suite**

Run: `npx jest`
Expected: 18 suites / 125 tests passing — unchanged.

- [ ] **Step 6: Commit**

```bash
git add package.json app.config.js CHANGELOG.md
git commit -m "bump to v1.8.0

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Manual test plan (give this to the user after Task 5)

On the existing dev client, over the same LAN Metro session:

1. Open Settings. Confirm the new copy: "What counts as one meal" (with
   "Photos close in time" / "A whole day" options), "Merge photos taken
   within: X h Y m" above its slider, "Photos per row: N", "Use the
   photo's own date", "Save where you were" — all in Wall colors, no
   leftover card/box behind the merge-window or comment-style inputs.
2. Scroll to the bottom of Settings — confirm a new "Edit tags" row with a
   chevron, and that tapping it opens the Tags screen.
3. On the Wall, confirm the tag rail now shows a small pencil/Edit button
   at its trailing end (after any tag chips, or alone if you have none
   yet) — tapping it also opens the Tags screen.
4. On the Tags screen: confirm the add/edit form has no boxed background
   (just a hairline rule under it separating it from the chip list below),
   and that adding, editing and deleting tags all still work exactly as
   before. Enter "Select" mode and delete a tag — confirm the "Delete (N)"
   header text is now clay-colored (not plain white/bone).
5. Start a new entry (Capture). Confirm the screen is in Wall colors
   throughout — comment box, date/time row, thumbnails square-cornered
   with no rounding.
6. Take or pick more than one photo, tap a thumbnail to open the in-flow
   viewer, and confirm the page-dot indicator at the bottom still tracks
   which photo you're on when you swipe.
