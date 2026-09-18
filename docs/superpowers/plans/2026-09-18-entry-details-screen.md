# Entry Details Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current photo-viewer-does-everything `PhotoDetailsScreen` into a new `EntryDetailsScreen` (photos, metadata, editing, delete) and a simplified `PhotoDetailsScreen` (pure zoom/swipe viewer), so the flow becomes Feed → (multiple entries →) single entry → photo tap → photo viewer.

**Architecture:** Add one new screen (`EntryDetailsScreen`) reached from both `FeedScreen` (single-entry groups) and `GroupDetailsScreen` (any entry in a multi-entry group). It owns all entry editing/delete, previously split across `PhotoDetailsScreen`'s header/footer. `PhotoStack` gains an optional per-tile tap callback so `EntryDetailsScreen` can open the photo viewer at a specific index. `PhotoDetailsScreen` is trimmed down to just the viewer once nothing routes editing through it anymore.

**Tech Stack:** React Native, Expo, React Navigation (native-stack), Redux Toolkit, Jest/ts-jest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-18-entry-details-screen-design.md`

## Global Constraints

- No hardcoded colors/spacing/radii/typography outside `src/theme/theme.ts` — always reference `theme.colors.*` / `theme.spacing.*` / `theme.radii.*` / `theme.typography.*` (existing project-wide convention, visible throughout every screen/component in the codebase).
- This codebase does not unit-test screens — only pure logic (selectors, layout math, slices) gets test files. None of these four tasks touch pure-logic modules, so no task adds a test file; verification is `tsc --noEmit` + the existing `npx jest` suite staying green (regression check), per the spec's Testing section.
- Per the user's standing testing-preference, do not run the Expo dev server or drive the app interactively to verify UI — the final task ends with a manual test plan for the user instead.
- Every commit message ends with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` (session attribution instruction) if the executor is Claude; subagent-driven-development's own commit convention applies if that's the execution path.

---

### Task 1: `PhotoStack` gains an optional per-tile tap callback

**Files:**
- Modify: `src/components/PhotoStack.tsx`

**Interfaces:**
- Consumes: nothing new (existing `masonryLayout`/`squarifiedLayout` from `./photoLayouts/*`, unchanged).
- Produces: `PhotoStack`'s `Props` gains `onPhotoPress?: (index: number) => void`. `index` is the photo's position in the flattened `photosByEntry.flat()` array (same indexing `FeedScreen` already relies on implicitly). Task 2 consumes this to open `PhotoDetails` at the tapped photo.

- [ ] **Step 1: Replace the per-tile `View` with a `Pressable` that calls `onPhotoPress`**

Read the current file first (`src/components/PhotoStack.tsx`) to confirm it still matches what's below before editing — it was last touched in the feed-window-title work.

Replace the whole file with:

```tsx
import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { PhotoLayoutAlgorithm } from '../types/models';
import { masonryLayout } from './photoLayouts/masonryLayout';
import { squarifiedLayout } from './photoLayouts/squarifiedLayout';

const TILE_INSET = 2;

type Props = {
  photosByEntry: string[][];
  algorithm: PhotoLayoutAlgorithm;
  onPhotoPress?: (index: number) => void;
};

export function PhotoStack({ photosByEntry, algorithm, onPhotoPress }: Props) {
  const photos = photosByEntry.flat();
  if (photos.length === 0) {
    return null;
  }

  const layout = algorithm === 'masonry' ? masonryLayout(photosByEntry) : squarifiedLayout(photosByEntry);

  return (
    <View style={[styles.stack, { aspectRatio: layout.unitWidth / layout.unitHeight }]}>
      {photos.map((uri, index) => {
        const rect = layout.rects[index];
        return (
          <Pressable
            key={uri + index}
            disabled={!onPhotoPress}
            onPress={onPhotoPress ? () => onPhotoPress(index) : undefined}
            style={{
              position: 'absolute',
              left: `${(rect.x / layout.unitWidth) * 100}%`,
              top: `${(rect.y / layout.unitHeight) * 100}%`,
              width: `${(rect.width / layout.unitWidth) * 100}%`,
              height: `${(rect.height / layout.unitHeight) * 100}%`,
              padding: TILE_INSET,
            }}
          >
            <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.muted,
  },
});
```

`FeedScreen`'s existing `<PhotoStack photosByEntry={...} algorithm={...} />` call doesn't pass `onPhotoPress`, so `disabled={!onPhotoPress}` is `true` there — a disabled `Pressable` doesn't claim the touch responder, so `FeedScreen`'s own card-level `Pressable` (which wraps the whole card, including the `PhotoStack`) keeps working exactly as before.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: `TypeScript: No errors found` (or equivalent zero-error output).

- [ ] **Step 3: Run the full test suite as a regression check**

Run: `npx jest`
Expected: all suites still pass (this file has no test of its own — screens/components aren't unit-tested in this codebase — but confirm nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add src/components/PhotoStack.tsx
git commit -m "feat: add optional per-tile tap callback to PhotoStack

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Create `EntryDetailsScreen` and register it

**Files:**
- Create: `src/screens/EntryDetailsScreen.tsx`
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `PhotoStack` with `onPhotoPress` from Task 1. `IconButton` (`src/components/IconButton.tsx`, already has `accessibilityLabel` prop). `TagChip` (`src/components/TagChip.tsx`, `{icon, label, selected?, onPress?}`). `Button` (`src/components/photoLayouts/Button.tsx`, `{label, onPress}`). Redux: `updateEntryComment`, `updateEntryTags`, `deleteEntry` from `src/store/entriesSlice.ts`; `resolvePhotoUri`, `deletePhotoFile` from `src/storage/photoStorage.ts`; `formatFullDateTime` from `src/utils/dateFormat.ts`. `RootState` shape: `state.entries[id]: Entry`, `state.tags: Record<string, Tag>`, `state.settings.photoLayoutAlgorithm: PhotoLayoutAlgorithm`.
- Produces: new route `EntryDetails: { entryId: string }` on `RootStackParamList`, consumed by Task 3 (`FeedScreen`, `GroupDetailsScreen` navigate here) and by this screen's own navigation into `PhotoDetails: { entryId, photoIndex }` (unchanged shape, already exists).

- [ ] **Step 1: Add the `EntryDetails` route to `RootStackParamList`**

In `src/navigation/types.ts`, change:

```ts
export type RootStackParamList = {
  Tabs: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  PhotoDetails: { entryId: string; photoIndex: number };
};
```

to:

```ts
export type RootStackParamList = {
  Tabs: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  EntryDetails: { entryId: string };
  PhotoDetails: { entryId: string; photoIndex: number };
};
```

- [ ] **Step 2: Create `src/screens/EntryDetailsScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateEntryComment, updateEntryTags, deleteEntry } from '../store/entriesSlice';
import { deletePhotoFile, resolvePhotoUri } from '../storage/photoStorage';
import { formatFullDateTime } from '../utils/dateFormat';
import { PhotoStack } from '../components/PhotoStack';
import { TagChip } from '../components/TagChip';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/photoLayouts/Button';
import { Tag } from '../types/models';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EntryDetails'>;
type Route = RouteProp<RootStackParamList, 'EntryDetails'>;

export function EntryDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId } = route.params;

  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.entries[entryId]);
  const allTags = useAppSelector((state) => state.tags);
  const photoLayoutAlgorithm = useAppSelector((state) => state.settings.photoLayoutAlgorithm);

  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(entry?.comment ?? '');
  const [draftTagIds, setDraftTagIds] = useState<string[]>(entry?.tagIds ?? []);

  function startEdit() {
    if (!entry) return;
    setDraftComment(entry.comment);
    setDraftTagIds(entry.tagIds ?? []);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  function saveEdits() {
    if (!entry) return;
    dispatch(updateEntryComment({ id: entry.id, comment: draftComment }));
    dispatch(updateEntryTags({ id: entry.id, tagIds: draftTagIds }));
    setIsEditing(false);
  }

  function toggleDraftTag(id: string) {
    setDraftTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]
    );
  }

  function confirmDelete() {
    if (!entry) return;
    Alert.alert(
      'Delete entry?',
      'This removes the photo(s) and comment permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Promise.allSettled(entry.photos.map((photo) => deletePhotoFile(photo.uri)));
            dispatch(deleteEntry({ id: entry.id }));
            navigation.goBack();
          },
        },
      ]
    );
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isEditing ? (
          <View style={styles.headerButtonRow}>
            <Pressable onPress={cancelEdit} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEdits} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerButtonRow}>
            <IconButton name="pencil-outline" onPress={startEdit} accessibilityLabel="Edit entry" />
            <IconButton name="trash-outline" onPress={confirmDelete} accessibilityLabel="Delete entry" />
          </View>
        ),
    });
  }, [navigation, isEditing, entry, draftComment, draftTagIds]);

  if (!entry) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate('Tabs')} />
      </View>
    );
  }

  const resolvedTags = (entry.tagIds ?? [])
    .map((id) => allTags[id])
    .filter((tag): tag is Tag => Boolean(tag));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PhotoStack
        photosByEntry={[entry.photos.map((photo) => resolvePhotoUri(photo.uri))]}
        algorithm={photoLayoutAlgorithm}
        onPhotoPress={(index) =>
          navigation.navigate('PhotoDetails', { entryId: entry.id, photoIndex: index })
        }
      />
      <Text style={styles.meta}>{formatFullDateTime(entry.createdAt)}</Text>
      {entry.location?.placeName ? <Text style={styles.meta}>{entry.location.placeName}</Text> : null}

      {isEditing ? (
        <>
          {Object.values(allTags).length > 0 ? (
            <View style={styles.tagRow}>
              {Object.values(allTags).map((tag) => (
                <TagChip
                  key={tag.id}
                  icon={tag.icon}
                  label={tag.label}
                  selected={draftTagIds.includes(tag.id)}
                  onPress={() => toggleDraftTag(tag.id)}
                />
              ))}
            </View>
          ) : null}
          <TextInput
            style={styles.commentInput}
            value={draftComment}
            onChangeText={setDraftComment}
            multiline
            placeholder="Comment"
            placeholderTextColor={theme.colors.muted}
          />
        </>
      ) : (
        <>
          {resolvedTags.length > 0 ? (
            <View style={styles.tagRow}>
              {resolvedTags.map((tag) => (
                <TagChip key={tag.id} icon={tag.icon} label={tag.label} />
              ))}
            </View>
          ) : null}
          <Text style={styles.comment}>{entry.comment || 'No comment'}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  headerButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  comment: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 96,
    textAlignVertical: 'top',
    color: theme.colors.text,
    ...theme.typography.body,
  },
  missing: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  missingText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});
```

- [ ] **Step 3: Register the screen in `RootNavigator.tsx`**

In `src/navigation/RootNavigator.tsx`, add the import:

```ts
import { EntryDetailsScreen } from '../screens/EntryDetailsScreen';
```

(alongside the existing `GroupDetailsScreen`/`PhotoDetailsScreen` imports), and add a new `Stack.Screen` between the existing `GroupDetails` and `PhotoDetails` entries:

```tsx
<Stack.Screen
  name="EntryDetails"
  component={EntryDetailsScreen}
  options={{ title: 'Entry' }}
/>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors. (Nothing navigates to `EntryDetails` yet — that's Task 3 — so this task is type-correct but not yet reachable from the UI.)

- [ ] **Step 5: Run the full test suite as a regression check**

Run: `npx jest`
Expected: all suites still pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/EntryDetailsScreen.tsx src/navigation/types.ts src/navigation/RootNavigator.tsx
git commit -m "feat: add EntryDetailsScreen (photos, metadata, edit, delete)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Route into `EntryDetails` from Feed and Group Details

**Files:**
- Modify: `src/screens/FeedScreen.tsx`
- Modify: `src/screens/GroupDetailsScreen.tsx`

**Interfaces:**
- Consumes: `EntryDetails: { entryId: string }` route from Task 2.
- Produces: nothing new — this task just repoints two existing `navigation.navigate` calls. Nothing later depends on anything new from this task.

- [ ] **Step 1: `FeedScreen.tsx` — single-entry groups go to `EntryDetails`**

In `src/screens/FeedScreen.tsx`, find `openGroup`:

```tsx
  function openGroup(group: EntryGroup) {
    if (group.entries.length === 1) {
      navigation.navigate("PhotoDetails", {
        entryId: group.entries[0].id,
        photoIndex: 0,
      });
    } else {
      navigation.navigate("GroupDetails", {
        entryIds: group.entries.map((e) => e.id),
      });
    }
  }
```

Change the single-entry branch to:

```tsx
  function openGroup(group: EntryGroup) {
    if (group.entries.length === 1) {
      navigation.navigate("EntryDetails", {
        entryId: group.entries[0].id,
      });
    } else {
      navigation.navigate("GroupDetails", {
        entryIds: group.entries.map((e) => e.id),
      });
    }
  }
```

- [ ] **Step 2: `GroupDetailsScreen.tsx` — tapping an entry goes to `EntryDetails`**

In `src/screens/GroupDetailsScreen.tsx`, find:

```tsx
        <Pressable
          onPress={() =>
            guardedPress(() => navigation.navigate('PhotoDetails', { entryId: item.id, photoIndex: 0 }))
          }
        >
```

Change to:

```tsx
        <Pressable
          onPress={() =>
            guardedPress(() => navigation.navigate('EntryDetails', { entryId: item.id }))
          }
        >
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Run the full test suite as a regression check**

Run: `npx jest`
Expected: all suites still pass.

- [ ] **Step 5: Commit**

```bash
git add src/screens/FeedScreen.tsx src/screens/GroupDetailsScreen.tsx
git commit -m "feat: route Feed and Group Details into EntryDetails

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Simplify `PhotoDetailsScreen` to a pure viewer, update CHANGELOG

**Files:**
- Modify: `src/screens/PhotoDetailsScreen.tsx`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — this is the last task in the plan.

- [ ] **Step 1: Replace `PhotoDetailsScreen.tsx` with the trimmed version**

Read the current file first (`src/screens/PhotoDetailsScreen.tsx`) to confirm it still matches what Task 2's spec assumed (no other work has touched it since the design was written).

Replace the whole file with:

```tsx
import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImageViewing from "react-native-image-viewing";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAppSelector } from "../store/hooks";
import { resolvePhotoUri } from "../storage/photoStorage";
import { formatFullDateTime } from "../utils/dateFormat";
import { Button } from "../components/photoLayouts/Button";
import { theme } from "../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "PhotoDetails">;
type Route = RouteProp<RootStackParamList, "PhotoDetails">;

type PhotoDetailsHeaderProps = {
  navigation: Nav;
};

// Rendered by ImageViewing's HeaderComponent. Kept as its own component so
// the value passed as HeaderComponent can have a stable identity across
// parent re-renders.
function PhotoDetailsHeader({ navigation }: PhotoDetailsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.topBarButton}
      >
        <Text style={styles.topBarButtonText}>Close</Text>
      </Pressable>
    </View>
  );
}

type PhotoDetailsFooterProps = {
  entryId: string;
  imageIndex: number;
};

// Rendered by ImageViewing's FooterComponent. Keyed only by entryId, so it
// has a stable identity across parent re-renders.
function PhotoDetailsFooter({ entryId, imageIndex }: PhotoDetailsFooterProps) {
  const entry = useAppSelector((state) => state.entries[entryId]);
  const insets = useSafeAreaInsets();

  if (!entry) {
    return null;
  }

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: insets.bottom + theme.spacing.md },
      ]}
    >
      {entry.photos.length > 1 ? (
        <View style={styles.dots}>
          {entry.photos.map((photo, index) => (
            <View
              key={photo.id}
              style={[styles.dot, index === imageIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
      <Text style={styles.footerMeta}>
        {formatFullDateTime(entry.createdAt)}
      </Text>
      {entry.location?.placeName ? (
        <Text style={styles.footerMeta}>{entry.location.placeName}</Text>
      ) : null}
    </View>
  );
}

export function PhotoDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { entryId, photoIndex } = route.params;

  const entry = useAppSelector((state) => state.entries[entryId]);
  const insets = useSafeAreaInsets();

  const HeaderComponent = useCallback(
    () => <PhotoDetailsHeader navigation={navigation} />,
    [navigation],
  );
  const FooterComponent = useCallback(
    ({ imageIndex }: { imageIndex: number }) => (
      <PhotoDetailsFooter entryId={entryId} imageIndex={imageIndex} />
    ),
    [entryId],
  );

  if (!entry) {
    return (
      <View
        style={[
          styles.missing,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Text style={styles.missingText}>This entry no longer exists.</Text>
        <Button label="Back" onPress={() => navigation.navigate("Tabs")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageViewing
        images={entry.photos.map((photo) => ({
          uri: resolvePhotoUri(photo.uri),
        }))}
        imageIndex={photoIndex}
        visible
        onRequestClose={() => navigation.goBack()}
        HeaderComponent={HeaderComponent}
        FooterComponent={FooterComponent}
      />
    </View>
  );
}

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
  },
  topBarButtonText: {
    color: theme.colors.textOnDark,
    ...theme.typography.subtitle,
  },
  footer: {
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

- [ ] **Step 2: Add a CHANGELOG entry**

In `CHANGELOG.md`, under the existing `## [Unreleased]` → `### Changed` list, add one more bullet (the file currently has a `### Changed` section from the previous session's badge/a11y cleanup — add to it, don't create a duplicate heading):

```markdown
- Replaced the photo-viewer-does-everything entry screen with a dedicated
  Entry Details screen (photos, date, location, tags, comment, edit,
  delete) reached from Feed and Group Details; tapping a photo from there
  opens a now-simplified pure viewer (zoom/swipe only).
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Run the full test suite as a regression check**

Run: `npx jest`
Expected: all suites still pass.

- [ ] **Step 5: Commit**

```bash
git add src/screens/PhotoDetailsScreen.tsx CHANGELOG.md
git commit -m "refactor: trim PhotoDetailsScreen to a pure zoom/swipe viewer

Editing (comment/tags) and delete moved to EntryDetailsScreen; this
screen keeps only Close, the photo-position dots, and a date/location
caption.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Give the user a manual test plan**

Per the testing-preference constraint, don't drive the app interactively. Instead give the user this plan once all four tasks are committed:

1. Open the app to the Feed tab.
2. Tap a feed card that represents a **single entry** (badge not shown / count 1) → should land on the new **Entry Details** screen (not straight into the photo viewer).
3. Tap a feed card that represents **multiple entries** (badge shows a count) → should land on **Group Details** (unchanged) → tap any entry card there → should land on **Entry Details**.
4. On Entry Details: tap a photo → should open the full-screen zoom/swipe viewer at that exact photo; swipe between photos if there's more than one; confirm the dots + date/location caption show, and there's no comment/tag/delete UI in the viewer; tap **Close** → returns to Entry Details.
5. On Entry Details: tap the pencil icon in the header → fields become editable (tag picker + comment box); change something; tap **Save** → change persists and view mode shows the update; repeat but tap **Cancel** instead → change is discarded.
6. On Entry Details: tap the trash icon in the header → confirm the delete `Alert` appears → confirm **Delete** → entry disappears and you land back on whatever screen presented Entry Details (Feed, or Group Details with that entry now missing from the list).
