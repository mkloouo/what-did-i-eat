# Feed Grid, FAB & Config Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Feed card's cover-photo+badge with an adaptive photo grid, move "New Entry" to a FAB, and collapse the Config screen into a one-row grouping-mode menu on the Feed header.

**Architecture:** Three new presentational components (`PhotoGrid`, `Fab`, `GroupingMenu`) plug into the existing `FeedScreen` and `RootNavigator`. The grouping selector's output type changes from a single `coverPhotoUri` to a flattened `photos` array. `ConfigScreen` and its route are deleted; its only piece of state (`settings.bundleByDay`) is now written from `GroupingMenu`.

**Tech Stack:** React Native (Expo v57), TypeScript, Redux Toolkit, React Navigation native-stack, Jest (`jest-expo` preset, no component-testing library — this codebase only unit-tests pure logic, never renders components in tests).

**Spec:** `docs/superpowers/specs/2026-09-17-feed-grid-fab-config-menu-design.md` (amends `docs/superpowers/specs/2026-09-17-what-did-i-eat-app-design.md`)

## Global Constraints

- No new npm dependencies — everything is built from `react-native` primitives, `@expo/vector-icons`, and `react-native-safe-area-context` (already a dependency), consistent with the spec's "no third-party UI component library" rule.
- No component/render tests — this codebase only unit-tests pure functions/selectors/slices (see `dateFormat.test.ts`, `groupSelectors.test.ts`, `settingsSlice.test.ts`). Follow that pattern: extract pure logic where it needs a test, leave presentational components untested.
- Theme values only come from `src/theme/theme.ts` (`theme.colors`, `theme.spacing`, `theme.radii`, `theme.typography`) — no hardcoded colors/sizes outside that file.
- Every task ends in a passing `npx jest` run (where the task added/changed tests) and a commit.

---

### Task 1: Selector — flatten group photos instead of a single cover photo

**Files:**
- Modify: `src/store/selectors/groupSelectors.ts`
- Modify: `src/store/selectors/groupSelectors.test.ts`

**Interfaces:**
- Produces: `EntryGroup` type now has `photos: string[]` (resolved URIs, chronological: entries in group order, each entry's `photos` in their existing array order) instead of `coverPhotoUri: string`. `id`, `dayKey`, `entries`, `groupTime` are unchanged. This is what Task 5 (`FeedScreen`) consumes.

- [ ] **Step 1: Update the failing test**

In `src/store/selectors/groupSelectors.test.ts`, replace the `coverPhotoUri` assertion in the "puts entries within 1 hour of each other into one group" test:

```ts
    expect(sections[0].groups[0].photos).toEqual([
      resolvePhotoUri(e1.photos[0].uri),
      resolvePhotoUri(e2.photos[0].uri),
    ]);
```

(replaces the line `expect(sections[0].groups[0].coverPhotoUri).toBe(resolvePhotoUri(e2.photos[0].uri));`)

Then add a new test in the same `describe` block covering an entry with multiple photos:

```ts
  it('flattens photos across every entry in the group, in entry then photo order', () => {
    const e1: Entry = {
      id: 'a',
      createdAt: '2026-03-05T12:00:00.000Z',
      comment: 'comment-a',
      location: null,
      photos: [
        { id: 'a-1', uri: 'a-1.jpg' },
        { id: 'a-2', uri: 'a-2.jpg' },
      ],
    };
    const e2 = entry('b', '2026-03-05T12:30:00.000Z');
    const state = stateFrom([e1, e2]);

    const sections = selectFeedSections(state);

    expect(sections[0].groups[0].photos).toEqual([
      resolvePhotoUri('a-1.jpg'),
      resolvePhotoUri('a-2.jpg'),
      resolvePhotoUri(e2.photos[0].uri),
    ]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/store/selectors/groupSelectors.test.ts`
Expected: FAIL — `photos` is `undefined` on the group (the selector still produces `coverPhotoUri`).

- [ ] **Step 3: Update the selector**

In `src/store/selectors/groupSelectors.ts`, change the `EntryGroup` type and `finalizeGroup`:

```ts
export type EntryGroup = {
  id: string;
  dayKey: string;
  entries: Entry[];
  groupTime: string;
  photos: string[];
};
```

```ts
function finalizeGroup(entries: Entry[], dayKey: string): EntryGroup {
  const latest = entries[entries.length - 1];
  return {
    id: `${dayKey}-${entries[0].id}`,
    dayKey,
    entries,
    groupTime: latest.createdAt,
    photos: entries.flatMap((entry) => entry.photos.map((photo) => resolvePhotoUri(photo.uri))),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/store/selectors/groupSelectors.test.ts`
Expected: PASS, all tests including the two touched above.

- [ ] **Step 5: Commit**

```bash
git add src/store/selectors/groupSelectors.ts src/store/selectors/groupSelectors.test.ts
git commit -m "feat: flatten group photos in feed selector instead of a single cover photo"
```

---

### Task 2: `PhotoGrid` component

**Files:**
- Create: `src/components/PhotoGrid.tsx`
- Create: `src/components/PhotoGrid.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (pure + `theme`).
- Produces: `computeGridLayout(count: number, size: number): { columns: number; rows: number; cellSize: number }` and `PhotoGrid({ photos: string[]; size: number })` React component. Task 5 (`FeedScreen`) renders `<PhotoGrid photos={item.photos} size={GRID_SIZE} />`.

- [ ] **Step 1: Write the failing test for the layout math**

Create `src/components/PhotoGrid.test.ts`:

```ts
import { computeGridLayout } from './PhotoGrid';

describe('computeGridLayout', () => {
  it('returns a single full-size cell for 1 photo', () => {
    expect(computeGridLayout(1, 72)).toEqual({ columns: 1, rows: 1, cellSize: 72 });
  });

  it('lays out 2-4 photos as a 2x2 grid', () => {
    expect(computeGridLayout(2, 72)).toEqual({ columns: 2, rows: 1, cellSize: 34 });
    expect(computeGridLayout(3, 72)).toEqual({ columns: 2, rows: 2, cellSize: 34 });
    expect(computeGridLayout(4, 72)).toEqual({ columns: 2, rows: 2, cellSize: 34 });
  });

  it('lays out 5-9 photos as a 3x3 grid', () => {
    expect(computeGridLayout(5, 72)).toEqual({ columns: 3, rows: 2, cellSize: 64 / 3 });
    expect(computeGridLayout(9, 72)).toEqual({ columns: 3, rows: 3, cellSize: 64 / 3 });
  });

  it('lays out 10 photos as a 4-column grid', () => {
    expect(computeGridLayout(10, 72)).toEqual({ columns: 4, rows: 3, cellSize: 15 });
  });

  it('shrinks cell size as photo count grows (non-increasing across boundaries)', () => {
    const sizes = [1, 2, 5, 10, 17].map((count) => computeGridLayout(count, 72).cellSize);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/PhotoGrid.test.ts`
Expected: FAIL with "Cannot find module './PhotoGrid'".

- [ ] **Step 3: Implement `PhotoGrid`**

Create `src/components/PhotoGrid.tsx`:

```tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

const GAP = theme.spacing.xs;

export function computeGridLayout(count: number, size: number) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.ceil(count / columns);
  const cellSize = (size - GAP * (columns - 1)) / columns;
  return { columns, rows, cellSize };
}

type Props = {
  photos: string[];
  size: number;
};

export function PhotoGrid({ photos, size }: Props) {
  if (photos.length === 0) {
    return null;
  }

  if (photos.length === 1) {
    return (
      <Image
        source={{ uri: photos[0] }}
        style={{ width: size, height: size, borderRadius: theme.radii.md }}
        resizeMode="cover"
      />
    );
  }

  const { columns, cellSize } = computeGridLayout(photos.length, size);

  return (
    <View style={[styles.grid, { width: size, height: size }]}>
      {photos.map((uri, index) => (
        <Image
          key={index}
          source={{ uri }}
          style={{
            width: cellSize,
            height: cellSize,
            marginRight: (index + 1) % columns === 0 ? 0 : GAP,
            marginBottom: GAP,
            borderRadius: theme.radii.sm,
          }}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    overflow: 'hidden',
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/PhotoGrid.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PhotoGrid.tsx src/components/PhotoGrid.test.ts
git commit -m "feat: add adaptive PhotoGrid component for feed cards"
```

---

### Task 3: `Fab` component

**Files:**
- Create: `src/components/Fab.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `Fab({ onPress: () => void })` React component. Task 5 (`FeedScreen`) renders `<Fab onPress={() => navigation.navigate('NewEntry')} />`.

No test — purely presentational with no branching logic, consistent with the codebase's "no component tests" convention (same as the `Button`/`IconButton`/`Card` primitives, which have none).

- [ ] **Step 1: Implement `Fab`**

Create `src/components/Fab.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

type Props = {
  onPress: () => void;
};

export function Fab({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      <Ionicons name="add" size={28} color={theme.colors.textOnDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `Fab.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/Fab.tsx
git commit -m "feat: add Fab component"
```

---

### Task 4: `GroupingMenu` component (replaces Config screen's setting)

**Files:**
- Create: `src/components/GroupingMenu.tsx`

**Interfaces:**
- Consumes: `useAppSelector`, `useAppDispatch` from `src/store/hooks.ts`; `setBundleByDay` from `src/store/settingsSlice.ts` (both already exist and are unchanged).
- Produces: `GroupingMenu()` React component, no props — reads/writes `settings.bundleByDay` itself. Task 6 (`RootNavigator`) renders it as `headerRight`.

No test — presentational + a single dispatch call, same convention as the deleted `ConfigScreen` (which also had no test).

- [ ] **Step 1: Implement `GroupingMenu`**

Create `src/components/GroupingMenu.tsx`:

```tsx
import React, { useState } from 'react';
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setBundleByDay } from '../store/settingsSlice';
import { theme } from '../theme/theme';
import { Card } from './Card';

export function GroupingMenu() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const bundleByDay = useAppSelector((state) => state.settings.bundleByDay);
  const dispatch = useAppDispatch();

  function select(value: boolean) {
    dispatch(setBundleByDay(value));
    setOpen(false);
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger}>
        <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.textOnDark} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Card style={[styles.popover, { top: insets.top + 48 }]}>
            <Text style={styles.label}>Group by</Text>
            <View style={styles.segmented}>
              <Pressable
                onPress={() => select(false)}
                style={[styles.segment, !bundleByDay && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, !bundleByDay && styles.segmentTextActive]}>Hour</Text>
              </Pressable>
              <Pressable
                onPress={() => select(true)}
                style={[styles.segment, bundleByDay && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, bundleByDay && styles.segmentTextActive]}>Day</Text>
              </Pressable>
            </View>
          </Card>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: theme.spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  popover: {
    position: 'absolute',
    right: theme.spacing.md,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: theme.radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.muted,
  },
  segment: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  segmentTextActive: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `GroupingMenu.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/GroupingMenu.tsx
git commit -m "feat: add GroupingMenu header popover for bundle-by-day setting"
```

---

### Task 5: Wire `FeedScreen` to the grid, the entry-count badge, and the FAB

**Files:**
- Modify: `src/screens/FeedScreen.tsx`

**Interfaces:**
- Consumes: `EntryGroup.photos` (Task 1), `PhotoGrid` (Task 2), `Fab` (Task 3).
- Produces: nothing new consumed by later tasks — this is the integration point.

No test — `FeedScreen` was untested before this change too (screens aren't unit-tested in this codebase).

- [ ] **Step 1: Replace the cover-photo card with the grid + badge, and add the FAB**

In `src/screens/FeedScreen.tsx`, replace the `PhotoThumbnail` import with `PhotoGrid` and add `Fab`:

```ts
import { PhotoGrid } from '../components/PhotoGrid';
import { Fab } from '../components/Fab';
```

(remove the `import { PhotoThumbnail } from '../components/PhotoThumbnail';` line)

Add a `GRID_SIZE` constant near the top of the file, after the `Nav` type:

```ts
const GRID_SIZE = 72;
```

Replace the card row JSX:

```tsx
              <View style={styles.photoWrapper}>
                <PhotoGrid photos={item.photos} size={GRID_SIZE} />
                {item.entries.length > 1 ? (
                  <View style={styles.entryBadge}>
                    <Text style={styles.entryBadgeText}>{item.entries.length}</Text>
                  </View>
                ) : null}
              </View>
```

(replaces the single `<PhotoThumbnail uri={item.coverPhotoUri} size={72} badgeCount={item.entries.length} />` line)

Wrap the screen body so the FAB floats over both the list and the empty state — replace the whole `return` block:

```tsx
  return (
    <View style={styles.container}>
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Nothing logged yet</Text>
          <Text style={styles.emptyBody}>Tap the + to log your first photo.</Text>
        </View>
      ) : (
        <SectionList
          style={styles.list}
          sections={sections.map((section) => ({
            title: dayLabel(section.dayKey),
            data: section.groups,
            key: section.dayKey,
          }))}
          keyExtractor={(group) => group.id}
          renderSectionHeader={({ section }) => <DayDivider label={section.title} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => openGroup(item)} style={styles.itemWrapper}>
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.photoWrapper}>
                    <PhotoGrid photos={item.photos} size={GRID_SIZE} />
                    {item.entries.length > 1 ? (
                      <View style={styles.entryBadge}>
                        <Text style={styles.entryBadgeText}>{item.entries.length}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTime}>{formatTime(item.groupTime)}</Text>
                    <Text style={styles.cardComment} numberOfLines={2}>
                      {item.entries[item.entries.length - 1].comment || 'No comment'}
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
      <Fab onPress={() => navigation.navigate('NewEntry')} />
    </View>
  );
```

(this removes the old early-return empty-state branch and folds it into the shared container so the FAB is always rendered)

Update the `styles` object: remove the top-level `flex: 1, backgroundColor` from `list` won't need to change, but add `container` and the badge/wrapper styles, and drop `emptyContainer`'s own `flex: 1`/background since the outer `container` now owns those:

```ts
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  itemWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  card: {},
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoWrapper: {
    width: GRID_SIZE,
    height: GRID_SIZE,
  },
  entryBadge: {
    position: 'absolute',
    bottom: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 2,
  },
  entryBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '700',
  },
  cardText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  cardTime: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  cardComment: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyBody: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors referencing `FeedScreen.tsx` (this will still show errors about `RootStackParamList['Config']`/`ConfigScreen` usage in `RootNavigator.tsx` until Task 6 — ignore those for this step, confirm only `FeedScreen.tsx` is clean).

- [ ] **Step 3: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: PASS (this task touches no test files; existing suite should be unaffected).

- [ ] **Step 4: Commit**

```bash
git add src/screens/FeedScreen.tsx
git commit -m "feat: render feed cards with PhotoGrid, entry-count badge, and FAB"
```

---

### Task 6: Remove Config screen/route, wire `GroupingMenu` into the header

**Files:**
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/RootNavigator.tsx`
- Delete: `src/screens/ConfigScreen.tsx`

**Interfaces:**
- Consumes: `GroupingMenu` (Task 4).
- Produces: nothing consumed by later tasks — this is the final integration point.

- [ ] **Step 1: Drop `Config` from the route param list**

In `src/navigation/types.ts`, remove the `Config: undefined;` line:

```ts
export type RootStackParamList = {
  Feed: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  PhotoDetails: { entryId: string; photoIndex: number };
};
```

- [ ] **Step 2: Update `RootNavigator`**

In `src/navigation/RootNavigator.tsx`, remove the `ConfigScreen` import and add the `GroupingMenu` import:

```ts
import { GroupingMenu } from '../components/GroupingMenu';
```

(remove `import { ConfigScreen } from '../screens/ConfigScreen';`)

Replace the `Feed` screen's `options` to drop `headerLeft` and point `headerRight` at `GroupingMenu`:

```tsx
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: 'What Did I Eat',
          headerRight: () => <GroupingMenu />,
        }}
      />
```

(this drops the `({ navigation }) => ({...})` options function entirely since neither remaining option needs `navigation`, and drops the `headerLeft` settings `IconButton`)

Remove the `<Stack.Screen name="Config" ... />` line entirely.

The `IconButton` import in this file becomes unused — remove it:

```ts
import { IconButton } from '../components/IconButton';
```

(delete this line; `IconButton` is still used elsewhere, e.g. `ConfigScreen`, but that file is being deleted in this same task — confirm with Step 4 below before removing the import)

- [ ] **Step 3: Delete `ConfigScreen.tsx`**

```bash
rm src/screens/ConfigScreen.tsx
```

- [ ] **Step 4: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: PASS, no errors anywhere (this is the first point where the full project — including Task 5's `FeedScreen.tsx` changes — typechecks clean end to end).

- [ ] **Step 5: Run the full test suite**

Run: `npx jest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/navigation/types.ts src/navigation/RootNavigator.tsx
git rm src/screens/ConfigScreen.tsx
git commit -m "feat: remove Config screen, wire GroupingMenu into Feed header"
```

---

## Manual verification (after all tasks)

Per the user's stated preference, the app itself is not run/driven automatically as part of this work. Once all six tasks are committed, hand the user this test plan:

1. `npx expo start`, open the app on a simulator/device.
2. On the Feed screen: confirm the header now shows only a "•••" icon on the right (no gear on the left, no "+" icon).
3. Tap "•••": confirm a small popover appears with "Group by: Hour | Day", and that tapping either option updates immediately and closes the popover.
4. Confirm there's a floating "+" button at the bottom-right of the Feed screen (visible even when the list is empty).
5. Tap it: confirm it opens New Entry, same as the old header "+" did.
6. Create a few entries close together in time (within an hour) with 1, 2, 3, and 5+ photos respectively; back on Feed, confirm each card shows a photo grid (not a single cover photo) sized to roughly the old cover photo's footprint, with cells shrinking as photo count increases, and that groups with 2+ entries show a small count badge over the grid.
7. Confirm tapping a card still opens GroupDetails (2+ entries) or PhotoDetails (1 entry) as before.
